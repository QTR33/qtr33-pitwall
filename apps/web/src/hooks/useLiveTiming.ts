import { useState, useEffect, useCallback } from 'react';
import { LiveTimingState, RacingSeriesId, TimingMode } from '@livetiming/shared';
import { getTimingFeed } from '../services/TimingFeed.js';

export function useLiveTiming() {
  const [state, setState] = useState<LiveTimingState | null>(null);

  useEffect(() => {
    return getTimingFeed().subscribe(setState);
  }, []);

  const setMode = useCallback((mode: TimingMode) => {
    getTimingFeed().setMode(mode);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    getTimingFeed().setSpeed(speed);
  }, []);

  const togglePlayPause = useCallback(() => {
    getTimingFeed().togglePlayPause();
  }, []);

  const seekReplay = useCallback((progress: number) => {
    getTimingFeed().seek(progress);
  }, []);

  const restartReplay = useCallback(() => {
    getTimingFeed().restart();
  }, []);

  const setSeries = useCallback((series: RacingSeriesId) => {
    getTimingFeed().setSeries(series);
  }, []);

  return {
    state,
    setMode,
    setSpeed,
    togglePlayPause,
    seekReplay,
    restartReplay,
    setSeries,
  };
}
