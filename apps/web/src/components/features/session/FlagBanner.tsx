import React from 'react';
import { TrackFlag } from '@livetiming/shared';
import { getTrackFlagStyle } from '../../../utils/colors.js';

export interface FlagBannerProps {
  flag: TrackFlag | string;
}

// Track status as words only; the full-width rule at the top of the header carries the flag color
export const FlagBanner: React.FC<FlagBannerProps> = ({ flag }) => {
  const style = getTrackFlagStyle(flag);

  return (
    <span className={`text-data font-semibold ${style.text}`} role="status" aria-live="polite">
      {style.label}
    </span>
  );
};
