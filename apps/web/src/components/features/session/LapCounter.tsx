import React from 'react';
import { SessionState, DriverState } from '@livetiming/shared';

export interface LapCounterProps {
  session: SessionState;
  drivers?: DriverState[];
}

// The page's single bold element: current lap at hero size
export const LapCounter: React.FC<LapCounterProps> = ({ session, drivers = [] }) => {
  // Current lap: from leader driver, else max laps completed, else session.currentLap
  const leaderDriver = drivers.find((d) => d.Position === '1' || d.Line === 1) || drivers[0];
  const leaderLaps = leaderDriver?.NumberOfLaps || 0;
  const maxDriverLaps = drivers.reduce((max, d) => Math.max(max, d.NumberOfLaps || 0), 0);
  const currentLap =
    leaderLaps > 0 ? leaderLaps : maxDriverLaps > 0 ? maxDriverLaps : session.currentLap || 1;
  const totalLaps =
    session.totalLaps || (session.series === 'wec' ? 160 : session.series === 'indycar' ? 200 : 58);

  return (
    <div className="flex items-baseline gap-3" aria-label={`Lap ${currentLap} of ${totalLaps}`}>
      <span className="label" aria-hidden="true">
        Lap
      </span>
      <span className="num text-hero font-semibold text-ink" aria-hidden="true">
        {currentLap}
        <span className="text-mute">/{totalLaps}</span>
      </span>
    </div>
  );
};
