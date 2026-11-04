import { LiveTimingState, RacingSeriesId, TimingMode } from '@livetiming/shared';
import { ENV } from '../env.js';
import { LocalTimingFeed } from './LocalTimingFeed.js';
import { WebSocketClient } from './WebSocketClient.js';

/** Source of timing state for the dashboard, with the playback controls it accepts. */
export interface TimingFeed {
  subscribe(listener: (state: LiveTimingState) => void): () => void;
  setMode(mode: TimingMode): void;
  setSeries(series: RacingSeriesId): void;
  setSpeed(speed: number): void;
  togglePlayPause(): void;
  seek(progressPercent: number): void;
  restart(): void;
}

let feed: TimingFeed | null = null;

/** Runs entirely in the browser unless VITE_SERVER_URL points at an apps/server backend. */
export function getTimingFeed(): TimingFeed {
  feed ??= ENV.SERVER_URL ? new WebSocketClient(ENV.SERVER_URL) : new LocalTimingFeed();
  return feed;
}
