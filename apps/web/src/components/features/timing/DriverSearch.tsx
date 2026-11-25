import React, { useEffect, useId, useRef } from 'react';
import { DriverState } from '@livetiming/shared';
import { SearchField } from '../../common/SearchField.js';
import { DriverSearchResult } from '../../../utils/driverSearch.js';
import { focusDriverRow, scrollDriverRowIntoView } from './driverRowDom.js';

export interface DriverSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** What the query finds in the tower (searchDrivers in utils/driverSearch) */
  result: DriverSearchResult;
  /** Opens a driver's drawer */
  onOpenDriver: (driver: DriverState) => void;
  className?: string;
}

/*
 * Finds a driver without hiding anyone: the tower keeps every car in race order and marks the
 * matches (see TimingTable); this is the field, the line saying what Enter will do, and the jump.
 *
 * - Typing scrolls the page to the car the query points at, else to the first match.
 * - While the field has focus or a query, the band pins under the header, so it stays in view
 *   wherever the page jumps and "/" can be pressed from anywhere in the tower.
 * - Enter opens the drawer of the one driver the query points at and clears the query. Focus goes
 *   to that driver's row first, so closing the drawer lands on the driver in the full order.
 * - ArrowDown moves focus to the row the query jumped to.
 */
export const DriverSearch: React.FC<DriverSearchProps> = ({
  query,
  onQueryChange,
  result,
  onOpenDriver,
  className = '',
}) => {
  const statusId = useId();
  const bandRef = useRef<HTMLDivElement>(null);

  const jumpCar = (result.target ?? result.matches[0])?.carNumber;
  // Read through a ref so the jump follows the query, not the order: a live reorder that changes
  // the first match must not move the page under the fan
  const jumpCarRef = useRef(jumpCar);
  jumpCarRef.current = jumpCar;

  useEffect(() => {
    const car = jumpCarRef.current;
    // Below the band, which is pinned under the header by now
    if (car) scrollDriverRowIntoView(car, bandRef.current?.getBoundingClientRect().bottom ?? 0);
  }, [query]);

  const openTarget = () => {
    const driver = result.target;
    if (!driver?.carNumber) return;
    // The drawer hands focus back to whatever had it, so give it to the row first
    focusDriverRow(driver.carNumber);
    onOpenDriver(driver);
    onQueryChange('');
  };

  const count = result.matches.length;
  const counted = `${count} ${count === 1 ? 'match' : 'matches'}`;
  const noMatch = result.active && count === 0;
  const targetName = result.target && (result.target.name || `Car ${result.target.carNumber}`);

  return (
    <div
      ref={bandRef}
      role="search"
      aria-label="Drivers"
      className={`top-[var(--header-h,6.5rem)] z-20 flex flex-wrap items-center gap-x-4 gap-y-2 bg-paper py-3 focus-within:sticky ${
        result.active ? 'sticky' : ''
      } ${className}`}
    >
      <SearchField
        className="w-full sm:w-72"
        label="Find a driver"
        placeholder="Number, name or code"
        value={query}
        onChange={onQueryChange}
        onSubmit={openTarget}
        onArrowDown={jumpCar ? () => focusDriverRow(jumpCar) : undefined}
        shortcut="/"
        describedBy={statusId}
      />
      {/* What the query found and what Enter will do; also the live region a screen reader hears
          as the query changes, so it stays in the page while empty. On a phone the marked rows say
          it, so only "no match" shows there (on its own line under the field) */}
      <p
        id={statusId}
        role="status"
        className={`text-data text-mute ${noMatch ? '' : 'sr-only sm:not-sr-only'}`}
      >
        {!result.active ? null : noMatch ? (
          <>No driver matches “{query.trim()}”</>
        ) : targetName ? (
          <>
            {count > 1 && `${counted} · `}
            <kbd className="label rounded-sm border border-rule px-1.5">Enter</kbd> opens{' '}
            <span className="text-ink">{targetName}</span>
          </>
        ) : (
          `${counted} · type more to pick one`
        )}
      </p>
    </div>
  );
};
