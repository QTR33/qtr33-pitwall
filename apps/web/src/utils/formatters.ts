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
  if (isLeader) return { text: '—', catching: false };
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
