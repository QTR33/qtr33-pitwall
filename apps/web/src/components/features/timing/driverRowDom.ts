/*
 * Each tower row carries `data-car`, so the driver search can bring a row into view and move focus
 * to it without threading refs through the table. Kept apart from the components so their modules
 * export components only.
 */

const findRow = (car: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`tr[data-car="${CSS.escape(car)}"]`);

// Room left between the row and whatever covers the top or bottom of the screen
const MARGIN_PX = 12;

/**
 * Scrolls the page just enough to show a car's row below `topInset` (the bottom edge of the
 * sticky header and search band). Instant, not smooth: the tower's only movers are the LIVE dot
 * and the caution rule
 */
export function scrollDriverRowIntoView(car: string, topInset: number): void {
  const row = findRow(car);
  if (!row) return;
  const rect = row.getBoundingClientRect();
  const top = topInset + MARGIN_PX;
  const bottom = window.innerHeight - MARGIN_PX;
  if (rect.top < top) window.scrollBy({ top: rect.top - top });
  else if (rect.bottom > bottom) window.scrollBy({ top: rect.bottom - bottom });
}

/** Moves keyboard focus to a car's row (its driver button, the row's own control) */
export function focusDriverRow(car: string): void {
  findRow(car)?.querySelector<HTMLElement>('[data-row-trigger]')?.focus({ preventScroll: true });
}
