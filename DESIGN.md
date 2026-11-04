---
name: QTR33 Pitwall
description: A minimal timing tower for following a live F1 session at a glance.
colors:
  # Dark theme (default). Source of truth: per-theme RGB channels in apps/web/src/index.css.
  paper: '#0E0F11'
  raise: '#17181B'
  ink: '#ECECEC'
  mute: '#8B9099'
  rule: '#24262A'
  signal: '#FF3B30'
  best: '#C084FC'
  pb: '#4ADE80'
  warn: '#E3C04A'
  danger: '#F87171'
  seg-best: '#C084FC'
  seg-pb: '#4ADE80'
  seg-warn: '#E3C04A'
  flag-green: '#4ADE80'
  flag-yellow: '#FACC15'
  flag-red: '#F87171'
  compound-soft: '#FF2D55'
  compound-medium: '#FFC300'
  compound-hard: '#F0F0F0'
  compound-inter: '#4CC038'
  compound-wet: '#3B9BFF'
  # Light theme (html.light)
  paper-light: '#FAFAF8'
  raise-light: '#F1F1ED'
  ink-light: '#141517'
  mute-light: '#5E636B'
  rule-light: '#E4E4E0'
  signal-light: '#D70F0F'
  best-light: '#7E22CE'
  pb-light: '#15803D'
  warn-light: '#8A6100'
  danger-light: '#C81E1E'
  seg-best-light: '#9333EA'
  seg-pb-light: '#16A34A'
  seg-warn-light: '#E0A800'
  flag-green-light: '#16A34A'
  flag-yellow-light: '#EAB308'
  flag-red-light: '#DC2626'
  compound-soft-light: '#D6002A'
  compound-medium-light: '#946A00'
  compound-hard-light: '#52565E'
  compound-inter-light: '#2E7D1E'
  compound-wet-light: '#0062A8'
typography:
  display:
    fontFamily: 'IBM Plex Mono, ui-monospace, Consolas, monospace'
    fontSize: '40px'
    fontWeight: 600
    lineHeight: '44px'
    letterSpacing: '-0.02em'
    fontFeature: "'tnum' 1"
  title:
    fontFamily: 'IBM Plex Sans, system-ui, sans-serif'
    fontSize: '20px'
    fontWeight: 600
    lineHeight: '28px'
  body-large:
    fontFamily: 'IBM Plex Sans, system-ui, sans-serif'
    fontSize: '15px'
    fontWeight: 400
    lineHeight: '22px'
  body:
    fontFamily: 'IBM Plex Sans, system-ui, sans-serif'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: '20px'
    fontFeature: "'tnum' 1"
  numeral-large:
    fontFamily: 'IBM Plex Mono, ui-monospace, Consolas, monospace'
    fontSize: '15px'
    fontWeight: 400
    lineHeight: '22px'
    fontFeature: "'tnum' 1"
  numeral:
    fontFamily: 'IBM Plex Mono, ui-monospace, Consolas, monospace'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: '20px'
    fontFeature: "'tnum' 1"
  label:
    fontFamily: 'IBM Plex Sans, system-ui, sans-serif'
    fontSize: '11px'
    fontWeight: 600
    lineHeight: '16px'
    letterSpacing: '0.06em'
rounded:
  sm: '2px'
  DEFAULT: '4px'
  full: '9999px'
spacing:
  hairline: '1px'
  bar-gap: '2px'
  cell-y: '10px'
  cell-x: '12px'
  gutter: '16px'
  gutter-md: '32px'
  section: '40px'
  column-gap: '48px'
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    typography: '{typography.body}'
    rounded: '{rounded.DEFAULT}'
    padding: '0 14px'
    height: '36px'
  button-secondary:
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.DEFAULT}'
    padding: '0 14px'
    height: '36px'
  button-ghost:
    textColor: '{colors.mute}'
    typography: '{typography.body}'
    rounded: '{rounded.DEFAULT}'
    padding: '0 14px'
    height: '36px'
  button-ghost-hover:
    textColor: '{colors.ink}'
  tab:
    textColor: '{colors.mute}'
    typography: '{typography.body}'
    padding: '8px 0'
  tab-active:
    textColor: '{colors.ink}'
  tooltip:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    typography: '{typography.label}'
    rounded: '{rounded.DEFAULT}'
    padding: '4px 8px'
  timing-row:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    typography: '{typography.numeral}'
    padding: '10px 12px'
  timing-row-selected:
    backgroundColor: '{colors.raise}'
  tyre-ring:
    textColor: '{colors.compound-soft}'
    typography: '{typography.label}'
    rounded: '{rounded.full}'
    size: '20px'
  mini-sector-bar:
    backgroundColor: '{colors.seg-pb}'
    height: '3px'
  mini-sector-bar-large:
    backgroundColor: '{colors.seg-pb}'
    height: '4px'
  dialog:
    backgroundColor: '{colors.paper}'
    rounded: '{rounded.DEFAULT}'
  drawer:
    backgroundColor: '{colors.paper}'
    padding: '24px'
    width: '576px'
  stat-label:
    textColor: '{colors.mute}'
    typography: '{typography.label}'
  stat-value:
    textColor: '{colors.ink}'
    typography: '{typography.numeral-large}'
---

# Design System: QTR33 Pitwall

## Overview

**Creative North Star: "The Pit Wall Monitor"**

QTR33 Pitwall should read like the screen a race engineer watches on the pit wall: dark, as dense as the job needs and no denser, with every pixel there so the state of the race reads in one glance. The fan has the broadcast in front of them and looks across for a second at a time. The interface has to answer in that second, then let them look back.

The system is precise and restrained. Surfaces are flat, sections are separated by whitespace and 1px hairlines, and components carry no fills, shadows or chrome of their own. Color is held back for two jobs: one interface accent, Start Light Red, and the timing-data colors that follow official convention (purple for overall fastest, green for personal best, yellow for timed, plus tyre compounds and track flags). With that much restraint, any color on screen means something.

Numbers are the hero. Every timing value is set in a tabular monospace so columns stay aligned while values change several times a second, and each screen has exactly one loud number: on the main view, laps (current/total) in a race and time remaining on the official clock in practice and qualifying; in the driver drawer, the car's position. Dark is the default theme; the light theme is a full counterpart built from the same tokens, not an inverted afterthought.

**Key Characteristics:**

- Flat, hairline-separated layout; no shadows, gradients, blur or glow.
- One interface accent (Start Light Red); all other color is timing data.
- Tabular monospace numerals throughout; one hero numeral per screen.
- Two weights only (400 and 600), a five-step type scale.
- Ambient motion limited to the LIVE dot and the caution rule.
- Dark default with an equal light theme, both WCAG AA for text.

## Colors

Near-neutral cool grays carrying a single red accent and an official timing-data palette that appears only when the data means something.

Every color is an RGB-channel CSS variable defined per theme on `:root, html.dark` and `html.light` in `apps/web/src/index.css`, mapped to Tailwind names in `tailwind.config.js`. Components never use `dark:` variants or literal colors; tokens swap with the theme class on `<html>`.

### Primary

- **Start Light Red** (`signal`; `signal-light` in light theme): the only interface accent. Used for the `QTR33` wordmark, the LIVE dot, the global focus ring, the active tab underline, the selected-row edge, the range input accent, and text selection. Never used for data.

### Neutral

- **Monitor Black / Sheet White** (`paper` / `paper-light`): the page and every surface. Sticky table cells and the header repaint `paper` so they stay opaque.
- **Raised Panel** (`raise` / `raise-light`): a single tonal step above paper, used only for hovered and selected timing rows. It is a state, not a surface.
- **Readout White / Ink Black** (`ink` / `ink-light`): primary text and values; also the fill of the primary button and tooltip, with `paper` text.
- **Dimmed Readout** (`mute` / `mute-light`): labels, secondary text, held (previous-lap) sector times, inactive controls, units.
- **Hairline** (`rule` / `rule-light`): every divider and border, plus the unreached mini-sector bar.

### Data Colors

These encode timing meaning and nothing else.

- **Fastest Purple** (`best`): overall fastest lap, sector or speed.
- **Personal Best Green** (`pb`): personal best; also positions gained and the catching interval.
- **Timed Amber** (`warn`): caution text (yellow, SC, VSC), in-pit status.
- **Alarm Red** (`danger`): red flag, positions lost, connection errors.
- **Mini-sector bars** (`seg-best`, `seg-pb`, `seg-warn`): fills for the 3px mini-sector bars. In light theme they are brighter and more saturated than the text tokens so thin bars still read.
- **Track flags** (`flag-green`, `flag-yellow`, `flag-red`): the full-width alert rule only. The status label beside it uses the AA-safe text tokens instead.
- **Tyre compounds** (`compound-soft`, `compound-medium`, `compound-hard`, `compound-inter`, `compound-wet`): the ring and letter of the tyre badge.
- **Team colors** come from the feed at runtime and appear only as a 3px vertical bar beside the driver name.

### Named Rules

**The One Accent Rule.** Start Light Red is the only interface accent. If an element needs emphasis and is not data, it gets weight or `ink`, not a new color.

**The Data Earns Color Rule.** Data colors are text color or thin bars, never box fills or backgrounds. A cell is purple because the time is the fastest, never for decoration.

**The Two Themes Rule.** Every new token is defined in both theme blocks and mapped in `tailwind.config.js`; text pairs stay at or above WCAG AA (4.5:1) on `paper` in both themes.

## Typography

**Body Font:** IBM Plex Sans (with system-ui, sans-serif)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, Consolas, monospace)

**Character:** An engineered, neutral pairing from one family: Plex Sans carries the interface quietly, Plex Mono carries every number with fixed-width digits so columns never jitter.

### Hierarchy

- **Display** (Mono 600, 40px / 44px, -0.02em): the one hero number of a screen (`text-hero`): on the main view `{lap}/{total}` in a race (`—` until the official total arrives) or the official time remaining in practice and qualifying, labelled "Lap" or "Remaining"; `P{position}` in the driver drawer.
- **Title** (Sans 600, 20px / 28px): dialog titles, the fastest-lap time in the sidebar (`text-title`).
- **Body Large** (Sans, 15px / 22px): the `Pitwall` wordmark, driver name in the fastest-lap card (`text-ui`).
- **Numeral Large** (Mono, 15px / 22px, tabular): row position (600), drawer stat values and drawer sector times (`.num text-ui`).
- **Body** (Sans 400, 13px / 20px): the default size for the whole app, including table cells, messages and controls (`text-data`).
- **Numeral** (Mono 400, 13px / 20px, tabular): every time, gap, interval, speed, lap count and clock in the tower and sidebar (`.num`).
- **Label** (Sans 600, 11px / 16px, 0.06em, uppercase): column headers, section titles, badges (`.label`, `text-label`).

### Named Rules

**The Tabular Rule.** Every timing numeral uses `.num` (IBM Plex Mono, `tnum`). A number that can change while visible is never set in proportional figures.

**The Two Weights Rule.** Only 400 and 600. Hierarchy comes from size, case and color (`ink` vs `mute`), not from extra weights.

**The One Hero Rule.** Each screen (the main view, or an open drawer) has exactly one `text-hero` number, and it is the answer the screen exists to give. A second hero on the same screen means one of them is wrong.

## Layout

A single centered container (max 1600px) with a 16px side gutter on small screens and 32px from `md` (768px). The header is sticky from `md`.

The main view is a two-column grid from `xl` (1280px): the timing tower takes the flexible column and a 320px sidebar (fastest lap, race control) sits to the right, sticky. Columns are 48px apart; sidebar sections are 40px apart. Below `xl`, the sidebar stacks under the tower.

The timing tower is a real table with a fixed layout (`table-layout: fixed`), 1024px minimum width, scrolling horizontally inside its own container on narrow screens. Position and driver columns stay sticky on the left. Cells use 10px vertical and 12px horizontal padding; numeric columns are right-aligned.

**The Still Columns Rule.** Values change several times a second, so no value may move its neighbours. Every timing column has a fixed width in the `colgroup`, sized to the longest real value it can hold (IBM Plex Mono 13px ≈ 7.8px per digit, plus 24px padding); Driver is the only flexible column and truncates. Optional lines inside a row (position delta, mini-sector strip) keep their height when empty, so rows never change height either. Below `sm` (640px) the driver cell drops to number and three-letter code.

The header is a three-zone grid on `md` and up (brand and session left, session progress centered, status right); below `md` the progress hero wraps onto its own row. The status zone carries the feed status, last update, theme toggle, track status and weather; there is no wall clock.

**The Glance Density Rule.** Density serves a one-second glance: whitespace and hairlines separate groups, never boxes. If a new element needs a container to be legible, the grouping is wrong.

## Elevation & Depth

The system is flat. There are no shadows anywhere. Depth is expressed by tone and position only: `raise` marks hovered and selected rows, sticky header and cells repaint `paper` so content passes beneath cleanly, and dialogs sit over a 50% black scrim with a 1px `rule` border.

**The Flat Monitor Rule.** No shadows, gradients, blur or glow, at rest or in any state. If a layer must read as above another, use the scrim and a hairline border.

## Shapes

Square and quiet. Controls, dialogs and tooltips use a barely-softened 4px radius; the driver button's focus target uses 2px. Circles are reserved for meaning: the tyre ring (20px, 1.5px compound-colored stroke), the LIVE and status dots (8px) and the team bar's rounded ends. Borders are always 1px `rule`, except the 2px active-tab underline and the 2px selected-row edge in `signal`.

## Components

### Buttons

Precise and restrained; the label does the work.

- **Shape:** gently squared corners (4px); heights 32 / 36 / 40px.
- **Primary:** `ink` fill with `paper` text, 600 weight; hover drops the fill to 85% opacity.
- **Secondary:** no fill, 1px `rule` border, `ink` text; hover darkens the border to `mute`.
- **Ghost:** text only in `mute`; hover to `ink`. Used for close and restart.
- **Danger:** secondary shape with `danger` text; border turns `danger` on hover.
- **Disabled:** 40% opacity, not-allowed cursor. Focus uses the global 2px `signal` outline at 2px offset.

### Tabs and Segmented Text Controls

- **Tabs:** text-only labels 20px apart on a `rule` hairline; active tab is `ink` with a 2px `signal` underline, inactive is `mute` with hover to `ink`.
- **Mode and speed switches** (Live / Replay, 1× 2× 5× 10×): plain text buttons with `aria-pressed`; active is `ink` 600, inactive `mute`.

### Badges and Status

- **Badge:** an uppercase 11px label in a data color (`pb`, `warn`, `danger`, `best`, `signal` or `mute`), no fill, no border.
- **Status pill:** an 8px dot plus a 13px 600 label. Only the LIVE dot (`signal`) animates; every other state is a static dot. It always names the source truthfully: `Live` (`signal`, pulsing), `Reconnecting` (`warn`), `Connecting` (`mute`) and `Recorded session` (`mute`, with a title explaining that no live timing is available). A recording is never left unlabelled.
- **Last data:** beside the pill while live, the age of the last feed message of any kind (heartbeats included), never a clock time, since the header has no clock to compare one against: "Last data just now" under 5s, "Last data 12s ago" after that, then "No data for 25s" in `warn` 600 past 15s, announced once to screen readers. A fixed minimum width keeps its neighbours still as it ticks.
- **Feed notice:** while the live link is down, a full-width line at the bottom of the sticky header, above a `rule` hairline: "Lost connection to live timing." in `danger` 600, then "Reconnecting… Times shown are from HH:MM:SS." in `mute`. The timing stays on screen; its age is stated. No colored side border, no fill.

### Cards / Sections

- **Card:** a titled section, not a surface: uppercase label title over a 1px `rule` bottom hairline, optional count or action on the right, 12px above content. No background, border or radius.

### Dialog / Drawer

- **Style:** `paper` panel, 1px `rule` border, 4px radius (centered) or full-height right drawer (max 576px). Header with a 20px title over a `rule` hairline and a ghost close button.
- **Behavior:** focus moves to close on open, Tab is trapped, Escape closes, focus returns to the trigger. Entry is a 180ms fade, or a 24px slide-in for the drawer.

### Tooltip

- **Style:** `ink` fill with `paper` 11px text, 4px radius, 4px × 8px padding; shown on hover and focus, linked with `aria-describedby`.

### Timing Tower (signature)

The product's core component: a table row per car.

- **Row:** hairline-separated, `paper` at rest, `raise` on hover and when selected; a 2px left edge in `signal` marks the selected car.
- **Position:** 15px 600 numeral, with a ▲/▼ delta beneath in `pb` or `danger`.
- **Driver:** 3px team-color bar, muted car number, name in 600, three-letter code, team in `mute` below.
- **Times:** right-aligned numerals colored by `best` / `pb` / `ink`; a sector still in progress holds last lap's time in `mute`.
- **Mini-sectors:** 3px bars, 2px apart, sharing the sector cell's width equally (the count varies by circuit and sector, 6–10), under each sector time, colored by `seg-best`, `seg-pb`, `seg-warn`, `mute` (pit lane) or `rule` (not reached).
- **Tyre:** a 20px compound-colored ring with the compound letter, followed by stint laps in `mute` and a `pb` "N" for a new set.
- **Car state** (last column, in place of the stop count): an uppercase Label — `Out` in `mute` (the name also drops to `mute`, gap and interval read "—"), `Stopped` in `danger`, `In pit` and `Pit exit` in `warn`.
- **Meaning in words:** every colored time or speed carries `sr-only` text ("fastest overall", "personal best", "previous lap") so the color is never the only carrier.

### Driver Detail Drawer (signature)

The deep view behind a glance: opened by selecting a row in the tower, it shows one car in full without leaving the timing.

- **Frame:** the right-hand drawer variant of Dialog (max 576px, full height), titled with the driver's name over `{team} · Car {number}` in `mute`. Body padding is 24px; sections stack 40px apart.
- **Position block:** `P{position}` in Display at the left, the drawer's one hero; to its right, bottom-aligned, a three-column stat group (Gap, Best lap, Pit stops), right-aligned with 24px gaps. Best lap takes `best` / `pb` / `ink` by meaning.
- **Stat:** a definition pair (`<dl>` / `<dt>` / `<dd>`): an uppercase Label in `mute` over a Numeral Large value in `ink`, 4px apart. Used for every single value in the drawer.
- **Section:** an uppercase Label heading with content 12px below. No hairline under the heading; that distinguishes drawer sections from sidebar Cards. Units live in the heading (`Speed traps · km/h`), never in the values.
- **Sectors:** three columns from `sm` (one column below), 24px apart. Each has `S1`–`S3` as a Label and the time in Numeral Large on one baseline, colored by meaning; a sector still in progress shows last lap's time in `mute`. Beneath, the large mini-sector strip: 4px bars that share the column width equally, 3px apart, in the same segment colors as the tower.
- **Speed traps:** a Stat grid, two columns below `sm` and four from `sm` (Speed trap, Intermediate 1, Intermediate 2, Finish line), each value colored by meaning or `mute` when empty.
- **Stints:** a compact hairline table (Stint, Tyre, Laps, Best lap) with Label headers, the same 10px row padding as the tower, the first and last columns flush to the edges, and the tyre ring without its lap count. Rows are static: no hover, no selection.
- **Empty states:** one plain sentence in `mute` at the content's size, in place of the content, e.g. "No mini-sectors yet", "No stints recorded yet". No icons or illustrations.

### Track Status

- **Alert rule:** a 2px full-width bar across the top of the header in the flag color (green, yellow, red); it beats with a 1.2s heartbeat during caution (yellow, SC, VSC) and is absent under the chequered flag.
- **Status label:** the track status in words only ("Green flag", "Safety car", "Red flag"…), 13px 600 in the AA-safe text token (`pb`, `warn`, `danger`, `ink`). No flag icon or board beside it: the alert rule already carries the flag color.

### Named Rules

**The Only Movers Rule.** Two things may animate continuously: the LIVE dot and the caution alert rule. Everything else is static, apart from 150ms color transitions on hover and the dialog's entry. All of it collapses under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:

- **Do** use the token names (`paper`, `raise`, `ink`, `mute`, `rule`, `signal`, data tokens) through Tailwind classes; add new tokens to both theme blocks in `index.css` and to `tailwind.config.js`.
- **Do** set every timing numeral in `.num` (IBM Plex Mono, tabular).
- **Do** give each screen exactly one `text-hero` number: laps or time remaining on the main view, the position in the driver drawer.
- **Do** say "Leader" once on P1 (in Gap) and leave its Interval empty.
- **Do** present single values in the drawer as Stats (Label over Numeral Large) and put units in the section heading.
- **Do** separate groups with whitespace and 1px `rule` hairlines.
- **Do** color times by meaning only: `best` for overall fastest, `pb` for personal best, `ink` otherwise.
- **Do** keep the global 2px `signal` focus outline visible on every interactive element.
- **Do** check both themes for WCAG AA text contrast before shipping.

### Don't:

- **Don't** fill unknown facts with defaults: a missing team, total or session name stays empty or reads "—".
- **Don't** hard-code colors or use `dark:` variants (the `#E10600` team-color fallback in `DriverRow.tsx` and the `bg-black/50` scrim are existing exceptions to remove, not patterns to copy).
- **Don't** add shadows, gradients, blur or glow.
- **Don't** use data colors as box fills or backgrounds.
- **Don't** introduce a second interface accent.
- **Don't** use weights other than 400 and 600.
- **Don't** animate anything besides the LIVE dot and the caution alert rule.
- **Don't** use official Formula 1 logos or marks; the product is unofficial.
