import React from 'react';
import { DriverState } from '@livetiming/shared';
import { ArrowUp, Star } from 'lucide-react';
import { DriverRow } from './DriverRow.js';

export interface TimingTableProps {
  drivers: DriverState[];
  onSelectDriver: (driver: DriverState) => void;
  selectedDriverNum?: string;
  /** Car numbers the fan is watching; their rows stay highlighted */
  watchedCars?: ReadonlySet<string>;
  /** Turns watching a car on or off; without it the rows have no watch toggle */
  onToggleWatch?: (driver: DriverState) => void;
  /** Shown in place of the rows when there are no drivers */
  emptyMessage?: string;
  /** Places gained / lost beside each position: races and sprints only */
  showPositionChange?: boolean;
  /** Cars matching the driver search: marked in place, the order and every other car kept */
  matchingCars?: ReadonlySet<string>;
  /** The one car the search points at (Enter opens it): marked with an ink edge as well */
  searchTargetCar?: string;
}

const th = 'label whitespace-nowrap py-3 px-3 font-semibold';

export const TimingTable: React.FC<TimingTableProps> = ({
  drivers,
  onSelectDriver,
  selectedDriverNum,
  watchedCars,
  onToggleWatch,
  emptyMessage = 'Waiting for timing data…',
  showPositionChange = false,
  matchingCars,
  searchTargetCar,
}) => {
  const isEmpty = drivers.length === 0;

  return (
    <div>
      {/* `relative` contains the absolutely-positioned sr-only text inside the scroll area */}
      <div className="relative overflow-x-auto">
        {/* Fixed layout: column widths come from the colgroup, never from the values in them, so a
            changing time can't push its neighbours sideways. Widths fit the longest real value
            (IBM Plex Mono 13px ≈ 7.8px per digit) plus the 24px cell padding; Driver takes the
            rest. From sm the 1086px floor leaves Driver 202px: after its padding, the watch star, team
            bar, number and code (the code is 22px, label tracking included), the name gets 87px,
            and the longest surname needs 85 (first names show only where they fit, see
            DriverRow). It also fits the tower's share beside the
            sidebar at 2xl: 1536px less a page scrollbar (up to 17px), 64px of gutter, the 48px gap
            and the 320px sidebar is 1087px. Below sm the driver cell drops to number and code, so
            the floor drops to leave it 112px: on a 390px phone the sticky Pos and Driver then take
            176px and Gap and Int stay on screen.
            Groups (order | pace | strategy) are set apart by 12px of extra lead-in at S1 and Tyre */}
        <table className="w-full min-w-[996px] table-fixed border-collapse text-left sm:min-w-[1086px]">
          {/* The legend is the caption, shown under the rows: each color word is set in the color
              it explains, so a first-time fan can learn the tower without leaving it. With no rows
              it explains nothing, so only its spoken part stays */}
          {/* Label size, but sentence case: drop the label scale's 0.06em tracking, which is meant
              for short uppercase labels and slows reading in running text */}
          <caption className="caption-bottom pt-3 text-left text-label tracking-normal text-mute">
            <span className="sr-only">Live timing order. </span>
            {!isEmpty && (
              <>
                <span className="text-best">Purple</span> fastest overall ·{' '}
                <span className="text-pb">Green</span> personal best · Grey previous lap ·{' '}
                <span className="whitespace-nowrap text-pb">
                  <ArrowUp
                    className="mr-0.5 inline h-3 w-3 align-[-1px]"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  catching
                </span>{' '}
                the car ahead · <span className="num text-pb">N</span> new tyres
                {onToggleWatch && (
                  <>
                    {' '}
                    ·{' '}
                    <span className="whitespace-nowrap">
                      <Star
                        className="mr-0.5 inline h-3 w-3 align-[-1px] text-signal"
                        fill="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      watched driver
                    </span>
                  </>
                )}
              </>
            )}
          </caption>
          <colgroup>
            {/* Position with its gain / loss beside it in a race: "▲12 20". The width stays the
                same in other sessions so the tower does not shift when the session changes */}
            <col className="w-16" />
            <col />
            {/* Gap: "+12.345", "+2 LAPS", "Leader"; Int also fits the 12px catching arrow */}
            <col className="w-[88px]" />
            <col className="w-[100px]" />
            {/* S1–S3: "1:02.345" at most (S1 carries the pace group's lead-in) */}
            <col className="w-[100px]" />
            <col className="w-[88px]" />
            <col className="w-[88px]" />
            {/* Best "1:21.902", Last up to an out-lap "10:46.790" */}
            <col className="w-[88px]" />
            <col className="w-[96px]" />
            {/* Tyre ring + "12 N", plus the strategy group's lead-in */}
            <col className="w-[96px]" />
            {/* "PIT EXIT" / "STOPPED", with 3px of air before the tower's edge */}
            <col className="w-[76px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-rule">
              <th scope="col" className={`${th} sticky left-0 z-10 w-16 bg-paper pl-0 text-right`}>
                Pos
              </th>
              <th scope="col" className={`${th} sticky left-16 z-10 bg-paper`}>
                Driver
              </th>
              <th scope="col" className={`${th} text-right`}>
                Gap
              </th>
              <th scope="col" className={`${th} text-right`}>
                Int
              </th>
              <th scope="col" className={`${th} pl-6 text-right`}>
                S1
              </th>
              <th scope="col" className={`${th} text-right`}>
                S2
              </th>
              <th scope="col" className={`${th} text-right`}>
                S3
              </th>
              <th scope="col" className={`${th} text-right`}>
                Best
              </th>
              <th scope="col" className={`${th} text-right`}>
                Last
              </th>
              <th scope="col" className={`${th} pl-6`}>
                Tyre
              </th>
              <th scope="col" className={`${th} pr-[3px] text-right`}>
                Pit
              </th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver, idx) => (
              <DriverRow
                key={driver.carNumber || idx}
                driver={driver}
                index={idx}
                isLeader={idx === 0}
                onSelectDriver={onSelectDriver}
                isSelected={selectedDriverNum === driver.carNumber}
                isWatched={!!driver.carNumber && !!watchedCars?.has(driver.carNumber)}
                onToggleWatch={onToggleWatch}
                showPositionChange={showPositionChange}
                isSearchMatch={!!driver.carNumber && !!matchingCars?.has(driver.carNumber)}
                isSearchTarget={!!searchTargetCar && searchTargetCar === driver.carNumber}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Outside the scroll area, so it is centred in what the screen shows: inside the 1086px
          table it sat off to the right on a phone */}
      {isEmpty && <p className="py-16 text-center text-data text-mute">{emptyMessage}</p>}
    </div>
  );
};
