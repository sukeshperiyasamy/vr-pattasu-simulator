# Roadmap, Task List, Milestone Gates

## Process rules
Only one active milestone at a time. AI agent should make small changes, run validation, attach visual evidence and keep this file current. Mark a checkbox complete only with proof.

### M0 — Discovery and design lock
- [x] Audit the starter pack. It initially contained only documentation and an empty manifest, with no Git metadata.
- [x] Resolve exact dependency versions and verify peer ranges.
- [x] Compare two licensed Indian house previews and choose the lighter façade for a modular courtyard.
- [x] Choose a model or geometry approach for Busvanam, sparkler, spinner and Sky Shot.
- [x] Evaluate three.quarks and Todd Gray's Three.js aerial demo.
- [x] Identify licensed ignition, fountain and burst audio.
- [x] Record the asset shortlist and license terms. Verify actual packages at acquisition.
- [x] Document choices, exclusions and performance concerns.
**Gate:** sources and legal status recorded; plan for one Busvanam vertical slice approved.

### M1 — Minimal running app
- [x] Scaffold React + Vite + TypeScript and install foundational dependencies in M0.
- [x] Create first-person WebGL canvas and responsive loading screen.
- [x] Build the courtyard with local PBR materials, a temporary veranda, nighttime lighting and instanced diyas.
- [x] Verify mouse look, WASD, façade and table bounds, and range-limited Busvanam selection.
- [x] Add controls, pause, render scale and a load error fallback.
- [x] Pass typecheck, lint, production build and Edge smoke checks at 1440 × 900 and 1024 × 768.

Evidence: [Courtyard](evidence/m1-courtyard.png) and [Busvanam selection](evidence/m1-busvanam.png). The listed Sketchfab façade is pending authenticated acquisition.
**Gate:** player can enter, look, move and select a placeholder prop with no console errors.

### M2 — Full interaction lifecycle
- [x] Define registry and transition state machine.
- [x] Implement raycast selection with distance constraint in M1.
- [x] Implement hold, placement preview, valid ground placement and virtual ignition.
- [x] Add reset and cleanup, with transition tests.
**Gate:** one prop completes interaction lifecycle before particles are introduced.

### M3 — Polished Busvanam vertical slice
- [x] Use an unbranded tapered prop with material changes after the effect.
- [x] Integrate fountain particles with staged ignition, emission and decay.
- [x] Add dynamic warm light and restrained smoke.
- [x] Integrate original positional audio, gesture unlock and cleanup.
- [x] Add persistent quality presets, volume, mute and reduced flashes.
- [x] Review [the active fountain capture](evidence/m3-busvanam.png) and test ten active resets.
**Gate:** visually polished and repeatable Busvanam loop, 10x reset test and passing tests.

### M4 — Expand fireworks
- [x] Sparkler with moving emitter and held prop.
- [x] Spinner with radial effects and anchored rotation.
- [x] Sky Shot with a pooled launch trail and [aerial burst](evidence/m4-skyshot.png).
- [x] Verify each effect through completion and reset with positional playback.
**Gate:** all four effects can be selected, used and repeated independently.

### M5 — Mobile browser
- [x] Build touch look, virtual movement and on-screen interactions.
- [ ] Profile midrange Android hardware on low preset.
- [ ] Fix small-screen layouts, input conflicts and hot GPU paths.
- [ ] Check memory after repeated launches and resets.
**Gate:** playable on at least one documented real Android device with measured results.

### M6 — VR feasibility and support
- [ ] Verify chosen headset/browser's immersive-vr support on device.
- [x] Add Quest WebXR entry, controller rays, teleport, snap turning and shared interaction commands.
- [x] Exercise immersive entry, controllers, diya lighting, firecracker interaction, reset and exit in Quest 3 emulation.
- [ ] Test session entry/exit, head tracking, controllers and comfort.
- [ ] Investigate phone-goggle stereo separately; mark unsupported platforms plainly.
**Gate:** successful actual-device VR walkthrough and interaction evidence, or clearly documented limitation.

### M8 — Interactive firecracker shop

- [x] Convert the counter to a two-tier stall with seven labeled boxes.
- [x] Open and close boxes with eased hinges and withdraw stock into the existing lifecycle.
- [x] Keep stock and active firecracker updates atomic. Reset restocks boxes and refills caps.
- [x] Validate desktop controls, all seven fireworks, both cap pistols, and failure cases.
- [x] Validate box pickup on Pixel 7 touch emulation and Quest 3 WebXR emulation.
- [ ] Test touch and XR interactions on physical Android and Quest hardware.

## Completion report template
`Milestone | Files changed | What works | Commands/tests run | Screenshot/video evidence | Measured performance | Asset/license changes | Known issues | Next limited task`
