export function formatLapTime(time?: string): string {
  if (!time) return '—';
  return time;
}

export function formatGap(gap?: string, isLeader = false): string {
  if (isLeader) return 'Leader';
  if (!gap || gap.trim() === '') return '—';
  if (gap.startsWith('+')) return gap;
  return `+${gap}`;
}

export function formatInterval(
  interval?: { Value?: string; Catching?: boolean } | string,
  isLeader = false
): { text: string; catching: boolean } {
  // The Gap cell already says "Leader"; there is no car ahead to measure an interval to
  if (isLeader) return { text: '', catching: false };
  if (!interval) return { text: '—', catching: false };

  if (typeof interval === 'string') {
    return {
      text: interval.startsWith('+') ? interval : `+${interval}`,
      catching: false,
    };
  }

  const text = interval.Value
    ? interval.Value.startsWith('+')
      ? interval.Value
      : `+${interval.Value}`
    : '—';
  return {
    text,
    catching: !!interval.Catching,
  };
}

export function formatSpeed(speed?: { Value?: string } | string): string {
  if (!speed) return '—';
  if (typeof speed === 'string') return speed;
  return speed.Value || '—';
}

export function formatSectorTime(time?: string): string {
  if (!time) return '—';
  return time;
}

/** Seconds in an F1 clock value ("1:02:03", "45:12"); null when unreadable */
export function parseClockSeconds(value: string): number | null {
  const parts = value.split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

/** Countdown as "45:12", or "1:02:03" from an hour up */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(hours ? 2 : 1, '0');
  const ss = String(s % 60).padStart(2, '0');
  return hours ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "24 Jul 2026" in the viewer's locale; empty when the timestamp is unreadable */
export function formatRecordedDate(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Local HH:MM:SS for a feed timestamp; empty when unreadable */
export function formatClockTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toTimeString().split(' ')[0];
}

export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin}m ago`;
  } catch {
    return isoString;
  }
}
