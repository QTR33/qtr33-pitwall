export type RacingSeriesId = 'f1' | 'wec' | 'indycar' | 'motogp' | 'fe';

export type TimingMode = 'live' | 'replay';

export interface RacingSeriesInfo {
  id: RacingSeriesId;
  name: string;
  category: string;
  season: number;
  icon?: string;
  accentColor: string;
  supportedModes: TimingMode[];
}

export interface DriverProfile {
  name: string;
  code: string;
  number: number;
  team: string;
  team_color: string;
  country?: string;
  headshot?: string;
}

export interface SectorSegment {
  Status: number; // 0: not reached, 2048: yellow, 2049: green personal best, 2051: purple overall best, 2064: pit lane
}

export interface SectorData {
  Value?: string;
  PreviousValue?: string;
  PersonalFastest?: boolean;
  OverallFastest?: boolean;
  Segments?: Record<string, SectorSegment>;
}

export interface SpeedData {
  Value?: string;
  PersonalFastest?: boolean;
  OverallFastest?: boolean;
}

export interface StintData {
  LapFlags?: number;
  Compound?: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | string;
  New?: string | boolean;
  TyresNotChanged?: string;
  TotalLaps?: number;
  StartLaps?: number;
  LapTime?: string;
  LapNumber?: number;
}

export interface DriverState {
  carNumber: string;
  name?: string;
  code?: string;
  number?: number;
  team?: string;
  team_color?: string;
  Line?: number;
  Position?: string;
  PositionDelta?: number; // Gain / loss from starting or previous line
  TimeDiffToFastest?: string;
  TimeDiffToPositionAhead?: string;
  GapToLeader?: string;
  IntervalToPositionAhead?: {
    Value?: string;
    Catching?: boolean;
  };
  NumberOfLaps?: number;
  Sectors?: Record<string, SectorData>;
  Speeds?: Record<string, SpeedData>;
  BestLapTime?: {
    Value?: string;
    Lap?: number;
    OverallFastest?: boolean;
    PersonalFastest?: boolean;
  };
  LastLapTime?: {
    Value?: string;
    PersonalFastest?: boolean;
    OverallFastest?: boolean;
  };
  Status?: number;
  InPit?: boolean;
  PitOut?: boolean;
  NumberOfPitStops?: number;
  Stints?: Record<string, StintData>;
  CurrentStint?: StintData;
  Retired?: boolean;
  Stopped?: boolean;
}

export type TrackFlag =
  'GREEN' | 'YELLOW' | 'DOUBLE_YELLOW' | 'RED' | 'VSC' | 'SC' | 'CHEQUERED' | 'CLEAR';

export interface RaceControlMessage {
  id?: string;
  Utc: string;
  Category: 'Flag' | 'SafetyCar' | 'Drs' | 'CarEvent' | 'Other' | string;
  Flag?: TrackFlag | string;
  Scope?: 'Track' | 'Sector' | 'Driver' | string;
  Sector?: number;
  Driver?: string;
  Message: string;
  Lap?: number;
}

export interface SessionState {
  series: RacingSeriesId;
  sessionName: string;
  sessionType: string;
  sessionStatus: 'Inactive' | 'Started' | 'Paused' | 'Ended' | 'Finished' | string;
  trackStatus: TrackFlag;
  circuitName: string;
  totalLaps: number;
  currentLap: number;
  clockTime?: string;
  airTemp?: number;
  trackTemp?: number;
  humidity?: number;
  windSpeed?: number;
  rainfall?: boolean;
}

export interface ReplayState {
  isActive: boolean;
  isPaused: boolean;
  speedMultiplier: number;
  currentProgress: number; // 0 to 100%
  currentTimestamp?: string;
  totalEvents?: number;
  currentEventIndex?: number;
}

export interface LiveTimingState {
  series: RacingSeriesId;
  mode: TimingMode;
  session: SessionState;
  drivers: DriverState[];
  raceControl: RaceControlMessage[];
  replay?: ReplayState;
  lastUpdated: string;
}

export type ClientCommand =
  | { type: 'SET_MODE'; payload: TimingMode }
  | { type: 'SET_SERIES'; payload: RacingSeriesId }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'SEEK_REPLAY'; payload: number }
  | { type: 'TOGGLE_PLAY_PAUSE' }
  | { type: 'RESTART_REPLAY' };

export type ClientCommandType = ClientCommand['type'];

export interface StateUpdateMessage {
  type: 'STATE_UPDATE';
  payload: LiveTimingState;
}
