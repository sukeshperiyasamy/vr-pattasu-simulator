# Product Requirements Document (PRD)

## Purpose
Build **VR Pattasu Simulator**, a single-player, first-person browser experience of virtual Diwali firecrackers. Prioritize visual authenticity, a satisfying interaction loop, low development overhead and reusable implementations. **A realistic simulation is not physical safety training.**

## Users and platforms
- **Primary:** PC/laptop Chrome/Edge-class browsers, keyboard and mouse, WebGL2-capable GPU.
- **Secondary:** Android mobile browser with touch; hardware performance varies.
- **Later:** standalone headset with supported WebXR immersive-vr, controller support and (where supported) hand tracking.
- **Conditional exploratory:** smartphone inside passive VR goggles, depending on browser compatibility, gyroscope permissions and separate stereo fallback. Never promise universal phone WebXR support.

## Main experience
Player spawns at standing-eye height in a night-time courtyard near a fireworks display shelf. Player looks at an item, sees an unobtrusive outline/prompt, selects it, holds or places it, uses virtual ignition, sees and hears the effect, then selects another. The player is always alone; no human avatar is required.

## MVP functional requirements
| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| F01 | Courtyard with walkable bounds and decorations | Must | scene loads with no missing asset, usable lighting, no clipping through major boundaries |
| F02 | Mouse look, WASD movement and desktop interact controls | Must | tested with keyboard/mouse; pointer lock requires user gesture |
| F03 | Firecracker selectable from table | Must | prompt appears within interaction range; picking works repeatedly |
| F04 | Simple hold, place, ignite and reset flow | Must | invalid transitions prevented; no duplicate triggers |
| F05 | Busvanam visual & audio effect | Must | sparks/light/audio staged and synchronized; ends and resets |
| F06 | Sound volume/mute; reduced-flash toggle | Must | settings apply instantly and persist locally when permitted |
| F07 | Quality presets | Must | particle quantity and expensive effects change by preset |
| F08 | On-screen first-use controls/help | Must | mouse/keyboard instructions and restart available |
| F09 | Kambi Mathappu sparkler | Should, after MVP | hand-held moving emitter with finite lifetime |
| F10 | Sangu Chakram ground spinner | Should, after MVP | anchored rotation and circular sparks |
| F11 | Sky Shot | Should, after MVP | launch trail, burst and distance-scaled audio |
| F12 | Android touch controls | Later | touch look + joystick + interaction buttons tested on real phone |
| F13 | WebXR headset mode | Later | actual immersive session demonstrated on target hardware |

## Nonfunctional requirements
- Clean composition, realistic materials, warm Diwali decorations and credible night lighting.
- Graceful fallback if an asset or optional effect fails; no broken UI.
- No unchecked external downloads, unlicensed packages or non-attributed assets.
- Modern browser accessible UX: keyboard usable menus; readable contrast; reduced flashing.
- WebGL render resources disposed when no longer needed; effects pooled/instanced where practical.
- Keep UI screens light and nonintrusive; no excessive status overlays during fireworks.

## Success definition
A new user can open a deployed HTTPS URL on desktop, understand the controls, select and place the Busvanam, trigger it, observe an appealing complete effect with synced audio, reset and repeat — without errors or developer intervention. Quality is reviewed visually, not inferred from build success.

## Out of scope
Instructions for real ignition, DIY explosive chemistry or real fireworks handling, purchasing integrations, multiplayer, user accounts, virtual currency, machine learning, complex avatar skeletons, real heat/tactile sensations.

## Risks
- Existing assets may not have suitable licenses or performance characteristics.
- Fireworks particles can cause transparency overdraw on mobile.
- Phone browsers may not support immersive WebXR or required orientation sensors.
- Sound autoplay is restricted until user interaction.
- Photorealism and VR frame rates compete; use quality tiers and device tests.

## Release criteria
Complete every Must acceptance, pass testing in `08_TEST_AND_ACCEPTANCE.md`, verify manifest, eliminate console/runtime errors and document limitations.
