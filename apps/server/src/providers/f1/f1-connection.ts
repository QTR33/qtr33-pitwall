import WebSocket from 'ws';
import * as signalR from '@microsoft/signalr';
import { CONFIG } from '../../config/index.js';
import { logSignal } from '../../services/logger.js';
import { TimingStateManager } from '@livetiming/shared';

// Force SignalR to use Node's WebSocket in Node environment
(globalThis as any).WebSocket = WebSocket;

// F1 sends a Heartbeat every few seconds; this much silence means the subscription is dead
const FEED_SILENCE_LIMIT_MS = 60_000;
const WATCHDOG_INTERVAL_MS = 15_000;
const RECONNECT_DELAY_MS = 5_000;

export class F1Connection {
  private connection: signalR.HubConnection | null = null;
  private manager: TimingStateManager;
  private isConnected = false;
  // Set by disconnect() so a deliberate stop is not treated as a dropped feed
  private stopRequested = false;
  private lastMessageAt = 0;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(manager: TimingStateManager) {
    this.manager = manager;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;
    this.stopRequested = false;

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
        this.lastMessageAt = Date.now();
        logSignal(topic, data);
        this.manager.processMessage(topic, data);
      });

      this.connection.onreconnecting((error) => {
        console.warn('[F1 Live] Connection lost, reconnecting...', error?.message || '');
      });

      // A reconnected SignalR connection starts with no subscriptions, so subscribe again
      this.connection.onreconnected(async () => {
        console.log('[F1 Live] Reconnected, re-subscribing...');
        try {
          await this.subscribe();
        } catch (err) {
          console.error('❌ [F1 Live] Re-subscribe failed, restarting connection:', err);
          await this.connection?.stop();
        }
      });

      // Fires once automatic reconnect gives up (or the watchdog stops a dead connection)
      this.connection.onclose((error) => {
        this.isConnected = false;
        console.log('[F1 Live] Connection closed:', error?.message || 'clean');
        if (!this.stopRequested) this.scheduleReconnect();
      });

      await this.connection.start();
      this.isConnected = true;
      console.log('✅ [F1 Live] Connected to official F1 Live Timing stream!');

      await this.subscribe();
      this.startWatchdog();
    } catch (err) {
      this.isConnected = false;
      console.error('❌ [F1 Live] Connection failed:', err);
      throw err;
    }
  }

  private async subscribe(): Promise<void> {
    if (!this.connection) return;
    console.log('[F1 Live] Subscribing to topics:', CONFIG.F1_TOPICS);
    // Subscribe returns the full current state per topic; the 'feed' stream only carries deltas
    const snapshot = await this.connection.invoke<Record<string, unknown>>(
      'Subscribe',
      CONFIG.F1_TOPICS
    );
    this.lastMessageAt = Date.now();
    for (const [topic, data] of Object.entries(snapshot ?? {})) {
      logSignal(topic, data);
      this.manager.processMessage(topic, data);
    }
    console.log('🚀 [F1 Live] Subscribed and receiving live data!\n');
  }

  // Catches a connection that stays open but stops delivering feed messages
  private startWatchdog() {
    this.stopWatchdog();
    this.watchdogTimer = setInterval(() => {
      const silentFor = Date.now() - this.lastMessageAt;
      if (
        this.connection?.state === signalR.HubConnectionState.Connected &&
        silentFor > FEED_SILENCE_LIMIT_MS
      ) {
        console.warn(
          `⚠️ [F1 Live] No feed data for ${Math.round(silentFor / 1000)}s, restarting connection...`
        );
        // onclose will schedule the reconnect
        this.connection.stop().catch(() => {});
      }
    }, WATCHDOG_INTERVAL_MS);
  }

  private stopWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.stopWatchdog();
    console.log(`[F1 Live] Retrying in ${RECONNECT_DELAY_MS / 1000}s...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.stopRequested) return;
      this.connection = null;
      this.connect().catch(() => this.scheduleReconnect());
    }, RECONNECT_DELAY_MS);
  }

  public async disconnect(): Promise<void> {
    this.stopRequested = true;
    this.stopWatchdog();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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
