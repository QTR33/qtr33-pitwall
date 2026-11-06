import React from 'react';

export interface HeroNumberProps {
  /** Short Label before the number, e.g. "Lap", "Remaining" */
  label: string;
  /** What a screen reader hears instead of the label and digits, e.g. "Lap 16 of 52" */
  spoken: string;
  /** The number itself; may hold a quieter part such as "/52" */
  children: React.ReactNode;
  className?: string;
}

// The screen's one text-hero number (One Hero Rule): a Label, then the value in tabular figures
export const HeroNumber: React.FC<HeroNumberProps> = ({
  label,
  spoken,
  children,
  className = '',
}) => (
  <p className={`flex items-baseline gap-3 ${className}`}>
    <span className="label" aria-hidden="true">
      {label}
    </span>
    <span className="num text-hero font-semibold text-ink" aria-hidden="true">
      {children}
    </span>
    <span className="sr-only">{spoken}</span>
  </p>
);
