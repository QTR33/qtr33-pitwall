import React from 'react';
import { SpeedData } from '@livetiming/shared';
import { formatSpeed } from '../../../utils/formatters.js';
import { getTimingTextColor } from '../../../utils/colors.js';

export interface SpeedTrapCellProps {
  speed?: SpeedData;
  label?: string;
}

// Unit (km/h) lives in the column header, not repeated in every cell
export const SpeedTrapCell: React.FC<SpeedTrapCellProps> = ({ speed, label: _label }) => {
  const color = speed?.Value
    ? getTimingTextColor(speed.OverallFastest, speed.PersonalFastest)
    : 'text-mute';

  return <span className={`num text-data ${color}`}>{formatSpeed(speed)}</span>;
};
