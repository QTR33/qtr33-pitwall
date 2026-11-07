import {
  DriverState,
  RacingSeriesId,
  RaceControlMessage,
  SessionState,
  LiveTimingState,
  TrackFlag,
  ReplayState,
  TimingMode,
} from '../types/telemetry.js';

function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  if (typeof source !== 'object' || source === null) {
    return source as unknown as T;
  }

  if (typeof target !== 'object' || target === null) {
    target = {} as T;
  }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        (target as any)[key] = deepMerge((target as Record<string, any>)[key], source[key]);
      } else {
        (target as any)[key] = source[key];
      }
    }
  }

  return target;
}

/** Who drives a car: the fields a driver row shows besides timing */
type DriverIdentity = Pick<DriverState, 'name' | 'code' | 'team' | 'team_color'>;

/**
 * Reads a driver's identity from either the feed's DriverList spelling (FullName, Tla, TeamName,
 * TeamColour without '#') or the static grid's (name, code, team, team_color). Fields the source
 * doesn't carry are left out rather than set to undefined, so merging never erases a known value.
 */
function readIdentity(raw: Record<string, any>): DriverIdentity {
  const color = raw.TeamColour || raw.team_color;
  const identity: DriverIdentity = {
    name: raw.FullName || raw.BroadcastName || raw.name,
    code: raw.Tla || raw.code,
    team: raw.TeamName || raw.team,
    team_color: color ? (String(color).startsWith('#') ? color : `#${color}`) : undefined,
  };
  for (const key of Object.keys(identity) as Array<keyof DriverIdentity>) {
    if (!identity[key]) delete identity[key];
  }
  return identity;
}

/**
 * Maps any track-status spelling seen in the feeds (TrackStatus codes, SessionData names like
 * `SCDeployed`, race control flags like `DOUBLE YELLOW`) to a TrackFlag. Returns null for
 * values that don't describe the whole track, e.g. driver flags (`BLUE`, `BLACK AND WHITE`).
 */
export function normalizeTrackFlag(raw: unknown): TrackFlag | null {
  if (raw === undefined || raw === null) return null;
  const key = String(raw)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  switch (key) {
    case '1':
    case 'GREEN':
    case 'CLEAR':
    case 'ALLCLEAR':
      return 'GREEN';
    case '2':
    case 'YELLOW':
      return 'YELLOW';
    case 'DOUBLE_YELLOW':
      return 'DOUBLE_YELLOW';
    case '4':
    case 'SC':
    case 'SCDEPLOYED':
    case 'SAFETY_CAR':
      return 'SC';
    case '5':
    case 'RED':
      return 'RED';
    case '6':
    case '7':
    case 'VSC':
    case 'VSCDEPLOYED':
    case 'VSCENDING':
      return 'VSC';
    case 'CHEQUERED':
    case 'CHECKERED':
      return 'CHEQUERED';
    default:
      return null;
  }
}

export class TimingStateManager {
  private series: RacingSeriesId;
  private driversState: Record<string, DriverState> = {};
  // Static grid by car number. It never adds a car: it only names cars the feed reports, for
  // fields the feed hasn't sent (the replay recording has no full DriverList). Survives resets.
  private fallbackDrivers: Record<string, DriverIdentity> = {};
  private sessionState: SessionState;
  private raceControlMessages: RaceControlMessage[] = [];
  private messageListeners: Array<(state: LiveTimingState) => void> = [];
  // Once the official LapCount topic arrives it owns the lap counter
  private hasLapCount = false;

  // When the last feed message was processed; drives the snapshot's lastUpdated
  private lastDataAt: number | null = null;

  constructor(series: RacingSeriesId = 'f1') {
    this.series = series;
    this.sessionState = TimingStateManager.emptySession(series);
  }

  // Unknown until the feed says otherwise: empty names, 0 laps, no weather, never invented values
  private static emptySession(series: RacingSeriesId): SessionState {
    return {
      series,
      sessionName: '',
      sessionType: '',
      sessionStatus: 'Inactive',
      circuitName: '',
      totalLaps: 0,
      currentLap: 0,
    };
  }

  public setSeries(series: RacingSeriesId) {
    this.series = series;
    this.sessionState.series = series;
    if (series === 'wec') {
      this.sessionState.circuitName = 'Circuit de Spa-Francorchamps';
      this.sessionState.sessionName = '6 Hours of Spa';
      this.sessionState.totalLaps = 160;
    } else if (series === 'indycar') {
      this.sessionState.circuitName = 'Indianapolis Motor Speedway';
      this.sessionState.sessionName = 'Indy 500';
      this.sessionState.totalLaps = 200;
    }
    // F1 session details come from the real feed (SessionInfo / LapCount), so none are preset
  }

  public subscribe(listener: (state: LiveTimingState) => void) {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener);
    };
  }

  public notify(mode: TimingMode = 'live', replayState?: ReplayState) {
    if (this.messageListeners.length === 0) return;
    const snapshot = this.getFullSnapshot(mode, replayState);
    for (const listener of this.messageListeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('Error in state listener:', err);
      }
    }
  }

  /**
   * Sets the static grid used to name drivers the feed hasn't identified. The feed's DriverList
   * always wins field by field, and cars missing from the feed are never shown.
   */
  public setFallbackDrivers(drivers: any[]) {
    this.fallbackDrivers = {};
    for (const driver of drivers) {
      const carNum = String(driver.RacingNumber || driver.number || driver.carNumber || '');
      if (carNum) this.fallbackDrivers[carNum] = readIdentity(driver);
    }
  }

  public processMessage(topic: string, data: any) {
    if (!data) return;
    this.lastDataAt = Date.now();

    if (topic === 'TimingData' || topic === 'TimingAppData') {
      if (data.Lines) {
        for (const carNum in data.Lines) {
          if (!this.driversState[carNum]) {
            this.driversState[carNum] = { carNumber: carNum };
          }
          const rawLine = data.Lines[carNum];
          const prevPosition = this.driversState[carNum].Position;

          // Normalize gap / interval fields if sent in raw F1 SignalR format
          const normalizedLine: any = { ...rawLine };
          if (rawLine.TimeDiffToFastest && !rawLine.GapToLeader) {
            normalizedLine.GapToLeader = rawLine.TimeDiffToFastest;
          }
          if (rawLine.TimeDiffToPositionAhead && !rawLine.IntervalToPositionAhead) {
            normalizedLine.IntervalToPositionAhead = {
              Value: rawLine.TimeDiffToPositionAhead,
              Catching: false,
            };
          }
          if (rawLine.RacingNumber) {
            normalizedLine.carNumber = String(rawLine.RacingNumber);
          }

          // Remember sector times before merging — the feed blanks a sector's Value as the car
          // starts it again, and the UI holds the last time until the new one is set
          const heldSectorTimes: Record<string, string> = {};
          for (const [idx, sector] of Object.entries(this.driversState[carNum].Sectors ?? {})) {
            if (sector?.Value) heldSectorTimes[idx] = sector.Value;
          }

          this.driversState[carNum] = deepMerge(this.driversState[carNum], normalizedLine);

          for (const [idx, sector] of Object.entries(this.driversState[carNum].Sectors ?? {})) {
            if (sector && !sector.Value && heldSectorTimes[idx]) {
              sector.PreviousValue = heldSectorTimes[idx];
            }
          }

          // Update current stint information
          const stints = this.driversState[carNum].Stints;
          if (stints) {
            if (Array.isArray(stints) && stints.length > 0) {
              this.driversState[carNum].CurrentStint = stints[stints.length - 1];
            } else if (typeof stints === 'object') {
              const stintKeys = Object.keys(stints).sort(
                (a, b) => parseInt(a, 10) - parseInt(b, 10)
              );
              if (stintKeys.length > 0) {
                const latestKey = stintKeys[stintKeys.length - 1];
                this.driversState[carNum].CurrentStint = stints[latestKey];
              }
            }
          }
          if (rawLine.Compound) {
            this.driversState[carNum].CurrentStint = {
              ...this.driversState[carNum].CurrentStint,
              Compound: rawLine.Compound,
            };
          }

          // Calculate position change if position changed
          const newPos = this.driversState[carNum].Position;
          if (prevPosition && newPos && prevPosition !== newPos) {
            const diff = parseInt(prevPosition, 10) - parseInt(newPos, 10);
            this.driversState[carNum].PositionDelta = diff;
          }
        }
      }

      // Without LapCount (e.g. older recordings), estimate the lap from leader / max completed laps
      let maxLaps = 0;
      for (const carNum in this.driversState) {
        const d = this.driversState[carNum];
        const laps =
          typeof d.NumberOfLaps === 'number'
            ? d.NumberOfLaps
            : parseInt(String(d.NumberOfLaps || 0), 10);
        if (!this.hasLapCount && (d.Position === '1' || (d as any).Line === 1) && laps > 0) {
          this.sessionState.currentLap = laps;
        }
        if (laps > maxLaps) {
          maxLaps = laps;
        }
      }
      if (
        !this.hasLapCount &&
        (!this.sessionState.currentLap || this.sessionState.currentLap === 1) &&
        maxLaps > 0
      ) {
        this.sessionState.currentLap = maxLaps;
      }

      // Qualifying part (1–3), kept apart from the session's own name
      const part = parseInt(String(data.SessionPart ?? ''), 10);
      if (part > 0) this.sessionState.sessionPart = part;
    } else if (topic === 'DriverList') {
      for (const [carNum, rawDriver] of Object.entries(data)) {
        // Only car entries are objects; skips markers such as the snapshot's `_kf: true`
        if (!rawDriver || typeof rawDriver !== 'object') continue;
        if (!this.driversState[carNum]) {
          this.driversState[carNum] = { carNumber: carNum };
        }
        // Deltas often carry only Line; readIdentity leaves out what they don't carry
        this.driversState[carNum] = deepMerge(this.driversState[carNum], {
          ...rawDriver,
          carNumber: carNum,
          ...readIdentity(rawDriver),
        });
      }
    } else if (topic === 'RaceControlMessages') {
      if (data.Messages) {
        const msgs = Array.isArray(data.Messages) ? data.Messages : Object.values(data.Messages);

        for (const msg of msgs as RaceControlMessage[]) {
          // avoid duplicate identical messages
          const exists = this.raceControlMessages.some(
            (m) => m.Utc === msg.Utc && m.Message === msg.Message
          );
          if (!exists) {
            this.raceControlMessages.unshift({
              ...msg,
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            });
            if (this.raceControlMessages.length > 50) {
              this.raceControlMessages.pop();
            }

            // Track-wide flags set the track status. Sector flags may only raise a yellow
            // (the TrackStatus topic clears it); driver flags such as BLUE never apply.
            const flag = normalizeTrackFlag(msg.Flag);
            if (flag && msg.Scope !== 'Driver') {
              const current = this.sessionState.trackStatus;
              if (msg.Scope !== 'Sector') {
                this.sessionState.trackStatus = flag;
              } else if (
                (flag === 'YELLOW' || flag === 'DOUBLE_YELLOW') &&
                (!current || current === 'GREEN' || current === 'CLEAR' || current === 'YELLOW')
              ) {
                this.sessionState.trackStatus = flag;
              }
            }
          }
        }
      }
    } else if (topic === 'SessionData') {
      if (data.StatusSeries) {
        const statuses = Object.values(data.StatusSeries) as any[];
        if (statuses.length > 0) {
          const latest = statuses[statuses.length - 1];
          if (latest.SessionStatus) {
            this.sessionState.sessionStatus = latest.SessionStatus;
          }
          const flag = normalizeTrackFlag(latest.TrackStatus);
          if (flag) this.sessionState.trackStatus = flag;
        }
      }
      const flag = normalizeTrackFlag(data.TrackStatus);
      if (flag) this.sessionState.trackStatus = flag;
    } else if (topic === 'SessionStatus') {
      if (data.Status) {
        this.sessionState.sessionStatus = data.Status;
      }
    } else if (topic === 'TrackStatus') {
      const flag = normalizeTrackFlag(data.Status) ?? normalizeTrackFlag(data.Message);
      if (flag) this.sessionState.trackStatus = flag;
    } else if (topic === 'LapCount') {
      // Official race lap counter: CurrentLap is the lap the leader is on, not laps completed
      const current = parseInt(String(data.CurrentLap ?? ''), 10);
      const total = parseInt(String(data.TotalLaps ?? ''), 10);
      if (current > 0) {
        this.sessionState.currentLap = current;
        this.hasLapCount = true;
      }
      if (total > 0) this.sessionState.totalLaps = total;
    } else if (topic === 'SessionInfo') {
      if (data.Meeting?.Name) this.sessionState.sessionName = data.Meeting.Name;
      if (data.Meeting?.Circuit?.ShortName) {
        this.sessionState.circuitName = data.Meeting.Circuit.ShortName;
      }
      if (data.Name) {
        // A different session starts with no qualifying part until the feed names one
        if (data.Name !== this.sessionState.sessionType) this.sessionState.sessionPart = undefined;
        this.sessionState.sessionType = data.Name;
      }
      const kind = String(data.Type ?? '').toLowerCase();
      if (kind === 'race' || kind === 'qualifying' || kind === 'practice') {
        this.sessionState.sessionKind = kind;
      }
    } else if (topic === 'ExtrapolatedClock') {
      // Deltas may carry only some fields, so merge onto the last known clock
      const prev = this.sessionState.clock;
      const remaining = data.Remaining ?? prev?.remaining;
      const utc = data.Utc ?? prev?.utc;
      if (remaining && utc) {
        this.sessionState.clock = {
          remaining: String(remaining),
          utc: String(utc),
          running: data.Extrapolating !== undefined ? !!data.Extrapolating : !!prev?.running,
        };
      }
    } else if (topic === 'WeatherData') {
      const num = (v: unknown) => {
        const n = parseFloat(String(v ?? ''));
        return Number.isFinite(n) ? n : undefined;
      };
      this.sessionState.airTemp = num(data.AirTemp) ?? this.sessionState.airTemp;
      this.sessionState.trackTemp = num(data.TrackTemp) ?? this.sessionState.trackTemp;
      this.sessionState.humidity = num(data.Humidity) ?? this.sessionState.humidity;
      this.sessionState.windSpeed = num(data.WindSpeed) ?? this.sessionState.windSpeed;
      this.sessionState.windDirection = num(data.WindDirection) ?? this.sessionState.windDirection;
      this.sessionState.pressure = num(data.Pressure) ?? this.sessionState.pressure;
      if (data.Rainfall !== undefined) this.sessionState.rainfall = String(data.Rainfall) === '1';
    }

    // Determine leader fastest lap across all drivers
    let fastestLapMs = Infinity;
    let fastestDriverNum: string | null = null;

    const parseLapTime = (str?: string): number => {
      if (!str) return Infinity;
      const parts = str.split(':');
      if (parts.length === 2) {
        const mins = parseFloat(parts[0]);
        const secs = parseFloat(parts[1]);
        return mins * 60 + secs;
      }
      return parseFloat(str) || Infinity;
    };

    for (const [carNum, driver] of Object.entries(this.driversState)) {
      if (driver.BestLapTime?.Value) {
        const ms = parseLapTime(driver.BestLapTime.Value);
        if (ms < fastestLapMs) {
          fastestLapMs = ms;
          fastestDriverNum = carNum;
        }
      }
    }

    if (fastestDriverNum) {
      for (const [carNum, driver] of Object.entries(this.driversState)) {
        if (driver.BestLapTime) {
          driver.BestLapTime.OverallFastest = carNum === fastestDriverNum;
        }
      }
    }

    this.notify();
  }

  public getSortedDrivers(): DriverState[] {
    const drivers = Object.entries(this.driversState).map(([carNumber, state]) => {
      const fallback = this.fallbackDrivers[carNumber];
      return {
        ...state,
        carNumber,
        name: state.name ?? fallback?.name,
        code: state.code ?? fallback?.code,
        team: state.team ?? fallback?.team,
        team_color: state.team_color ?? fallback?.team_color,
      };
    });

    drivers.sort((a, b) => {
      const posA = a.Position ? parseInt(a.Position, 10) : 999;
      const posB = b.Position ? parseInt(b.Position, 10) : 999;
      return posA - posB;
    });

    return drivers;
  }

  public getSessionState(): SessionState {
    return this.sessionState;
  }

  public updateSessionState(partial: Partial<SessionState>) {
    this.sessionState = {
      ...this.sessionState,
      ...partial,
    };
  }

  public getRaceControlMessages(): RaceControlMessage[] {
    return this.raceControlMessages;
  }

  public getFullSnapshot(mode: TimingMode = 'live', replayState?: ReplayState): LiveTimingState {
    return {
      series: this.series,
      mode,
      session: this.sessionState,
      drivers: this.getSortedDrivers(),
      raceControl: this.raceControlMessages,
      replay: replayState,
      lastUpdated: new Date(this.lastDataAt ?? Date.now()).toISOString(),
    };
  }

  public resetState() {
    this.driversState = {};
    this.raceControlMessages = [];
    this.hasLapCount = false;
    this.lastDataAt = null;
    this.sessionState = TimingStateManager.emptySession(this.series);
  }
}
