import { DriverState } from '@livetiming/shared';

/*
 * Finding a car in the tower by what a fan knows of it: the car number ("44"), the three-letter
 * code ("HAM") or any part of the name ("lewis", "hamil"). Each word typed must match the start
 * of the number, of the code or of one word of the name, so "lew ham" narrows and "am" does not
 * hit every name with an "am" inside it. Case and accents are ignored: "perez" finds Pérez.
 */

// Lower case without diacritics: "Hülkenberg" → "hulkenberg"
const fold = (text: string): string => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** The words of a query, folded; a leading "#" on a number ("#44") is dropped */
export function parseDriverQuery(query: string): string[] {
  return fold(query)
    .split(/\s+/)
    .map((word) => word.replace(/^#/, ''))
    .filter(Boolean);
}

/** The folded strings a query word may prefix: car number, code, and each word of the name */
function searchTerms(driver: DriverState): string[] {
  const nameWords = fold(driver.name ?? '').split(/[\s\-'’.]+/);
  return [
    String(driver.carNumber || driver.number || ''),
    fold(driver.code ?? ''),
    ...nameWords,
  ].filter(Boolean);
}

/** Whether a driver matches every word of the query; an empty query matches everyone */
export function matchesDriver(driver: DriverState, query: string): boolean {
  const words = parseDriverQuery(query);
  if (words.length === 0) return true;
  const terms = searchTerms(driver);
  return words.every((word) => terms.some((term) => term.startsWith(word)));
}

/**
 * The one driver a query points at, or null when it is ambiguous. An exact car number or code
 * wins over prefixes, so "1" is car 1 even though 10, 11 and 16 match too
 */
export function findDriver(drivers: DriverState[], query: string): DriverState | null {
  const words = parseDriverQuery(query);
  if (words.length === 0) return null;
  if (words.length === 1) {
    const [word] = words;
    const exact = drivers.find(
      (d) => String(d.carNumber || d.number || '') === word || fold(d.code ?? '') === word
    );
    if (exact) return exact;
  }
  const matches = drivers.filter((d) => matchesDriver(d, query));
  return matches.length === 1 ? matches[0] : null;
}

export interface DriverSearchResult {
  /** Whether the query has any words; an empty query marks nothing */
  active: boolean;
  /** Every matching driver, in the order given (the tower's order) */
  matches: DriverState[];
  /** The one driver the query points at, which Enter opens; null when it is ambiguous */
  target: DriverState | null;
}

/** What a query finds among the drivers: all matches, and the one it points at if any */
export function searchDrivers(drivers: DriverState[], query: string): DriverSearchResult {
  if (parseDriverQuery(query).length === 0) return { active: false, matches: [], target: null };
  return {
    active: true,
    matches: drivers.filter((d) => matchesDriver(d, query)),
    target: findDriver(drivers, query),
  };
}
