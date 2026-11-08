# Gameplay, UX and Visual Direction

## Artistic direction
- Setting: enclosed, traditional South Indian-inspired residential courtyard, nighttime, warm decorative lights, diyas and tasteful rangoli.
- Main stage: unobstructed safe-looking paved center; selection shelf along a wall.
- Tone: festive and immersive, realistic but stylized slightly where performance requires.
- Lighting: cool ambient moonlight + warm practical lights + local dynamic light from active firework.
- Materials: PBR stone/plaster/wood, plausible roughness and normal textures, no oversized or repeating patterns.
- Soundscape: subtle ambience; positional firework crackle/whistle/pop; master volume and mute.
- Camera: first person at approximate standing eye level, adjustable sensitivity, no forced camera shake or fast artificial motion.

## User journey
1. Opening screen: `Enter Courtyard`, `Controls`, `Settings`.
2. Click Enter: browser unlocks audio; pointer lock requested after the click where supported.
3. Look around and move within courtyard.
4. Approach shelf and look at firecracker; reticle/prompt indicates `E: Pick up`.
5. Held state shows simple hand/prop attached to view; optional outline confirms selection.
6. Ground-only cracker: `G / click: Place` onto a valid highlighted ground spot (raycast ground); no placement on walls/inside objects.
7. `F / click: Ignite` triggers a virtual ignition animation; keep explicit interaction separate from actual safety guidance.
8. Observe light/audio/particle sequence; after completion item becomes reusable or respawns.
9. `R: Reset active firework`; `Esc: pause/unlock pointer`.

## Controls (proposed; validate for conflicts)
| Action | Desktop | Mobile later | XR later |
|---|---|---|---|
| Look | Mouse / pointer lock | Drag or device orientation | Head tracking |
| Move | WASD | Thumbstick | Controller stick / teleport |
| Pick / Interact | E or click | Tap interact | Controller select / pinch if supported |
| Place | G | Place button | Release or place action |
| Ignite | F | Ignite button | Controller action |
| Reset | R | UI button | XR menu |
| Pause/settings | Esc | Menu | XR menu |

## Interaction behavior
- Center screen reticle only highlights targets within configurable distance.
- One held object at a time; switching must first release/reset existing held object.
- Ground-only items cannot be ignited while held.
- Handheld sparkler may be ignited while held.
- Invalid interactions show a brief, calm feedback prompt, never crash.
- No forced waiting through long timers; allow skip/reset after completion.
- Preserve user agency: no autoplay bursts at initial entry; explicit ignition.

## Visual effect guidelines
- Place particles in true 3D where possible: sparks fall with gravity, sizes/brightness change with lifetime, realistic glowing color ramp.
- Avoid huge bloom, flat stickers, excessive smoke or unrealistic object scaling.
- Minimize overdraw by limiting transparent particles and particle sizes, especially mobile.
- Dynamic light intensity should rise/fall with emission; local light count kept small.
- Sound starts on user activation; stage temporal layers (ignite → emission → fade).
- Background should be dark enough for sparks but still navigable.

## Comfort and accessibility
- Reduced flash intensity setting ON by default if suitable; no strobing effect dependencies.
- Master volume/mute, separate effects control optionally.
- Motion sensitivity control; optional vignette/teleport for VR locomotion.
- Subtitles/captions for important prompts; icon + text, not color alone.
- Add age-appropriate experience labeling and clear statement: simulated fireworks, not real-world handling instructions.

## Visual approval checklist
Review actual screenshots and gameplay footage (desktop low/high presets and Android when available). Check: scene composition, scale, texture seams, lighting, hand/prop alignment, firework origin, shadows, spark lifetimes, smoke, audio timing and responsive UX.
