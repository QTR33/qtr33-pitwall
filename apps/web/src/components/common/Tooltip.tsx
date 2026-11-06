import React, { useId, useState } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Horizontal anchor for top/bottom tooltips; `end` keeps one near the right edge on screen */
  align?: 'center' | 'start' | 'end';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  align = 'center',
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const id = useId();

  const horizontal = {
    center: 'left-1/2 -translate-x-1/2',
    start: 'left-0',
    end: 'right-0',
  }[align];
  const positionClasses = {
    top: `bottom-full mb-2 ${horizontal}`,
    bottom: `top-full mt-2 ${horizontal}`,
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? id : undefined}
    >
      {children}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={`pointer-events-none absolute z-40 whitespace-nowrap rounded bg-ink px-2 py-1 text-label normal-case tracking-normal text-paper ${positionClasses}`}
        >
          {content}
        </span>
      )}
    </span>
  );
};
