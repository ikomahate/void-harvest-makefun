# Development and validation report

VOID HARVEST: Escape the Collapse is implemented locally. Nothing has been submitted, published, pushed or committed by this work.

## Files changed

| File | Change |
| --- | --- |
| `main.ts` | Authored preflight checks for required runtime files, screenshot count/dimensions/size, output placement and dossier size; retains official copying and buildDossier submission contract. |
| `game/index.html` | Complete title, tutorial, accessible HUD controls, pause/settings, upgrade bay, victory/defeat and restart interface. |
| `game/style.css` | New local stylesheet, responsive logical layout, visual hierarchy, panels, focus indicators and reduced-motion styling. |
| `game/src/config.js` | Sector dimensions, collapse/alignment timing, charge requirements, upgrade definitions and palette. |
| `game/src/input.js` | Keyboard/mouse movement, aim, combat, mining and queued screen actions with focus cleanup. |
| `game/src/world.js` | Browser-independent fixed-step mining, solid asteroids, salvage, combat, three enemy types, waves, shields, boost, pulse, upgrades, hazards, alignment and extraction rules. |
| `game/src/render.js` | Original procedural nebula, fractured planet, ships, asteroid facets/crystals, animated gate, parallax, lights, particles, shake, damage feedback and radar. |
| `game/src/audio.js` | New procedural Web Audio music and effects, with independent music and master controls. |
| `game/src/main.js` | Application lifecycle, DOM UI, settings, optional local records and fixed-step scheduling. |
| `game/src/shots.js` | Removed starter screenshot staging. Captures now come from actual live play. |
| `screenshots/1-start.jpg` | Genuine 1280x800 title capture. |
| `screenshots/2-play.jpg` | Genuine 1280x800 live mining/combat capture. |
| `screenshots/3-end.jpg` | Removed old Block Dodger screenshot. |
| `screenshots/3-refit.jpg` | Genuine 1280x800 refit bay capture during an expedition. |
| `screenshots/4-end.jpg` | Genuine 1280x800 successful extraction/restart capture. |
| `shots.json` | Describes the actual capture workflow instead of staged screenshot URL parameters. |
| `scripts/browser.mjs` | Dependency-free Chrome DevTools Protocol connection/input/native capture helper. |
| `scripts/qa-browser.mjs` | Real-browser full-loop automated play and screenshot capture using normal input handlers. |
| `scripts/verify-input.mjs` | Focused keyboard menu checks, boost/pulse, focus-loss pause, smaller viewport and frame timing. |
| `scripts/validate.mjs` | Official library checks, import/resource integrity, no-network checks, vendor hash and deterministic packaging comparison. |
| `tests/simulation.mjs` | Seeded complete-run and rule regression checks, with an input-only autonomous pilot. |
| `.gitignore` | Excludes local browser profile, QA artifacts and validation packages. |
| `README.md` | Play, controls, rules, architecture, testing, packaging and precise manual capture instructions. |
| `DEVELOPMENT.md` | This report. |

`vendor/makefun-game.ts` is byte-for-byte unchanged (SHA-256 `dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129`). The starter's `serve.ts`, `LICENSE` and seeded `game/src/random.js` remain unchanged. All runtime files are under `game/`.

## Checks performed

- Node syntax checks on all runtime JavaScript and root main.ts.
- `node tests/simulation.mjs`: five seeds (1, 7, 19, 42, 2026) complete victory after gate alignment and the third wave; combat defeat and collapse defeat; reset of hull/resources/outcome/portal state; spending preserves charge; invalid/unaffordable purchases; all three enemy types; finite simulation state and bounded particles.
- Headless desktop Chrome, using a locally installed browser and the official starter server: title/manual/start, keyboard movement and mouse aiming/fire, mining/collection, waves, boost/pulse, upgrade purchases, time freeze in pause/refit, sound controls, successful portal extraction, restart reset and natural hull-breach defeat. Viewports: 1280x800 and 1024x768. Browser runtime exceptions and off-origin game requests are checked.
- Targeted keyboard/input regression after fixing focused-button activation: Enter launch/manual, Space resume, U/refit return, boost energy consumption, pulse cooldown and focus-loss pause all pass. A 240-frame headless Chrome sample averaged 16.81 ms, with 16.80 ms at the 95th percentile (local machine measurement, not a hardware-independent guarantee).
- Four native browser JPEG captures at 1280x800, with no post-processing, compositing, resizing or generated artwork. The automated pilot reads state and sends input events; it never changes simulation values or stages outcomes.
- `node scripts/validate.mjs`: packages twice with root main.ts, compares dossier bytes and SHA-256, rebuilds with the unchanged official `buildDossier`, compares every runtime file, checks source imports/HTML references, screenshot caps, file/byte/path caps and absence of remote runtime dependencies.
- Official kit `makefun check --worktree`: passes with the official tool's local bundle of the genuine recorded Codex session. Authorship, session timing, recorded usage, revisions, root entrypoint, license, and snapshot checks pass. The bundle tool performs its standard privacy redaction on archive copies; the original session log is untouched. No transcript is fabricated or manually edited.

Ignored local evidence is in `artifacts/browser-report.json`, `artifacts/input-report.json`, `artifacts/simulation-report.json`, `artifacts/validation-report.json` and `artifacts/makefun-bundle-check.json`. Fresh local output copies and the official tool's point-in-time session bundle are under `.validation/`.

## Iteration and limits

The first prototype allowed an efficient pilot to escape in about 15–21 seconds, skipping later enemy types. The revised run keeps the gate in alignment for 70 seconds and makes that timing visible in the manual and objective, providing time for mining, upgrades and three combat waves. Contact immunity and knockback were adjusted to make close encounters more forgiving. Resource labels were aggregated for readability, particle allocation was bounded, reduced-motion ship visibility was corrected, and focused buttons now consistently activate with Enter or Space.

No known blocking gameplay defect remains in the tested Chrome flows. Full judged scoring is server-only under the official kit; it was not run. Repository ownership, publication and signing are submission-time checks. The local transcript bundle is a point-in-time validation artifact and should be regenerated from the complete authentic session before a future authorized submission. Other browsers and mobile controls were not tested; this entry targets desktop Chrome as requested.
