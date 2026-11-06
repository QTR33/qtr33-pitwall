---
target: timing tower
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 4
target_identity: "file:E:\\livetiming-dashboard\\apps\\web\\src\\components\\features\\timing"
timestamp: 2026-11-04T15-09-10Z
slug: apps-web-src-components-features-timing
closed: true
---
Method: dual-agent (A: design review sub-agent · B: detector + rendered scan sub-agent)

# Critique: Timing Tower (apps/web/src/components/features/timing), 21/40 Acceptable

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Connection hard-wired true (useLiveTiming.ts:7-8); recording plays unlabelled; only "· stale" after 15s |
| 2 | Match System / Real World | 3 | Official purple/green/yellow conventions; practice/quali show fabricated "Lap n/58" |
| 3 | User Control and Freedom | 3 | Drawer closes via Esc/scrim/button; selected-row edge persists after close |
| 4 | Consistency and Standards | 3 | Strong token discipline; pb green carries five meanings within one row |
| 5 | Error Prevention | 2 | Recording mistakable for live; drawer position frozen; fabricated lap total |
| 6 | Recognition Rather Than Recall | 2 | Color key only in sr-only caption; bar/held/N meanings must be recalled |
| 7 | Flexibility and Efficiency | 1 | No shortcuts, no followed driver, no column/density choice, no prev/next in drawer |
| 8 | Aesthetic and Minimalist Design | 3 | Very restrained; 12 equal-weight columns and 4 identity tokens per row add noise |
| 9 | Error Recovery | 1 | Only error message can never fire; "stale" gives no cause or next step |
| 10 | Help and Documentation | 1 | No visible legend; no "unofficial" disclosure anywhere |
| **Total** | | **21/40** | **Acceptable (52%)**; Operate surface, all ten apply |

## Design Specificity Verdict

LLM assessment: specific in detail, generic in layout. F1-only details (SC/VSC marshal board, held previous-lap sector in mute, pit-lane mini-sector status, tyre ring, heartbeat caution rule) sit inside a stock admin-dashboard skeleton (sticky header, 12 equal-weight columns, right card sidebar, modal drawer). PRODUCT.md promises "easier to read than dense timing screens"; the structure is still the official timing column set, quieter.

Deterministic scan: CLI scan of the 5 timing TSX files, 0 findings. Rendered scans at 1280x800, 960x800, 390x844: 1 advisory each, flat-type-hierarchy (11/13/15px), advisory-by-design per DESIGN.md Two Weights Rule. No false positives. Coverage limits: page likely rendered without live rows ("Waiting for timing data…"), so rows, hover/selected states and drawer were not rendered; light theme not scanned (localStorage-only).

Synthesis: the detector confirms token conformance; every material issue is in state logic and information architecture, which the detector does not see. The LLM review and the earlier audit independently found the hard-wired connection state and the fabricated lap total.

Visual overlays: not available (no browser automation tool in session; injection not attempted).

## Overall Impression

An unusually disciplined visual system where purple truly pops because nothing else is colored. But the tower answers the analyst's question, not the glancing fan's. Biggest opportunity: make the screen honest about its own state (live vs recording, connected vs dropped, running vs retired), then reorganize the row so one glance is enough.

## What's Working

1. Timing truth with discipline: one helper (getTimingTextColor) colors every time in tower and drawer; the held previous-lap sector in mute is a real F1 timing nuance.
2. Numbers built to change: .num tabular mono, right-aligned, sticky Pos/Driver, 60ms throttled emits, units in headers.
3. Solid a11y scaffolding: real table with caption and scope, row buttons with aria-label, sr-only deltas and tyre, focus-trapped drawer, flag live region.

## Priority Issues

1. [P0] The screen can confidently show the wrong session. F1Feed.enterReplay (F1Feed.ts:152) silently falls back to the recording on a failed probe or after 5 min without activity; with FEATURES.replay=false HeaderBar.tsx:81 shows no pill in replay; connection state hard-wired true (useLiveTiming.ts:7). Fix: expose real connection and mode from the feed; always label the recording ("Recording · {GP}" in mute where the LIVE pill sits); wire the existing Lost connection alert; drop placeholder defaults (Grand Prix 2026, Albert Park, 24°/38°, 58 laps) in TimingStateManager. Command: /impeccable harden
2. [P1] The drawer's hero is stale. App.tsx:27-32 stores the clicked driver object; getSortedDrivers shallow-copies while deepMerge mutates nested objects in place, so P{pos}, Gap and Pit stops freeze at click time while Sectors and Speeds update. Fix: store carNumber and look the driver up in state.drivers each render. Command: /impeccable harden
3. [P1] The tower does not fit one glance. Team-name line makes rows ~57px (20 rows ~1,150px; P14-P20 below the fold on laptops); at 1280-1311px the column is 848px < min-w 880px so Pit scrolls off; below 1280px race control stacks under the tower; header not sticky below md. Fix: single-line rows (team as color bar, name to drawer; requires updating DESIGN.md), let the table shrink at xl or move the sidebar to 2xl, sticky header at all widths, latest race-control line in the header below xl. Command: /impeccable layout
4. [P1] Row hierarchy does not answer the first question. Gap/Int (DriverRow.tsx:114-125) styled like sector/lap times; catching is pb-only, same green as PB sectors. Fix: lift Int (text-ui, ink), drop Gap to mute, add a catching glyph, group columns order | pace | strategy, consider Tyre/Pit next to Int. Command: /impeccable distill
5. [P1] The tower knows one session type and one car state. Retired/Stopped/PitOut exist on DriverState but are not rendered; practice/quali hero shows "Lap n/58" with no time remaining; SessionClock shows local wall time beside last-updated. Fix: row states (Out/DNF dims to mute, Pit exit, Stopped in danger); session-appropriate hero; drop wall clock. Command: /impeccable harden, plus /impeccable clarify

## Persona Red Flags

Alex (power user): no shortcuts (no j/k, jump-to-driver); Tab passes 20 row buttons before race control, no skip link; modal drawer with scroll lock blocks watching the tower, no prev/next driver.

Sam (screen reader / low vision): held sector marked only by mute + title, announced as current; catching and mini-sectors color-only (deuteranopia); stale not announced; aria-selected on plain tr ignored.

Dev, second-screen fan (from PRODUCT.md): no way to highlight a followed driver; "In pit" in column 12 of 12 with no just-pitted cue; "why yellow" lives in race control, off-screen below 1280px; recording plays unlabelled between sessions.

## Minor Observations

- "Leader" printed in both Gap and Int on P1.
- Team-color fallback #E10600 is F1 brand red: hints at affiliation and sits close to signal.
- Selected-row edge persists after closing the drawer; could become a deliberate follow feature.
- Color legend exists only for screen readers; one mute line under the table header would serve first-time fans.

## Questions to Consider

1. Glancing from a TV, what do 24 mini-sector bars per row earn? Glance view (Pos, code, Int, tyre, pit) with sectors one tap away?
2. Interval is the first question yet 13px while the lap is 40px. Should the hero be the nearest battle?
3. Under SC or red flag the timing columns mean little. Should the tower change state instead of relying on a 2px rule?
