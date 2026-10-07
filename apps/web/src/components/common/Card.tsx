import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
  subTitle?: string;
  /** Visual variants are collapsed in the minimal design; kept for API compatibility */
  variant?: 'default' | 'subtle' | 'highlight' | 'interactive';
  onClick?: () => void;
  noPadding?: boolean;
  contentClassName?: string;
}

// A Card is a titled section: no surface, no shadow — separated by a hairline and whitespace
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  action,
  icon,
  title,
  subTitle,
  onClick,
  noPadding = false,
  contentClassName = '',
}) => {
  const rightElement = action || (title ? header : null);

  return (
    <section className={className} onClick={onClick}>
      {(header || title || action) && (
        <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2">
          <div className="flex items-baseline gap-2">
            {icon}
            {title && <h2 className="label">{title}</h2>}
            {subTitle && <p className="text-data text-mute">{subTitle}</p>}
          </div>
          {rightElement && <div className="flex items-center gap-2">{rightElement}</div>}
          {!title && !action && header}
        </div>
      )}
      <div className={noPadding ? contentClassName : `pt-3 ${contentClassName}`.trim()}>
        {children}
      </div>
    </section>
  );
};
