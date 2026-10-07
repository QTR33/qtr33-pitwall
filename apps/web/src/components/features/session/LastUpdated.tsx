import React, { useEffect, useState } from 'react';

export interface LastUpdatedProps {
  /** ISO timestamp of the latest timing snapshot received */
  lastUpdated?: string;
}

// After this long without an update the feed is flagged as stale
const STALE_AFTER_MS = 15_000;

export const LastUpdated: React.FC<LastUpdatedProps> = ({ lastUpdated }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const received = lastUpdated ? new Date(lastUpdated) : null;
  if (!received || isNaN(received.getTime())) return null;

  const ageSec = Math.max(0, Math.round((now - received.getTime()) / 1000));
  const isStale = now - received.getTime() > STALE_AFTER_MS;

  return (
    <span
      className={`num text-data ${isStale ? 'text-warn' : 'text-mute'}`}
      title={`Last updated ${ageSec}s ago`}
    >
      <span className="font-sans sm:hidden">Updated </span>
      <span className="hidden font-sans sm:inline">Last updated </span>
      <time dateTime={lastUpdated}>{received.toTimeString().split(' ')[0]}</time>
      {isStale && <span className="font-sans"> · stale</span>}
    </span>
  );
};
