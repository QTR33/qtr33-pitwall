---
target: weather readout in the header
total_score: 22
max_score: 36
na_heuristics: 3
p0_count: 0
p1_count: 1
target_identity: "file:/home/phong.vunhat@nccsoft.office/NCC/qtr33-pitwall/apps/web/src/components/features/session/WeatherReadout.tsx"
target_fingerprint: "sha256:51fbb654a1501d486e13bd8ecfebe7e6311654a6c0f3177c06e9e62705764008"
target_path: /home/phong.vunhat@nccsoft.office/NCC/qtr33-pitwall/apps/web/src/components/features/session/WeatherReadout.tsx
timestamp: 2026-11-06T03-14-37Z
slug: nents-features-session-weatherreadout-tsx-59dc5e95
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Rain onset silent; FlagBanner announces, weather doesn't |
| 2 | Match System / Real World | 2 | "Hum" abbreviation, "°" without C, m/s vs km/h elsewhere |
| 3 | User Control and Freedom | n/a | Passive readout, no actions |
| 4 | Consistency and Standards | 2 | warn used for weather (undocumented); compass mute vs ink values |
| 5 | Error Prevention | 2 | Amber Rain beside flag label misreads as caution |
| 6 | Recognition Rather Than Recall | 3 | Compass needs mental map of circuit |
| 7 | Flexibility and Efficiency | 2 | Below xl humidity/wind/pressure hover-only via title |
| 8 | Aesthetic and Minimalist Design | 3 | Token-clean, but 4 ink numerals louder than session line |
| 9 | Error Recovery | 3 | Partial data degrades well |
| 10 | Help and Documentation | 2 | No Weather spec in DESIGN.md |
| **Total** | | **22/36** | Acceptable (61%) |

## Design Specificity Verdict
LLM: mostly product-grounded (track temp first, rain at every width, never invented values); generic weather-widget habits: 8-point compass, pressure, rain as a bare word.
Detector: 0 findings in WeatherReadout.tsx/HeaderBar.tsx and session/ (also --no-config). URL scan: ai-color-palette at App.tsx:86 (false positive, `best` token), flat-type-hierarchy advisory (page-wide). Contrast AA in both themes; tightest light warn on raise 4.89. Overlay not injected (no browser automation).

## Priority Issues
- [P1] Weather width changes shift the flag label (Still Columns Rule): row 2 right-aligned (HeaderBar.tsx:152); Rain toggle ~39px, digit/compass changes ~8px; at md worst case overflows 1fr track and moves the hero. Fix: flag on the stable side, ch min-widths, reserve Rain slot. → layout, harden
- [P2] Rain in warn 600 reads as a caution flag next to FlagBanner; flag and readings share gap-3. Fix: ink 600 Rain; gap-6 or rule divider. → colorize, clarify
- [P2] aria-label on role-less span; temps display:none below sm; pressure/humidity/wind title-only; rain onset not announced. Fix: sr-only sentence, role=status on rain change, common Tooltip. → harden, audit
- [P2] Empty flex wrapper below sm + parent gap-3 indents flag label 12px on phones. Fix: fragment or hidden sm:flex. → adapt
- [P3] Ink values louder than role; "Hum"; "°" without C; compass mute. → quieter, clarify

## Persona Red Flags
Alex: hover-only secondary readings at 1280px, no trend. Sam: aria-label ignored, "m slash s", rain not announced. Second-screen fan: two amber words under SC + rain, flag label moved, no rain duration.

## Minor Observations
Wind duplicates Reading (add suffix prop); "Track —°" unit after dash; 0.1° precision flicker; no WeatherData fixture in replay.

## Questions to Consider
Only track temp + rain in header? Headwind/tailwind on main straight instead of compass? Rain as timed state ("Rain · 6 min")?
