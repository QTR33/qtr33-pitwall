import React, { useEffect, useState } from 'react';
import { SessionState } from '@livetiming/shared';
import { HeroNumber } from '../../common/HeroNumber.js';
import { formatCountdown, parseClockSeconds } from '../../../utils/formatters.js';

export interface SessionTimerProps {
  session: SessionState;
  /** Feed time to count down against (a replay's recorded moment); omit for the live wall clock */
  referenceTime?: string;
}

// Hero for timed sessions (practice, qualifying): time left on the official session clock
export const SessionTimer: React.FC<SessionTimerProps> = ({ session, referenceTime }) => {
  const clock = session.clock;
  const ticking = !!clock?.running && !referenceTime;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!ticking) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [ticking]);

  const remainingAt = clock ? parseClockSeconds(clock.remaining) : null;
  const stampedAt = clock ? Date.parse(clock.utc) : NaN;
  if (remainingAt === null || isNaN(stampedAt)) return null;

  // F1 stamps the remaining time once and lets clients extrapolate while the clock runs
  const reference = referenceTime ? Date.parse(referenceTime) : now;
  const elapsed = clock?.running && !isNaN(reference) ? (reference - stampedAt) / 1000 : 0;
  const remaining = formatCountdown(remainingAt - Math.max(0, elapsed));

  return (
    <HeroNumber label="Remaining" spoken={`${remaining} remaining in the session`}>
      {remaining}
    </HeroNumber>
  );
};
