import React, { useLayoutEffect, useRef } from 'react';
import { LiveTimingState, RacingSeriesId, SessionState, TimingMode } from '@livetiming/shared';
import { FlagBanner } from './FlagBanner.js';
import { WeatherReadout } from './WeatherReadout.js';
import { LapCounter } from './LapCounter.js';
import { SessionTimer } from './SessionTimer.js';
import { BrandMark } from './BrandMark.js';
import { LastUpdated } from './LastUpdated.js';
import { FeedNotice } from './FeedNotice.js';
import { RaceControlTicker } from '../race-control/RaceControlTicker.js';
import { StatusPill, StatusPillProps } from '../../common/StatusPill.js';
import { Button } from '../../common/Button.js';
import { SegmentedControl } from '../../common/SegmentedControl.js';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme.js';
import { getTrackFlagStyle } from '../../../utils/colors.js';
import { formatRecordedDate } from '../../../utils/formatters.js';
import { getWaitReason } from '../../../utils/feedStatus.js';
import { FEATURES } from '../../../config.js';

export interface HeaderBarProps {
  state: LiveTimingState;
  onSetMode: (mode: TimingMode) => void;
  onSetSeries: (series: RacingSeriesId) => void;
}

type FeedPill = Pick<StatusPillProps, 'status' | 'text' | 'title' | 'pulse'>;

/** "Practice 1", "Qualifying Q2", "Sprint Qualifying SQ1", "Sprint", "Race"; the feed's own name */
function getSessionLabel(session: SessionState): string {
  const part =
    session.sessionKind === 'qualifying' && session.sessionPart
      ? `${/sprint/i.test(session.sessionType) ? 'SQ' : 'Q'}${session.sessionPart}`
      : '';
  return [session.sessionType, part].filter(Boolean).join(' ');
}

// The pill must never let a recording or a dropped link pass for live timing
function getFeedPill(state: LiveTimingState): FeedPill | null {
  const feed = state.feedStatus;
  if (feed === 'no-session') {
    return { status: 'idle', text: 'No session', title: 'Nothing is running on track right now' };
  }
  if (feed === 'unreachable') {
    return { status: 'offline', text: 'Offline', title: 'Can’t reach live timing' };
  }
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
  // Between sessions there is no track status, progress or data age to report, only the pill
  const waiting = getWaitReason(state) !== null;
  const isLive = state.mode === 'live' && !waiting;
  const { theme, toggleTheme } = useTheme();
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  // Only what the feed reported: until it names a track status there is no label and no rule
  const trackStatus = state.session.trackStatus;
  const flagStyle = trackStatus ? getTrackFlagStyle(trackStatus) : null;
  const pill = getFeedPill(state);
  const isTimedSession =
    state.session.sessionKind === 'practice' || state.session.sessionKind === 'qualifying';
  const linkDown =
    isLive && (state.feedStatus === 'reconnecting' || state.feedStatus === 'connecting');

  // The sidebar pins itself just under the header, whose height moves with what it shows (the
  // caution rule, a second session line, the lost-link notice), so publish the real height
  const headerRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--header-h', `${header.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--header-h');
    };
  }, []);

  // Only what the feed reported; a recording without session info is named by its date
  const recordedOn =
    !isLive && state.replay?.currentTimestamp
      ? formatRecordedDate(state.replay.currentTimestamp)
      : null;
  const sessionLabel = getSessionLabel(state.session);
  const meetingLine = [
    state.session.sessionName,
    state.session.circuitName,
    recordedOn && `Recorded ${recordedOn}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    // Sticky at every width: the flag, progress and feed state must never scroll out of a glance
    <header ref={headerRef} className="sticky top-0 z-30 border-b border-rule bg-paper">
      {/* Full-width rule in the track-status color (green, yellow, SC/VSC, red);
          beats during caution periods */}
      {flagStyle?.alert && (
        <div
          className={`h-0.5 w-full ${flagStyle.fill} ${flagStyle.pulse ? 'animate-heartbeat' : ''}`}
          aria-hidden="true"
        />
      )}

      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto] items-center gap-x-6 gap-y-4 px-4 py-4 md:grid-cols-[1fr_auto_1fr] md:px-8">
        {/* Brand & session */}
        <div className="min-w-0">
          <BrandMark />
          {/* Which session this is, on its own line so practice, qualifying, sprint and race
              tell apart at a glance; where and when sit below it, quieter */}
          {sessionLabel && (
            <p className="mt-1 truncate text-data font-semibold text-ink">{sessionLabel}</p>
          )}
          {meetingLine && (
            <p className={`truncate text-data text-mute ${sessionLabel ? '' : 'mt-1'}`}>
              {meetingLine}
            </p>
          )}
        </div>

        {/* The one loud element answers "how far along is this session": laps in a race,
            time left in practice and qualifying, where laps are per car, not per session */}
        <div className="order-3 col-span-2 md:order-none md:col-span-1">
          {waiting ? null : isTimedSession ? (
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
              <SegmentedControl
                label="Timing mode"
                options={[
                  { value: 'live', label: 'Live' },
                  { value: 'replay', label: 'Replay' },
                ]}
                value={state.mode}
                onChange={onSetMode}
              />
            )}
            {/* A recording's update time is just the wall clock, so only live shows it */}
            {isLive && <LastUpdated lastUpdated={state.lastUpdated} />}
            {pill && <StatusPill {...pill} />}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              title={themeLabel}
              aria-label={themeLabel}
              icon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            />
          </div>
          {/* The flag label holds the right edge; conditions sit to its left behind a hairline,
              so a change in the readout never moves it */}
          {!waiting && (
            <div className="flex items-center gap-3">
              <WeatherReadout session={state.session} />
              {trackStatus && <FlagBanner flag={trackStatus} />}
            </div>
          )}
        </div>
      </div>

      {/* Below 2xl the race-control feed sits under the tower, so its latest line rides here */}
      <RaceControlTicker messages={state.raceControl} className="2xl:hidden" />

      {/* Inside the header so it stays in view while the tower scrolls */}
      {linkDown && <FeedNotice lastUpdated={state.lastUpdated} />}
    </header>
  );
};
