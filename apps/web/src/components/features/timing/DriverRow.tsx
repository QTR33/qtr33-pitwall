import React from 'react';
import { DriverState } from '@livetiming/shared';
import { SectorSegment } from './SectorSegment.js';
import { TyreBadge } from './TyreBadge.js';
import { SpeedTrapCell } from './SpeedTrapCell.js';
import { formatGap, formatInterval, formatLapTime } from '../../../utils/formatters.js';
import { getTimingTextColor, getTimingMeaning } from '../../../utils/colors.js';

export interface DriverRowProps {
  driver: DriverState;
  index: number;
  isLeader: boolean;
  onSelectDriver: (driver: DriverState) => void;
  isSelected?: boolean;
}

const td = 'py-2.5 px-3 align-middle';

export const DriverRow: React.FC<DriverRowProps> = ({
  driver,
  index: _index,
  isLeader,
  onSelectDriver,
  isSelected = false,
}) => {
  const rawColor = (driver as any).TeamColour || driver.team_color || '#E10600';
  const teamColor = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;
  const pos = driver.Position ? parseInt(driver.Position, 10) : driver.Line || '—';
  const posDelta = driver.PositionDelta || 0;

  // A retired car's gap and interval froze when it stopped racing; they no longer mean anything
  const isOut = !!driver.Retired;

  const gapValue = driver.GapToLeader || (driver as any).TimeDiffToFastest;
  const gap = isOut ? '—' : formatGap(gapValue, isLeader);

  const intervalValue = driver.IntervalToPositionAhead || (driver as any).TimeDiffToPositionAhead;
  const intervalInfo = isOut
    ? { text: '—', catching: false }
    : formatInterval(intervalValue, isLeader);

  const driverName =
    driver.name ||
    (driver as any).FullName ||
    (driver as any).BroadcastName ||
    `Car ${driver.carNumber || driver.number}`;
  const driverCode = driver.code || (driver as any).Tla || '';
  // Unknown stays empty: a made-up team would be a claim the feed never made
  const driverTeam = driver.team || (driver as any).TeamName || '';
  const carNumber = driver.carNumber || driver.number;

  const bestColor = getTimingTextColor(
    driver.BestLapTime?.OverallFastest,
    driver.BestLapTime?.PersonalFastest
  );
  const lastColor = getTimingTextColor(
    driver.LastLapTime?.OverallFastest,
    driver.LastLapTime?.PersonalFastest
  );
  const bestMeaning = getTimingMeaning(
    driver.BestLapTime?.OverallFastest,
    driver.BestLapTime?.PersonalFastest
  );
  const lastMeaning = getTimingMeaning(
    driver.LastLapTime?.OverallFastest,
    driver.LastLapTime?.PersonalFastest
  );

  const pitStops = driver.NumberOfPitStops ?? 0;
  // Car state outranks the stop count: out of the race, stopped on track, in or leaving the pits
  const carState = isOut
    ? { label: 'Out', className: 'text-mute' }
    : driver.Stopped
      ? { label: 'Stopped', className: 'text-danger' }
      : driver.InPit
        ? { label: 'In pit', className: 'text-warn' }
        : driver.PitOut
          ? { label: 'Pit exit', className: 'text-warn' }
          : null;

  // Sticky cells need an opaque background that tracks the row's hover / selected state
  const stickyBg = isSelected ? 'bg-raise' : 'bg-paper group-hover:bg-raise';

  return (
    <tr
      onClick={() => onSelectDriver(driver)}
      className={`group cursor-pointer border-b border-rule transition-colors duration-150 ${
        isSelected ? 'bg-raise' : 'hover:bg-raise'
      }`}
    >
      {/* Position — selected row is marked by the accent rule on the left */}
      <td
        className={`${td} sticky left-0 z-10 w-12 border-l-2 pl-2 text-right ${stickyBg} ${
          isSelected ? 'border-signal' : 'border-transparent'
        }`}
      >
        <div className="flex flex-col items-end leading-tight">
          <span className="num text-ui font-semibold text-ink">{pos}</span>
          {/* The delta line keeps its height when empty, so a gain or loss never resizes the row */}
          <span
            className={`num min-h-[14px] text-label ${posDelta > 0 ? 'text-pb' : 'text-danger'}`}
          >
            {posDelta !== 0 && (
              <>
                <span aria-hidden="true">{posDelta > 0 ? '▲' : '▼'}</span>
                {Math.abs(posDelta)}
                <span className="sr-only">
                  {posDelta > 0 ? ' positions gained' : ' positions lost'}
                </span>
              </>
            )}
          </span>
        </div>
      </td>

      {/* Driver — the name is a real button so the row is reachable by keyboard */}
      <td className={`${td} sticky left-12 z-10 ${stickyBg}`}>
        <div className="flex items-center gap-3">
          <span
            className="h-7 w-[3px] flex-shrink-0 rounded-full"
            style={{ backgroundColor: teamColor }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            {/* Driver is the one flexible column: long names truncate instead of widening it */}
            <button
              type="button"
              className="flex min-w-0 max-w-full items-baseline gap-2 rounded-sm text-left"
              aria-haspopup="dialog"
              aria-label={`${driverName}${driverTeam ? `, ${driverTeam}` : ''}${isOut ? ', out of the race' : ''} — view details`}
            >
              <span className="num w-5 shrink-0 text-right text-label text-mute">{carNumber}</span>
              <span
                className={`hidden min-w-0 truncate text-data font-semibold sm:inline ${
                  isOut ? 'text-mute' : 'text-ink'
                }`}
              >
                {driverName}
              </span>
              <span className="num shrink-0 text-label text-ink sm:text-mute">{driverCode}</span>
            </button>
            <p className="ml-7 hidden truncate text-label text-mute sm:block">
              {/* A non-breaking space keeps the row height when the team is unknown */}
              {driverTeam || '\u00a0'}
            </p>
          </div>
        </div>
      </td>

      <td
        className={`${td} num text-right text-data ${isLeader || isOut ? 'text-mute' : 'text-ink'}`}
      >
        {gap}
      </td>

      <td
        className={`${td} num text-right text-data ${
          intervalInfo.catching ? 'text-pb' : isLeader || isOut ? 'text-mute' : 'text-ink'
        }`}
      >
        {intervalInfo.text}
        {intervalInfo.catching && <span className="sr-only"> (catching)</span>}
      </td>

      <td className={`${td} text-right`}>
        <SectorSegment sectorIndex={0} sector={driver.Sectors?.['0']} />
      </td>
      <td className={`${td} text-right`}>
        <SectorSegment sectorIndex={1} sector={driver.Sectors?.['1']} />
      </td>
      <td className={`${td} text-right`}>
        <SectorSegment sectorIndex={2} sector={driver.Sectors?.['2']} />
      </td>

      <td className={`${td} num text-right text-data ${bestColor}`}>
        {formatLapTime(driver.BestLapTime?.Value)}
        {bestMeaning && <span className="sr-only">, {bestMeaning}</span>}
      </td>

      <td className={`${td} num text-right text-data ${lastColor}`}>
        {formatLapTime(driver.LastLapTime?.Value)}
        {lastMeaning && <span className="sr-only">, {lastMeaning}</span>}
      </td>

      <td className={`${td} text-right`}>
        <SpeedTrapCell speed={driver.Speeds?.['ST']} label="ST" />
      </td>

      <td className={td}>
        <TyreBadge stint={driver.CurrentStint} />
      </td>

      <td className={`${td} pr-0 text-right`}>
        {carState ? (
          <span className={`label whitespace-nowrap ${carState.className}`}>{carState.label}</span>
        ) : (
          <span className="num text-data text-mute">{pitStops}</span>
        )}
      </td>
    </tr>
  );
};
