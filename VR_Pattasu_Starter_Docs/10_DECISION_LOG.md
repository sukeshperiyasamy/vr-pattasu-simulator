# Architecture Decisions and Open Questions

## Confirmed
- D001: Single player only; no multiplayer services or accounts.
- D002: First-person viewport; no complete 3D character for MVP.
- D003: Reuse legally permitted assets and effects before custom authoring.
- D004: Desktop browser vertical slice first; Android next; VR later.
- D005: Busvanam first; subsequent sparkler, ground spinner and sky shot.
- D006: Maintain source/license register; preserve notices.
- D007: Quality, sound and reduced-flashing settings ship with MVP.
- D008: No real-world explosive instructions; virtual simulation only.

## Phase 0 decisions
- D009: Use the textured 18,910-triangle Indian Village House as a façade facing an open paved court. The published preview shows a veranda but no enclosed playable courtyard. Add plaster boundary walls, granite paving and the wooden table from the manifest. Use the 1K Courtyard Night HDRI for reflections, a cool fill and a small number of warm local lights. Prefer the oil lamp as a single accent. Keep surfaces, walkable bounds and placement colliders separate from render meshes.
- D010: In M3, prototype one three.quarks fountain with cone emission, gravity and lifetime color. Reuse the emitter for a moving sparkler tip and a rotating ground spinner in M4. The aerial reference is MIT, but owns its renderer, audio and continuous scheduler and pins CDN Three 0.160.0. Its additive sparks and trails disable depth testing. Extract only one burst recipe for M4 and validate occlusion, cancellation and disposal in the shared scene.
- D011: Keep the registry and pure state transitions independent of React and Three. Use a single lifecycle clock with effect stages derived from it. One active instance owns its light, audio and particles and cleans them up on reset. Keep motion in frame-loop refs and persist only settings. Use E or click for pick, G for place and F for ignite to resolve the click overlap between the journey and control table. M1 implements selection only.
- D012: Keep Howler as the single playback path. In M3, verify Web Audio spatial playback with the camera pose as listener, mono point-source clips and user-gesture unlock. Map quality tiers to caps for pixel ratio, shadow resolution, particle density and smoke. Treat performance budgets as provisional until measured.
- D013: Defer React Three XR 6.6.32. Its React >=18, R3F >=8 and unrestricted Three peer ranges admit the pinned stack. The [upstream license](https://github.com/pmndrs/xr/blob/main/LICENSE) grants MIT-style permissions and requires preserving the notice. Confirm the published package and hardware before integration.
- D014: Reuse Drei's pointer-lock, keyboard and GLTF helpers in M1. Consult the [Three.js pointer-lock example](https://github.com/mrdoob/three.js/blob/dev/examples/misc_controls_pointerlock.html) and [R3F examples](https://r3f.docs.pmnd.rs/getting-started/examples) for control and frame-loop patterns. Check each linked demo's own license and asset rights if copying from it.

## Candidates held back

- [Indian old house](https://sketchfab.com/3d-models/indian-old-house-0fa45c4ffa02474c81425ff97376c4a0) is CC BY 4.0. The monochrome preview shows a compact veranda and tile roof, but the listing reports 360,484 triangles and OBJ/FBX source formats. Retain as a fallback only if decimation and material work are practical.
- Kenney's CC0 [Building Kit](https://kenney.nl/assets/building-kit) and [Furniture Kit](https://kenney.nl/assets/furniture-kit) provide modular alternatives. Use the Indian façade and PBR furniture first to preserve regional character and visual consistency.
- The [Fab Diwali collection](https://www.fab.com/listings/47441bf7-6754-47fd-89d9-818bf887839e) offers converted glTF/GLB and requires purchase. Listing terms were insufficient to approve public delivery. The CC BY 4.0 [Fire Crackers pack](https://sketchfab.com/3d-models/fire-crackers-8bdb2b1a58b04a81ab03838eb44e8bee) is 137,516 triangles across the pack and has a generic rocket, with no confirmed match for the four required props. Use unbranded simple geometry later: tapered Busvanam, slender sparkler rod, flat spinner disc and short Sky Shot tube. Reuse the published material set where suitable.
- Innerscene's CC0 clay diya is listed as a 5.3 MB GLB. Optimize and reuse one mesh for rows of diyas. Rangoli still needs source verification or simple original artwork. Check all reviewed models for embedded texture rights, scale, orientation and size before adding them. Keep Sketchfab credits and change notices with the game. Audition the listed SFX and keep them embedded in gameplay under Pixabay terms.

## Open questions / not blocking MVP
- Q001: Which precise courtyard asset is best after inspecting license and performance?
- Q002: Which desktop GPU/browser should be used for official visual baseline?
- Q003: What specific smartphone and passive goggles, if any, are available for later testing?
- Q004: What target standalone XR headset/browser is available for real WebXR testing?
- Q005: Should the visual style be ultra-photorealistic or realistic-with-performance-constraints?

## Change log

- v0.9 — Phase 8 replaces loose display stock with seven reusable box configurations on the existing CC0 table. One Zustand transaction runs the existing pickup transition and decrements stock only after it succeeds. Finished crackers can be replaced without restocking. Reset closes boxes, invalidates in-flight hinges and restocks inventory while preserving cap reset and diya behavior.
- The stall uses original geometry, a shared 1024 × 512 artwork atlas, instanced trays, and original synthesized positional shop sounds. The touch, desktop and WebXR adapters share the same shop raycast target. The tabletop lamps moved to the front corners for access.
- At 1440 × 900 on Edge/Iris Xe, idle draw calls changed from 88 to 72 and the Busvanam sample from 90 to 82 with one box open. Median frame interval was 16.7 ms in both phases. Other open boxes add their visible product meshes.
- Eight unit tests and desktop gameplay checks passed. Pixel 7 emulation exercised tapping a box, taking an item, placement, diya and ignition, pause and reset. Quest 3 emulation exercised controller box and item interaction, fuse contact, left-hand sparkler lighting and reset.

- v0.8 — Phase 7 adds a gradient night sky, retuned moon and practical lighting, refined stone/plaster response, and rangoli details. Sketchfab's original-file endpoint still returns HTTP 401, so the veranda remains the licensed-material fallback. The courtyard still uses the existing CC0 Poly Haven and Innerscene assets.
- Two reusable unshadowed point lights cover firework and cap effects. Sparks retain their shared emitter with per-particle brightness, drag and longer streaks. Repeated veranda columns and red-chain props are instanced. Phase 7 audio includes a ducked original night loop, EQ and limiting for the existing cues, and shorter transfers for the two chain clips. VR uses optional controller haptics.
- Same 1440 × 900 Edge/Iris Xe sample before and after. Median frame interval was 16.7 ms in both runs. Draw calls fell from 103 to 88 at idle and 105 to 90 during Busvanam. Busvanam triangles fell from 42,712 to 39,770 in the sampled frame. These are short desktop samples. Physical Quest and Android measurements remain open.
- Phase 7 checks passed: typecheck, ESLint, three lifecycle tests, production build and startup, all seven fireworks and both cap pistols on desktop, diya and incense lighting, reset and persisted settings, Pixel 7 touch emulation, and Quest 3 emulation for physical fuse contact and the left-hand sparkler.

- v0.7 — The 1000 Wala uses a coiled prop, 88 pooled visual burst groups, and a synthesized track containing 1,000 pop transients. In VR the tracked right-hand incense tip lights from a diya and ignites fuses by contact. The sparkler is held in the left hand. B resets the game so the grip can be held without resetting it.

- v0.6 — Added the Red Cracker Chain and Comet Rocket. The chain stages eight ground bursts and the comet uses a gold variation of the aerial effect. Two original toy cap pistols use a shared aim ray, cap counts, recoil, a brief spark, and impact feedback. Only a direct hit on the currently placed cracker can ignite it through the toy. The additional audio is synthesized in-project.

- v0.5 — Sky Shot has a visible rising shell, a spark trail, a two-layer spherical burst with persistent colors and drag, and a delayed positional report. The diya workflow uses a lit lamp to prime a visible virtual taper. The same interaction lights other lamps and gates firecracker ignition on desktop, touch and XR.
- Added React Three XR 6.6.32 with local WebXR Input Profiles 1.0.20 JSON layouts for Quest Touch Plus and a generic fallback. The native controller adapter uses floor teleport, snap turn and a small in-headset guide. XR caps particle density and uses foveation. An IWER Quest 3 run passed session entry and exit, two controllers, teleport, diya interaction, pickup, placement, ignition and reset. Physical Quest 3 validation remains open.

- v0.4 — Implemented four desktop firecrackers with one active prop, ground placement validation, reset and a shared particle pool. Three instanced meshes and standard materials provide sparks without custom shaders. Howler plays original mono cues at the effect position. The Pixabay recording download returned HTTP 403, so the bundled cues are synthesized in-project. Presets change pixel ratio and particle density. Reduced flashes are enabled by default.
- Edge production startup and desktop gameplay passed with zero console errors and failed requests. Tests covered all four effects through completion and reset, ten active Busvanam resets, pause and playback cleanup, invalid placement and ignition, and settings persistence. Pixel 7 emulation covered drag look, joystick movement, pickup, placement, ignition, pause/resume and reset. Physical Android profiling and immersive headset validation remain open.

- v0.3 — Built the M1 courtyard. The Sketchfab API verified the preferred house's CC BY 4.0 license and download flag. Its original-file endpoint requires authentication. The temporary veranda, garland and rangoli are project geometry. Import the authorized house package when available and update the visible asset credits with modifications.
- M1 uses Three's pointer-lock controls with separate WASD handling and axis-separated courtyard/table bounds. The interaction system raycasts against visible geometry and only accepts the closest selectable within 2.5 m. There is one static shadow map and an optional 1× render-scale cap.
- Edge 156 passed production and development checks with zero console errors or failed requests. Playwright verified all four movement directions, pointer-locked mouse movement, Escape and resume, fixed eye height, façade and table bounds, distant-click rejection and Busvanam selection. Screenshots were reviewed at both desktop sizes. A short 1440 × 900 test with device pixel ratio 1.5 on Intel Iris Xe measured 16.7 ms median animation frame time, 48 draw calls and 32,612 triangles near the table. The sample covers one viewpoint. R3F emits a Three Clock deprecation warning and Vite reports a large client chunk.

- v0.2 — Added a React development shell and exact npm lockfile. On Windows with Node 24.22.2 and npm 11.19.1, strict `npm ci`, typecheck, lint, build and audit passed. The production shell rendered in headless Edge 156.0.4314.58 with no console errors or failed requests. The shell has no WebGL scene, so browser validation covers startup only.
- The first audit traced moderate findings to one [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249). The lockfile uses an override to 11.0.1 for the lint dependency tree. Revisit when the upstream tools adopt a patched range. Drei's optional stats helper currently pulls a second Three version. Leave the helper out of the scene and check the M1 bundle for duplication.

- v0.1 — Initial documentation baseline. No app code, models, sounds or effects claimed as implemented or validated.
