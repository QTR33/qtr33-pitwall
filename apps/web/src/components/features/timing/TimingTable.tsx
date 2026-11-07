import React from 'react';
import { DriverState } from '@livetiming/shared';
import { ArrowUp } from 'lucide-react';
import { DriverRow } from './DriverRow.js';

export interface TimingTableProps {
  drivers: DriverState[];
  onSelectDriver: (driver: DriverState) => void;
  selectedDriverNum?: string;
  /** Shown in place of the rows when there are no drivers */
  emptyMessage?: string;
  /** Places gained / lost beside each position: races and sprints only */
  showPositionChange?: boolean;
}

const th = 'label whitespace-nowrap py-3 px-3 font-semibold';

export const TimingTable: React.FC<TimingTableProps> = ({
  drivers,
  onSelectDriver,
  selectedDriverNum,
  emptyMessage = 'Waiting for timing data…',
  showPositionChange = false,
}) => {
  return (
    // `relative` contains the absolutely-positioned sr-only text inside the scroll area
    <div className="relative overflow-x-auto">
      {/* Fixed layout: column widths come from the colgroup, never from the values in them, so a
          changing time can't push its neighbours sideways. Widths fit the longest real value
          (IBM Plex Mono 13px ≈ 7.8px per digit) plus the 24px cell padding; Driver takes the rest.
          The 1080px floor leaves Driver ~190px, enough for a full name before it truncates.
          Groups (order | pace | strategy) are set apart by 12px of extra lead-in at S1 and Tyre */}
      <table className="w-full min-w-[1080px] table-fixed border-collapse text-left">
        {/* The legend is the caption, shown under the rows: each color word is set in the color
            it explains, so a first-time fan can learn the tower without leaving it */}
        {/* Label size, but sentence case: drop the label scale's 0.06em tracking, which is meant
            for short uppercase labels and slows reading in running text */}
        <caption className="caption-bottom pt-3 text-left text-label tracking-normal text-mute">
          <span className="sr-only">Live timing order. </span>
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
          {/* "PIT EXIT" / "STOPPED" */}
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
            <th scope="col" className={`${th} pr-0 text-right`}>
              Pit
            </th>
          </tr>
        </thead>
        <tbody>
          {drivers.length === 0 ? (
            <tr>
              <td colSpan={11} className="py-16 text-center text-data text-mute">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            drivers.map((driver, idx) => (
              <DriverRow
                key={driver.carNumber || idx}
                driver={driver}
                index={idx}
                isLeader={idx === 0}
                onSelectDriver={onSelectDriver}
                isSelected={selectedDriverNum === driver.carNumber}
                showPositionChange={showPositionChange}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
