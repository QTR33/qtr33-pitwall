import React from 'react';
import { DriverState } from '@livetiming/shared';
import { SectorSegment } from './SectorSegment.js';
import { TyreBadge } from './TyreBadge.js';
import { SpeedTrapCell } from './SpeedTrapCell.js';
import { formatGap, formatInterval, formatLapTime } from '../../../utils/formatters.js';
import { getTimingTextColor } from '../../../utils/colors.js';

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

  const gapValue = driver.GapToLeader || (driver as any).TimeDiffToFastest;
  const gap = formatGap(gapValue, isLeader);

  const intervalValue = driver.IntervalToPositionAhead || (driver as any).TimeDiffToPositionAhead;
  const intervalInfo = formatInterval(intervalValue, isLeader);

  const driverName =
    driver.name ||
    (driver as any).FullName ||
    (driver as any).BroadcastName ||
    `Car ${driver.carNumber || driver.number}`;
  const driverCode = driver.code || (driver as any).Tla || '';
  const driverTeam = driver.team || (driver as any).TeamName || 'Independent';
  const carNumber = driver.carNumber || driver.number;

  const bestColor = getTimingTextColor(
    driver.BestLapTime?.OverallFastest,
    driver.BestLapTime?.PersonalFastest
  );
  const lastColor = getTimingTextColor(
    driver.LastLapTime?.OverallFastest,
    driver.LastLapTime?.PersonalFastest
  );

  const inPit = !!driver.InPit;
  const pitStops = driver.NumberOfPitStops ?? 0;

  // Sticky cells need an opaque background that tracks the row's hover / selected state
  const stickyBg = isSelected ? 'bg-raise' : 'bg-paper group-hover:bg-raise';

  return (
    <tr
      onClick={() => onSelectDriver(driver)}
      aria-selected={isSelected}
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
          {posDelta !== 0 && (
            <span className={`num text-label ${posDelta > 0 ? 'text-pb' : 'text-danger'}`}>
              <span aria-hidden="true">{posDelta > 0 ? '▲' : '▼'}</span>
              {Math.abs(posDelta)}
              <span className="sr-only">
                {posDelta > 0 ? ' positions gained' : ' positions lost'}
              </span>
            </span>
          )}
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
            <button
              type="button"
              className="flex items-baseline gap-2 rounded-sm text-left"
              aria-label={`${driverName}, ${driverTeam} — view details`}
            >
              <span className="num w-5 text-right text-label text-mute">{carNumber}</span>
              <span className="hidden truncate text-data font-semibold text-ink sm:inline">
                {driverName}
              </span>
              <span className="num text-label text-ink sm:text-mute">{driverCode}</span>
            </button>
            <p className="ml-7 hidden truncate text-label text-mute sm:block">{driverTeam}</p>
          </div>
        </div>
      </td>

      <td className={`${td} num text-right text-data ${isLeader ? 'text-mute' : 'text-ink'}`}>
        {gap}
      </td>

      <td
        className={`${td} num text-right text-data ${
          intervalInfo.catching ? 'text-pb' : isLeader ? 'text-mute' : 'text-ink'
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
      </td>

      <td className={`${td} num text-right text-data ${lastColor}`}>
        {formatLapTime(driver.LastLapTime?.Value)}
      </td>

      <td className={`${td} text-right`}>
        <SpeedTrapCell speed={driver.Speeds?.['ST']} label="ST" />
      </td>

      <td className={td}>
        <TyreBadge stint={driver.CurrentStint} />
      </td>

      <td className={`${td} pr-0 text-right`}>
        {inPit ? (
          <span className="label text-warn">In pit</span>
        ) : (
          <span className="num text-data text-mute">{pitStops}</span>
        )}
      </td>
    </tr>
  );
};
