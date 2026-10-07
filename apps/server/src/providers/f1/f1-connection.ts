import WebSocket from 'ws';
import * as signalR from '@microsoft/signalr';
import { CONFIG } from '../../config/index.js';
import { logSignal } from '../../services/logger.js';
import { TimingStateManager } from '@livetiming/shared';

// Force SignalR to use Node's WebSocket in Node environment
(globalThis as any).WebSocket = WebSocket;

export class F1Connection {
  private connection: signalR.HubConnection | null = null;
  private manager: TimingStateManager;
  private isConnected = false;

  constructor(manager: TimingStateManager) {
    this.manager = manager;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      console.log('[F1 Live] Connecting to F1 SignalR:', CONFIG.F1_SIGNALR_URL);

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(CONFIG.F1_SIGNALR_URL, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .build();

      this.connection.on('feed', (topic: string, data: unknown) => {
        logSignal(topic, data);
        this.manager.processMessage(topic, data);
      });

      this.connection.onclose((error) => {
        this.isConnected = false;
        console.log('[F1 Live] Connection closed:', error?.message || 'clean');
      });

      await this.connection.start();
      this.isConnected = true;
      console.log('✅ [F1 Live] Connected to official F1 Live Timing stream!');

      console.log('[F1 Live] Subscribing to topics:', CONFIG.F1_TOPICS);
      await this.connection.invoke('Subscribe', CONFIG.F1_TOPICS);
      console.log('🚀 [F1 Live] Subscribed and receiving live data!\n');
    } catch (err) {
      this.isConnected = false;
      console.error('❌ [F1 Live] Connection failed:', err);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (err) {
        console.error('Error stopping SignalR:', err);
      }
      this.connection = null;
      this.isConnected = false;
      console.log('[F1 Live] Disconnected from SignalR.');
    }
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}
