import React from 'react';
import { formatClockTime } from '../../../utils/formatters.js';

export interface FeedNoticeProps {
  /** When timing data last arrived (ISO) */
  lastUpdated?: string;
}

// Shown while the live link is down: the timing stays on screen, but its age is stated plainly
export const FeedNotice: React.FC<FeedNoticeProps> = ({ lastUpdated }) => {
  const since = lastUpdated ? formatClockTime(lastUpdated) : '';

  return (
    <div role="alert" className="border-t border-rule">
      <p className="mx-auto max-w-[1600px] px-4 py-2 text-data md:px-8">
        <span className="font-semibold text-danger">Lost connection to live timing.</span>{' '}
        <span className="text-mute">
          Reconnecting…
          {since && (
            <>
              {' '}
              Times shown are from{' '}
              <time className="num" dateTime={lastUpdated}>
                {since}
              </time>
              .
            </>
          )}
        </span>
      </p>
    </div>
  );
};
