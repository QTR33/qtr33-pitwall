import React from 'react';
import { RaceControlMessage } from '@livetiming/shared';
import { Badge } from '../../common/Badge.js';
import { formatUtcTime, getCategory } from './RaceControlFeed.js';

export interface RaceControlTickerProps {
  /** Newest first, as the feed delivers them */
  messages: RaceControlMessage[];
  className?: string;
}

// The latest race-control message as one line in the sticky header, for widths where the full
// feed sits below the tower: "why is it yellow" stays answerable at a glance. Not a live region,
// so screen readers hear each message once, from the full feed.
export const RaceControlTicker: React.FC<RaceControlTickerProps> = ({
  messages,
  className = '',
}) => {
  const latest = messages[0];
  if (!latest) return null;
  const category = getCategory(latest);

  return (
    <div className={`border-t border-rule ${className}`}>
      <p className="mx-auto flex max-w-[1600px] items-baseline gap-3 px-4 py-2 text-data md:px-8">
        <span className="label hidden shrink-0 sm:inline">Race control</span>
        <time className="num shrink-0 text-label text-mute" dateTime={latest.Utc}>
          {formatUtcTime(latest.Utc)}
        </time>
        <Badge variant={category.variant} className="shrink-0">
          {category.label}
        </Badge>
        <span className="min-w-0 truncate text-ink" title={latest.Message}>
          {latest.Message}
        </span>
        <a
          href="#race-control"
          className="ml-auto shrink-0 rounded-sm text-mute underline-offset-2 transition-colors duration-150 hover:text-ink hover:underline"
        >
          All messages
        </a>
      </p>
    </div>
  );
};
