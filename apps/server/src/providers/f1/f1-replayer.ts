import fs from 'fs';
import path from 'path';
import { CONFIG } from '../../config/index.js';
import { ReplayState, TimingStateManager } from '@livetiming/shared';

export interface TelemetryEvent {
  timestamp: number;
  timeStr: string;
  topic: string;
  data: any;
}

export class F1Replayer {
  private manager: TimingStateManager;
  private events: TelemetryEvent[] = [];
  private isLoaded = false;
  private currentIndex = 0;
  private timer: NodeJS.Timeout | null = null;
  private isPlaying = false;
  private speedMultiplier = 2; // Default 2x for responsive demo playback
  private initialDriverData: any[] = [];
  private onStateChangeCallback?: (replayState: ReplayState) => void;

  constructor(manager: TimingStateManager, driverData: any[] = []) {
    this.manager = manager;
    this.initialDriverData = driverData;
  }

  public setOnStateChange(cb?: (replayState: ReplayState) => void) {
    this.onStateChangeCallback = cb;
  }

  private notifyState() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.getReplayState());
    }
  }

  public loadEvents(): void {
    if (this.isLoaded) return;

    const logFile = path.join(CONFIG.DATA_DIR, 'f1', 'signal.log');
    if (!fs.existsSync(logFile)) {
      console.warn(`[F1 Replayer] ${logFile} not found, creating synthetic replay loop.`);
      this.isLoaded = true;
      return;
    }

    console.log(`[F1 Replayer] Parsing log file from ${logFile}...`);
    try {
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.replace(/\r\n/g, '\n').split('\n');

      let isInsideBlock = false;
      let currentTopic = '';
      let currentTimeStr = '';
      let jsonLines: string[] = [];
      let captureJson = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '----------------------------------------') {
          if (!isInsideBlock) {
            isInsideBlock = true;
          } else {
            if (currentTopic && jsonLines.length > 0) {
              try {
                const rawJson = jsonLines.join('\n');
                const data = JSON.parse(rawJson);
                if (
                  [
                    'TimingData',
                    'TimingAppData',
                    'DriverList',
                    'RaceControlMessages',
                    'SessionData',
                    'SessionStatus',
                    'TrackStatus',
                  ].includes(currentTopic)
                ) {
                  const ts = currentTimeStr ? new Date(currentTimeStr).getTime() : Date.now();
                  this.events.push({
                    timestamp: isNaN(ts) ? Date.now() : ts,
                    timeStr: currentTimeStr,
                    topic: currentTopic,
                    data,
                  });
                }
              } catch {
                // Ignore malformed JSON chunks in raw log
              }
            }

            isInsideBlock = false;
            currentTopic = '';
            currentTimeStr = '';
            jsonLines = [];
            captureJson = false;
          }
        } else if (isInsideBlock) {
          if (line.includes('Topic:')) {
            const match = line.match(/Topic:\s*([a-zA-Z0-9_-]+)/);
            if (match && match[1]) currentTopic = match[1];

            const timeMatch = line.match(/\[(20\d{2}-\d{2}-\d{2}T[^\]]+)\]/);
            if (timeMatch && timeMatch[1]) currentTimeStr = timeMatch[1];
          }

          if (line.startsWith('Data: {')) {
            captureJson = true;
            jsonLines.push('{');
            continue;
          }

          if (captureJson) {
            jsonLines.push(line);
          }
        }
      }

      console.log(`✅ [F1 Replayer] Loaded ${this.events.length} real-time telemetry ticks!`);
      this.isLoaded = true;
    } catch (err) {
      console.error('[F1 Replayer] Error loading events:', err);
    }
  }

  public start(): void {
    if (!this.isLoaded) {
      this.loadEvents();
    }

    if (this.isPlaying) return;

    if (this.currentIndex === 0) {
      this.manager.resetState();
      this.manager.loadDriverMetadata(this.initialDriverData);

      // Fast forward first 50 events so initial screen has positions and timing immediately
      const warmup = Math.min(60, this.events.length);
      for (let i = 0; i < warmup; i++) {
        const ev = this.events[i];
        this.manager.processMessage(ev.topic, ev.data);
      }
      this.currentIndex = warmup;
    }

    this.isPlaying = true;
    this.scheduleNextTick();
    this.notifyState();
    console.log(`[F1 Replayer] Started at speed ${this.speedMultiplier}x`);
  }

  private scheduleNextTick() {
    if (!this.isPlaying) return;

    if (this.events.length === 0) {
      // Fallback timer
      this.timer = setTimeout(() => {
        if (this.isPlaying) this.scheduleNextTick();
      }, 1000);
      return;
    }

    if (this.currentIndex >= this.events.length) {
      // Loop replay
      this.currentIndex = 0;
      this.manager.resetState();
      this.manager.loadDriverMetadata(this.initialDriverData);
    }

    const currentEvent = this.events[this.currentIndex];
    this.manager.processMessage(currentEvent.topic, currentEvent.data);
    this.currentIndex++;

    // Calculate delay to next event or default tick rate
    const intervalMs = Math.max(40, Math.floor(400 / this.speedMultiplier));

    this.timer = setTimeout(() => {
      this.scheduleNextTick();
    }, intervalMs);

    // Periodically notify state
    if (this.currentIndex % 10 === 0) {
      this.notifyState();
    }
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.notifyState();
    console.log('[F1 Replayer] Paused.');
  }

  public resume(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.scheduleNextTick();
    this.notifyState();
    console.log('[F1 Replayer] Resumed.');
  }

  public togglePlayPause(): boolean {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      this.resume();
      return true;
    }
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.5, Math.min(20, multiplier));
    this.notifyState();
    console.log(`[F1 Replayer] Speed set to ${this.speedMultiplier}x`);
  }

  public seek(progressPercent: number): void {
    if (this.events.length === 0) return;
    const clamped = Math.max(0, Math.min(100, progressPercent));
    const targetIndex = Math.floor((clamped / 100) * this.events.length);

    this.currentIndex = 0;
    this.manager.resetState();
    this.manager.loadDriverMetadata(this.initialDriverData);

    for (let i = 0; i < targetIndex; i++) {
      const ev = this.events[i];
      this.manager.processMessage(ev.topic, ev.data);
    }
    this.currentIndex = targetIndex;
    this.notifyState();
  }

  public restart(): void {
    this.seek(0);
    this.resume();
  }

  public stop(): void {
    this.pause();
    this.currentIndex = 0;
  }

  public getReplayState(): ReplayState {
    const total = this.events.length || 1;
    const progress = Math.min(100, Math.round((this.currentIndex / total) * 100));
    const curEvent = this.events[this.currentIndex] || null;

    return {
      isActive: true,
      isPaused: !this.isPlaying,
      speedMultiplier: this.speedMultiplier,
      currentProgress: progress,
      currentTimestamp: curEvent?.timeStr || new Date().toISOString(),
      totalEvents: this.events.length,
      currentEventIndex: this.currentIndex,
    };
  }
}
