import React from 'react';
import { ReplayState } from '@livetiming/shared';
import { Button } from '../../common/Button.js';
import { Play, Pause, RotateCcw } from 'lucide-react';

export interface PlaybackControlsProps {
  replay?: ReplayState;
  onTogglePlayPause: () => void;
  onSetSpeed: (speed: number) => void;
  onSeek: (progress: number) => void;
  onRestart: () => void;
}

const SPEEDS = [1, 2, 5, 10];

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  replay,
  onTogglePlayPause,
  onSetSpeed,
  onSeek,
  onRestart,
}) => {
  if (!replay) return null;

  const isPaused = replay.isPaused;
  const currentSpeed = replay.speedMultiplier || 1;
  const progress = replay.currentProgress || 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper">
      <div className="mx-auto flex max-w-[1600px] flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 md:px-8">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={onTogglePlayPause}
            icon={isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          >
            {isPaused ? 'Play' : 'Pause'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRestart}
            icon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Restart
          </Button>
        </div>

        <label className="flex flex-1 items-center gap-3">
          <span className="sr-only">Replay position</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="h-1 w-full cursor-pointer accent-signal"
          />
          <span className="num w-10 text-right text-data text-ink">{progress}%</span>
        </label>

        <div className="flex items-center gap-3" role="group" aria-label="Playback speed">
          <span className="label">Speed</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSetSpeed(s)}
              aria-pressed={currentSpeed === s}
              className={`num text-data transition-colors duration-150 ${
                currentSpeed === s ? 'font-semibold text-ink' : 'text-mute hover:text-ink'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
