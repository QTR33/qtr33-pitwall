import { LiveTimingState, RacingSeriesId, ClientCommand, TimingMode } from '@livetiming/shared';
import { getClientTimingEngine } from './ClientTimingEngine.js';

const SERVER_URL = (
  import.meta.env.VITE_SERVER_URL ||
  `${window.location.protocol}//${window.location.hostname || 'localhost'}:3001`
).replace(/\/$/, '');
const WS_URL = `${SERVER_URL.replace(/^http/, 'ws')}/ws`;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Array<(state: LiveTimingState, isLiveServer: boolean) => void> = [];
  private currentServerState: LiveTimingState | null = null;
  private useServerFeed = false;

  constructor() {
    this.connect();
  }

  public connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.useServerFeed = true;
        console.log(
          '%c🛰️ LIVE TIMING WEBSOCKET %c Connected to backend server: ' + WS_URL,
          'background: #10b981; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
          'background: #0f172a; color: #34d399; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'STATE_UPDATE' && message.payload) {
            this.currentServerState = message.payload;
            if (this.currentServerState) {
              this.notify(this.currentServerState, true);
            }
          }
        } catch (err) {
          console.error('[WS Client] Error parsing incoming message:', err);
        }
      };

      this.ws.onclose = () => {
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.ws = null;
        if (wasConnected) {
          console.warn(
            '[WS Client] Connection lost. Falling back to local engine & retrying in 3s...'
          );
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
    }, 3000);
  }

  public subscribe(listener: (state: LiveTimingState, isLiveServer: boolean) => void) {
    this.listeners.push(listener);

    // Initial delivery: either latest server state or fallback to local client engine
    if (this.isConnected && this.currentServerState) {
      listener(this.currentServerState, true);
    } else {
      listener(getClientTimingEngine().getState(), false);
    }

    // Also subscribe to local client engine in case server is not running
    const unsubLocal = getClientTimingEngine().subscribe((localState) => {
      if (!this.isConnected) {
        this.notify(localState, false);
      }
    });

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
      unsubLocal();
    };
  }

  private notify(state: LiveTimingState, isLiveServer: boolean) {
    for (const listener of this.listeners) {
      try {
        listener(state, isLiveServer);
      } catch (e) {
        console.error('[WS Client] Error in listener:', e);
      }
    }
  }

  private sendCommand(command: ClientCommand) {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    }
    // Also always inform local engine for seamless parity
    const engine = getClientTimingEngine();
    switch (command.type) {
      case 'SET_MODE':
        engine.setMode(command.payload);
        break;
      case 'SET_SPEED':
        engine.setSpeed(command.payload);
        break;
      case 'TOGGLE_PLAY_PAUSE':
        engine.togglePlayPause();
        break;
      case 'SEEK_REPLAY':
        engine.seek(command.payload);
        break;
      case 'RESTART_REPLAY':
        engine.restart();
        break;
      case 'SET_SERIES':
        engine.setSeries(command.payload);
        break;
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

  public async setSeries(series: RacingSeriesId) {
    this.sendCommand({ type: 'SET_SERIES', payload: series });
    // Also hit HTTP endpoint if server is online
    if (this.isConnected) {
      try {
        await fetch(`${SERVER_URL}/api/series/switch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seriesId: series }),
        });
      } catch (e) {
        console.warn('[WS Client] Failed calling switch API:', e);
      }
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

let wsClientInstance: WebSocketClient | null = null;
export function getWebSocketClient(): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient();
  }
  return wsClientInstance;
}
