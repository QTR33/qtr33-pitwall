/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `development` enables console logging; `production` silences it. Defaults to Vite's mode. */
  readonly VITE_APP_ENV?: 'development' | 'production';
  /** F1 SignalR Core hub URL, e.g. https://livetiming.formula1.com/signalrcore */
  readonly VITE_F1_SIGNALR_URL?: string;
  /** Optional backend base URL, e.g. http://localhost:3001. Unset = client-only. */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
