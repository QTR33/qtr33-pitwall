import React from 'react';
import { DriverState } from '@livetiming/shared';
import { SectorSegment } from './SectorSegment.js';
import { TyreBadge } from './TyreBadge.js';
import { Button } from '../../common/Button.js';
import { ArrowUp } from 'lucide-react';
import { formatGap, formatInterval, formatLapTime } from '../../../utils/formatters.js';
import { getTimingTextColor, getTimingMeaning } from '../../../utils/colors.js';

export interface DriverRowProps {
  driver: DriverState;
  index: number;
  isLeader: boolean;
  onSelectDriver: (driver: DriverState) => void;
  isSelected?: boolean;
  /** Places gained / lost beside the position; only a race or sprint has a grid to count from */
  showPositionChange?: boolean;
}

// 8px rows: the tallest cell (the 15px position) sets a ~38px row
const td = 'py-2 px-3 align-middle';
// Extra lead-in whitespace where a column group starts (pace at S1, strategy at Tyre)
const groupStart = 'pl-6';

export const DriverRow: React.FC<DriverRowProps> = ({
  driver,
  index: _index,
  isLeader,
  onSelectDriver,
  isSelected = false,
  showPositionChange = false,
}) => {
  // The feed's team color is data and drawn as-is; with none, the bar falls back to the rule token
  // rather than an invented brand color
  const rawColor: string = (driver as any).TeamColour || driver.team_color || '';
  const teamColor = rawColor && (rawColor.startsWith('#') ? rawColor : `#${rawColor}`);
  const pos = driver.Position ? parseInt(driver.Position, 10) : driver.Line || '—';
  // In practice and qualifying the order is a lap-time ranking, so a move up or down is no overtake
  const posDelta = showPositionChange ? driver.PositionDelta || 0 : 0;

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
      <td className={`${td} sticky left-0 z-10 w-16 pl-2 text-right ${stickyBg}`}>
        {/* The rule is drawn inside the cell, not as its left border: in a collapsed table the
            table paints the borders, so a border stays put while the sticky cell slides over it,
            and an unselected (transparent) one left a slit where scrolled cells showed through.
            The sticky cell is the containing block, so the rule moves with it */}
        {isSelected && (
          <span className="absolute inset-y-0 left-0 w-0.5 bg-signal" aria-hidden="true" />
        )}
        {/* Gain / loss sits beside the position, not under it, so every row stays one line high */}
        <div className="flex items-baseline justify-end gap-1.5">
          {posDelta !== 0 && (
            <span className={`num text-label ${posDelta > 0 ? 'text-pb' : 'text-danger'}`}>
              <span aria-hidden="true">{posDelta > 0 ? '▲' : '▼'}</span>
              {Math.abs(posDelta)}
              <span className="sr-only">
                {posDelta > 0 ? ' positions gained' : ' positions lost'}
              </span>
            </span>
          )}
          <span className="num text-ui font-semibold text-ink">{pos}</span>
        </div>
      </td>

      {/* Driver — the name is a real button so the row is reachable by keyboard */}
      <td className={`${td} sticky left-16 z-10 ${stickyBg}`}>
        {/* One line: the team survives as its color bar and in the drawer, not as a second line */}
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`h-5 w-[3px] flex-shrink-0 rounded-full ${teamColor ? '' : 'bg-rule'}`}
            style={teamColor ? { backgroundColor: teamColor } : undefined}
            aria-hidden="true"
          />
          <div className="min-w-0">
            {/* Driver is the one flexible column: long names truncate instead of widening it */}
            <Button
              variant="plain"
              size="inline"
              className="flex min-w-0 max-w-full items-baseline gap-2 text-left"
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
            </Button>
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
        {/* Catching is said by shape as well as by green: an up arrow, before the value so the
            digits stay aligned with the rows that have none */}
        {intervalInfo.catching && (
          <ArrowUp
            className="mr-1 inline h-3 w-3 align-[-1px]"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        )}
        {intervalInfo.text}
        {intervalInfo.catching && <span className="sr-only"> (catching)</span>}
      </td>

      <td className={`${td} ${groupStart} text-right`}>
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

      <td className={`${td} ${groupStart}`}>
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
