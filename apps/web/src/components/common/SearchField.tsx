import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './Button.js';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name, e.g. "Find a driver"; the placeholder is a hint, not the name */
  label: string;
  placeholder?: string;
  /** Enter pressed in the field */
  onSubmit?: () => void;
  /** ArrowDown pressed in the field: move into the results */
  onArrowDown?: () => void;
  /** One key that focuses the field from anywhere on the page, e.g. "/"; shown as a hint */
  shortcut?: string;
  /** Id of an element that describes the field, such as a result count */
  describedBy?: string;
  className?: string;
}

/*
 * A text search: a 36px hairline field (the height of a `md` Button) with a search icon, a clear
 * button while it holds text, and Escape to clear (a second Escape leaves the field). With
 * `shortcut`, that key focuses it from anywhere on the page, except while typing in another field
 * or while a modal dialog is open. It focuses without scrolling: a caller that wants the field in
 * view wherever the page is keeps it there itself (the driver search pins itself while focused).
 */
export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  label,
  placeholder,
  onSubmit,
  onArrowDown,
  shortcut,
  describedBy,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== shortcut || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target;
      // A "/" typed into another field is just typing
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest('input, textarea, select'))
      ) {
        return;
      }
      // A modal dialog makes the page behind it inert; the shortcut must not reach through it
      if (document.querySelector('[aria-modal="true"]')) return;
      // Also stops Firefox's quick find, which "/" opens
      e.preventDefault();
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.select();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter while an input method is composing a character only confirms the character
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      // The first Escape clears; on an empty field it hands focus back to the page
      if (value) onChange('');
      else inputRef.current?.blur();
    } else if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'ArrowDown' && onArrowDown) {
      e.preventDefault();
      onArrowDown();
    }
  };

  const clear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute"
        strokeWidth={2}
        aria-hidden="true"
      />
      {/* The browser's own clear button and search styling are removed: they differ per engine
          and the clear Button below replaces them */}
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label={label}
        aria-describedby={describedBy}
        aria-keyshortcuts={shortcut}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        // Focus draws the global signal outline inset, over the hairline, so the field shows one
        // edge when focused instead of the border plus a ring 2px outside it
        className="peer h-9 w-full appearance-none rounded border border-rule bg-transparent pl-9 pr-10 text-data text-ink transition-colors duration-150 placeholder:text-mute hover:border-mute focus-visible:[outline-offset:-2px] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
      />
      {/* Right end: the clear button while there is text; otherwise the shortcut key, until the
          field has focus. Touch screens have no keyboard to use it, so they never show it */}
      {value ? (
        <span className="absolute inset-y-0 right-3 flex items-center">
          <Button variant="ghost" size="icon-sm" onClick={clear} aria-label="Clear search">
            <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          </Button>
        </span>
      ) : (
        shortcut && (
          <span
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center peer-focus:hidden [@media(hover:none)]:hidden"
            aria-hidden="true"
          >
            <kbd className="label rounded-sm border border-rule px-1.5">{shortcut}</kbd>
          </span>
        )
      )}
    </div>
  );
};
