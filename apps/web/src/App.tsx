import React, { useState } from 'react';
import { useLiveTiming } from './hooks/useLiveTiming.js';
import { HeaderBar } from './components/features/session/HeaderBar.js';
import { BrandMark } from './components/features/session/BrandMark.js';
import { TimingTable } from './components/features/timing/TimingTable.js';
import { RaceControlFeed } from './components/features/race-control/RaceControlFeed.js';
import { DriverDetailModal } from './components/features/telemetry/DriverDetailModal.js';
import { PlaybackControls } from './components/features/playback/PlaybackControls.js';
import { NoSessionNotice } from './components/features/session/NoSessionNotice.js';
import { Card } from './components/common/Card.js';
import { SkipLink } from './components/common/SkipLink.js';
import { DriverState } from '@livetiming/shared';
import { formatLapTime } from './utils/formatters.js';
import { FEATURES } from './config.js';
import { getWaitReason } from './utils/feedStatus.js';

export function App() {
  const { state, setMode, setSpeed, togglePlayPause, seekReplay, restartReplay, setSeries } =
    useLiveTiming();

  // Keep only the car number: the driver is looked up in each new state, so the drawer stays live.
  // A selection exists only while its drawer is open, so the row's accent edge goes with it
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const selectedDriver = state?.drivers.find((d) => d.carNumber === selectedCar) ?? null;

  const handleSelectDriver = (driver: DriverState) => {
    setSelectedCar(driver.carNumber ?? null);
  };

  const handleCloseModal = () => {
    setSelectedCar(null);
  };

  // Find overall fastest lap driver
  const fastestLapDriver = state?.drivers.find((d) => d.BestLapTime?.OverallFastest);
  const showPlayback = FEATURES.replay && state?.mode === 'replay';
  // Until the first live probe settles there is nothing true to show in the tower yet
  const isConnecting = state?.mode === 'replay' && state.feedStatus === 'connecting';
  // Production between sessions: nothing to put in the tower, and no recording in its place
  const waitingReason = state ? getWaitReason(state) : null;

  return (
    <div className={`flex min-h-screen flex-col ${showPlayback ? 'pb-36 sm:pb-20' : ''}`}>
      {/* Its target lives beside the tower, which is not there between sessions */}
      {!waitingReason && <SkipLink href="#race-control">Skip to race control</SkipLink>}

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
        {waitingReason ? (
          <NoSessionNotice reason={waitingReason} />
        ) : (
          /* The sidebar only sits beside the tower once both fit: the tower needs 1080px, the
            sidebar 320 + 48 gap, the page 64 of gutter — about 1512px, so from 2xl (1536px).
            Narrower, the tower takes the full width and the sidebar follows it */
          <div className="grid grid-cols-1 items-start gap-x-12 gap-y-12 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <h2 className="sr-only">Timing</h2>
              <TimingTable
                drivers={isConnecting ? [] : state?.drivers || []}
                onSelectDriver={handleSelectDriver}
                selectedDriverNum={selectedCar ?? undefined}
                emptyMessage={isConnecting ? 'Connecting to live timing…' : undefined}
                // The feed types a sprint as a race too; an unnamed session shows no change
                showPositionChange={state?.session.sessionKind === 'race'}
              />
            </div>

            {/* Under the tower: fastest lap and race control side by side from lg; a column beside
              the tower from 2xl, pinned 2rem under the header (its height comes from HeaderBar).
              Pinned, it is held to the screen's height: sticky only works within the tower's
              row, so a sidebar taller than the room left at the bottom of the page would be
              pushed up and under the header. The room is the screen less the header, 2rem above
              and 2rem of page padding below, plus the playback bar when it shows */}
            <aside
              className={`flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12 2xl:sticky 2xl:top-[calc(var(--header-h,6.5rem)_+_2rem)] 2xl:flex-col 2xl:gap-10 ${
                showPlayback
                  ? '2xl:max-h-[calc(100vh_-_var(--header-h,6.5rem)_-_9rem)]'
                  : '2xl:max-h-[calc(100vh_-_var(--header-h,6.5rem)_-_4rem)]'
              }`}
              aria-label="Session details"
            >
              {fastestLapDriver && (
                <Card title="Fastest lap" className="lg:w-80 lg:shrink-0 2xl:w-auto">
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

              {/* Skip-link target: focusable so keyboard focus lands here, not back at the top.
                  The one part of the pinned sidebar that may shrink (its list then scrolls) */}
              <div
                id="race-control"
                tabIndex={-1}
                className="flex min-h-0 min-w-0 flex-col focus:outline-none lg:flex-1 2xl:flex-initial"
              >
                <RaceControlFeed messages={state?.raceControl || []} maxHeight="max-h-[420px]" />
              </div>
            </aside>
          </div>
        )}
      </main>

      <DriverDetailModal
        driver={selectedDriver}
        isOpen={selectedDriver !== null}
        onClose={handleCloseModal}
      />

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
