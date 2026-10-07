import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.js';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subTitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  drawer?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subTitle,
  children,
  size = 'lg',
  drawer = false,
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Keep keyboard focus inside the dialog
      if (e.key === 'Tab' && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-7xl',
  }[size];

  const header = (
    <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-5">
      <div className="min-w-0">
        {title && (
          <h2 id={titleId} className="text-title font-semibold text-ink">
            {title}
          </h2>
        )}
        {subTitle && <p className="mt-0.5 text-data text-mute">{subTitle}</p>}
      </div>
      <Button ref={closeRef} variant="ghost" size="icon" onClick={onClose} aria-label="Close">
        <X className="h-5 w-5" aria-hidden="true" />
      </Button>
    </div>
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex ${drawer ? 'justify-end' : 'items-center justify-center p-4'}`}
    >
      <div className="fixed inset-0 animate-fade-in bg-black/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={
          drawer
            ? 'relative z-10 flex h-full w-full max-w-xl animate-drawer-in flex-col border-l border-rule bg-paper'
            : `relative z-10 flex max-h-[90vh] w-full animate-fade-in flex-col overflow-hidden rounded border border-rule bg-paper ${sizeClasses}`
        }
      >
        {header}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
};
