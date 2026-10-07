import {
  TimingStateManager,
  LiveTimingState,
  RacingSeriesId,
  ReplayState,
  TimingMode,
  f1Drivers2026,
} from '@livetiming/shared';

// WEC Hypercar 2026 Grid
const WEC_DRIVERS = [
  {
    carNumber: '51',
    number: 51,
    name: 'Antonio Giovinazzi',
    code: 'GIO',
    team: 'Ferrari AF Corse',
    team_color: '#E8002D',
  },
  {
    carNumber: '50',
    number: 50,
    name: 'Antonio Fuoco',
    code: 'FUO',
    team: 'Ferrari AF Corse',
    team_color: '#E8002D',
  },
  {
    carNumber: '7',
    number: 7,
    name: 'Kamui Kobayashi',
    code: 'KOB',
    team: 'Toyota Gazoo Racing',
    team_color: '#FFFFFF',
  },
  {
    carNumber: '8',
    number: 8,
    name: 'Sebastien Buemi',
    code: 'BUE',
    team: 'Toyota Gazoo Racing',
    team_color: '#FFFFFF',
  },
  {
    carNumber: '6',
    number: 6,
    name: 'Kevin Estre',
    code: 'EST',
    team: 'Porsche Penske Motorsport',
    team_color: '#D5001C',
  },
  {
    carNumber: '5',
    number: 5,
    name: 'Matt Campbell',
    code: 'CAM',
    team: 'Porsche Penske Motorsport',
    team_color: '#D5001C',
  },
  {
    carNumber: '93',
    number: 93,
    name: 'Mikkel Jensen',
    code: 'JEN',
    team: 'Peugeot TotalEnergies',
    team_color: '#99CC00',
  },
  {
    carNumber: '94',
    number: 94,
    name: 'Loic Duval',
    code: 'DUV',
    team: 'Peugeot TotalEnergies',
    team_color: '#99CC00',
  },
  {
    carNumber: '15',
    number: 15,
    name: 'Raffaele Marciello',
    code: 'MAR',
    team: 'BMW M Team WRT',
    team_color: '#0066B1',
  },
  {
    carNumber: '20',
    number: 20,
    name: 'Robin Frijns',
    code: 'FRI',
    team: 'BMW M Team WRT',
    team_color: '#0066B1',
  },
  {
    carNumber: '35',
    number: 35,
    name: 'Paul-Loup Chatin',
    code: 'CHA',
    team: 'Alpine Endurance Team',
    team_color: '#0093CC',
  },
  {
    carNumber: '36',
    number: 36,
    name: 'Mick Schumacher',
    code: 'MSC',
    team: 'Alpine Endurance Team',
    team_color: '#0093CC',
  },
  {
    carNumber: '007',
    number: 7,
    name: 'Alex Riberas',
    code: 'RIB',
    team: 'Aston Martin Heart of Racing',
    team_color: '#229971',
  },
  {
    carNumber: '99',
    number: 99,
    name: 'Robert Kubica',
    code: 'KUB',
    team: 'AF Corse Hypercar',
    team_color: '#E8002D',
  },
];

// IndyCar 2026 Grid
const INDYCAR_DRIVERS = [
  {
    carNumber: '10',
    number: 10,
    name: 'Alex Palou',
    code: 'PAL',
    team: 'Chip Ganassi Racing',
    team_color: '#003399',
  },
  {
    carNumber: '2',
    number: 2,
    name: 'Josef Newgarden',
    code: 'NEW',
    team: 'Team Penske',
    team_color: '#D12640',
  },
  {
    carNumber: '3',
    number: 3,
    name: 'Scott McLaughlin',
    code: 'MCL',
    team: 'Team Penske',
    team_color: '#D12640',
  },
  {
    carNumber: '12',
    number: 12,
    name: 'Will Power',
    code: 'POW',
    team: 'Team Penske',
    team_color: '#D12640',
  },
  {
    carNumber: '5',
    number: 5,
    name: "Pato O'Ward",
    code: 'OWA',
    team: 'Arrow McLaren',
    team_color: '#FF8000',
  },
  {
    carNumber: '7',
    number: 7,
    name: 'Christian Lundgaard',
    code: 'LUN',
    team: 'Arrow McLaren',
    team_color: '#FF8000',
  },
  {
    carNumber: '26',
    number: 26,
    name: 'Colton Herta',
    code: 'HER',
    team: 'Andretti Global',
    team_color: '#E10600',
  },
  {
    carNumber: '27',
    number: 27,
    name: 'Kyle Kirkwood',
    code: 'KIR',
    team: 'Andretti Global',
    team_color: '#E10600',
  },
  {
    carNumber: '28',
    number: 28,
    name: 'Marcus Ericsson',
    code: 'ERI',
    team: 'Andretti Global',
    team_color: '#E10600',
  },
  {
    carNumber: '9',
    number: 9,
    name: 'Scott Dixon',
    code: 'DIX',
    team: 'Chip Ganassi Racing',
    team_color: '#003399',
  },
  {
    carNumber: '8',
    number: 8,
    name: 'Kyffin Simpson',
    code: 'SIM',
    team: 'Chip Ganassi Racing',
    team_color: '#003399',
  },
  {
    carNumber: '60',
    number: 60,
    name: 'Felix Rosenqvist',
    code: 'ROS',
    team: 'Meyer Shank Racing',
    team_color: '#E31B23',
  },
];

export class ClientTimingEngine {
  private manager: TimingStateManager;
  private mode: TimingMode = 'live';
  private series: RacingSeriesId = 'f1';
  private listeners: Array<(state: LiveTimingState) => void> = [];

  // Simulation timer
  private tickerInterval: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  // Replay State
  private replayState: ReplayState = {
    isActive: false,
    isPaused: false,
    speedMultiplier: 2,
    currentProgress: 35,
    totalEvents: 1450,
    currentEventIndex: 508,
  };

  constructor() {
    this.manager = new TimingStateManager('f1');
    this.initializeGrid('f1');
    console.log(
      '%c🏎️ PITWALL LIVE TIMING %c [MODE: LIVE] Client Telemetry Engine initialized',
      'background: #E10600; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
      'background: #0f172a; color: #38bdf8; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
    );
  }

  public subscribe(listener: (state: LiveTimingState) => void) {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (e) {
        console.error('[ClientEngine] Error in listener:', e);
      }
    }
  }

  public getState(): LiveTimingState {
    return this.manager.getFullSnapshot(
      this.mode,
      this.mode === 'replay' ? this.replayState : undefined
    );
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextTick();
  }

  public stop() {
    this.isRunning = false;
    if (this.tickerInterval) {
      clearTimeout(this.tickerInterval);
      this.tickerInterval = null;
    }
  }

  public setMode(mode: TimingMode) {
    this.mode = mode;
    this.replayState.isActive = mode === 'replay';
    if (mode === 'live') {
      this.replayState.isPaused = false;
      console.log(
        '%c🔴 CONNECTION STATUS %c [LIVE STREAM MODE ACTIVE] Real-time telemetry feed connected',
        'background: #E10600; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
        'background: #0f172a; color: #22c55e; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
      );
    } else {
      console.log(
        '%c⏪ REPLAY ENGINE %c [REPLAY / SIMULATION MODE ACTIVE] Multiplier: ' +
          this.replayState.speedMultiplier +
          'x',
        'background: #8b5cf6; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
        'background: #0f172a; color: #a78bfa; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
      );
    }
    this.notify();
  }

  public setSeries(series: RacingSeriesId) {
    this.series = series;
    this.manager.resetState();
    this.manager.setSeries(series);
    this.initializeGrid(series);
    console.log(
      '%c🏁 SERIES SWITCHED %c Active Series: [' + series.toUpperCase() + ']',
      'background: #f59e0b; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
      'background: #0f172a; color: #fbbf24; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
    );
    this.notify();
  }

  public setSpeed(speed: number) {
    this.replayState.speedMultiplier = speed;
    console.log(`[Replay Engine] Playback speed updated to: ${speed}x`);
    this.notify();
  }

  public togglePlayPause() {
    this.replayState.isPaused = !this.replayState.isPaused;
    console.log(`[Replay Engine] State: ${this.replayState.isPaused ? 'PAUSED ⏸️' : 'PLAYING ▶️'}`);
    this.notify();
  }

  public seek(progressPercent: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(progressPercent)));
    this.replayState.currentProgress = clamped;
    this.replayState.currentEventIndex = Math.round(
      ((this.replayState.totalEvents || 1000) * clamped) / 100
    );

    // Apply simulated state progression based on seek
    const drivers = this.manager.getSortedDrivers();
    const baseLap = Math.max(
      1,
      Math.round((clamped / 100) * (this.manager.getSessionState().totalLaps || 58))
    );
    this.manager.updateSessionState({ currentLap: baseLap });

    for (let i = 0; i < drivers.length; i++) {
      const d = drivers[i];
      const carNum = d.carNumber;
      this.manager.processMessage('TimingData', {
        Lines: {
          [carNum]: {
            NumberOfLaps: baseLap,
          },
        },
      });
    }

    this.notify();
  }

  public restart() {
    this.seek(0);
    this.replayState.isPaused = false;
    this.notify();
  }

  private initializeGrid(series: RacingSeriesId) {
    let rawDrivers: any[] = [];
    if (series === 'f1') {
      rawDrivers = f1Drivers2026.drivers;
    } else if (series === 'wec') {
      rawDrivers = WEC_DRIVERS;
    } else if (series === 'indycar') {
      rawDrivers = INDYCAR_DRIVERS;
    }

    const compounds = ['SOFT', 'MEDIUM', 'HARD'];

    // Load driver profiles
    this.manager.loadDriverMetadata(rawDrivers);

    // Generate initial timing lines
    const lines: Record<string, any> = {};
    rawDrivers.forEach((driver, idx) => {
      const pos = idx + 1;
      const carNum = String(driver.number || driver.carNumber);
      const gapSec = idx === 0 ? 0 : (idx * 1.342 + Math.random() * 0.4).toFixed(3);
      const intSec = idx === 0 ? 0 : (1.2 + Math.random() * 0.5).toFixed(3);

      const s1Base = 28.5 + idx * 0.08 + Math.random() * 0.2;
      const s2Base = 29.8 + idx * 0.09 + Math.random() * 0.2;
      const s3Base = 23.9 + idx * 0.07 + Math.random() * 0.15;
      const totalLapTime = s1Base + s2Base + s3Base;

      const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const remSecs = (secs % 60).toFixed(3);
        return `${mins}:${remSecs.padStart(6, '0')}`;
      };

      const compound = compounds[idx % compounds.length];

      lines[carNum] = {
        Position: String(pos),
        GapToLeader: idx === 0 ? 'LEADER' : `+${gapSec}s`,
        IntervalToPositionAhead: {
          Value: idx === 0 ? '--' : `+${intSec}s`,
          Catching: Math.random() > 0.5,
        },
        NumberOfLaps: 18,
        NumberOfPitStops: idx > 12 ? 1 : 0,
        InPit: false,
        Sectors: {
          '0': {
            Value: s1Base.toFixed(3),
            PersonalFastest: idx === 0 || idx === 2,
            OverallFastest: idx === 0,
            Segments: {
              '0': { Status: idx === 0 ? 2051 : 2049 },
              '1': { Status: 2049 },
              '2': { Status: 2048 },
              '3': { Status: 2049 },
              '4': { Status: 2048 },
              '5': { Status: 2049 },
            },
          },
          '1': {
            Value: s2Base.toFixed(3),
            PersonalFastest: idx === 1,
            OverallFastest: idx === 1,
            Segments: {
              '0': { Status: 2049 },
              '1': { Status: 2049 },
              '2': { Status: 2048 },
              '3': { Status: idx === 1 ? 2051 : 2049 },
              '4': { Status: 2049 },
              '5': { Status: 2048 },
            },
          },
          '2': {
            Value: s3Base.toFixed(3),
            PersonalFastest: idx === 0,
            OverallFastest: idx === 0,
            Segments: {
              '0': { Status: 2051 },
              '1': { Status: 2049 },
              '2': { Status: 2048 },
              '3': { Status: 2049 },
            },
          },
        },
        Speeds: {
          ST: {
            Value: String(Math.floor(328 + Math.random() * 18)),
            PersonalFastest: idx === 3,
            OverallFastest: idx === 0,
          },
          I1: { Value: String(Math.floor(290 + Math.random() * 12)) },
          I2: { Value: String(Math.floor(245 + Math.random() * 10)) },
          FL: { Value: String(Math.floor(180 + Math.random() * 8)) },
        },
        BestLapTime: {
          Value: formatTime(totalLapTime - 0.3),
          Lap: 12,
          OverallFastest: idx === 0,
          PersonalFastest: true,
        },
        LastLapTime: {
          Value: formatTime(totalLapTime),
          PersonalFastest: false,
          OverallFastest: false,
        },
        Stints: {
          '0': {
            Compound: compound,
            TotalLaps: 18,
            New: 'false',
          },
        },
        CurrentStint: {
          Compound: compound,
          TotalLaps: 18,
          New: 'false',
        },
      };
    });

    this.manager.processMessage('TimingData', { Lines: lines });

    // Initial Race Control Messages
    const nowUtc = new Date().toISOString();
    this.manager.processMessage('RaceControlMessages', {
      Messages: [
        {
          Utc: nowUtc,
          Category: 'Flag',
          Flag: 'GREEN',
          Message: 'TRACK CLEAR - GREEN FLAG RACING RESUMED',
          Scope: 'Track',
        },
        {
          Utc: new Date(Date.now() - 60000).toISOString(),
          Category: 'Drs',
          Message: 'DRS ENABLED IN ZONES 1 AND 2',
          Scope: 'Track',
        },
        {
          Utc: new Date(Date.now() - 180000).toISOString(),
          Category: 'Flag',
          Flag: 'CLEAR',
          Message: 'TURN 4 INCIDENT CLEARED',
          Scope: 'Sector',
          Sector: 1,
        },
      ],
    });
  }

  private scheduleNextTick() {
    if (!this.isRunning) return;

    const delay =
      this.mode === 'replay'
        ? Math.max(100, Math.floor(1000 / (this.replayState.speedMultiplier || 1)))
        : 1200;

    this.tickerInterval = setTimeout(() => {
      this.tick();
      this.scheduleNextTick();
    }, delay);
  }

  private tick() {
    if (this.mode === 'replay') {
      if (this.replayState.isPaused) return;

      // Advance replay progress
      const nextProgress = this.replayState.currentProgress + 0.2;
      if (nextProgress >= 100) {
        this.replayState.currentProgress = 100;
        this.replayState.isPaused = true;
      } else {
        this.replayState.currentProgress = parseFloat(nextProgress.toFixed(1));
        this.replayState.currentEventIndex = Math.min(
          this.replayState.totalEvents || 1000,
          (this.replayState.currentEventIndex || 0) + 1
        );
      }
    }

    // Dynamic telemetry updates
    this.simulateLiveTelemetryDelta();
    this.notify();
  }

  private simulateLiveTelemetryDelta() {
    const drivers = this.manager.getSortedDrivers();
    if (drivers.length === 0) return;

    // Pick 2-4 random drivers to receive micro-sector & speed updates
    const sampleCount = Math.floor(Math.random() * 3) + 2;
    const sampledDrivers: any[] = [];
    for (let i = 0; i < sampleCount; i++) {
      const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
      if (randomDriver && !sampledDrivers.includes(randomDriver)) {
        sampledDrivers.push(randomDriver);
      }
    }

    const lines: Record<string, any> = {};

    sampledDrivers.forEach((driver) => {
      const carNum = driver.carNumber;
      const sectorIdx = Math.floor(Math.random() * 3); // 0, 1, or 2
      const segmentIdx = Math.floor(Math.random() * 6); // 0 to 5

      // Random segment status: 2048 (yellow), 2049 (green personal best), 2051 (purple overall fastest)
      const rand = Math.random();
      const status = rand > 0.85 ? 2051 : rand > 0.3 ? 2049 : 2048;

      const currentSectors = driver.Sectors || {};
      const targetSector = currentSectors[String(sectorIdx)] || {};
      const currentSegments = targetSector.Segments || {};

      lines[carNum] = {
        Sectors: {
          [String(sectorIdx)]: {
            Segments: {
              ...currentSegments,
              [String(segmentIdx)]: { Status: status },
            },
          },
        },
        Speeds: {
          ST: {
            Value: String(Math.floor(325 + Math.random() * 20)),
          },
        },
      };

      // Slight gap oscillation
      if (driver.Position && parseInt(driver.Position, 10) > 1 && driver.GapToLeader) {
        const currentGap = parseFloat(driver.GapToLeader.replace('+', '').replace('s', '')) || 5;
        const delta = (Math.random() - 0.48) * 0.15;
        const nextGap = Math.max(0.2, currentGap + delta).toFixed(3);
        lines[carNum].GapToLeader = `+${nextGap}s`;
        lines[carNum].IntervalToPositionAhead = {
          Value: `+${(Math.random() * 1.5 + 0.4).toFixed(3)}s`,
          Catching: delta < 0,
        };
      }
    });

    this.manager.processMessage('TimingData', { Lines: lines });

    // Occasional Race Control Message (1 in 25 ticks)
    if (Math.random() < 0.04) {
      const rcEvents = [
        { Category: 'Drs', Message: 'DRS DISABLED IN SECTOR 2 - DEBRIS REPORTED', Flag: 'YELLOW' },
        { Category: 'Drs', Message: 'DRS RE-ENABLED IN SECTOR 2', Flag: 'GREEN' },
        { Category: 'CarEvent', Message: 'CAR 12 (ANT) TRACK LIMITS VIOLATION AT TURN 9' },
        { Category: 'CarEvent', Message: 'CAR 44 (HAM) PIT ENTRY OPEN' },
        {
          Category: 'Flag',
          Message: 'SECTOR 1 YELLOW FLAG - RECOVERY VEHICLE ON SERVICE ROAD',
          Flag: 'YELLOW',
        },
        { Category: 'Flag', Message: 'TRACK CLEAR - GREEN FLAG', Flag: 'GREEN' },
      ];
      const selectedMsg = rcEvents[Math.floor(Math.random() * rcEvents.length)];
      this.manager.processMessage('RaceControlMessages', {
        Messages: [
          {
            Utc: new Date().toISOString(),
            ...selectedMsg,
          },
        ],
      });
    }
  }
}

// Global Singleton for Client Engine
let clientEngineInstance: ClientTimingEngine | null = null;

export function getClientTimingEngine(): ClientTimingEngine {
  if (!clientEngineInstance) {
    clientEngineInstance = new ClientTimingEngine();
    clientEngineInstance.start();
  }
  return clientEngineInstance;
}
