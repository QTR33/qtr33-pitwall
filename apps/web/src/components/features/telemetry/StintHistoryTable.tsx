import React from 'react';
import { StintData } from '@livetiming/shared';
import { TyreBadge } from '../timing/TyreBadge.js';
import { formatLapTime } from '../../../utils/formatters.js';

export interface StintHistoryTableProps {
  stints?: Record<string, StintData>;
}

export const StintHistoryTable: React.FC<StintHistoryTableProps> = ({ stints }) => {
  if (!stints || Object.keys(stints).length === 0) {
    return <p className="text-data text-mute">No stints recorded yet.</p>;
  }

  const stintList = Object.keys(stints)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((key, index) => ({
      stintNumber: index + 1,
      ...stints[key],
    }));

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-rule">
          <th scope="col" className="label py-2 pr-3 font-semibold">
            Stint
          </th>
          <th scope="col" className="label py-2 px-3 font-semibold">
            Tyre
          </th>
          <th scope="col" className="label py-2 px-3 text-right font-semibold">
            Laps
          </th>
          <th scope="col" className="label py-2 pl-3 text-right font-semibold">
            Best lap
          </th>
        </tr>
      </thead>
      <tbody>
        {stintList.map((stint) => (
          <tr key={stint.stintNumber} className="border-b border-rule">
            <td className="num py-2.5 pr-3 text-data text-ink">{stint.stintNumber}</td>
            <td className="py-2.5 px-3">
              <TyreBadge stint={stint} showLaps={false} />
            </td>
            <td className="num py-2.5 px-3 text-right text-data text-ink">
              {stint.TotalLaps ?? '—'}
            </td>
            <td className="num py-2.5 pl-3 text-right text-data text-ink">
              {formatLapTime(stint.LapTime)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
