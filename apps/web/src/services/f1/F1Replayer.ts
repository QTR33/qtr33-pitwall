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

/** Plays a recorded F1 session back into a TimingStateManager at variable speed. */
export class F1Replayer {
  private events: ReplayEvent[] = [];
  private loading: Promise<void> | null = null;
  private currentIndex = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isPlaying = false;
  // Bumped by start()/pause() so a start() still awaiting the download knows it was superseded
  private runId = 0;
  private speedMultiplier = 2; // Default 2x for responsive demo playback
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
    }

    this.scheduleNextTick();
    this.notifyState();
    logger.info(`[F1 Replayer] Started at speed ${this.speedMultiplier}x`);
  }

  private apply(event: ReplayEvent) {
    this.manager.processMessage(event.topic, event.data);
  }

  private scheduleNextTick() {
    if (!this.isPlaying || this.events.length === 0) return;

    if (this.currentIndex >= this.events.length) {
      // Loop replay
      this.currentIndex = 0;
      this.manager.resetState();
    }

    this.apply(this.events[this.currentIndex]);
    this.currentIndex++;

    const intervalMs = Math.max(40, Math.floor(400 / this.speedMultiplier));
    this.timer = setTimeout(() => this.scheduleNextTick(), intervalMs);

    // Periodically notify state
    if (this.currentIndex % 10 === 0) {
      this.notifyState();
    }
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
    this.scheduleNextTick();
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
