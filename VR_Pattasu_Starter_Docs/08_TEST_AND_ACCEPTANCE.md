# Test Plan and Acceptance Checklist

## General checks every milestone
- `npm run typecheck` passes (after configuring script).
- `npm run lint` passes.
- `npm run build` passes.
- No uncaught browser console errors or persistent failed network asset requests.
- UI buttons work; no accidental duplicate action on repeated clicks.
- Documented screenshots or short captures prove actual visual results.
- Asset manifest updated; source/license notices preserved.

## Manual gameplay test cases
| ID | Procedure | Expected |
|---|---|---|
| T01 | Enter scene and inspect courtyard | Loads with realistic lighting, no missing textures |
| T02 | Move to selection table, aim at prop | Prompt only appears within range |
| T03 | Select and hold Busvanam | One prop held; no clipping or duplicates |
| T04 | Try to ignite ground-only prop while held | Blocked with clear UI feedback |
| T05 | Place prop on valid floor | Stable orientation and valid position |
| T06 | Attempt placement on wall/outside stage | Rejected or snapped to approved surface |
| T07 | Virtually ignite prop | One activation and synced effects/audio |
| T08 | Ignite multiple times rapidly | No duplicate loop/burst or stuck state |
| T09 | Wait for effect completion | Particles/audio/light fade to zero |
| T10 | Reset mid-effect and repeat 10 times | No stuck objects, duplicate audio or buildup |
| T11 | Toggle mute and reduced flashes | Immediate effect and persists as designed |
| T12 | Change low/medium/high preset | Visual quality changes, no crash |
| T13 | Resize viewport | UI and canvas remain responsive |
| T14 | Lose/regain tab focus | Audio/pause behavior consistent |
| T15 | Break one asset path during development | Fallback/error UI, no blank page |

## Browser and device matrix
- Desktop Chrome/Edge (record version, OS and GPU).
- Desktop Firefox/Safari as available, with explicit known limitations.
- Android Chrome (record device/model, GPU, browser version, frame rate and thermal behavior).
- Headset browser only once supported hardware available.

## Performance testing
- Capture minimum/median FPS or frame-time traces during idle, active Busvanam and sky-shot peak.
- Measure JS heap where available, GPU pressure if tooling allows, total transferred bytes and loading time.
- Repeat activation/reset 10–20 times and check trends; document rather than assume no leaks.
- Targets are provisional: aim for 60 FPS desktop on target GPU, adapt to tested mobile baseline; XR targets depend on headset refresh rate. Visual quality must be downgraded if frame times are consistently high.

## Accessibility/comfort
- Menus operable with keyboard.
- Flash reduction has visible impact; no rapid mandatory strobes.
- Mute works for every sound, including loops.
- No sudden forced camera rotation, shake or unexpected locomotion.
- Clear pause/exit and help controls.

## Release signoff
- [ ] MVP behavior passes T01–T15 where applicable.
- [ ] No unverified rights, missing notices or hotlinked copyrighted assets.
- [ ] Actual screenshot/recording reviewed for clean realistic output.
- [ ] Compatibility statement accurately distinguishes desktop 3D, mobile 3D and true immersive VR.
- [ ] Limitations and remaining issues recorded.
