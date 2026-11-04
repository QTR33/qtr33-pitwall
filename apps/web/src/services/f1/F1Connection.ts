import * as signalR from '@microsoft/signalr';
import { TimingStateManager } from '@livetiming/shared';
import { logger } from '../logger.js';

export const F1_TOPICS = [
  'Heartbeat',
  'DriverList',
  'RaceControlMessages',
  'SessionData',
  'TimingData',
  'TimingAppData',
  'SessionStatus',
  'TrackStatus',
  'SessionInfo',
  'LapCount',
  'WeatherData',
];

// F1 sends a Heartbeat every few seconds; this much silence means the subscription is dead
const FEED_SILENCE_LIMIT_MS = 60_000;
const WATCHDOG_INTERVAL_MS = 15_000;
const RECONNECT_DELAY_MS = 5_000;

/** Browser connection to the official F1 live timing SignalR hub. */
export class F1Connection {
  private connection: signalR.HubConnection | null = null;
  private isConnected = false;
  // Set by disconnect() so a deliberate stop is not treated as a dropped feed
  private stopRequested = false;
  private lastMessageAt = 0;
  // When F1 last showed signs of a running session (snapshot Heartbeat or any feed delta)
  private lastSessionActivityAt = 0;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private manager: TimingStateManager,
    private url: string
  ) {}

  public async connect(): Promise<void> {
    if (this.isConnected) return;
    this.stopRequested = false;
    this.lastSessionActivityAt = 0;

    try {
      logger.info('[F1 Live] Connecting to F1 SignalR:', this.url);

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.url, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.None)
        .build();

      this.connection.on('feed', (topic: string, data: unknown) => {
        this.lastMessageAt = Date.now();
        // Deltas only flow while a session is running
        this.lastSessionActivityAt = this.lastMessageAt;
        logger.signal(topic, data);
        this.manager.processMessage(topic, data);
      });

      this.connection.onreconnecting((error) => {
        logger.warn('[F1 Live] Connection lost, reconnecting...', error?.message || '');
      });

      // A reconnected SignalR connection starts with no subscriptions, so subscribe again
      this.connection.onreconnected(async () => {
        logger.info('[F1 Live] Reconnected, re-subscribing...');
        try {
          await this.subscribe();
        } catch (err) {
          logger.error('[F1 Live] Re-subscribe failed, restarting connection:', err);
          await this.connection?.stop();
        }
      });

      // Fires once automatic reconnect gives up (or the watchdog stops a dead connection)
      this.connection.onclose((error) => {
        this.isConnected = false;
        logger.info('[F1 Live] Connection closed:', error?.message || 'clean');
        if (!this.stopRequested) this.scheduleReconnect();
      });

      await this.connection.start();
      this.isConnected = true;
      logger.info('[F1 Live] Connected to official F1 Live Timing stream');

      await this.subscribe();
      this.startWatchdog();
    } catch (err) {
      this.isConnected = false;
      logger.error('[F1 Live] Connection failed:', err);
      throw err;
    }
  }

  private async subscribe(): Promise<void> {
    if (!this.connection) return;
    logger.info('[F1 Live] Subscribing to topics:', F1_TOPICS);
    // Subscribe returns the full current state per topic; the 'feed' stream only carries deltas
    const snapshot = await this.connection.invoke<Record<string, unknown>>('Subscribe', F1_TOPICS);
    this.lastMessageAt = Date.now();

    // Between sessions F1 still answers with the last session's snapshot, so date it by its Heartbeat
    const heartbeatUtc = Date.parse(
      (snapshot?.Heartbeat as { Utc?: string } | undefined)?.Utc ?? ''
    );
    if (!isNaN(heartbeatUtc)) {
      this.lastSessionActivityAt = Math.max(this.lastSessionActivityAt, heartbeatUtc);
    }

    for (const [topic, data] of Object.entries(snapshot ?? {})) {
      logger.signal(topic, data);
      this.manager.processMessage(topic, data);
    }
    logger.info('[F1 Live] Subscribed and receiving live data');
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
        logger.warn(
          `[F1 Live] No feed data for ${Math.round(silentFor / 1000)}s, restarting connection...`
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
    logger.info(`[F1 Live] Retrying in ${RECONNECT_DELAY_MS / 1000}s...`);
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
        logger.error('[F1 Live] Error stopping SignalR:', err);
      }
      this.connection = null;
      this.isConnected = false;
      logger.info('[F1 Live] Disconnected from SignalR');
    }
  }

  /** True when F1 has shown session activity within the given window. */
  public hasRecentSessionActivity(windowMs: number): boolean {
    return Date.now() - this.lastSessionActivityAt < windowMs;
  }
}
