export * from './types/telemetry.js';
export * from './core/timing-state-manager.js';
import f1Drivers2026 from './series/f1/drivers-2026.json' with { type: 'json' };

export const REGISTERED_SERIES = [
  {
    id: 'f1',
    name: 'Formula 1',
    category: 'Single Seater',
    season: 2026,
    accentColor: '#E10600',
    supportedModes: ['live', 'replay'],
  },
  {
    id: 'wec',
    name: 'FIA WEC',
    category: 'Endurance / Hypercar',
    season: 2026,
    accentColor: '#003399',
    supportedModes: ['replay'],
  },
  {
    id: 'indycar',
    name: 'IndyCar Series',
    category: 'Open Wheel',
    season: 2026,
    accentColor: '#D12640',
    supportedModes: ['replay'],
  },
] as const;

export { f1Drivers2026 };
