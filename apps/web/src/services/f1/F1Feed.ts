import {
  FeedStatus,
  LiveTimingState,
  TimingMode,
  TimingStateManager,
  f1Drivers2026,
} from '@livetiming/shared';
import { ENV } from '../../env.js';
import { logger } from '../logger.js';
import { F1Connection } from './F1Connection.js';
import { F1Replayer } from './F1Replayer.js';

// A session counts as live while F1 has shown activity within this window
const SESSION_ACTIVITY_WINDOW_MS = 5 * 60_000;
// While live: how often to check that the session is still running
const LIVE_CHECK_INTERVAL_MS = 60_000;
// While replaying in place of live: how often to look for a session that has started
const LIVE_RETRY_INTERVAL_MS = 5 * 60_000;

/**
 * Client-side F1 feed: streams the official live timing straight from F1 when a session is
 * running and falls back to the recorded replay otherwise. Live and replay keep separate state
 * so probing for a live session never disturbs the replay on screen.
 */
export class F1Feed {
  private readonly drivers = f1Drivers2026.drivers;
  private readonly liveManager = new TimingStateManager('f1');
  private readonly replayManager = new TimingStateManager('f1');
  private readonly connection: F1Connection | null;
  private readonly replayer: F1Replayer;

  /** What the user asked for; `mode` is what is actually on screen */
  private requestedMode: TimingMode = 'live';
  // Not 'live' until F1 confirms a session is running
  private mode: TimingMode = 'replay';
  // True until the first live probe settles, so the screen says it is connecting, not replaying
  private firstProbe = true;
  private running = false;
  // Bumped on every mode change so a slow live probe can tell it was superseded
  private modeRun = 0;
  private modeTimer: ReturnType<typeof setInterval> | null = null;
  // Connection work runs one task at a time so live probes and disconnects never interleave
  private connectionQueue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<() => void>();

  constructor() {
    this.liveManager.loadDriverMetadata(this.drivers);
    this.replayManager.loadDriverMetadata(this.drivers);
    this.connection = ENV.F1_SIGNALR_URL
      ? new F1Connection(this.liveManager, ENV.F1_SIGNALR_URL)
      : null;
    this.replayer = new F1Replayer(this.replayManager, this.drivers);

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
    void this.setMode(this.requestedMode);
  }

  public async stop(): Promise<void> {
    this.running = false;
    this.modeRun++;
    this.clearModeTimer();
    this.replayer.stop();
    await this.disconnectLive();
  }

  public async setMode(mode: TimingMode): Promise<void> {
    this.requestedMode = mode;
    const run = ++this.modeRun;
    this.clearModeTimer();

    const live = mode === 'live' && (await this.tryLive());
    // A newer setMode()/stop() took over; its queued connection work cleans up after this probe
    if (run !== this.modeRun) return;
    if (live) {
      this.enterLive();
    } else {
      void this.disconnectLive();
      this.enterReplay();
    }
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
  private tryLive(): Promise<boolean> {
    return this.enqueue(async () => {
      const connection = this.connection;
      if (!connection) {
        logger.warn('[F1] VITE_F1_SIGNALR_URL is not set, live timing is off');
        return false;
      }

      // Start from a clean subscription so the fresh snapshot lands on the reset state
      await connection.disconnect();
      this.liveManager.resetState();
      this.liveManager.loadDriverMetadata(this.drivers);
      try {
        await connection.connect();
      } catch {
        await connection.disconnect();
        return false;
      }

      if (connection.hasRecentSessionActivity(SESSION_ACTIVITY_WINDOW_MS)) return true;
      logger.info('[F1] No session on track, showing the replay');
      await connection.disconnect();
      return false;
    });
  }

  private enterLive() {
    logger.info('[F1] Live session running, streaming from F1');
    this.mode = 'live';
    this.firstProbe = false;
    this.replayer.stop();
    this.notify();

    this.modeTimer = setInterval(() => {
      if (this.connection?.hasRecentSessionActivity(SESSION_ACTIVITY_WINDOW_MS)) return;
      logger.info('[F1] Session has ended, showing the replay');
      this.clearModeTimer();
      void this.disconnectLive();
      // Still in requested live mode, so the replay keeps looking for the next session
      this.enterReplay();
    }, LIVE_CHECK_INTERVAL_MS);
  }

  private enterReplay() {
    this.mode = 'replay';
    this.firstProbe = false;
    void this.replayer.start();
    this.notify();

    if (this.requestedMode !== 'live' || !this.connection) return;
    const run = this.modeRun;
    this.modeTimer = setInterval(async () => {
      if (run !== this.modeRun) return;
      const live = await this.tryLive();
      if (run !== this.modeRun) return;
      if (live) {
        this.clearModeTimer();
        this.enterLive();
      }
    }, LIVE_RETRY_INTERVAL_MS);
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
