# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Motorsport fans watching a session live on TV or a stream, with QTR33 Pitwall open beside it as a second screen. Their attention belongs to the broadcast; they glance across to answer quick questions — who is catching whom, what the gap is, who has pitted and on which tyre, why the track went yellow — and look back.

## Product Purpose

QTR33 Pitwall shows the official live timing of a session as a single timing tower: order, gaps and intervals, sector and lap times, speed traps, tyres, pit stops, and race control messages, with a detail view per driver. Success means a fan can read the state of the race in a glance without missing what is happening on screen.

## Positioning

- Free and account-free: runs entirely in the browser, connecting straight to the official F1 live timing feed. No subscription, sign-in or install.
- Easier to read than dense timing screens: one minimal tower built for a quick glance rather than a wall of data.
- Series-agnostic by design: new categories plug in through the `SeriesProvider` interface and shared schemas in `@livetiming/shared`. Formula 1 is the only series implemented today.

## Operating Context

- Used during live sessions, alongside a broadcast, often for the full length of a race.
- Data arrives as sub-second deltas from the official F1 SignalR hub; between sessions the deployed app (`VITE_APP_ENV=production`) says no session is on track and keeps checking, while development plays a bundled recording instead.
- Dark theme is the default, with a light theme alternative.

## Capabilities and Constraints

- Live mode: direct client-side connection to the F1 SignalR hub (URL configured by env vars), with reconnect handling.
- Replay: bundled recording at `apps/web/public/replay/f1.json`. The replay mode switcher and playback toolbar are currently disabled by the `FEATURES.replay` flag in `apps/web/src/config.ts`.
- Timing tower: position and gain/loss, driver and team, gap to leader, interval (with catching indicator), S1–S3 with mini-sectors, best and last lap, speed trap, tyre compound and age, pit status and stop count.
- Overall fastest lap (purple) and personal best (green) follow the official timing convention.
- Race control feed and track-status flag banner (green, yellow, SC, VSC, red, chequered).
- Driver detail view: sector splits, mini-sectors, speed traps, stint history.
- An optional Express + WebSocket server exists in `apps/server`; the web app does not require it.
- Open decision: which device the second screen mainly is (laptop or phone) has not been decided.

## Brand Commitments

- The name is **QTR33 Pitwall** and stays fixed, including the current BrandMark (`QTR33` in the accent color beside `Pitwall`).
- Unofficial product: never use official Formula 1 logos or marks, and never imply endorsement by or affiliation with Formula 1 or the FIA.

## Evidence on Hand

- Recorded raw feed: `data/f1/signal.log`; final state snapshot: `data/f1/final-timing-state.json`.
- Server day captures, one file per topic and day: `logs/<Topic>/<YYYY-MM-DD>.log` (gitignored, local only).
- Replay recording served to the web app: `apps/web/public/replay/f1.json`, built from the 2026-10-11 Singapore Grand Prix race logs (`yarn replay:build --logs 2026-10-11`).
- 2026 driver and team metadata (fallback only; the feed's DriverList wins): `packages/shared/src/series/f1/drivers-2026.json`, `data/f1/drivers.json`.
- No user research, testimonials, usage numbers or press exist; do not invent them.

## Product Principles

1. Glance first: every screen must answer its question in the second a fan looks away from the broadcast.
2. Timing truth over decoration: meaning comes from the official data and its conventions, never from embellishment.
3. Zero friction: no account, no install, no paywall between the fan and the timing.
4. Series-agnostic core: F1 specifics stay in its provider; the interface reads shared schemas.
5. Clearly unofficial: honest about what the product is and whose data it shows.

## Accessibility & Inclusion

Per `AGENTS.md`: text contrast meets WCAG AA in both themes, keyboard focus stays visible, and `prefers-reduced-motion` is respected.
