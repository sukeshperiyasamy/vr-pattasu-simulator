# Technical Stack and Architecture

## Chosen stack
- **Runtime & toolchain:** Node.js current active LTS, npm, Vite, TypeScript; pin exact tested versions in lockfile.
- **UI:** React.
- **3D:** Three.js + `@react-three/fiber`; helpers via `@react-three/drei`.
- **State:** Zustand (gameplay only; keep per-frame motion out of React state).
- **Audio:** Howler.js (verify spatial-audio requirements; may use Three.js positional audio if necessary).
- **Assets:** glTF/GLB, WebP or compressed textures, OGG/MP3 fallback.
- **XR later:** `@react-three/xr`; check compatibility with chosen R3F/Three versions before installing.
- **Tests:** TypeScript checker, ESLint, unit tests for finite-state transitions, Playwright browser smoke tests if feasible.

## Design rules
1. Separate *simulation state* from rendering, audio and platform input.
2. The same cracker definition powers desktop, mobile and XR control adapters.
3. Avoid deep dependencies for a feature that can be simple and local.
4. Use shared emitters/particles; don't duplicate shader implementations per cracker.
5. Keep code modules reasonably small; one cohesive responsibility per file.
6. Keep hot-path transforms in refs/useFrame rather than Zustand or React re-renders every frame.
7. Support loss/recovery of rendering context where feasible; show a friendly fallback.

## Components and responsibilities
- `GameCanvas`: renderer setup, frame loop, lighting and quality options.
- `Courtyard`: environment GLB/assets, bounds, props, decorations and ground placement surfaces.
- `PlayerRig`: desktop camera, input mapping, movement and interactions; XR adapters added later.
- `InteractionSystem`: target raycasting, pickup, holding, valid placement and action dispatch.
- `FirecrackerRegistry`: data-driven definitions (metadata, placement mode, effect/audio identifiers).
- `FirecrackerController`: transition logic and independent active instance lifecycle.
- `Effects`: reusable fountain emitter, spark trails, rotating spinner and aerial burst.
- `AudioManager`: unlock, master gain, one-shot/cycling playback, audio cleanup.
- `SettingsStore`: quality, sensitivity, flash reduction, audio preferences.
- `UI`: enter overlay, prompts, pause/settings, diagnostics overlay in dev mode only.

## Firecracker state machine
`available -> held -> placed -> igniting -> active -> finished -> available` (with reset from any state to available). For a handheld sparkler: `held -> igniting -> active -> finished`. Reject illegal transitions and duplicate ignitions. State transitions are pure functions and unit-tested.

## Firecracker definition
```ts
export type FirecrackerKind = 'sparkler' | 'fountain' | 'spinner' | 'skyshot';
export type PlacementMode = 'handheld' | 'ground';
export interface FirecrackerDefinition {
  id: string;
  label: string;
  kind: FirecrackerKind;
  placement: PlacementMode;
  modelUrl?: string;
  effectPreset: string;
  soundId: string;
  approximateDurationMs: number; // visual timing only; NOT real-world fuse specification
}
```
Store each firecracker's optional 3D model URL in the asset manifest; procedural primitive fallback when model unavailable.

## Suggested repository layout
```text
src/
  app/             # boot, global layout, routing if needed
  scene/           # Canvas, courtyard, lighting, environment
  input/           # desktop, mobile, XR adapters
  interaction/     # raycast/hold/place/ignite
  fireworks/       # registry, state machine, effect systems
  audio/           # playback, asset cache
  store/           # user settings + gameplay state
  ui/              # HUD, overlays and menus
  utils/           # asset loading and disposal
public/assets/          # environment, models, textures, audio, license notices
VR_Pattasu_Starter_Docs/ # PRD, manifest, decisions, QA
```

Phase 0 creates only `src/app/`. Add the other directories as the corresponding milestones introduce code and assets.

## Runtime sequence
1. UI button initializes audio permission and enters scene.
2. Input adapter translates user gesture to domain action.
3. Interaction system validates range and current state.
4. Controller updates state and requests effect/audio cue.
5. Render frame advances GPU effects; time-based lifecycle ends cleanly.
6. Reset disposes/pools used effects and restores prop.

## Deployment
Static front-end to HTTPS hosting; run `npm run build` and serve output. WebXR immersive-vr requires supported browser/device and secure context. Phone VR requires separate compatibility validation; do not declare shipped before real-device testing.
