import React from 'react';
import { RaceControlMessage } from '@livetiming/shared';
import { Card } from '../../common/Card.js';
import { Badge, BadgeProps } from '../../common/Badge.js';

export interface RaceControlFeedProps {
  messages: RaceControlMessage[];
  maxHeight?: string;
}

const MAX_VISIBLE = 15;

function getCategory(msg: RaceControlMessage): { label: string; variant: BadgeProps['variant'] } {
  if (msg.Flag) {
    const f = msg.Flag.toUpperCase();
    if (f === 'RED') return { label: 'Red flag', variant: 'danger' };
    if (f === 'YELLOW' || f === 'DOUBLE_YELLOW') return { label: 'Yellow', variant: 'warning' };
    if (f === 'SC') return { label: 'Safety car', variant: 'warning' };
    if (f === 'VSC') return { label: 'VSC', variant: 'warning' };
    if (f === 'GREEN' || f === 'CLEAR') return { label: 'Green', variant: 'success' };
    return { label: f, variant: 'default' };
  }
  if (msg.Category === 'SafetyCar') return { label: 'Safety car', variant: 'warning' };
  if (msg.Category === 'Drs') return { label: 'DRS', variant: 'default' };
  return { label: 'Notice', variant: 'default' };
}

function formatUtcTime(utc: string) {
  const d = new Date(utc);
  if (isNaN(d.getTime())) return utc;
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export const RaceControlFeed: React.FC<RaceControlFeedProps> = ({
  messages,
  maxHeight = 'max-h-[320px]',
}) => {
  const visible = messages.slice(0, MAX_VISIBLE);

  return (
    <Card
      title="Race control"
      action={
        <span className="num text-label text-mute">
          {messages.length > MAX_VISIBLE ? `${MAX_VISIBLE} of ${messages.length}` : messages.length}
        </span>
      }
    >
      {messages.length === 0 ? (
        <p className="py-4 text-data text-mute">No messages from race control yet.</p>
      ) : (
        <ol className={`${maxHeight} overflow-y-auto`} aria-live="polite" aria-relevant="additions">
          {visible.map((msg, idx) => {
            const category = getCategory(msg);
            return (
              <li
                key={msg.id || idx}
                className="grid grid-cols-[4.5rem_1fr] gap-x-3 border-b border-rule py-2.5 last:border-b-0"
              >
                <time className="num text-label text-mute" dateTime={msg.Utc}>
                  {formatUtcTime(msg.Utc)}
                </time>
                <div className="min-w-0">
                  <Badge variant={category.variant}>{category.label}</Badge>
                  <p className="mt-0.5 break-words text-data text-ink">{msg.Message}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
};
