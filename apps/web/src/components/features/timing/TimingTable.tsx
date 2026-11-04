import React from 'react';
import { DriverState } from '@livetiming/shared';
import { DriverRow } from './DriverRow.js';

export interface TimingTableProps {
  drivers: DriverState[];
  onSelectDriver: (driver: DriverState) => void;
  selectedDriverNum?: string;
  /** Shown in place of the rows when there are no drivers */
  emptyMessage?: string;
}

const th = 'label whitespace-nowrap py-3 px-3 font-semibold';

export const TimingTable: React.FC<TimingTableProps> = ({
  drivers,
  onSelectDriver,
  selectedDriverNum,
  emptyMessage = 'Waiting for timing data…',
}) => {
  return (
    // `relative` contains the absolutely-positioned sr-only text inside the scroll area
    <div className="relative overflow-x-auto">
      {/* Fixed layout: column widths come from the colgroup, never from the values in them, so a
          changing time can't push its neighbours sideways. Widths fit the longest real value
          (IBM Plex Mono 13px ≈ 7.8px per digit) plus the 24px cell padding; Driver takes the rest */}
      <table className="w-full min-w-[1024px] table-fixed border-collapse text-left">
        <caption className="sr-only">
          Live timing order. Purple marks the overall fastest time, green a personal best.
        </caption>
        <colgroup>
          <col className="w-12" />
          <col />
          {/* Gap, Int: "+12.345", "+2 LAPS", "Leader" */}
          <col className="w-[88px]" />
          <col className="w-[88px]" />
          {/* S1–S3: "1:02.345" at most; the mini-sector bars share the cell width */}
          <col className="w-[88px]" />
          <col className="w-[88px]" />
          <col className="w-[88px]" />
          {/* Best "1:21.902", Last up to an out-lap "10:46.790" */}
          <col className="w-[88px]" />
          <col className="w-[96px]" />
          {/* ST "312" */}
          <col className="w-14" />
          {/* Tyre ring + "12 N" */}
          <col className="w-[84px]" />
          {/* "PIT EXIT" / "STOPPED" */}
          <col className="w-[76px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className={`${th} sticky left-0 z-10 w-12 bg-paper pl-0 text-right`}>
              Pos
            </th>
            <th scope="col" className={`${th} sticky left-12 z-10 bg-paper`}>
              Driver
            </th>
            <th scope="col" className={`${th} text-right`}>
              Gap
            </th>
            <th scope="col" className={`${th} text-right`}>
              Int
            </th>
            <th scope="col" className={`${th} text-right`}>
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
            <th scope="col" className={`${th} text-right`}>
              <abbr title="Speed trap, km/h" className="no-underline">
                ST
              </abbr>
            </th>
            <th scope="col" className={th}>
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
              <td colSpan={12} className="py-16 text-center text-data text-mute">
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
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
