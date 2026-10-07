import React from 'react';
import { DriverState } from '@livetiming/shared';
import { Modal } from '../../common/Modal.js';
import { MiniSectorMatrix } from './MiniSectorMatrix.js';
import { StintHistoryTable } from './StintHistoryTable.js';
import { formatLapTime, formatGap, formatSpeed } from '../../../utils/formatters.js';
import { getTimingTextColor } from '../../../utils/colors.js';

export interface DriverDetailModalProps {
  driver: DriverState | null;
  isOpen: boolean;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h3 className="label">{title}</h3>
    {children}
  </section>
);

const Stat: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="label">{label}</dt>
    <dd className="num mt-1 text-ui text-ink">{children}</dd>
  </div>
);

export const DriverDetailModal: React.FC<DriverDetailModalProps> = ({
  driver,
  isOpen,
  onClose,
}) => {
  if (!driver) return null;

  const pos = driver.Position || (driver as any).Line || '—';
  const carNumber = driver.carNumber || driver.number;
  const driverName =
    driver.name || (driver as any).FullName || (driver as any).BroadcastName || `Car ${carNumber}`;
  const driverTeam = driver.team || (driver as any).TeamName || 'Independent';
  const gapValue = driver.GapToLeader || (driver as any).TimeDiffToFastest;
  const isLeader = String(pos) === '1';
  const bestColor = getTimingTextColor(
    driver.BestLapTime?.OverallFastest,
    driver.BestLapTime?.PersonalFastest
  );

  const traps = [
    { id: 'ST', name: 'Speed trap' },
    { id: 'I1', name: 'Intermediate 1' },
    { id: 'I2', name: 'Intermediate 2' },
    { id: 'FL', name: 'Finish line' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      drawer={true}
      title={driverName}
      subTitle={`${driverTeam} · Car ${carNumber}`}
    >
      <div className="space-y-10">
        {/* Position is the drawer's one bold element */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="label">Position</p>
            <p className="num text-hero font-semibold text-ink">P{pos}</p>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-right">
            <Stat label="Gap">{formatGap(gapValue, isLeader)}</Stat>
            <Stat label="Best lap">
              <span className={bestColor}>{formatLapTime(driver.BestLapTime?.Value)}</span>
            </Stat>
            <Stat label="Pit stops">{driver.NumberOfPitStops ?? 0}</Stat>
          </dl>
        </div>

        <Section title="Sectors">
          <MiniSectorMatrix sectors={driver.Sectors} />
        </Section>

        <Section title="Speed traps · km/h">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {traps.map((trap) => {
              const speed = driver.Speeds?.[trap.id];
              const color = speed?.Value
                ? getTimingTextColor(speed.OverallFastest, speed.PersonalFastest)
                : 'text-mute';
              return (
                <Stat key={trap.id} label={trap.name}>
                  <span className={color}>{formatSpeed(speed)}</span>
                </Stat>
              );
            })}
          </dl>
        </Section>

        <Section title="Stints">
          <StintHistoryTable stints={driver.Stints} />
        </Section>
      </div>
    </Modal>
  );
};
