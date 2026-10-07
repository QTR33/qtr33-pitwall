import path from 'path';
import { fileURLToPath } from 'url';
import type { TimingMode } from '@livetiming/shared';

// Resolve from this file (src/config or dist/config) so paths don't depend on process.cwd()
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  DATA_DIR: process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(REPO_ROOT, 'data'),
  LOGS_DIR: process.env.LOGS_DIR
    ? path.resolve(process.env.LOGS_DIR)
    : path.join(REPO_ROOT, 'logs'),
  DEFAULT_MODE: 'replay' as TimingMode, // Start in replay so dashboard is immediately rich with data out of the box
  F1_SIGNALR_URL: 'https://livetiming.formula1.com/signalrcore',
  F1_TOPICS: [
    'Heartbeat',
    'DriverList',
    'RaceControlMessages',
    'SessionData',
    'TimingData',
    'TimingAppData',
    'SessionStatus',
    'TrackStatus',
  ],
};
