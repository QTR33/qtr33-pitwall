import React from 'react';
import { SectorData } from '@livetiming/shared';
import { getTimingTextColor, getTimingMeaning, getSegmentColor } from '../../../utils/colors.js';
import { formatSectorTime } from '../../../utils/formatters.js';

export interface SectorSegmentProps {
  sectorIndex: number; // 0, 1, 2 (S1, S2, S3)
  sector?: SectorData;
}

export const SectorSegment: React.FC<SectorSegmentProps> = ({
  sectorIndex: _sectorIndex,
  sector,
}) => {
  const textColor = sector?.Value
    ? getTimingTextColor(sector.OverallFastest, sector.PersonalFastest)
    : 'text-mute';
  // While the car is still in this sector, hold last lap's time (muted) until the new one lands
  const isHeld = !sector?.Value && !!sector?.PreviousValue;
  const time = sector?.Value || sector?.PreviousValue;
  const meaning = isHeld
    ? 'previous lap'
    : sector?.Value
      ? getTimingMeaning(sector.OverallFastest, sector.PersonalFastest)
      : '';

  // Mini-sector segments (typically 6-8 per sector), drawn as thin bars under the time
  const segments = sector?.Segments ? Object.values(sector.Segments) : [];

  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`num text-data ${textColor}`} title={isHeld ? 'Previous lap' : undefined}>
        {formatSectorTime(time)}
        {meaning && <span className="sr-only">, {meaning}</span>}
      </span>
      {/* Bars share the cell width, so the segment count (6–10 by circuit) never resizes the
          column; the strip is always there, so the row keeps its height before data arrives */}
      <div className="flex h-[3px] w-full gap-[2px]" aria-hidden="true">
        {segments.map((seg, idx) => (
          <span key={idx} className={`flex-1 ${getSegmentColor(seg.Status)}`} />
        ))}
      </div>
    </div>
  );
};
