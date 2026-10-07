import React from 'react';
import { DriverState } from '@livetiming/shared';
import { DriverRow } from './DriverRow.js';

export interface TimingTableProps {
  drivers: DriverState[];
  onSelectDriver: (driver: DriverState) => void;
  selectedDriverNum?: string;
}

const th = 'label whitespace-nowrap py-3 px-3 font-semibold';

export const TimingTable: React.FC<TimingTableProps> = ({
  drivers,
  onSelectDriver,
  selectedDriverNum,
}) => {
  return (
    // `relative` contains the absolutely-positioned sr-only text inside the scroll area
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left">
        <caption className="sr-only">
          Live timing order. Purple marks the overall fastest time, green a personal best.
        </caption>
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
                Waiting for timing data…
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
