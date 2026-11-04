export type AppEnv = 'development' | 'production';

// VITE_APP_ENV wins; otherwise follow Vite's mode (`vite` = development, `vite build` = production)
const rawAppEnv =
  import.meta.env.VITE_APP_ENV ?? (import.meta.env.DEV ? 'development' : 'production');

export const ENV = {
  APP_ENV: (rawAppEnv === 'development' ? 'development' : 'production') as AppEnv,
  /** F1 SignalR Core hub. Empty means live timing is off and the dashboard runs the replay. */
  F1_SIGNALR_URL: (import.meta.env.VITE_F1_SIGNALR_URL ?? '').trim(),
  /** Optional backend (apps/server). When set, the dashboard streams from it instead of F1. */
  SERVER_URL: (import.meta.env.VITE_SERVER_URL ?? '').trim().replace(/\/$/, ''),
};

export const IS_DEV = ENV.APP_ENV === 'development';
