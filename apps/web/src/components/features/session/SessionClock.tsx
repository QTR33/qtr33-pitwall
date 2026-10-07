import React, { useState, useEffect } from 'react';
import { SessionState, DriverState } from '@livetiming/shared';

export interface SessionClockProps {
  session: SessionState;
  /** @deprecated Lap display moved to LapCounter; kept for API compatibility */
  drivers?: DriverState[];
}

export const SessionClock: React.FC<SessionClockProps> = ({ session }) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasWeather = session.trackTemp !== undefined || session.airTemp !== undefined;

  return (
    // Hidden on small screens, where the header's only timestamp is the last-updated time
    <span className="num hidden text-data text-mute sm:inline">
      <time>{currentTime}</time>
      {hasWeather && (
        <span className="hidden sm:inline">
          {' · '}Track {session.trackTemp ?? '—'}°{' · '}Air {session.airTemp ?? '—'}°
        </span>
      )}
    </span>
  );
};
