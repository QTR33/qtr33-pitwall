import fs from 'fs';
import path from 'path';
import { CONFIG } from '../../config/index.js';
import {
  LiveTimingState,
  RacingSeriesId,
  TimingMode,
  TimingStateManager,
  f1Drivers2026,
} from '@livetiming/shared';
import { SeriesProvider } from '../base-provider.js';
import { F1Connection } from './f1-connection.js';
import { F1Replayer } from './f1-replayer.js';

export class F1SeriesAdapter implements SeriesProvider {
  public readonly seriesId: RacingSeriesId = 'f1';
  public readonly name = 'Formula 1';

  private manager: TimingStateManager;
  private connection: F1Connection;
  private replayer: F1Replayer;
  private currentMode: TimingMode = CONFIG.DEFAULT_MODE;
  private driversList: any[] = [];

  constructor() {
    this.manager = new TimingStateManager('f1');
    this.loadDriverData();
    this.connection = new F1Connection(this.manager);
    this.replayer = new F1Replayer(this.manager, this.driversList);
  }

  private loadDriverData() {
    // A drivers.json in the data dir overrides the bundled 2026 grid
    const overridePath = path.join(CONFIG.DATA_DIR, 'f1', 'drivers.json');
    let source = '@livetiming/shared (drivers-2026.json)';
    this.driversList = f1Drivers2026.drivers;

    if (fs.existsSync(overridePath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(overridePath, 'utf-8'));
        this.driversList = raw.drivers || [];
        source = overridePath;
      } catch (e) {
        console.error('[F1 Adapter] Failed parsing drivers json:', e);
      }
    }

    console.log(`[F1 Adapter] Loaded ${this.driversList.length} drivers from ${source}`);
    this.manager.loadDriverMetadata(this.driversList);
  }

  public async start(mode: TimingMode = this.currentMode): Promise<void> {
    this.currentMode = mode;
    if (mode === 'live') {
      console.log('\n======================================================');
      console.log('🔴 [MODE: LIVE] Connecting to official F1 Live SignalR stream...');
      console.log('======================================================');
      this.replayer.stop();
      try {
        await this.connection.connect();
        console.log('✅ [MODE: LIVE] Successfully connected to live F1 telemetry stream!\n');
      } catch {
        console.warn(
          '⚠️ [MODE: REPLAY FALLBACK] Live SignalR connection unavailable (no active on-track session). Falling back to Replay / Simulation mode.\n'
        );
        this.currentMode = 'replay';
        this.replayer.start();
      }
    } else {
      console.log('\n======================================================');
      console.log('⏪ [MODE: REPLAY] Starting Replay & Telemetry Simulator...');
      console.log('======================================================\n');
      await this.connection.disconnect();
      this.replayer.start();
    }
  }

  public async stop(): Promise<void> {
    console.log('🛑 [F1 Adapter] Stopping feeds...');
    await this.connection.disconnect();
    this.replayer.stop();
  }

  public async setMode(mode: TimingMode): Promise<void> {
    if (this.currentMode === mode) return;
    console.log(`\n🔄 [F1 Adapter] Switching mode to: [${mode.toUpperCase()}]`);
    await this.start(mode);
  }

  public setSpeed(multiplier: number): void {
    this.replayer.setSpeed(multiplier);
  }

  public seek(progressPercent: number): void {
    this.replayer.seek(progressPercent);
  }

  public togglePause(): boolean {
    return this.replayer.togglePlayPause();
  }

  public restart(): void {
    this.replayer.restart();
  }

  public getState(): LiveTimingState {
    const snapshot = this.manager.getFullSnapshot(this.currentMode);
    if (this.currentMode === 'replay') {
      snapshot.replay = this.replayer.getReplayState();
    }
    return snapshot;
  }

  public onUpdate(callback: (state: LiveTimingState) => void): () => void {
    const unsubManager = this.manager.subscribe(() => {
      callback(this.getState());
    });

    this.replayer.setOnStateChange(() => {
      callback(this.getState());
    });

    return () => {
      unsubManager();
      this.replayer.setOnStateChange(undefined);
    };
  }
}
