import { TimingStateManager } from '@livetiming/shared';
import { logger } from '../logger.js';

/*
 * Development-only feed topics for the recorded replay: what a recording lacks, or what it never
 * had to show (rain, a session clock: a race recording has none, and an older one may also lack
 * WeatherData, SessionInfo and the LapCount total). Never used for live timing and never bundled
 * into a production build: F1Feed imports this module inside an `import.meta.env.DEV` branch.
 * Messages use the feed's own shapes (strings included) so the real parsing runs.
 */

/** dry: steady · rain: raining throughout · cycle: rain starts and stops every 30s */
export type MockWeatherMode = 'dry' | 'rain' | 'cycle';
/**
 * race / sprint: a lap total · qualifying / sprint-qualifying: Q1–Q3 (SQ1–SQ3) clocks in turn ·
 * practice: one session clock; clocks count down with the replay
 */
export type MockSessionMode = 'race' | 'sprint' | 'qualifying' | 'sprint-qualifying' | 'practice';

// The replay wipes its state when it starts, loops or seeks, so everything is re-sent every second
// (the real feed sends weather about once a minute; the values here drift slowly)
const TICK_MS = 1_000;
const RAIN_CYCLE_MS = 30_000;

interface MockSession {
  name: string;
  type: 'Race' | 'Qualifying' | 'Practice';
  totalLaps?: number;
  /** Clock length of each part in seconds; qualifying runs Q1 → Q2 → Q3 back to back */
  parts?: number[];
}

// Qualifying parts are shortened (real ones run 18 / 15 / 12 minutes) so each part change shows up
// within a few minutes of watching
const SESSIONS: Record<MockSessionMode, MockSession> = {
  race: { name: 'Race', type: 'Race', totalLaps: 52 },
  sprint: { name: 'Sprint', type: 'Race', totalLaps: 19 },
  qualifying: { name: 'Qualifying', type: 'Qualifying', parts: [120, 90, 60] },
  'sprint-qualifying': { name: 'Sprint Qualifying', type: 'Qualifying', parts: [90, 75, 60] },
  practice: { name: 'Practice 1', type: 'Practice', parts: [60 * 60] },
};

/** Seconds → the feed's "H:MM:SS" */
function toFeedClock(seconds: number): string {
  const t = Math.floor(seconds);
  const mm = String(Math.floor(t / 60) % 60).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  return `${Math.floor(t / 3600)}:${mm}:${ss}`;
}

const pick = <T extends string>(allowed: readonly T[], value: string | null | undefined) => {
  const v = value?.trim().toLowerCase();
  return (allowed as readonly string[]).includes(v ?? '') ? (v as T) : null;
};

export const parseMockWeatherMode = (value: string | null | undefined) =>
  pick<MockWeatherMode>(['dry', 'rain', 'cycle'], value);

export const parseMockSessionMode = (value: string | null | undefined) =>
  pick<MockSessionMode>(['race', 'sprint', 'qualifying', 'sprint-qualifying', 'practice'], value);

/** Streams WeatherData into `manager` until the returned function is called */
export function startMockWeather(manager: TimingStateManager, mode: MockWeatherMode): () => void {
  const startedAt = Date.now();

  const tick = () => {
    const ms = Date.now() - startedAt;
    const t = ms / 1000;
    const raining =
      mode === 'rain' || (mode === 'cycle' && Math.floor(ms / RAIN_CYCLE_MS) % 2 === 1);
    // Slow drift that crosses digit counts in rain (9.x → 10.x wind, 99 → 100% humidity)
    const wave = Math.sin(t / 40);
    const weather = {
      AirTemp: (raining ? 19.4 : 24.6) + wave * 1.5,
      TrackTemp: (raining ? 26.1 : 38.9) + wave * 3,
      Humidity: raining ? 96 + Math.round((wave + 1) * 2) : 45 + Math.round(wave * 5),
      Pressure: 1013.2 + wave * 0.8,
      WindSpeed: raining ? 9.2 + (wave + 1) : 1.2 + (wave + 1) * 0.6,
      WindDirection: (47 + t * 3) % 360,
    };
    const data: Record<string, string> = { Rainfall: raining ? '1' : '0' };
    for (const [k, v] of Object.entries(weather)) data[k] = v.toFixed(1);
    manager.processMessage('WeatherData', data);
  };

  logger.info(`[F1] Mock weather (${mode}) feeding the replay; never used for live timing`);
  tick();
  const timer = setInterval(tick, TICK_MS);
  return () => clearInterval(timer);
}

/**
 * Streams SessionInfo plus a lap total (race) or a session clock (qualifying, practice) into
 * `manager`. The clock counts down with the replay's own time, read through `replayTime`, so it
 * follows pause, speed and seeking; when the replay loops back, the clock starts over.
 */
export function startMockSession(
  manager: TimingStateManager,
  mode: MockSessionMode,
  replayTime: () => string | undefined
): () => void {
  const session = SESSIONS[mode];
  let anchor: number | null = null;

  const tick = () => {
    manager.processMessage('SessionInfo', {
      Meeting: { Name: 'Mock Grand Prix', Circuit: { ShortName: 'Mock Circuit' } },
      Name: session.name,
      Type: session.type,
    });

    if (session.totalLaps) {
      // Total only: the current lap stays the replay's own
      manager.processMessage('LapCount', { TotalLaps: session.totalLaps });
      return;
    }

    const iso = replayTime();
    const now = iso ? Date.parse(iso) : NaN;
    if (isNaN(now) || !session.parts) return;
    if (anchor === null || now < anchor) anchor = now;

    // Find the part the replay is in; after the last one its clock stays at zero
    let elapsed = (now - anchor) / 1000;
    let part = 0;
    while (part < session.parts.length - 1 && elapsed >= session.parts[part]) {
      elapsed -= session.parts[part];
      part++;
    }
    const left = Math.max(0, session.parts[part] - elapsed);
    if (session.type === 'Qualifying')
      manager.processMessage('TimingData', { SessionPart: part + 1 });
    manager.processMessage('ExtrapolatedClock', {
      Utc: new Date(now).toISOString(),
      Remaining: toFeedClock(left),
      Extrapolating: left > 0,
    });
  };

  logger.info(`[F1] Mock session (${mode}) feeding the replay; never used for live timing`);
  tick();
  const timer = setInterval(tick, TICK_MS);
  return () => clearInterval(timer);
}
