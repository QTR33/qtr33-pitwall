import { LiveTimingState, RacingSeriesId, ClientCommand, TimingMode } from '@livetiming/shared';
import { logger } from './logger.js';
import type { TimingFeed } from './TimingFeed.js';

const RECONNECT_DELAY_MS = 3000;

/** Streams timing state from the optional apps/server backend (enabled by VITE_SERVER_URL). */
export class WebSocketClient implements TimingFeed {
  private readonly wsUrl: string;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Array<(state: LiveTimingState) => void> = [];
  private currentState: LiveTimingState | null = null;

  constructor(private readonly serverUrl: string) {
    this.wsUrl = `${serverUrl.replace(/^http/, 'ws')}/ws`;
    this.connect();
  }

  private connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        logger.info('[WS Client] Connected to backend server:', this.wsUrl);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'STATE_UPDATE' && message.payload) {
            const payload = message.payload as LiveTimingState;
            // The server's own feed status, when it sends one; reaching us proves the link is up
            this.currentState = { ...payload, feedStatus: payload.feedStatus ?? 'connected' };
            this.notify(this.currentState);
          }
        } catch (err) {
          logger.error('[WS Client] Error parsing incoming message:', err);
        }
      };

      this.ws.onclose = () => {
        if (this.isConnected) {
          logger.warn(`[WS Client] Connection lost, retrying in ${RECONNECT_DELAY_MS / 1000}s...`);
        }
        this.isConnected = false;
        this.ws = null;
        // Keep the last state on screen, but say the link to it is down
        if (this.currentState && this.currentState.feedStatus !== 'reconnecting') {
          this.currentState = { ...this.currentState, feedStatus: 'reconnecting' };
          this.notify(this.currentState);
        }
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // Will trigger onclose and retry
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_DELAY_MS);
  }

  public subscribe(listener: (state: LiveTimingState) => void) {
    this.listeners.push(listener);
    if (this.currentState) listener(this.currentState);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(state: LiveTimingState) {
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (e) {
        logger.error('[WS Client] Error in listener:', e);
      }
    }
  }

  private sendCommand(command: ClientCommand) {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    }
  }

  public setMode(mode: TimingMode) {
    this.sendCommand({ type: 'SET_MODE', payload: mode });
  }

  public setSpeed(speed: number) {
    this.sendCommand({ type: 'SET_SPEED', payload: speed });
  }

  public togglePlayPause() {
    this.sendCommand({ type: 'TOGGLE_PLAY_PAUSE' });
  }

  public seek(progress: number) {
    this.sendCommand({ type: 'SEEK_REPLAY', payload: progress });
  }

  public restart() {
    this.sendCommand({ type: 'RESTART_REPLAY' });
  }

  public setSeries(series: RacingSeriesId) {
    if (!this.isConnected) return;
    fetch(`${this.serverUrl}/api/series/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesId: series }),
    }).catch((e) => logger.warn('[WS Client] Failed calling switch API:', e));
  }
}
