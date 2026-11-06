import React from 'react';
import { SessionState, DriverState } from '@livetiming/shared';
import { HeroNumber } from '../../common/HeroNumber.js';

export interface LapCounterProps {
  session: SessionState;
  drivers?: DriverState[];
}

// The page's single bold element: current lap at hero size
export const LapCounter: React.FC<LapCounterProps> = ({ session, drivers = [] }) => {
  // Current lap: session.currentLap (official LapCount when live), else leader / max laps completed
  const leaderDriver = drivers.find((d) => d.Position === '1' || d.Line === 1) || drivers[0];
  const leaderLaps = leaderDriver?.NumberOfLaps || 0;
  const maxDriverLaps = drivers.reduce((max, d) => Math.max(max, d.NumberOfLaps || 0), 0);
  const currentLap = session.currentLap || leaderLaps || maxDriverLaps;
  // Only the feed's own total (official LapCount); until it arrives the slot reads "—", never a guess
  const totalLaps = session.totalLaps > 0 ? session.totalLaps : null;

  if (!currentLap) return null;

  return (
    <HeroNumber
      label="Lap"
      spoken={`Lap ${currentLap}${totalLaps ? ` of ${totalLaps}` : ', total laps not known'}`}
    >
      {currentLap}
      <span className="text-mute">/{totalLaps ?? '—'}</span>
    </HeroNumber>
  );
};
