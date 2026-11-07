import React from 'react';
import type { WaitReason } from '../../../utils/feedStatus.js';

export interface NoSessionNoticeProps {
  /** no-session: the feed answered and nothing is on track · unreachable: it did not answer */
  reason: WaitReason;
}

const COPY = {
  'no-session': {
    title: 'No session on track',
    body: 'Live timing appears here when the next practice, qualifying or race begins. This page checks every few minutes, so there is no need to refresh.',
  },
  unreachable: {
    title: 'Can’t reach live timing',
    body: 'Check your internet connection. This page tries again every few minutes and as soon as you are back online, so there is no need to refresh.',
  },
} as const;

// Takes the place of the tower and sidebar between sessions. An empty state is a plain sentence:
// no icon, no illustration, no box; the header pill carries the status at a glance
export const NoSessionNotice: React.FC<NoSessionNoticeProps> = ({ reason }) => {
  const { title, body } = COPY[reason];

  return (
    <section aria-labelledby="no-session-title" className="mx-auto max-w-md py-24 text-center">
      <h2 id="no-session-title" className="text-title font-semibold text-ink">
        {title}
      </h2>
      <p className="mt-2 text-data text-mute">{body}</p>
    </section>
  );
};
