# 🏎️ Motorsport Live Timing & Telemetry Dashboard

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Yarn Workspaces](https://img.shields.io/badge/Yarn-Workspaces-2C8EBB?logo=yarn)](https://yarnpkg.com/)
[![SignalR](https://img.shields.io/badge/SignalR-Core-512BD4?logo=dotnet)](https://learn.microsoft.com/aspnet/core/signalr/)

A high-performance, real-time motorsport live timing and telemetry platform. Built with a modular **Yarn Monorepo** architecture, it ingests live deltas from the official **Formula 1 SignalR stream**, manages telemetry state with deep-merge delta resolution, and broadcasts sub-second updates to a minimal, timing-tower style F1 pitwall web dashboard.

---

## 📌 Features

- **⚡ Dual Operational Modes**:
  - **Live SignalR Stream**: Direct WebSocket connection to `https://livetiming.formula1.com/signalrcore` with auto-reconnection and heartbeat monitoring.
  - **Replay / Simulator Engine**: Offline playback engine parsing recorded telemetry (`signal.log`) with variable speed multipliers (**1x, 2x, 5x, 10x**), scrub navigation, pause, and restart.
- **🏁 Pitwall Live Timing Leaderboard**:
  - Positions P1–P22 with gain/loss deltas (▲/▼).
  - Driver numbers with official team color branding.
  - Live Gap to Leader and Interval to Car Ahead (with real-time **Catching** indicator ⚡).
  - 3-Sector times with visual mini-sector segment blocks (🟡 Timed, 🟢 Personal Best, 🟣 Overall Fastest).
  - Speed trap metrics (**ST**, **I1**, **I2**, **FL** in km/h).
  - Overall & Personal Fastest Lap tracking.
  - Tyre Strategy: Compound badges (🔴 Soft, 🟡 Medium, ⚪ Hard, 🟢 Inter, 🔵 Wet), tyre age in laps, and new/used indicators.
  - Pit Stop status: `IN PIT`, `OUT`, and pit stop counter.
- **🚨 Real-Time Race Control Feed**:
  - Live ticker of track flags (🟢 GREEN, 🟡 YELLOW, 🔴 RED, ⚠️ SC, ⚠️ VSC, 🏁 CHEQUERED), steward investigations, and pit lane notices.
- **📊 Interactive Driver Telemetry Drawer**:
  - Click on any driver to inspect detailed sector splits, mini-sector progress, speed traps, and multi-stint tyre history.
- **🧩 Scalable Multi-Series Architecture**:
  - Designed with an extensible `SeriesProvider` adapter pattern so new motorsport categories (FIA WEC, IndyCar, MotoGP, Formula E) can be plugged in easily.
- **🛠️ Code Quality**:
  - Clean ESLint configuration, Prettier rules, and Tailwind CSS v3 design system with minimal dark/light theme tokens.

---

## 🏗️ Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       DATA INGESTION                        │
│                                                             │
│   Official F1 SignalR Feed          Recorded Telemetry Log  │
│   livetiming.formula1.com/signalrcore     (data/f1/signal.log)   │
│                 │                               │           │
│                 ▼                               ▼           │
│        [ F1Connection ]                 [ F1Replayer ]      │
└────────────────┬────────────────────────────────┬───────────┘
                 │                                │
                 └───────────────┬────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    STATE ENGINE (SERVER)                    │
│                                                             │
│               [ F1SeriesAdapter / Provider ]                │
│                               │                             │
│                               ▼                             │
│                    [ TimingStateManager ]                   │
│             - Deep-Merge Telemetry Deltas                   │
│             - Driver Positioning & Gaps                     │
│             - Mini-Sector Bitmask Decoders                  │
│             - Fastest Lap & Stint Resolvers                 │
│                               │                             │
│                               ▼                             │
│                [ WebSocket & REST Server ]                  │
│                    (ws://localhost:3001/ws)                 │
└───────────────────────────────┬─────────────────────────────┘
                                │ (Throttled real-time deltas)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    PITWALL WEB DASHBOARD                    │
│                         (apps/web)                          │
│                                                             │
│  [ useLiveTiming ] ──► HeaderBar (Flags, Clock, Mode Switch)│
│                    ──► TimingTable & DriverRows             │
│                    ──► RaceControlFeed                      │
│                    ──► DriverDetailModal (Telemetry Drawer) │
│                    ──► PlaybackControls (Scrubber & Speeds) │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Bulletproof Directory Structure

```
livetiming-dashboard/
├── apps/
│   ├── server/                         # Telemetry ingestion, state managers & streaming server
│   │   ├── src/
│   │   │   ├── config/                 # Server configuration & SignalR topics
│   │   │   ├── providers/              # Motorsport series providers & adapters
│   │   │   │   ├── base-provider.ts    # Abstract SeriesProvider interface
│   │   │   │   └── f1/                 # Formula 1 provider, SignalR client & Replayer
│   │   │   │       ├── f1-adapter.ts
│   │   │   │       ├── f1-connection.ts
│   │   │   │       └── f1-replayer.ts
│   │   │   ├── services/               # WebSocket broadcaster, REST API & logger
│   │   │   │   ├── ws-server.ts
│   │   │   │   └── logger.ts
│   │   │   ├── server.ts               # Express & HTTP server instance
│   │   │   └── index.ts                # Server entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                            # Real-time Live Timing Web Dashboard
│       ├── src/
│       │   ├── components/             # Reusable UI components (Tailwind v3)
│       │   │   ├── common/             # Base design system primitives
│       │   │   │   ├── Badge.tsx       # Status, compound, & position badges
│       │   │   │   ├── Button.tsx      # Primary, secondary, ghost action buttons
│       │   │   │   ├── Card.tsx        # Titled sections (label + hairline)
│       │   │   │   ├── Modal.tsx       # Animated telemetry drawer / modal
│       │   │   │   ├── Tabs.tsx        # Series & view switcher tabs
│       │   │   │   ├── StatusPill.tsx  # Pulsing live & flag indicators
│       │   │   │   └── Tooltip.tsx     # Telemetry metric hover tips
│       │   │   └── features/           # Domain feature components
│       │   │       ├── session/        # HeaderBar, SeriesSelector, SessionClock, FlagBanner
│       │   │       ├── timing/         # TimingTable, DriverRow, SectorSegment, TyreBadge, SpeedTrapCell
│       │   │       ├── race-control/   # RaceControlFeed
│       │   │       ├── telemetry/      # DriverDetailModal, StintHistoryTable, MiniSectorMatrix
│       │   │       └── playback/       # PlaybackControls, TimelineScrubber, SpeedSelector
│       │   ├── hooks/                  # useLiveTiming, useWebSocket
│       │   ├── types/                  # UI telemetry models
│       │   ├── utils/                  # Time formatters, delta helpers, color mappers
│       │   ├── App.tsx                 # Main application dashboard layout
│       │   ├── main.tsx                # React entry point
│       │   └── index.css               # Tailwind directives & custom motorsport styling
│       ├── index.html
│       ├── tailwind.config.js          # Tailwind CSS v3 configuration
│       ├── postcss.config.js
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── packages/
│   └── shared/                         # Shared schemas, types & series definitions
│       ├── src/
│       │   ├── types/                  # Core telemetry, sector, tyre, driver interfaces
│       │   └── series/                 # Registered motorsport series & driver databases
│       │       └── f1/
│       │           └── drivers-2026.json
│       ├── package.json
│       └── tsconfig.json
│
├── data/                               # Historical telemetry logs & snapshots
│   └── f1/
│       ├── signal.log                  # Real-time recorded raw telemetry log
│       ├── final-timing-state.json     # Snapshot state
│       └── drivers.json                # 2026 F1 driver grid specifications
│
├── .eslintrc.json                      # ESLint configuration
├── .eslintignore                       # ESLint ignore rules
├── .prettierrc                         # Prettier formatting rules
├── .prettierignore                     # Prettier ignore rules
├── README.md                           # Project documentation
├── package.json                        # Root yarn workspaces configuration
└── tsconfig.json                       # Base TypeScript configuration
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: `v18.0.0` or higher (recommended: Node 20+)
- **Yarn**: `1.22.x` or modern Yarn

### 1. Install Dependencies

```bash
yarn install
```

### 2. Start Development Environment

Run both the backend telemetry server and the frontend Vite web application concurrently:

```bash
yarn dev
```

The application will be available at:

- 🌐 **Web Dashboard**: [http://localhost:5173](http://localhost:5173)
- 📡 **Telemetry Server API**: [http://localhost:3001/api/state](http://localhost:3001/api/state)
- 🔌 **WebSocket Stream**: `ws://localhost:3001/ws`

Optional environment variables:

| Variable          | Used by | Default                                   |
| :---------------- | :------ | :---------------------------------------- |
| `PORT`            | server  | `3001`                                    |
| `DATA_DIR`        | server  | `<repo>/data`                             |
| `LOGS_DIR`        | server  | `<repo>/logs`                             |
| `VITE_SERVER_URL` | web     | `<current protocol>//<current host>:3001` |

### 3. Individual Component Scripts

| Command             | Description                                         |
| :------------------ | :-------------------------------------------------- |
| `yarn dev:server`   | Starts backend server with hot-reload (`tsx watch`) |
| `yarn dev:web`      | Starts frontend Vite development server             |
| `yarn build`        | Compiles TypeScript and builds production bundles   |
| `yarn typecheck`    | Type-checks shared, server and web (`tsc --noEmit`) |
| `yarn lint`         | Runs ESLint across all packages and applications    |
| `yarn format`       | Formats all code using Prettier                     |
| `yarn format:check` | Validates Prettier formatting                       |

---

## 🏎️ 2026 Formula 1 Grid Reference

The project includes pre-configured driver numbers, 3-letter codes, teams, and official hex colors for the 2026 grid:

| #      | Driver            | Code  | Team            | Accent Color              |
| :----- | :---------------- | :---- | :-------------- | :------------------------ |
| **1**  | Lando Norris      | `NOR` | McLaren         | `#FF8000` (Papaya)        |
| **81** | Oscar Piastri     | `PIA` | McLaren         | `#FF8000` (Papaya)        |
| **16** | Charles Leclerc   | `LEC` | Ferrari         | `#E8002D` (Rosso Corsa)   |
| **44** | Lewis Hamilton    | `HAM` | Ferrari         | `#E8002D` (Rosso Corsa)   |
| **3**  | Max Verstappen    | `VER` | Red Bull Racing | `#3671C6` (Navy)          |
| **6**  | Isack Hadjar      | `HAD` | Red Bull Racing | `#3671C6` (Navy)          |
| **63** | George Russell    | `RUS` | Mercedes        | `#27F4D2` (Petronas Teal) |
| **12** | Kimi Antonelli    | `ANT` | Mercedes        | `#27F4D2` (Petronas Teal) |
| **14** | Fernando Alonso   | `ALO` | Aston Martin    | `#229971` (Racing Green)  |
| **18** | Lance Stroll      | `STR` | Aston Martin    | `#229971` (Racing Green)  |
| **10** | Pierre Gasly      | `GAS` | Alpine          | `#0093CC` (Alpine Blue)   |
| **43** | Franco Colapinto  | `COL` | Alpine          | `#0093CC` (Alpine Blue)   |
| **31** | Esteban Ocon      | `OCO` | Haas F1 Team    | `#B6BABD` (Haas Grey)     |
| **87** | Oliver Bearman    | `BEA` | Haas F1 Team    | `#B6BABD` (Haas Grey)     |
| **30** | Liam Lawson       | `LAW` | Racing Bulls    | `#6692FF` (RB Blue)       |
| **41** | Arvid Lindblad    | `LIN` | Racing Bulls    | `#6692FF` (RB Blue)       |
| **23** | Alexander Albon   | `ALB` | Williams        | `#64C4FF` (Williams Cyan) |
| **55** | Carlos Sainz      | `SAI` | Williams        | `#64C4FF` (Williams Cyan) |
| **27** | Nico Hülkenberg   | `HUL` | Audi            | `#C0C0C0` (Audi Silver)   |
| **5**  | Gabriel Bortoleto | `BOR` | Audi            | `#C0C0C0` (Audi Silver)   |
| **11** | Sergio Pérez      | `PER` | Cadillac        | `#D4AF37` (Cadillac Gold) |
| **77** | Valtteri Bottas   | `BOT` | Cadillac        | `#D4AF37` (Cadillac Gold) |

---

## 🔌 API & WebSocket Contract

### WebSocket Stream (`ws://localhost:3001/ws`)

#### Server Broadcasts

```json
{
  "type": "STATE_UPDATE",
  "payload": {
    "series": "f1",
    "mode": "replay",
    "session": {
      "sessionName": "Grand Prix 2026",
      "sessionType": "Race",
      "trackStatus": "GREEN",
      "totalLaps": 58,
      "currentLap": 14
    },
    "drivers": [
      {
        "carNumber": "1",
        "name": "Lando Norris",
        "code": "NOR",
        "team": "McLaren",
        "Position": "1",
        "GapToLeader": "",
        "BestLapTime": { "Value": "1:22.491", "OverallFastest": true },
        "LastLapTime": { "Value": "1:23.625" },
        "Sectors": {
          "0": { "Value": "29.105" },
          "1": { "Value": "30.486" },
          "2": { "Value": "24.034" }
        },
        "Speeds": { "ST": { "Value": "326" } },
        "CurrentStint": { "Compound": "SOFT", "TotalLaps": 17 }
      }
    ],
    "raceControl": [
      {
        "Utc": "2026-07-24T15:34:00",
        "Category": "Flag",
        "Flag": "GREEN",
        "Message": "GREEN LIGHT - PIT EXIT OPEN"
      }
    ],
    "replay": {
      "isActive": true,
      "isPaused": false,
      "speedMultiplier": 2,
      "currentProgress": 42
    }
  }
}
```

#### Client Commands

Send JSON payloads to the WebSocket connection:

```json
// Switch operational mode
{ "type": "SET_MODE", "payload": "live" }   // or "replay"

// Set playback speed
{ "type": "SET_SPEED", "payload": 5 }        // 1, 2, 5, 10

// Pause / Resume replay
{ "type": "TOGGLE_PLAY_PAUSE" }

// Seek replay progress
{ "type": "SEEK_REPLAY", "payload": 75 }     // 0 - 100%

// Restart replay
{ "type": "RESTART_REPLAY" }
```

---

## 📈 Scaling to Other Motorsport Series

To add a new racing series (e.g., FIA WEC, IndyCar, MotoGP):

1. **Define Driver & Series Metadata**:
   Add series JSON file in `packages/shared/src/series/<series-name>/`.
2. **Implement `SeriesProvider`**:
   Create a provider class in `apps/server/src/providers/<series-name>/` implementing the `SeriesProvider` interface:
   ```typescript
   export class WECSeriesAdapter implements SeriesProvider {
     readonly seriesId = 'wec';
     readonly name = 'FIA WEC';
     async start(mode?: 'live' | 'replay'): Promise<void> { ... }
     async stop(): Promise<void> { ... }
     getState(): LiveTimingState { ... }
     onUpdate(callback: (state: LiveTimingState) => void): () => void { ... }
   }
   ```
3. **Register in `apps/server/src/server.ts`**:
   Add the adapter to the server's `providers` map. The frontend series switcher will automatically enable switching!

---

## 📄 License

This project is open-source and created for motorsport telemetry analysis and enthusiasts.
