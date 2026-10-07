import React from 'react';
import { SectorData } from '@livetiming/shared';
import { getSegmentColor, getTimingTextColor } from '../../../utils/colors.js';

export interface MiniSectorMatrixProps {
  sectors?: Record<string, SectorData>;
}

export const MiniSectorMatrix: React.FC<MiniSectorMatrixProps> = ({ sectors }) => {
  const sectorList = [0, 1, 2].map((sIndex) => {
    const data = sectors?.[String(sIndex)];
    return {
      index: sIndex + 1,
      // Hold last lap's time (muted) until the car completes this sector again
      time: data?.Value || data?.PreviousValue,
      segments: data?.Segments ? Object.values(data.Segments) : [],
      color: data?.Value
        ? getTimingTextColor(data.OverallFastest, data.PersonalFastest)
        : 'text-mute',
    };
  });

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {sectorList.map((sec) => (
        <div key={sec.index}>
          <div className="flex items-baseline justify-between">
            <span className="label">S{sec.index}</span>
            <span className={`num text-ui ${sec.color}`}>{sec.time || '—'}</span>
          </div>
          <div className="mt-2 flex gap-[3px]">
            {sec.segments.length === 0 ? (
              <span className="text-label text-mute">No mini-sectors yet</span>
            ) : (
              sec.segments.map((seg, idx) => (
                <span
                  key={idx}
                  className={`h-1 flex-1 ${getSegmentColor(seg.Status)}`}
                  title={`Mini-sector ${idx + 1}`}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
