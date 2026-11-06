import React from 'react';
import { SectorData } from '@livetiming/shared';
import { getTimingTextColor, getTimingMeaning } from '../../../utils/colors.js';
import { formatSectorTime } from '../../../utils/formatters.js';

export interface SectorSegmentProps {
  sectorIndex: number; // 0, 1, 2 (S1, S2, S3)
  sector?: SectorData;
}

// The sector time alone: mini-sectors live in the driver drawer, where there is room to read them
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

  return (
    <span className={`num text-data ${textColor}`} title={isHeld ? 'Previous lap' : undefined}>
      {formatSectorTime(time)}
      {meaning && <span className="sr-only">, {meaning}</span>}
    </span>
  );
};
