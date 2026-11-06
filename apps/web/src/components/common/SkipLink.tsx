import React from 'react';

export interface SkipLinkProps {
  /** In-page target, e.g. `#race-control` */
  href: string;
  children: React.ReactNode;
}

// Hidden until focused, then pinned top-left over the page. It is not a Button: the visually
// hidden state needs a 1px box that Button's sizes would fight
export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => (
  <a
    href={href}
    className="sr-only rounded border border-rule bg-paper px-3 py-2 text-data font-semibold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
  >
    {children}
  </a>
);
