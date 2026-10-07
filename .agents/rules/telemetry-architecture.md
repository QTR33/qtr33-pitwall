# Rule: Telemetry State Management & Multi-Series Scalability

## 1. Telemetry Ingestion & Delta Deep Merging

- Formula 1 and other motorsport feeds send sparse JSON deltas (e.g. only updating Sector 2 while keeping Sector 1 and Stint history).
- Never overwrite top-level objects directly. All telemetry ingestion must pass through `TimingStateManager` with deep-merge logic.
- Sector segment bitmasks:
  - `2048`: Timed / yellow
  - `2049`: Personal best / green
  - `2064`: Overall fastest / purple

## 2. Multi-Series Provider Pattern

- All racing categories must implement the `SeriesProvider` interface (`apps/server/src/providers/base-provider.ts`):
  - `start(mode: 'live' | 'replay')`
  - `stop()`
  - `setMode(mode)`
  - `setSpeed(multiplier)`
  - `seek(progressPercent)`
  - `getState(): LiveTimingState`
  - `onUpdate(callback)`
- Providers must support both **Live SignalR Streaming** and **Log Replay Simulation** so development and testing can proceed 24/7.

## 3. WebSocket Streaming & Throttling

- WebSocket messages from server to client must follow the `{ type: 'STATE_UPDATE', payload: LiveTimingState }` contract.
- Broadcasts must be throttled (approx. 50-60ms) to ensure smooth 60fps UI rendering without saturating browser network buffers.
