import React from 'react';
import { LiveTimingState, RacingSeriesId, TimingMode } from '@livetiming/shared';
import { FlagBanner } from './FlagBanner.js';
import { SessionClock } from './SessionClock.js';
import { LapCounter } from './LapCounter.js';
import { BrandMark } from './BrandMark.js';
import { LastUpdated } from './LastUpdated.js';
import { StatusPill } from '../../common/StatusPill.js';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme.js';
import { getTrackFlagStyle } from '../../../utils/colors.js';
import { FEATURES } from '../../../config.js';

export interface HeaderBarProps {
  state: LiveTimingState;
  isConnected: boolean;
  onSetMode: (mode: TimingMode) => void;
  onSetSeries: (series: RacingSeriesId) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ state, isConnected, onSetMode }) => {
  const isLive = state.mode === 'live';
  const { theme, toggleTheme } = useTheme();
  const trackStatus = state.session.trackStatus || 'GREEN';
  const flagStyle = getTrackFlagStyle(trackStatus);

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
    <header className="z-30 border-b border-rule bg-paper md:sticky md:top-0">
      {/* Full-width alert rule — only present when the track is not clear */}
      {flagStyle.alert && <div className={`h-0.5 w-full ${flagStyle.fill}`} aria-hidden="true" />}

      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto] items-center gap-x-6 gap-y-4 px-4 py-4 md:grid-cols-[1fr_auto_1fr] md:px-8">
        {/* Brand & session */}
        <div className="min-w-0">
          <BrandMark />
          <p className="mt-1 truncate text-data text-mute">
            {state.session.sessionName} · {state.session.sessionType}
            <span className="hidden lg:inline"> · {state.session.circuitName}</span>
          </p>
        </div>

        {/* Lap counter — the one loud element */}
        <div className="order-3 col-span-2 md:order-none md:col-span-1">
          <LapCounter session={state.session} drivers={state.drivers} />
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
            <LastUpdated lastUpdated={state.lastUpdated} />
            {/* Pill shows only Live or Offline — replay is never named here, and when the mode
                switcher is visible it already names the mode */}
            {(!isConnected || (isLive && !FEATURES.replay)) && (
              <StatusPill
                status={isConnected ? 'live' : 'paused'}
                text={isConnected ? 'Live' : 'Offline'}
                pulse={isConnected}
              />
            )}
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
            <SessionClock session={state.session} />
          </div>
        </div>
      </div>
    </header>
  );
};
