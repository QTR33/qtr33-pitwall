import React from 'react';
import { SessionState } from '@livetiming/shared';

export interface WeatherReadoutProps {
  session: SessionState;
}

// Track and air temperature from the feed's WeatherData; nothing until it arrives
export const WeatherReadout: React.FC<WeatherReadoutProps> = ({ session }) => {
  if (session.trackTemp === undefined && session.airTemp === undefined) return null;

  return (
    <span className="num hidden text-data text-mute sm:inline">
      Track {session.trackTemp ?? '—'}° · Air {session.airTemp ?? '—'}°
    </span>
  );
};
