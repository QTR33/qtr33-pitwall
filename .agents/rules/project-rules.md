# Rule: Project Architecture & Coding Standards

## 1. Monorepo Organization

- The repository is organized as a Yarn Workspace monorepo (`packages/shared`, `apps/server`, `apps/web`).
- Always run dependency installations using `yarn install`.
- Internal package imports must use `@livetiming/shared` or relative paths within each app.

## 2. Code Quality & Formatting

- **ESLint 9**: All TypeScript and React code must comply with ESLint flat config (`eslint.config.js`).
- **Prettier**: Prettier is configured in `.prettierrc` (single quotes, trailing commas, 100 character print width). Run `yarn format` before committing.
- **Strict Typing**: Avoid `any` where possible. Use explicit models from `@livetiming/shared`.

## 3. UI Component Architecture (Tailwind CSS v3)

- Use Tailwind CSS v3 utility classes alongside the predefined theme tokens.
- **Base UI Primitives**: Place reusable UI widgets in `apps/web/src/components/common/`:
  - `Badge`: For status, flags, compounds, position numbers.
  - `Button`: Primary (ink fill), secondary (hairline), ghost and icon actions.
  - `Card`: Titled section — label heading over a hairline, no surface or shadow.
  - `Modal`: For slide-out telemetry drawer and modals.
  - `Tabs`: For category and series switchers.
  - `StatusPill`: For pulsing streaming and track status flags.
  - `Tooltip`: For metric explanations.
- **Domain Features**: Group feature-specific components under `apps/web/src/components/features/` by domain (`session`, `timing`, `race-control`, `telemetry`, `playback`).
