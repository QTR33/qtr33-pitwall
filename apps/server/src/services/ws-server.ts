import { WebSocketServer, WebSocket, RawData } from 'ws';
import { Server as HttpServer } from 'http';
import { ClientCommand, LiveTimingState, StateUpdateMessage } from '@livetiming/shared';
import { SeriesProvider } from '../providers/base-provider.js';

export class LiveTimingWebSocketServer {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();
  private activeProvider: SeriesProvider;
  private unsubscribeProvider?: () => void;
  private lastBroadcast = 0;
  private static readonly THROTTLE_MS = 60; // Max ~16 updates per second for smooth rendering without flooding clients
  private pendingBroadcast: NodeJS.Timeout | null = null;

  constructor(httpServer: HttpServer, initialProvider: SeriesProvider) {
    this.activeProvider = initialProvider;
    this.wss = new WebSocketServer({ server: httpServer, path: '/ws' });

    this.setupWss();
    this.bindProvider(initialProvider);
  }

  public setProvider(provider: SeriesProvider) {
    if (this.unsubscribeProvider) {
      this.unsubscribeProvider();
    }
    this.activeProvider = provider;
    this.bindProvider(provider);
    this.broadcastState(this.activeProvider.getState());
  }

  private bindProvider(provider: SeriesProvider) {
    this.unsubscribeProvider = provider.onUpdate((state) => {
      this.throttleBroadcast(state);
    });
  }

  private throttleBroadcast(state: LiveTimingState) {
    const now = Date.now();
    const { THROTTLE_MS } = LiveTimingWebSocketServer;

    if (now - this.lastBroadcast > THROTTLE_MS) {
      this.lastBroadcast = now;
      this.broadcastState(state);
    } else if (!this.pendingBroadcast) {
      this.pendingBroadcast = setTimeout(() => {
        this.pendingBroadcast = null;
        this.lastBroadcast = Date.now();
        this.broadcastState(this.activeProvider.getState());
      }, THROTTLE_MS);
    }
  }

  private setupWss() {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`[WS] Client connected. Active clients: ${this.clients.size}`);

      // Send initial snapshot immediately
      try {
        ws.send(LiveTimingWebSocketServer.serializeState(this.activeProvider.getState()));
      } catch (err) {
        console.error('[WS] Error sending initial state:', err);
      }

      ws.on('message', async (message: RawData) => {
        try {
          const command: ClientCommand = JSON.parse(message.toString());
          await this.handleClientCommand(command);
        } catch (err) {
          console.error('[WS] Error parsing client command:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WS] Client disconnected. Active clients: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error('[WS] Client error:', err);
      });
    });
  }

  private async handleClientCommand(command: ClientCommand) {
    console.log(`[WS] Command received:`, command);
    switch (command.type) {
      case 'SET_MODE':
        if (command.payload === 'live' || command.payload === 'replay') {
          await this.activeProvider.setMode(command.payload);
        }
        break;
      case 'SET_SPEED':
        if (typeof command.payload === 'number') {
          this.activeProvider.setSpeed(command.payload);
        }
        break;
      case 'TOGGLE_PLAY_PAUSE':
        this.activeProvider.togglePause();
        break;
      case 'SEEK_REPLAY':
        if (typeof command.payload === 'number') {
          this.activeProvider.seek(command.payload);
        }
        break;
      case 'RESTART_REPLAY':
        this.activeProvider.restart();
        break;
      case 'SET_SERIES':
        // Series switching is handled via POST /api/series/switch
        break;
      default:
        console.warn(`[WS] Unknown command: ${(command as { type?: string }).type}`);
    }
  }

  private static serializeState(state: LiveTimingState): string {
    const message: StateUpdateMessage = { type: 'STATE_UPDATE', payload: state };
    return JSON.stringify(message);
  }

  public broadcastState(state: LiveTimingState) {
    const payload = LiveTimingWebSocketServer.serializeState(state);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (e) {
          console.error('[WS] Error broadcasting to client:', e);
        }
      }
    }
  }
}
