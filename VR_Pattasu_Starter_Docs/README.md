# VR Pattasu Simulator — Development Starter Pack

**Version:** 0.4 | **Status:** Desktop playable, touch controls in device testing | **Mode:** single player

## Vision
Create a realistic, immersive, first-person Diwali firecracker experience in a browser. The player enters a decorated Indian courtyard, chooses a firecracker, picks it up, positions it when applicable, ignites it virtually, and experiences synchronized 3D sparks, sound, light and smoke. Deliver an excellent desktop web vertical slice before pursuing mobile and VR goggles.

## Core principles
1. **Reuse first:** use legal, verified 3D assets, sounds and effect code rather than rebuilding everything.
2. **One polished vertical slice:** fully complete Busvanam before adding other firecrackers.
3. **Shared simulation:** desktop, mobile and XR use the same gameplay engine with different input adapters.
4. **First person:** camera + simple visible hand/held prop; no full-body character.
5. **Performance and comfort:** configurable flashes and volume; target a smooth frame rate, profile real devices.
6. **Evidence over claims:** do not state an asset is licensed, tested, supported or downloaded without verification.

## Start here
1. Read `01_PRD.md` and `02_GAMEPLAY_AND_VISUAL_SPEC.md`.
2. Run **Phase 0 only** from `09_AI_AGENT_INSTRUCTIONS.md`: inspect repo, research assets/licenses, create a decision log.
3. Complete `06_ASSET_MANIFEST.csv` with real asset sources. Never treat sample paths as downloaded assets.
4. Follow `07_ROADMAP_AND_TASKS.md`, one gated phase at a time.
5. Use `08_TEST_AND_ACCEPTANCE.md` for each milestone.

## Planned technology
React + Vite + TypeScript; Three.js + React Three Fiber + Drei; Zustand; Howler.js; glTF/GLB; optional later @react-three/xr. No backend, authentication or multiplayer in MVP. See `03_TECH_STACK_AND_ARCHITECTURE.md`.

## MVP (desktop vertical slice)
- One attractive nighttime courtyard with an interaction table.
- First-person look/move; center reticle; interact/place/ignite/reset.
- One Busvanam fountain with staged ignition, visible sparks, animated light, sound, short-lived smoke and finished state.
- Settings for quality, sound and reduced flashing; reset without page reload.
- Verified source/license records for every imported asset.

## Subsequent features
Kambi Mathappu sparkler, Sangu Chakram ground spinner, aerial Sky Shot; mobile touch controls and device profiling; compatible XR headset sessions; phone-goggle stereo only if separately validated.

## Non-goals for MVP
Real-world fireworks instructions; combustible recipes; real fuse timings; multiplayer; economy; user accounts; AI assistants; advanced physics; full-body animation; standalone APK.

## Source files in this pack
- `01_PRD.md` — product requirements and scope
- `02_GAMEPLAY_AND_VISUAL_SPEC.md` — user journey, interaction/UX, aesthetic standard
- `03_TECH_STACK_AND_ARCHITECTURE.md` — architecture, interfaces and repository layout
- `04_FIREWORK_EFFECT_SPEC.md` — implementation contracts for four firework types
- `05_ASSET_SOURCING_AND_LICENSES.md` — acquisition, license and optimization policy
- `06_ASSET_MANIFEST.csv` — editable asset register
- `07_ROADMAP_AND_TASKS.md` — milestone order, tasks and gates
- `08_TEST_AND_ACCEPTANCE.md` — QA plan and acceptance criteria
- `09_AI_AGENT_INSTRUCTIONS.md` — token-efficient rules and first agent prompt
- `10_DECISION_LOG.md` — decisions and open questions

## Running the development shell
From the starter pack root, use Node 24 LTS and run `npm ci` followed by `npm run dev`. Use `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` for validation. Serve the production build locally with `npm run preview`.

Click **Enter courtyard**. Use WASD and the mouse to move and aim, click or press E to pick up, G to place a ground firecracker, R to reset, and Escape to pause. Aim at the lit diya on the left of the table and press F to light your virtual taper. F then lights unlit diyas or ignites an eligible firecracker. On touch screens, drag to look and use the joystick and on-screen buttons.

For Quest 3, open the forwarded localhost address over USB or serve the production build from a trusted HTTPS URL. Select **Enter VR** in Meta Quest Browser. Use the left trigger to teleport, the right thumbstick to snap turn, the right trigger to pick up or place props, and B to reset. Bring the incense stick on your right controller close to the flame of a burning diya, then touch its glowing tip to the fuse of the placed cracker. The handheld sparkler goes in the left hand so the right-hand stick can light it. Use the headset's system controls to leave VR. Physical headset comfort and performance still need testing.

The Single-Cap Pistol and Roll-Cap Pistol are toy props on the table. Pick one up, then click, tap **Fire**, or use the right Quest trigger. To ignite a cracker by shooting, place the cracker first, then equip the pistol and aim directly at the placed prop. Reset returns the toys to the table and refills the caps.

Runtime pins are React and React DOM 19.3.1, Three.js 0.187.0, R3F 9.8.2, Drei 10.7.9, Zustand 5.1.0 and Howler 2.2.4. The toolchain uses Vite 8.3.6 and TypeScript 6.0.3. See `package.json` and `package-lock.json` for exact versions. Three types match the runtime release line. TypeScript 6.0 satisfies the lint parser's supported range.
