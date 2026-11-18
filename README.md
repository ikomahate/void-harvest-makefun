# VOID HARVEST: Escape the Collapse

An original offline Canvas survival and extraction game, authored on the official Make.fun `best-game-01` starter. No libraries, asset downloads, remote fonts, generated images, or external audio files are required. All graphics and sound are procedural.

Run `node serve.ts` with Node 22.18 or later and open http://localhost:8080 in desktop Chrome. This local server does not require an internet connection. The ES modules need HTTP serving; double-clicking index.html is not supported by Chrome's file-origin module rules.

Move with WASD or arrows, aim with the mouse, and hold left mouse to fire. Hold E or right mouse near a glowing asteroid to mine. Crystals attract to the ship. Shift boosts; Space fires a defensive pulse (10-second cooldown). U opens the refit bay and pauses the simulation. Escape/P pauses, H opens the manual, and M mutes. Sound and music controls and reduced motion are available in the interface. Focus loss pauses flight.

Collect 60 crystals to charge the jump core. Gate 07 aligns 70 seconds after launch. Survive, spend salvage on upgrades, then follow the gate marker and hold E inside the gate for about two seconds. Escape before the sector collapses at 3:30. Spending salvage never removes jump charge. Additional harvesting and kills increase score; extracting quickly and preserving hull earn bonuses. Personal records stay in this browser when localStorage is available.

Stalkers pursue, sentinels orbit and shoot, and brutes have armor and spread fire. Waves arrive every 25 seconds after first contact. Red circles telegraph impacts. Shields recover after five seconds without damage. Asteroids are solid, but contact with them does not damage hull.

The runtime is entirely in `game/`: configuration, seeded randomness, input, browser-independent simulation, procedural renderer, procedural audio, and application lifecycle/UI. The starter's fixed simulation step, seeded RNG, static server, root submission entrypoint, license and unchanged official vendor library are retained.

Local checks:

- `node tests/simulation.mjs` exercises five complete autonomous victory runs, combat defeat, collapse defeat, upgrade spending, three enemy types and restart resets.
- `node scripts/qa-browser.mjs` drives an existing headless Chrome debug tab on port 9222 against the local server. It uses the actual input handlers, tests menus and complete victory/defeat/restart loops, and captures four unedited 1280x800 JPEG browser viewports. Its read-only pilot reads live state; it does not stage scenes or change simulation values.
- `node scripts/verify-input.mjs` checks focused-button keyboard activation, movement/boost, pulse, refit close, focus-loss pause, a smaller desktop viewport and frame timing.
- `node scripts/validate.mjs` packages twice using main.ts, compares deterministic output and the official buildDossier result, verifies imports/resources, vendor integrity and competition limits.

The browser runner requires a locally installed Chrome started with a debug port, for example (use your Chrome executable path): `chrome --headless=new --remote-debugging-port=9222 --window-size=1280,800 --user-data-dir=<workspace>/.browser-profile about:blank`. In restricted Windows environments Chrome may additionally need `--no-sandbox --disable-gpu --disable-software-rasterizer` for the QA process. These are test-launch settings, not game requirements.

To capture manually: set Chrome's device toolbar viewport to 1280x800 at 100% zoom and device scale 1; capture the title; launch and mine while fighting until wave 2; capture gameplay; press U, buy modules, and capture refit; return to flight, collect at least 60 crystals, wait for gate alignment, fly to Gate 07 and hold E until the result screen appears; capture it. Use Chrome's native screenshot command and save the unedited JPEG/PNG files in screenshots/. Each must be at most 256 KiB, long side at most 1280 and short side at least 480. Keep only three or four images; first by name is the cover. Do not use image editors.

To prepare an output directory without submitting: set MAKEFUN_OUTPUT_DIR to a new empty local directory, then run `node main.ts`. It validates screenshot dimensions and caps before copying the runtime/screenshots and invoking the official builder. Never use the repository root or game/ as the output directory.

No competition submission, repository publication, transcript fabrication or transcript modification is performed by these scripts. Full competition scoring is server-only. The authentic session bundle, repository provenance and other submission-only checks are separate from local runtime/output validation.
