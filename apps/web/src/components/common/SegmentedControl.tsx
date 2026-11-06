import React from 'react';
import { Button } from './Button.js';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  /** Accessible name when the label alone is unclear (e.g. "2×") */
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  /** Names the group for assistive tech */
  label: string;
  /** A visible Label before the segments, e.g. "Speed" */
  visibleLabel?: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Set each segment in tabular numerals (speeds, multipliers) */
  numeric?: boolean;
  className?: string;
}

// A text switch (Live / Replay, 1× 2× 5× 10×): plain text buttons with aria-pressed, active in ink
export function SegmentedControl<T extends string | number>({
  label,
  visibleLabel,
  options,
  value,
  onChange,
  numeric = false,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`flex items-center gap-3 text-data ${className}`}
      role="group"
      aria-label={label}
    >
      {visibleLabel && (
        <span className="label" aria-hidden="true">
          {visibleLabel}
        </span>
      )}
      {options.map((option) => (
        <Button
          key={option.value}
          variant="toggle"
          size="inline"
          pressed={option.value === value}
          onClick={() => onChange(option.value)}
          aria-label={option.ariaLabel}
          className={numeric ? 'num' : ''}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
