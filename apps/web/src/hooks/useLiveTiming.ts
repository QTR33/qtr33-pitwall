import { useState, useEffect, useCallback } from 'react';
import { LiveTimingState, RacingSeriesId, TimingMode } from '@livetiming/shared';
import { getWebSocketClient } from '../services/WebSocketClient.js';

export function useLiveTiming() {
  const [state, setState] = useState<LiveTimingState | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isServerFeed, setIsServerFeed] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const wsClient = getWebSocketClient();
    const unsubscribe = wsClient.subscribe((nextState, isLiveServer) => {
      setState(nextState);
      setIsConnected(true);
      setIsServerFeed(isLiveServer);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setMode = useCallback((mode: TimingMode) => {
    getWebSocketClient().setMode(mode);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    getWebSocketClient().setSpeed(speed);
  }, []);

  const togglePlayPause = useCallback(() => {
    getWebSocketClient().togglePlayPause();
  }, []);

  const seekReplay = useCallback((progress: number) => {
    getWebSocketClient().seek(progress);
  }, []);

  const restartReplay = useCallback(() => {
    getWebSocketClient().restart();
  }, []);

  const setSeries = useCallback((series: RacingSeriesId) => {
    getWebSocketClient().setSeries(series);
  }, []);

  return {
    state,
    isConnected,
    isServerFeed,
    error,
    setMode,
    setSpeed,
    togglePlayPause,
    seekReplay,
    restartReplay,
    setSeries,
  };
}
