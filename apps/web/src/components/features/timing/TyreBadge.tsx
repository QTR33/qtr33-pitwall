import React from 'react';
import { StintData } from '@livetiming/shared';
import { getTyreCompoundInfo } from '../../../utils/colors.js';

export interface TyreBadgeProps {
  stint?: StintData | null;
  showLaps?: boolean;
}

export const TyreBadge: React.FC<TyreBadgeProps> = ({ stint, showLaps = true }) => {
  const info = getTyreCompoundInfo(stint?.Compound);
  const laps = typeof stint?.TotalLaps === 'number' ? stint.TotalLaps : undefined;
  const isNew = String(stint?.New).toLowerCase() === 'true';

  const description = info.isUnknown
    ? 'Tyre data pending'
    : `${info.name} tyre${isNew ? ', new' : ''}${laps !== undefined ? `, ${laps} laps` : ''}`;

  return (
    <span className="inline-flex items-center gap-2" title={description}>
      <span
        className={`num flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] text-label font-semibold ${info.className}`}
        aria-hidden="true"
      >
        {info.short}
      </span>
      {showLaps && laps !== undefined && (
        <span className="num text-data text-mute" aria-hidden="true">
          {laps}
          {isNew && <span className="text-pb"> N</span>}
        </span>
      )}
      <span className="sr-only">{description}</span>
    </span>
  );
};
