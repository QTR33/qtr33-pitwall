import React, { useState } from 'react';
import { useLiveTiming } from './hooks/useLiveTiming.js';
import { HeaderBar } from './components/features/session/HeaderBar.js';
import { BrandMark } from './components/features/session/BrandMark.js';
import { TimingTable } from './components/features/timing/TimingTable.js';
import { RaceControlFeed } from './components/features/race-control/RaceControlFeed.js';
import { DriverDetailModal } from './components/features/telemetry/DriverDetailModal.js';
import { PlaybackControls } from './components/features/playback/PlaybackControls.js';
import { Card } from './components/common/Card.js';
import { DriverState } from '@livetiming/shared';
import { formatLapTime } from './utils/formatters.js';
import { FEATURES } from './config.js';

export function App() {
  const { state, setMode, setSpeed, togglePlayPause, seekReplay, restartReplay, setSeries } =
    useLiveTiming();

  // Keep only the car number: the driver is looked up in each new state, so the drawer stays live
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedDriver = state?.drivers.find((d) => d.carNumber === selectedCar) ?? null;

  const handleSelectDriver = (driver: DriverState) => {
    setSelectedCar(driver.carNumber ?? null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Find overall fastest lap driver
  const fastestLapDriver = state?.drivers.find((d) => d.BestLapTime?.OverallFastest);
  const showPlayback = FEATURES.replay && state?.mode === 'replay';
  // Until the first live probe settles there is nothing true to show in the tower yet
  const isConnecting = state?.mode === 'replay' && state.feedStatus === 'connecting';

  return (
    <div className={`flex min-h-screen flex-col ${showPlayback ? 'pb-36 sm:pb-20' : ''}`}>
      <a
        href="#race-control"
        className="sr-only rounded border border-rule bg-paper px-3 py-2 text-data font-semibold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to race control
      </a>

      {state ? (
        <HeaderBar state={state} onSetMode={setMode} onSetSeries={setSeries} />
      ) : (
        <header className="border-b border-rule">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-8">
            <BrandMark />
            <span className="text-data text-mute">Connecting…</span>
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-12 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <h2 className="sr-only">Timing</h2>
            <TimingTable
              drivers={isConnecting ? [] : state?.drivers || []}
              onSelectDriver={handleSelectDriver}
              selectedDriverNum={selectedCar ?? undefined}
              emptyMessage={isConnecting ? 'Connecting to live timing…' : undefined}
            />
          </div>

          <aside className="space-y-10 xl:sticky xl:top-32" aria-label="Session details">
            {fastestLapDriver && (
              <Card title="Fastest lap">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-ui font-semibold text-ink">{fastestLapDriver.name}</p>
                    <p className="text-data text-mute">{fastestLapDriver.team}</p>
                  </div>
                  <div className="text-right">
                    <p className="num text-title text-best">
                      {formatLapTime(fastestLapDriver.BestLapTime?.Value)}
                    </p>
                    {fastestLapDriver.BestLapTime?.Lap && (
                      <p className="num text-data text-mute">
                        Lap {fastestLapDriver.BestLapTime.Lap}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Skip-link target: focusable so keyboard focus lands here, not back at the top */}
            <div id="race-control" tabIndex={-1} className="focus:outline-none">
              <RaceControlFeed messages={state?.raceControl || []} maxHeight="max-h-[420px]" />
            </div>
          </aside>
        </div>
      </main>

      <DriverDetailModal driver={selectedDriver} isOpen={isModalOpen} onClose={handleCloseModal} />

      {showPlayback && state && (
        <PlaybackControls
          replay={state.replay}
          onTogglePlayPause={togglePlayPause}
          onSetSpeed={setSpeed}
          onSeek={seekReplay}
          onRestart={restartReplay}
        />
      )}
    </div>
  );
}
