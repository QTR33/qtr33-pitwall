import React from 'react';

export interface StatusPillProps {
  status: 'live' | 'replay' | 'paused' | 'flag' | 'sc' | 'vsc' | 'green' | 'red';
  text: string;
  className?: string;
  pulse?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  text,
  className = '',
  pulse = true,
}) => {
  const dot = {
    live: 'bg-signal',
    replay: 'bg-mute',
    paused: 'bg-mute',
    flag: 'bg-warn',
    sc: 'bg-warn',
    vsc: 'bg-warn',
    green: 'bg-pb',
    red: 'bg-danger',
  }[status];

  // Only the live indicator is allowed to move
  const shouldPulse = pulse && status === 'live';

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 text-data font-semibold text-ink ${className}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {shouldPulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dot}`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      {text}
    </span>
  );
};
