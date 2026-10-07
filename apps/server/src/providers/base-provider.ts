import { LiveTimingState, RacingSeriesId, TimingMode } from '@livetiming/shared';

export interface SeriesProvider {
  readonly seriesId: RacingSeriesId;
  readonly name: string;
  start(mode?: TimingMode): Promise<void>;
  stop(): Promise<void>;
  setMode(mode: TimingMode): Promise<void>;
  setSpeed(multiplier: number): void;
  seek(progressPercent: number): void;
  togglePause(): boolean;
  restart(): void;
  getState(): LiveTimingState;
  onUpdate(callback: (state: LiveTimingState) => void): () => void;
}
