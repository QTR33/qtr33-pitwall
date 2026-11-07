import { ReplayState, TimingStateManager } from '@livetiming/shared';
import { logger } from '../logger.js';

/** One recorded feed message, as written by scripts/build-replay.mjs */
interface ReplayEvent {
  time: string;
  topic: string;
  data: unknown;
}

const REPLAY_URL = `${import.meta.env.BASE_URL}replay/f1.json`;
// Fast-forward this many events on start so the first frame already has positions and timing
const WARMUP_EVENTS = 60;
// The recording plays on its own clock, scaled by the speed: each tick applies every event the
// playhead has passed, so busy moments (a restart, a round of stops) keep their real rhythm
const TICK_MS = 100;
// A longer silence (the recorder lost its link) is cut to this, so playback never sits idle
const MAX_SILENCE_MS = 5_000;

/** Plays a recorded F1 session back into a TimingStateManager at variable speed. */
export class F1Replayer {
  private events: ReplayEvent[] = [];
  // When each event was recorded (ms), parsed once on load
  private times: number[] = [];
  private loading: Promise<void> | null = null;
  private currentIndex = 0;
  // Recording time (ms) the replay has reached
  private playhead = 0;
  // Wall clock (ms) of the previous tick, so time spent paused never counts as playback
  private lastTickAt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isPlaying = false;
  // Bumped by start()/pause() so a start() still awaiting the download knows it was superseded
  private runId = 0;
  // 1× is real time: in development the replay stands in for a live session
  private speedMultiplier = 1;
  private onStateChange?: () => void;

  constructor(private manager: TimingStateManager) {}

  public setOnStateChange(cb?: () => void) {
    this.onStateChange = cb;
  }

  private notifyState() {
    this.onStateChange?.();
  }

  private load(): Promise<void> {
    this.loading ??= fetch(REPLAY_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ReplayEvent[]>;
      })
      .then((events) => {
        this.events = events;
        // An event without a readable time keeps the previous one's, so it plays right after it
        let last = 0;
        this.times = events.map((e) => {
          const t = Date.parse(e.time);
          if (!Number.isNaN(t)) last = t;
          return last;
        });
        logger.info(`[F1 Replayer] Loaded ${events.length} recorded telemetry events`);
      })
      .catch((err) => {
        // No recording available: the timing table stays on its empty state
        logger.warn(`[F1 Replayer] Could not load ${REPLAY_URL}:`, err);
      });
    return this.loading;
  }

  public async start(): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;
    const run = ++this.runId;
    await this.load();
    if (run !== this.runId) return;

    if (this.currentIndex === 0) {
      this.manager.resetState();
      const warmup = Math.min(WARMUP_EVENTS, this.events.length);
      for (let i = 0; i < warmup; i++) {
        this.apply(this.events[i]);
      }
      this.currentIndex = warmup;
      this.syncPlayhead();
    }

    this.lastTickAt = performance.now();
    this.tick();
    this.notifyState();
    logger.info(`[F1 Replayer] Started at speed ${this.speedMultiplier}x`);
  }

  private apply(event: ReplayEvent) {
    this.manager.processMessage(event.topic, event.data);
  }

  /** Puts the playhead on the last applied event, after a jump in the recording */
  private syncPlayhead() {
    this.playhead = this.times[Math.max(0, this.currentIndex - 1)] ?? 0;
  }

  private tick() {
    if (!this.isPlaying || this.events.length === 0) return;

    if (this.currentIndex >= this.events.length) {
      // Loop replay
      this.currentIndex = 0;
      this.manager.resetState();
      this.syncPlayhead();
    }

    const now = performance.now();
    this.playhead += (now - this.lastTickAt) * this.speedMultiplier;
    this.lastTickAt = now;

    // Cut a long silence short
    const nextAt = this.times[this.currentIndex];
    if (nextAt - this.playhead > MAX_SILENCE_MS) this.playhead = nextAt - MAX_SILENCE_MS;

    const before = this.currentIndex;
    while (
      this.currentIndex < this.events.length &&
      this.times[this.currentIndex] <= this.playhead
    ) {
      this.apply(this.events[this.currentIndex]);
      this.currentIndex++;
    }
    if (this.currentIndex !== before) this.notifyState();

    this.timer = setTimeout(() => this.tick(), TICK_MS);
  }

  public pause(): void {
    this.isPlaying = false;
    this.runId++;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.notifyState();
  }

  public resume(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTickAt = performance.now();
    this.tick();
    this.notifyState();
  }

  public togglePlayPause(): void {
    if (this.isPlaying) this.pause();
    else this.resume();
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.5, Math.min(20, multiplier));
    this.notifyState();
  }

  public seek(progressPercent: number): void {
    if (this.events.length === 0) return;
    const clamped = Math.max(0, Math.min(100, progressPercent));
    const targetIndex = Math.floor((clamped / 100) * this.events.length);

    this.manager.resetState();
    for (let i = 0; i < targetIndex; i++) {
      this.apply(this.events[i]);
    }
    this.currentIndex = targetIndex;
    this.syncPlayhead();
    // Catching up on thousands of events takes a moment; it is not playback time
    this.lastTickAt = performance.now();
    this.notifyState();
  }

  public restart(): void {
    this.seek(0);
    this.resume();
  }

  public stop(): void {
    this.pause();
    this.currentIndex = 0;
  }

  public getReplayState(): ReplayState {
    const total = this.events.length || 1;
    return {
      isActive: true,
      isPaused: !this.isPlaying,
      speedMultiplier: this.speedMultiplier,
      currentProgress: Math.min(100, Math.round((this.currentIndex / total) * 100)),
      // When the event on screen was recorded; absent until the recording has loaded
      currentTimestamp: this.events[Math.min(this.currentIndex, total - 1)]?.time,
      totalEvents: this.events.length,
      currentEventIndex: this.currentIndex,
    };
  }
}
