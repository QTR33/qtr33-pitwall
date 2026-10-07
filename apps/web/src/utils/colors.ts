import { TrackFlag, normalizeTrackFlag } from '@livetiming/shared';

export type TrackFlagGlyph =
  'green' | 'yellow' | 'double-yellow' | 'sc' | 'vsc' | 'red' | 'chequered';

export interface TrackFlagStyle {
  /** Human-readable status, sentence case */
  label: string;
  /** Text color class */
  text: string;
  /** Background class for the alert rule */
  fill: string;
  /** Which flag to draw */
  glyph: TrackFlagGlyph;
  /** Whether the state is abnormal and should raise the full-width alert rule */
  alert: boolean;
}

export function getTrackFlagStyle(flag?: TrackFlag | string): TrackFlagStyle {
  switch (normalizeTrackFlag(flag)) {
    case 'YELLOW':
      return {
        label: 'Yellow flag',
        text: 'text-warn',
        fill: 'bg-flag-yellow',
        glyph: 'yellow',
        alert: true,
      };
    case 'DOUBLE_YELLOW':
      return {
        label: 'Double yellow',
        text: 'text-warn',
        fill: 'bg-flag-yellow',
        glyph: 'double-yellow',
        alert: true,
      };
    case 'VSC':
      return {
        label: 'Virtual safety car',
        text: 'text-warn',
        fill: 'bg-flag-yellow',
        glyph: 'vsc',
        alert: true,
      };
    case 'SC':
      return {
        label: 'Safety car',
        text: 'text-warn',
        fill: 'bg-flag-yellow',
        glyph: 'sc',
        alert: true,
      };
    case 'RED':
      return {
        label: 'Red flag',
        text: 'text-danger',
        fill: 'bg-flag-red',
        glyph: 'red',
        alert: true,
      };
    case 'CHEQUERED':
      return {
        label: 'Chequered flag',
        text: 'text-ink',
        fill: 'bg-ink',
        glyph: 'chequered',
        alert: false,
      };
    default:
      return {
        label: 'Track clear',
        text: 'text-ink',
        fill: 'bg-flag-green',
        glyph: 'green',
        alert: false,
      };
  }
}

export function getTyreCompoundInfo(compound?: string): {
  name: string;
  short: string;
  /** Text + border color class for the tyre ring */
  className: string;
  isUnknown?: boolean;
} {
  if (!compound || compound.trim() === '') {
    return { name: 'No data', short: '–', className: 'text-mute border-rule', isUnknown: true };
  }

  const comp = compound.trim().toUpperCase();

  // SOFT / RED / C4 / C5 / S
  if (comp === 'S' || comp.includes('SOFT') || comp === 'C4' || comp === 'C5' || comp === 'RED') {
    return { name: 'Soft', short: 'S', className: 'text-compound-soft border-compound-soft' };
  }

  // MEDIUM / YELLOW / C3 / M
  if (comp === 'M' || comp.includes('MED') || comp === 'C3' || comp === 'YELLOW') {
    return { name: 'Medium', short: 'M', className: 'text-compound-medium border-compound-medium' };
  }

  // HARD / WHITE / C1 / C2 / H
  if (comp === 'H' || comp.includes('HARD') || comp === 'C1' || comp === 'C2' || comp === 'WHITE') {
    return { name: 'Hard', short: 'H', className: 'text-compound-hard border-compound-hard' };
  }

  // INTERMEDIATE / GREEN / I
  if (comp === 'I' || comp.includes('INTER') || comp === 'GREEN') {
    return {
      name: 'Intermediate',
      short: 'I',
      className: 'text-compound-inter border-compound-inter',
    };
  }

  // WET / BLUE / W
  if (comp === 'W' || comp.includes('WET') || comp === 'BLUE') {
    return { name: 'Wet', short: 'W', className: 'text-compound-wet border-compound-wet' };
  }

  return {
    name: compound,
    short: compound.charAt(0).toUpperCase(),
    className: 'text-mute border-mute',
  };
}

/** Text color for a timing value: purple = overall best, green = personal best, else neutral */
export function getTimingTextColor(
  isOverallFastest?: boolean,
  isPersonalFastest?: boolean
): string {
  if (isOverallFastest) return 'text-best';
  if (isPersonalFastest) return 'text-pb';
  return 'text-ink';
}

export function getSegmentColor(status: number): string {
  // F1 mini-sector segment status codes:
  // 0:    Not reached yet
  // 2048: Timed, no improvement (Yellow)
  // 2049: Personal best (Green)
  // 2051: Overall best (Purple)
  // 2064: In the pit lane
  if (status === 2051) return 'bg-seg-best';
  if (status === 2049) return 'bg-seg-pb';
  if (status === 2064) return 'bg-mute';
  if (status > 0) return 'bg-seg-warn';
  return 'bg-rule';
}
