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
  const {
    state,
    isConnected,
    error,
    setMode,
    setSpeed,
    togglePlayPause,
    seekReplay,
    restartReplay,
    setSeries,
  } = useLiveTiming();

  const [selectedDriver, setSelectedDriver] = useState<DriverState | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectDriver = (driver: DriverState) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Find overall fastest lap driver
  const fastestLapDriver = state?.drivers.find((d) => d.BestLapTime?.OverallFastest);
  const showPlayback = FEATURES.replay && state?.mode === 'replay';

  return (
    <div className={`flex min-h-screen flex-col ${showPlayback ? 'pb-36 sm:pb-20' : ''}`}>
      {state ? (
        <HeaderBar
          state={state}
          isConnected={isConnected}
          onSetMode={setMode}
          onSetSeries={setSeries}
        />
      ) : (
        <header className="border-b border-rule">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-8">
            <BrandMark />
            <span className="text-data text-mute">Connecting…</span>
          </div>
        </header>
      )}

      {error && !isConnected && (
        <div className="mx-auto mt-4 w-full max-w-[1600px] px-4 md:px-8">
          <p role="alert" className="border-l-2 border-danger pl-3 text-data text-ink">
            Lost connection to the timing feed. Reconnecting…
          </p>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-12 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <h2 className="sr-only">Timing</h2>
            <TimingTable
              drivers={state?.drivers || []}
              onSelectDriver={handleSelectDriver}
              selectedDriverNum={selectedDriver?.carNumber}
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

            <RaceControlFeed messages={state?.raceControl || []} maxHeight="max-h-[420px]" />
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
