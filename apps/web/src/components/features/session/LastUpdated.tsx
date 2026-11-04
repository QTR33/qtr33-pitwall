import React, { useEffect, useState } from 'react';
import { formatClockTime } from '../../../utils/formatters.js';

export interface LastUpdatedProps {
  /** When the last feed message arrived (ISO); any message counts, including heartbeats */
  lastUpdated?: string;
}

// After this long without a message the feed is flagged; F1 sends heartbeats well inside it
const STALE_AFTER_MS = 15_000;
// Below this the age reads "just now", so a healthy feed doesn't flicker 0s, 1s, 2s…
const FRESH_MS = 5_000;

/** "12s", "1m 05s", "1h 02m" */
function formatAge(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

// How long since the last message, as an age rather than a clock time: the header has no clock to
// compare against, so "14:32:05" alone could not tell a fan the feed went quiet two minutes ago
export const LastUpdated: React.FC<LastUpdatedProps> = ({ lastUpdated }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!lastUpdated) return null;
  const receivedAt = Date.parse(lastUpdated);
  if (isNaN(receivedAt)) return null;

  const ageMs = Math.max(0, now - receivedAt);
  const isStale = ageMs > STALE_AFTER_MS;
  const age = formatAge(ageMs);

  return (
    <span
      // A fixed minimum width keeps the pill and toggle beside it still while the age ticks
      className={`inline-block min-w-[6.5rem] text-right text-data sm:min-w-[10rem] ${
        isStale ? 'font-semibold text-warn' : 'text-mute'
      }`}
      title={`Last data received at ${formatClockTime(lastUpdated)}`}
    >
      <time dateTime={lastUpdated}>
        {isStale ? (
          <>
            No data for <span className="num">{age}</span>
          </>
        ) : (
          <>
            <span className="sm:hidden">Data </span>
            <span className="hidden sm:inline">Last data </span>
            {ageMs < FRESH_MS ? (
              'just now'
            ) : (
              <>
                <span className="num">{age}</span> ago
              </>
            )}
          </>
        )}
      </time>
      {/* Announced once when it turns stale; the ticking age itself is not a live region */}
      <span role="status" className="sr-only">
        {isStale ? `No timing data received for over ${STALE_AFTER_MS / 1000} seconds` : ''}
      </span>
    </span>
  );
};
