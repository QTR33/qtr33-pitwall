import {
  FeedStatus,
  LiveTimingState,
  TimingMode,
  TimingStateManager,
  f1Drivers2026,
} from '@livetiming/shared';
import { ENV, IS_DEV } from '../../env.js';
import { logger } from '../logger.js';
import { F1Connection } from './F1Connection.js';
import { F1Replayer } from './F1Replayer.js';

/** What a look for a live session found */
type ProbeResult = 'live' | 'no-session' | 'unreachable';
type WaitReason = Exclude<ProbeResult, 'live'>;

// A session counts as live while F1 has shown activity within this window
const SESSION_ACTIVITY_WINDOW_MS = 5 * 60_000;
// While live: how often to check that the session is still running
const LIVE_CHECK_INTERVAL_MS = 60_000;
// While replaying in place of live: how often to look for a session that has started
const LIVE_RETRY_INTERVAL_MS = 5 * 60_000;
// Returning to the tab probes for a live session at once, but no more often than this
const VISIBLE_PROBE_MIN_GAP_MS = 30_000;

/**
 * Client-side F1 feed: streams the official live timing straight from F1 when a session is
 * running. Between sessions, development (VITE_APP_ENV) plays the recorded replay so there is
 * data to work with, and production waits on a blank state that says no session is on track.
 * Live and replay keep separate state so probing for a live session never disturbs the screen.
 */
export class F1Feed {
  private readonly liveManager = new TimingStateManager('f1');
  private readonly replayManager = new TimingStateManager('f1');
  // Never fed: what production shows between sessions, so nothing from a probe leaks on screen
  private readonly blankManager = new TimingStateManager('f1');
  private readonly connection: F1Connection | null;
  private readonly replayer: F1Replayer;

  /** What the user asked for; `mode` is what is actually on screen */
  private requestedMode: TimingMode = 'live';
  // Not 'live' until F1 confirms a session is running; 'waiting' is production between sessions
  private mode: TimingMode | 'waiting' = 'replay';
  private waitReason: WaitReason = 'no-session';
  // True until the first live probe settles, so the screen says it is connecting, not replaying
  private firstProbe = true;
  private probing = false;
  private lastProbeAt = 0;
  private running = false;
  // Bumped on every mode change so a slow live probe can tell it was superseded
  private modeRun = 0;
  private modeTimer: ReturnType<typeof setInterval> | null = null;
  // Connection work runs one task at a time so live probes and disconnects never interleave
  private connectionQueue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<() => void>();
  // Development only: stops the mock topics fed to the replay
  private stopDevMocks: Array<() => void> | null = null;

  constructor() {
    // The feed's DriverList names the drivers; the static grid only fills what it leaves out
    this.liveManager.setFallbackDrivers(f1Drivers2026.drivers);
    this.replayManager.setFallbackDrivers(f1Drivers2026.drivers);
    this.connection = ENV.F1_SIGNALR_URL
      ? new F1Connection(this.liveManager, ENV.F1_SIGNALR_URL)
      : null;
    this.replayer = new F1Replayer(this.replayManager);

    this.liveManager.subscribe(() => this.mode === 'live' && this.notify());
    this.replayManager.subscribe(() => this.mode === 'replay' && this.notify());
    this.replayer.setOnStateChange(() => this.mode === 'replay' && this.notify());
    // A dropped or restored link changes what the screen must say, even with no new data
    this.connection?.setOnStatusChange(() => this.mode === 'live' && this.notify());
  }

  /** Called on every state change; read the state with getState() */
  public onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) listener();
  }

  public getState(): LiveTimingState {
    if (this.mode === 'live') {
      return { ...this.liveManager.getFullSnapshot('live'), feedStatus: this.getLiveStatus() };
    }
    if (this.mode === 'waiting') {
      return { ...this.blankManager.getFullSnapshot('live'), feedStatus: this.waitReason };
    }
    return {
      ...this.replayManager.getFullSnapshot('replay', this.replayer.getReplayState()),
      feedStatus: this.firstProbe ? 'connecting' : 'offline',
    };
  }

  private getLiveStatus(): FeedStatus {
    const status = this.connection?.getStatus() ?? 'offline';
    // Between drop and retry the link is down but a reconnect is scheduled
    return status === 'offline' ? 'reconnecting' : status;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.watchBrowser(true);
    // The import sits inside the DEV branch so production builds drop the module entirely
    if (import.meta.env.DEV) void import('./devMocks.js').then((m) => this.startDevMocks(m));
    void this.setMode(this.requestedMode);
  }

  /**
   * A recording may lack weather, session name, lap total or session clock, or never show rain or
   * qualifying, so in development the replay can be given mock ones: `?mockWeather=dry|rain|cycle`
   * and `?mockSession=race|qualifying|practice` in the URL, or VITE_MOCK_WEATHER / VITE_MOCK_SESSION
   * in .env.development. Live state is never touched.
   */
  private startDevMocks(mock: typeof import('./devMocks.js')) {
    if (!this.running || this.stopDevMocks) return;
    const params = new URLSearchParams(window.location.search);
    const weather =
      mock.parseMockWeatherMode(params.get('mockWeather')) ??
      mock.parseMockWeatherMode(import.meta.env.VITE_MOCK_WEATHER);
    const session =
      mock.parseMockSessionMode(params.get('mockSession')) ??
      mock.parseMockSessionMode(import.meta.env.VITE_MOCK_SESSION);
    this.stopDevMocks = [];
    if (weather) this.stopDevMocks.push(mock.startMockWeather(this.replayManager, weather));
    if (session) {
      this.stopDevMocks.push(
        mock.startMockSession(
          this.replayManager,
          session,
          () => this.replayer.getReplayState().currentTimestamp
        )
      );
    }
  }

  public async stop(): Promise<void> {
    this.running = false;
    this.watchBrowser(false);
    this.stopDevMocks?.forEach((stop) => stop());
    this.stopDevMocks = null;
    this.modeRun++;
    this.clearModeTimer();
    this.replayer.stop();
    await this.disconnectLive();
  }

  // The browser knows about a lost or restored network (and a sleeping tab) before any timer does
  private watchBrowser(on: boolean) {
    if (typeof window === 'undefined') return;
    const method = on ? 'addEventListener' : 'removeEventListener';
    window[method]('online', this.handleOnline);
    window[method]('offline', this.handleOffline);
    document[method]('visibilitychange', this.handleVisible);
  }

  private readonly handleOffline = () => {
    if (this.mode === 'live') this.connection?.notifyOffline();
    // No network means F1 can't be reached; going back online probes again
    else if (this.mode === 'waiting') this.enterWaiting('unreachable');
  };

  private readonly handleOnline = () => this.resume(0);

  private readonly handleVisible = () => {
    if (document.visibilityState === 'visible') this.resume(VISIBLE_PROBE_MIN_GAP_MS);
  };

  /** Network or tab is back: reconnect a live feed now, or look for a session now */
  private resume(minProbeGapMs: number) {
    if (!this.running || this.firstProbe || this.requestedMode !== 'live') return;
    if (this.mode === 'live') {
      this.connection?.retryNow();
    } else if (Date.now() - this.lastProbeAt >= minProbeGapMs) {
      void this.probeLive();
    }
  }

  public async setMode(mode: TimingMode): Promise<void> {
    this.requestedMode = mode;
    const run = ++this.modeRun;
    this.clearModeTimer();

    const found = mode === 'live' ? await this.tryLive() : null;
    // A newer setMode()/stop() took over; its queued connection work cleans up after this probe
    if (run !== this.modeRun) return;
    if (found === 'live') {
      this.enterLive();
      return;
    }
    void this.disconnectLive();
    if (found) this.enterNoSession(found);
    else this.enterReplay();
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.connectionQueue.then(task, task);
    this.connectionQueue = result.catch(() => {});
    return result;
  }

  private disconnectLive(): Promise<void> {
    return this.enqueue(async () => {
      await this.connection?.disconnect();
    });
  }

  /** Connects to F1 and reports whether a session is actually running. */
  private tryLive(): Promise<ProbeResult> {
    return this.enqueue(async () => {
      const connection = this.connection;
      if (!connection) {
        logger.warn('[F1] VITE_F1_SIGNALR_URL is not set, live timing is off');
        return 'unreachable';
      }

      // Start from a clean subscription so the fresh snapshot lands on the reset state
      await connection.disconnect();
      this.liveManager.resetState();
      try {
        await connection.connect();
      } catch {
        await connection.disconnect();
        return 'unreachable';
      }

      if (connection.hasRecentSessionActivity(SESSION_ACTIVITY_WINDOW_MS)) return 'live';
      logger.info('[F1] No session on track');
      await connection.disconnect();
      return 'no-session';
    });
  }

  /** Live was asked for, nothing is running: development plays the recording, production waits */
  private enterNoSession(reason: WaitReason) {
    if (IS_DEV) this.enterReplay();
    else this.enterWaiting(reason);
  }

  private enterLive() {
    logger.info('[F1] Live session running, streaming from F1');
    this.mode = 'live';
    this.firstProbe = false;
    this.replayer.stop();
    this.notify();

    this.modeTimer = setInterval(() => {
      // Silence while our own link is down is an outage, not the session ending: stay live,
      // say "Reconnecting", and let the connection keep retrying until data flows again
      if (this.connection?.getStatus() !== 'connected') return;
      if (this.connection.hasRecentSessionActivity(SESSION_ACTIVITY_WINDOW_MS)) return;
      logger.info('[F1] Session has ended');
      this.clearModeTimer();
      void this.disconnectLive();
      // Still in requested live mode, so it keeps looking for the next session
      this.enterNoSession('no-session');
    }, LIVE_CHECK_INTERVAL_MS);
  }

  private enterReplay() {
    this.mode = 'replay';
    this.firstProbe = false;
    void this.replayer.start();
    this.notify();

    if (this.requestedMode !== 'live' || !this.connection) return;
    this.modeTimer = setInterval(() => void this.probeLive(), LIVE_RETRY_INTERVAL_MS);
  }

  /**
   * Production between sessions: a blank state that says why there is no timing, while it keeps
   * looking for a session. The recording is never loaded. Called again by each probe to update why.
   */
  private enterWaiting(reason: WaitReason) {
    const changed = this.mode !== 'waiting' || this.waitReason !== reason;
    this.mode = 'waiting';
    this.waitReason = reason;
    this.firstProbe = false;
    this.replayer.stop();
    if (changed) this.notify();

    if (this.modeTimer || !this.connection) return;
    this.modeTimer = setInterval(() => void this.probeLive(), LIVE_RETRY_INTERVAL_MS);
  }

  /** Between sessions (replay or waiting): check once whether a session has started, and go live */
  private async probeLive() {
    if (this.probing || this.mode === 'live') return;
    this.probing = true;
    this.lastProbeAt = Date.now();
    const run = this.modeRun;
    try {
      const found = await this.tryLive();
      // A newer setMode()/stop() took over while the probe ran; only they change what is on
      // screen during a probe (the probing flag keeps a second probe out), and they bump modeRun
      if (run !== this.modeRun) return;
      if (found === 'live') {
        this.clearModeTimer();
        this.enterLive();
      } else if (this.mode === 'waiting') {
        // F1 may have become reachable since the last look, or stopped being so
        this.enterWaiting(found);
      }
    } finally {
      this.probing = false;
    }
  }

  private clearModeTimer() {
    if (this.modeTimer) {
      clearInterval(this.modeTimer);
      this.modeTimer = null;
    }
  }

  public setSpeed(multiplier: number) {
    this.replayer.setSpeed(multiplier);
  }

  public togglePlayPause() {
    this.replayer.togglePlayPause();
  }

  public seek(progressPercent: number) {
    this.replayer.seek(progressPercent);
  }

  public restart() {
    this.replayer.restart();
  }
}
