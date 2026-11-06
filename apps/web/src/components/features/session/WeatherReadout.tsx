import React, { useId } from 'react';
import { SessionState } from '@livetiming/shared';
import { Tooltip } from '../../common/Tooltip.js';

export interface WeatherReadoutProps {
  session: SessionState;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const COMPASS_SPOKEN = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
];

/** Degrees the wind blows from → index into the 8-point compass */
function compassIndex(deg: number): number {
  return Math.round((((deg % 360) + 360) % 360) / 45) % 8;
}

/**
 * One reading: label and unit in prose, the value in tabular figures inside a slot sized to its
 * longest real value, so a new digit (9° → 10°, 99% → 100%) never moves what sits beside it
 */
const Reading: React.FC<{
  label: string;
  value: string;
  /** Tailwind min-width for the value slot, e.g. `min-w-[2ch]` */
  slot: string;
  unit?: string;
  suffix?: React.ReactNode;
  className?: string;
}> = ({ label, value, slot, unit, suffix, className = '' }) => (
  <span className={`whitespace-nowrap ${className}`}>
    {label} <span className={`num inline-block text-right ${slot}`}>{value}</span>
    {unit}
    {suffix}
  </span>
);

// Track conditions from the feed's WeatherData; nothing until it arrives, never invented values.
// Tiers: track temperature and rain at every width, air from lg, humidity and wind from xl, where
// the status zone has room; all of it, pressure included, in a tooltip on hover, focus or tap.
// It sits left of the flag label so the flag keeps its place at the zone's right edge.
export const WeatherReadout: React.FC<WeatherReadoutProps> = ({ session }) => {
  const summaryId = useId();
  const { trackTemp, airTemp, humidity, windSpeed, windDirection, pressure, rainfall } = session;
  // Direction alone is not shown, so it does not count as having weather to show
  const hasAny = [trackTemp, airTemp, humidity, windSpeed, pressure, rainfall].some(
    (v) => v !== undefined
  );
  if (!hasAny) return null;

  const dir = windDirection !== undefined ? compassIndex(windDirection) : undefined;

  // The feed's own precision, for anyone who stops to read
  const details: [string, string][] = [];
  if (trackTemp !== undefined) details.push(['Track', `${trackTemp.toFixed(1)} °C`]);
  if (airTemp !== undefined) details.push(['Air', `${airTemp.toFixed(1)} °C`]);
  if (humidity !== undefined) details.push(['Humidity', `${humidity.toFixed(0)}%`]);
  if (windSpeed !== undefined) {
    const from =
      dir !== undefined && windDirection !== undefined
        ? ` from ${COMPASS[dir]} (${windDirection.toFixed(0)}°)`
        : '';
    details.push(['Wind', `${windSpeed.toFixed(1)} m/s${from}`]);
  }
  if (pressure !== undefined) details.push(['Pressure', `${pressure.toFixed(1)} mbar`]);
  if (rainfall !== undefined) details.push(['Rain', rainfall ? 'Raining' : 'Dry']);

  // Spoken in words, since "m/s" and a bare "NE" read badly aloud; rain has its own status line
  const spoken = [
    trackTemp !== undefined && `track ${trackTemp.toFixed(0)} degrees Celsius`,
    airTemp !== undefined && `air ${airTemp.toFixed(0)} degrees`,
    humidity !== undefined && `humidity ${humidity.toFixed(0)} percent`,
    windSpeed !== undefined &&
      `wind ${windSpeed.toFixed(1)} metres per second${
        dir !== undefined ? ` from the ${COMPASS_SPOKEN[dir]}` : ''
      }`,
    pressure !== undefined && `pressure ${pressure.toFixed(0)} millibars`,
  ]
    .filter(Boolean)
    .join(', ');

  const tooltip = (
    <span className="block py-0.5">
      {details.map(([label, value]) => (
        <span key={label} className="flex justify-between gap-4">
          <span>{label}</span>
          <span className="num">{value}</span>
        </span>
      ))}
    </span>
  );

  return (
    <>
      <Tooltip content={tooltip} position="bottom" align="end">
        {/* Focusable so keyboard and touch reach the tooltip; tapping focuses it */}
        <span
          tabIndex={0}
          role="group"
          aria-label="Track conditions"
          aria-describedby={summaryId}
          className="flex cursor-default items-center gap-3 rounded text-data text-mute"
        >
          <span id={summaryId} className="sr-only">
            {spoken}
          </span>
          <span className="contents" aria-hidden="true">
            {/* The one emphasized word, read first. While dry its slot stays reserved from md,
                where the header's centred columns would otherwise shift when it appears; at the
                far left the reserved space merges with the free space beside it */}
            {rainfall !== undefined && (
              <span
                className={`font-semibold text-ink ${rainfall ? '' : 'invisible hidden md:inline'}`}
              >
                Rain
              </span>
            )}
            {trackTemp !== undefined && (
              <Reading label="Track" value={trackTemp.toFixed(0)} slot="min-w-[2ch]" unit="°C" />
            )}
            {airTemp !== undefined && (
              <Reading
                label="Air"
                value={airTemp.toFixed(0)}
                slot="min-w-[2ch]"
                unit="°C"
                className="hidden lg:inline"
              />
            )}
            {humidity !== undefined && (
              <Reading
                label="Humidity"
                value={humidity.toFixed(0)}
                slot="min-w-[2ch]"
                unit="%"
                className="hidden xl:inline"
              />
            )}
            {windSpeed !== undefined && (
              <Reading
                label="Wind"
                value={windSpeed.toFixed(1)}
                slot="min-w-[3ch]"
                unit=" m/s"
                suffix={
                  dir !== undefined && (
                    <span className="num inline-block min-w-[3ch] pl-[1ch]">{COMPASS[dir]}</span>
                  )
                }
                className="hidden xl:inline"
              />
            )}
          </span>
        </span>
      </Tooltip>
      {/* Announced once when rain starts or stops; a region present from mount stays quiet */}
      {rainfall !== undefined && (
        <span role="status" className="sr-only">
          {rainfall ? 'Raining at the track' : 'Track dry'}
        </span>
      )}
      <span className="h-3 border-l border-rule" aria-hidden="true" />
    </>
  );
};
