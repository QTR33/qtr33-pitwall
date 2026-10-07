import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'outline' | 'compound';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** @deprecated Glow was removed in the minimal design; kept for API compatibility */
  glow?: boolean;
}

// Badges are plain colored labels — the color carries the meaning, no fills or borders
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const sizeClass = {
    sm: 'text-label',
    md: 'text-label',
    lg: 'text-data',
  }[size];

  const variantClass = {
    default: 'text-mute',
    primary: 'text-signal',
    success: 'text-pb',
    warning: 'text-warn',
    danger: 'text-danger',
    purple: 'text-best',
    outline: 'text-mute',
    compound: 'text-ink font-mono',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-[0.06em] ${sizeClass} ${variantClass} ${className}`}
    >
      {children}
    </span>
  );
};
