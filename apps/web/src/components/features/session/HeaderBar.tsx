import React from 'react';
import { LiveTimingState, RacingSeriesId, TimingMode } from '@livetiming/shared';
import { FlagBanner } from './FlagBanner.js';
import { WeatherReadout } from './WeatherReadout.js';
import { LapCounter } from './LapCounter.js';
import { SessionTimer } from './SessionTimer.js';
import { BrandMark } from './BrandMark.js';
import { LastUpdated } from './LastUpdated.js';
import { FeedNotice } from './FeedNotice.js';
import { RaceControlTicker } from '../race-control/RaceControlTicker.js';
import { StatusPill, StatusPillProps } from '../../common/StatusPill.js';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme.js';
import { getTrackFlagStyle } from '../../../utils/colors.js';
import { formatRecordedDate } from '../../../utils/formatters.js';
import { FEATURES } from '../../../config.js';

export interface HeaderBarProps {
  state: LiveTimingState;
  onSetMode: (mode: TimingMode) => void;
  onSetSeries: (series: RacingSeriesId) => void;
}

type FeedPill = Pick<StatusPillProps, 'status' | 'text' | 'title' | 'pulse'>;

// The pill must never let a recording or a dropped link pass for live timing
function getFeedPill(state: LiveTimingState): FeedPill | null {
  const feed = state.feedStatus;
  if (state.mode === 'replay') {
    if (feed === 'connecting') {
      return { status: 'connecting', text: 'Connecting', title: 'Connecting to live timing' };
    }
    // When the mode switcher is visible it already names replay
    if (FEATURES.replay) return null;
    return {
      status: 'replay',
      text: 'Recorded session',
      title: 'No live timing right now, so a recorded session is playing',
    };
  }
  if (feed === 'connecting' || feed === 'reconnecting') {
    return { status: 'reconnecting', text: 'Reconnecting', pulse: false };
  }
  return FEATURES.replay ? null : { status: 'live', text: 'Live', pulse: true };
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ state, onSetMode }) => {
  const isLive = state.mode === 'live';
  const { theme, toggleTheme } = useTheme();
  const trackStatus = state.session.trackStatus || 'GREEN';
  const flagStyle = getTrackFlagStyle(trackStatus);
  const pill = getFeedPill(state);
  const isTimedSession =
    state.session.sessionKind === 'practice' || state.session.sessionKind === 'qualifying';
  const linkDown =
    isLive && (state.feedStatus === 'reconnecting' || state.feedStatus === 'connecting');

  // Only what the feed reported; a recording without session info is named by its date
  const recordedOn =
    !isLive && state.replay?.currentTimestamp
      ? formatRecordedDate(state.replay.currentTimestamp)
      : null;
  const sessionLine = [
    state.session.sessionName,
    state.session.sessionType,
    recordedOn && `Recorded ${recordedOn}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const modeButton = (mode: TimingMode, label: string) => {
    const active = state.mode === mode;
    return (
      <button
        type="button"
        onClick={() => onSetMode(mode)}
        aria-pressed={active}
        className={`text-data font-semibold transition-colors duration-150 ${
          active ? 'text-ink' : 'text-mute hover:text-ink'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    // Sticky at every width: the flag, progress and feed state must never scroll out of a glance
    <header className="sticky top-0 z-30 border-b border-rule bg-paper">
      {/* Full-width rule in the track-status color (green, yellow, SC/VSC, red);
          beats during caution periods */}
      {flagStyle.alert && (
        <div
          className={`h-0.5 w-full ${flagStyle.fill} ${flagStyle.pulse ? 'animate-heartbeat' : ''}`}
          aria-hidden="true"
        />
      )}

      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto] items-center gap-x-6 gap-y-4 px-4 py-4 md:grid-cols-[1fr_auto_1fr] md:px-8">
        {/* Brand & session */}
        <div className="min-w-0">
          <BrandMark />
          {sessionLine && (
            <p className="mt-1 truncate text-data text-mute">
              {sessionLine}
              {state.session.circuitName && (
                <span className="hidden lg:inline"> · {state.session.circuitName}</span>
              )}
            </p>
          )}
        </div>

        {/* The one loud element answers "how far along is this session": laps in a race,
            time left in practice and qualifying, where laps are per car, not per session */}
        <div className="order-3 col-span-2 md:order-none md:col-span-1">
          {isTimedSession ? (
            <SessionTimer
              session={state.session}
              referenceTime={isLive ? undefined : state.replay?.currentTimestamp}
            />
          ) : (
            <LapCounter session={state.session} drivers={state.drivers} />
          )}
        </div>

        {/* Status & controls */}
        <div className="flex flex-col items-end gap-1 justify-self-end">
          <div className="flex items-center gap-4">
            {FEATURES.replay && (
              <div className="flex items-center gap-3" role="group" aria-label="Timing mode">
                {modeButton('live', 'Live')}
                {modeButton('replay', 'Replay')}
              </div>
            )}
            {/* A recording's update time is just the wall clock, so only live shows it */}
            {isLive && <LastUpdated lastUpdated={state.lastUpdated} />}
            {pill && <StatusPill {...pill} />}
            <button
              type="button"
              onClick={toggleTheme}
              className="-m-2 p-2 text-mute transition-colors duration-150 hover:text-ink"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <FlagBanner flag={trackStatus} />
            <WeatherReadout session={state.session} />
          </div>
        </div>
      </div>

      {/* Below 2xl the race-control feed sits under the tower, so its latest line rides here */}
      <RaceControlTicker messages={state.raceControl} className="2xl:hidden" />

      {/* Inside the header so it stays in view while the tower scrolls */}
      {linkDown && <FeedNotice lastUpdated={state.lastUpdated} />}
    </header>
  );
};
