import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'neon' | 'active';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: React.ReactNode;
  active?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'secondary',
    size = 'md',
    icon,
    active = false,
    className = '',
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  const sizeClasses = {
    sm: 'h-8 px-3 gap-1.5 text-data',
    md: 'h-9 px-3.5 gap-2 text-data',
    lg: 'h-10 px-4 gap-2 text-ui',
    icon: 'h-9 w-9 justify-center',
  }[size];

  const variantClasses = {
    primary: 'bg-ink text-paper hover:bg-ink/85',
    secondary: 'border border-rule text-ink hover:border-mute',
    danger: 'border border-rule text-danger hover:border-danger',
    ghost: 'text-mute hover:text-ink',
    neon: 'border border-rule text-ink hover:border-mute',
    active: 'bg-ink text-paper',
  }[active ? 'active' : variant];

  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center rounded font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
});
