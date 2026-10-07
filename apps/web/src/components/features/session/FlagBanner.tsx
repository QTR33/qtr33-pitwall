import React, { useId } from 'react';
import { TrackFlag } from '@livetiming/shared';
import { getTrackFlagStyle, TrackFlagGlyph } from '../../../utils/colors.js';

export interface FlagBannerProps {
  flag: TrackFlag | string;
}

// A flag mid-wave on a short pole, drawn in a 24×20 box
const FLAG_PATH =
  'M4 2.5C8 0.5 12 4.5 16 2.5C18.5 1.25 20.5 1.5 22 2V12.5C20.5 12 18.5 11.75 16 13C12 15 8 11 4 13Z';

type WavedGlyph = Exclude<TrackFlagGlyph, 'chequered' | 'sc' | 'vsc'>;

const FLAG_FILL: Record<WavedGlyph, string> = {
  green: 'fill-flag-green',
  yellow: 'fill-flag-yellow',
  'double-yellow': 'fill-flag-yellow',
  red: 'fill-flag-red',
};

// Yellow marshal board with black lettering, as shown trackside under SC / VSC
const BoardGlyph: React.FC<{ text: 'SC' | 'VSC' }> = ({ text }) => {
  const width = text === 'SC' ? 24 : 30;

  return (
    <svg
      viewBox={`0 0 ${width} 20`}
      className={`h-5 shrink-0 ${text === 'SC' ? 'w-6' : 'w-[30px]'}`}
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="2.5"
        width={width - 1}
        height="15"
        rx="2"
        strokeWidth="0.75"
        className="fill-flag-yellow stroke-ink/25"
      />
      <text
        x={width / 2}
        y="10"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fontWeight="600"
        className="fill-flag-ink font-mono"
      >
        {text}
      </text>
    </svg>
  );
};

const FlagGlyph: React.FC<{ glyph: Exclude<TrackFlagGlyph, 'sc' | 'vsc'> }> = ({ glyph }) => {
  const patternId = useId();

  return (
    <svg viewBox="0 0 24 20" className="h-5 w-6 shrink-0" aria-hidden="true">
      {glyph === 'chequered' && (
        <defs>
          <pattern id={patternId} width="5" height="5" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" className="fill-paper" />
            <rect width="2.5" height="2.5" className="fill-ink" />
            <rect x="2.5" y="2.5" width="2.5" height="2.5" className="fill-ink" />
          </pattern>
        </defs>
      )}
      <line x1="3.5" y1="1.5" x2="3.5" y2="19" strokeWidth="1.5" className="stroke-mute" />
      <path
        d={FLAG_PATH}
        fill={glyph === 'chequered' ? `url(#${patternId})` : undefined}
        strokeWidth="0.75"
        className={`stroke-ink/25 ${glyph === 'chequered' ? '' : FLAG_FILL[glyph]}`}
      />
    </svg>
  );
};

export const FlagBanner: React.FC<FlagBannerProps> = ({ flag }) => {
  const style = getTrackFlagStyle(flag);

  return (
    <span
      className={`inline-flex items-center gap-2 text-data font-semibold ${style.text}`}
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex" title={style.label}>
        {style.glyph === 'sc' || style.glyph === 'vsc' ? (
          <BoardGlyph text={style.glyph === 'sc' ? 'SC' : 'VSC'} />
        ) : (
          <>
            <FlagGlyph glyph={style.glyph} />
            {style.glyph === 'double-yellow' && (
              <span className="-ml-2">
                <FlagGlyph glyph={style.glyph} />
              </span>
            )}
          </>
        )}
      </span>
      {style.label}
    </span>
  );
};
