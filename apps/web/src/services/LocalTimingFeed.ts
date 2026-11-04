import { LiveTimingState, RacingSeriesId, TimingMode } from '@livetiming/shared';
import { ClientTimingEngine } from './ClientTimingEngine.js';
import { F1Feed } from './f1/F1Feed.js';
import type { TimingFeed } from './TimingFeed.js';

// Max ~16 renders per second; the live feed can deliver many messages per second
const EMIT_THROTTLE_MS = 60;

/** Client-only feed: real F1 data straight from F1, simulated grids for the other series. */
export class LocalTimingFeed implements TimingFeed {
  private readonly f1 = new F1Feed();
  // Only created once a simulated series is picked
  private sim: ClientTimingEngine | null = null;
  private series: RacingSeriesId = 'f1';
  private listeners = new Set<(state: LiveTimingState) => void>();
  private emitTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.f1.onChange(() => this.series === 'f1' && this.scheduleEmit());
    this.f1.start();
  }

  public subscribe(listener: (state: LiveTimingState) => void) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private getState(): LiveTimingState {
    return this.series === 'f1' || !this.sim ? this.f1.getState() : this.sim.getState();
  }

  private scheduleEmit() {
    if (this.emitTimer) return;
    this.emitTimer = setTimeout(() => {
      this.emitTimer = null;
      this.emit();
    }, EMIT_THROTTLE_MS);
  }

  private emit() {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }

  public setSeries(series: RacingSeriesId) {
    if (series === this.series) return;
    this.series = series;

    if (series === 'f1') {
      this.sim?.stop();
      this.f1.start();
    } else {
      void this.f1.stop();
      if (!this.sim) {
        this.sim = new ClientTimingEngine();
        this.sim.subscribe(() => this.series !== 'f1' && this.scheduleEmit());
      }
      this.sim.setSeries(series);
      this.sim.start();
    }
    this.emit();
  }

  public setMode(mode: TimingMode) {
    if (this.series === 'f1') void this.f1.setMode(mode);
    else this.sim?.setMode(mode);
  }

  public setSpeed(speed: number) {
    if (this.series === 'f1') this.f1.setSpeed(speed);
    else this.sim?.setSpeed(speed);
  }

  public togglePlayPause() {
    if (this.series === 'f1') this.f1.togglePlayPause();
    else this.sim?.togglePlayPause();
  }

  public seek(progressPercent: number) {
    if (this.series === 'f1') this.f1.seek(progressPercent);
    else this.sim?.seek(progressPercent);
  }

  public restart() {
    if (this.series === 'f1') this.f1.restart();
    else this.sim?.restart();
  }
}
