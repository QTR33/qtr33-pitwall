import React from 'react';
import { DriverState } from '@livetiming/shared';
import { SectorSegment } from './SectorSegment.js';
import { TyreBadge } from './TyreBadge.js';
import { Button } from '../../common/Button.js';
import { ArrowUp, Star } from 'lucide-react';
import {
  formatGap,
  formatInterval,
  formatLapTime,
  splitDriverName,
} from '../../../utils/formatters.js';
import { getTimingTextColor, getTimingMeaning } from '../../../utils/colors.js';

export interface DriverRowProps {
  driver: DriverState;
  index: number;
  isLeader: boolean;
  onSelectDriver: (driver: DriverState) => void;
  isSelected?: boolean;
  /** A car the fan is following: its row stays highlighted wherever it moves in the order */
  isWatched?: boolean;
  /** Turns watching this car on or off; without it the row has no watch toggle */
  onToggleWatch?: (driver: DriverState) => void;
  /** Places gained / lost beside the position; only a race or sprint has a grid to count from */
  showPositionChange?: boolean;
  /** Matches the driver search: raised in place, so the order and the cars around it stay */
  isSearchMatch?: boolean;
  /** The one car the driver search points at (Enter opens it) */
  isSearchTarget?: boolean;
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
  isWatched = false,
  onToggleWatch,
  showPositionChange = false,
  isSearchMatch = false,
  isSearchTarget = false,
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
  // The surname always shows; the first name only where the cell has room for it
  const { first: firstName, last: surname } = splitDriverName(driverName);
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

  // Raised rows: the car whose drawer is open, watched cars, and cars matching the driver search
  const isRaised = isSelected || isWatched || isSearchMatch;
  // The 2px left edge: signal for the car whose drawer is open, ink for the car the search points
  // at. Watched cars carry their star instead: a red edge beside a red team bar (Ferrari) read as
  // one more team bar
  const edge = isSelected ? 'bg-signal' : isSearchTarget ? 'bg-ink' : null;
  // Sticky cells need an opaque background that tracks the row's hover / raised / focused state.
  // No color transition on the row: the sticky cells paint their own background, so a fading row
  // lit the position and name at once and the times behind them 150ms later
  const stickyBg = isRaised
    ? 'bg-raise'
    : 'bg-paper group-hover:bg-raise group-has-[[data-row-trigger]:focus-visible]:bg-raise';

  return (
    <tr
      // How the driver search finds this row to scroll to it and focus it (driverRowDom.ts)
      data-car={driver.carNumber}
      onClick={() => onSelectDriver(driver)}
      // Keyboard focus on the driver button lights the whole row (raise and the ink edge below)
      // instead of a ring around the name: the row is what the button stands for
      className={`group cursor-pointer border-b border-rule ${
        isRaised ? 'bg-raise' : 'hover:bg-raise has-[[data-row-trigger]:focus-visible]:bg-raise'
      }`}
    >
      {/* Position — the open car and the search target are marked by an edge on the left */}
      <td className={`${td} sticky left-0 z-10 w-16 pl-2 text-right ${stickyBg}`}>
        {/* The rule is drawn inside the cell, not as its left border: in a collapsed table the
            table paints the borders, so a border stays put while the sticky cell slides over it,
            and an unselected (transparent) one left a slit where scrolled cells showed through.
            The sticky cell is the containing block, so the rule moves with it.
            A focused row takes the ink edge, as the search target does: Enter opens this car.
            The open car's signal edge comes later in the DOM, so it paints over it */}
        <span
          className="absolute inset-y-0 left-0 hidden w-0.5 bg-ink group-has-[[data-row-trigger]:focus-visible]:block"
          aria-hidden="true"
        />
        {edge && <span className={`absolute inset-y-0 left-0 w-0.5 ${edge}`} aria-hidden="true" />}
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
        {/* One line: watch star, team bar, number, name, code. The team survives as its color bar
            and in the drawer, not as a second line. A size container, so the first name can show
            only where the cell has room for it */}
        <div className="flex min-w-0 items-center [container-type:inline-size]">
          {/* Watch toggle first, beside the position where the eye scans, and a star rather than a
              bar, so it never reads as a team color. A watched car always shows it; the rest show
              it only under the pointer or keyboard focus, so twenty idle stars don't crowd the
              tower. Its slot is always kept (touch screens too, which have no hover to reveal it),
              so bars and names never shift; clicking it never opens the drawer. On touch, the
              drawer's Watch toggle is the way in */}
          {onToggleWatch && (
            <span
              className={`mr-1.5 flex w-4 shrink-0 justify-center ${
                isWatched
                  ? ''
                  : 'opacity-0 group-hover:opacity-100 has-[:focus-visible]:opacity-100 [@media(hover:none)]:invisible'
              }`}
            >
              <Button
                variant="mark"
                size="icon-sm"
                pressed={isWatched}
                aria-label={`Watch ${driverName}`}
                onClick={(e: React.MouseEvent) => {
                  // The row opens the drawer; the star only marks the car
                  e.stopPropagation();
                  onToggleWatch(driver);
                }}
              >
                <Star
                  className="h-3.5 w-3.5"
                  fill={isWatched ? 'currentColor' : 'none'}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Button>
            </span>
          )}
          <span
            className={`mr-3 h-5 w-[3px] flex-shrink-0 rounded-full ${teamColor ? '' : 'bg-rule'}`}
            style={teamColor ? { backgroundColor: teamColor } : undefined}
            aria-hidden="true"
          />
          <div className="min-w-0">
            {/* Driver is the one flexible column: long names truncate instead of widening it */}
            <Button
              data-row-trigger
              variant="row"
              size="inline"
              className="flex min-w-0 max-w-full items-baseline gap-1.5 text-left"
              aria-haspopup="dialog"
              aria-label={`${driverName}${driverTeam ? `, ${driverTeam}` : ''}${isOut ? ', out of the race' : ''}${isWatched ? ', watching' : ''} — view details`}
            >
              <span className="num w-5 shrink-0 text-right text-label text-mute">{carNumber}</span>
              {/* The surname, as the broadcast uses it; the first name too from a 240px cell
                  (every name fits there), so a narrow tower drops first names instead of
                  cutting surnames. Phones keep only number and code */}
              <span
                className={`hidden min-w-0 truncate text-data font-semibold sm:inline ${
                  isOut ? 'text-mute' : 'text-ink'
                }`}
              >
                {firstName && (
                  <span className="hidden [@container(min-width:15rem)]:inline">{firstName} </span>
                )}
                {surname}
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

      <td className={`${td} pr-[3px] text-right`}>
        {carState ? (
          <span className={`label whitespace-nowrap ${carState.className}`}>{carState.label}</span>
        ) : (
          <span className="num text-data text-mute">{pitStops}</span>
        )}
      </td>
    </tr>
  );
};
