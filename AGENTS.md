# Motorsport Live Timing & Telemetry Platform - Agent Guidelines

Welcome to the Motorsport Live Timing & Telemetry Platform codebase. When working on this project, follow these core principles and rules.

---

## 🏎️ Project Overview & Architecture

This repository is a production-grade **Yarn Monorepo** for motorsport real-time timing:

- **`packages/shared`**: Shared telemetry TypeScript types, series registries, and 2026 driver/team metadata.
- **`apps/server`**: Express HTTP + WebSocket backend managing the SignalR connection to official F1 feeds, state management with deep-merge delta resolution, and variable-speed replay simulator.
- **`apps/web`**: React 18 + Vite + Tailwind CSS v3 Live Timing Web Dashboard with a minimal "timing tower" design (dark default + light theme).
- **`data/f1`**: Telemetry recordings and driver catalogs.

---

## 🛠️ Development & Package Management Rules

1. **Package Manager**: **ALWAYS USE YARN** (`yarn.cmd`). Never use `npm` or `pnpm` to install packages or run scripts.
2. **Scripts**:
   - `yarn dev`: Runs both server and web concurrently.
   - `yarn dev:server`: Runs the backend with hot-reload.
   - `yarn dev:web`: Runs Vite dev server.
   - `yarn build`: Compiles TypeScript and builds all packages.
   - `yarn lint`: Runs ESLint 9 across all packages.
   - `yarn format`: Runs Prettier formatter across all code.
3. **Styling**:
   - Use **Tailwind CSS v3** with custom theme tokens defined in `apps/web/tailwind.config.js`.
   - Design language is **minimalism**. All tokens live in `apps/web/src/index.css` (per-theme RGB CSS variables) and are mapped in `tailwind.config.js`. Never hard-code colors or use `dark:` variants — tokens swap with the theme class on `<html>`.
   - Interface tokens: `paper`, `raise`, `ink`, `mute`, `rule`, `signal` (the only accent). Data tokens: `best` (overall fastest), `pb` (personal best), `warn`, `danger`, `compound-*`. Data colors only encode timing meaning — as text color or thin bars, never as box fills.
   - Type: IBM Plex Sans (UI) + IBM Plex Mono (`.num` for all timing numerals). Sizes: `text-label` / `text-data` / `text-ui` / `text-title` / `text-hero`. Weights 400 and 600 only.
   - No shadows, gradients, blur or glow. Separate content with whitespace and 1px `rule` hairlines. Only the LIVE dot may animate; respect `prefers-reduced-motion`.
   - Keep keyboard focus visible (global `:focus-visible` ring) and text contrast ≥ WCAG AA in both themes.
4. **Component Hierarchy**:
   - Put low-level design primitives (`Button`, `Badge`, `Card`, `Modal`, `Tabs`, `StatusPill`, `Tooltip`) inside `apps/web/src/components/common/`.
   - Put domain-specific features inside `apps/web/src/components/features/<domain>/` (`session/`, `timing/`, `race-control/`, `telemetry/`, `playback/`).

---

## 🔌 Extensibility & SeriesProvider Pattern

- When adding new racing categories (e.g. WEC, IndyCar, MotoGP), always implement the [`SeriesProvider`](file:///e:/livetiming-dashboard/apps/server/src/providers/base-provider.ts) interface.
- Keep the frontend series-agnostic by using shared telemetry schemas from [`@livetiming/shared`](file:///e:/livetiming-dashboard/packages/shared).
