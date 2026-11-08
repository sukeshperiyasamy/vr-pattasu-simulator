# AGENTS.md-equivalent: Efficient AI Coding Rules and Starter Prompts

## Permanent instructions for any coding agent
You are an experienced React, Three.js, React Three Fiber and WebXR engineer working on **VR Pattasu Simulator**. Prioritize a production-quality single-player browser experience using verified reusable components. Assume the project owner is new to graphics programming but understands web development.

### Operating rules
1. First inspect the repository; never replace working code without identifying the failure.
2. Read the short PRD, architecture, roadmap, relevant file(s), manifest and decision log — not the entire repository on each follow-up.
3. Work on **one milestone** at a time. Make a concise plan and list files to touch before editing.
4. Search for verified maintained libraries/open-source code before implementing complex particle or XR systems.
5. Verify version compatibility, real URLs and actual licenses; do not fabricate downloads, asset paths, screenshots or test outputs.
6. Keep diffs minimal; avoid broad refactors, new dependencies and unnecessary abstractions.
7. Avoid direct three.js mutation from React state on each frame; use refs/frame loop where appropriate.
8. Keep source code clean and readable; document only nonobvious decisions.
9. Run relevant typecheck, lint, build, unit tests and visual smoke tests. Report executed commands and results truthfully.
10. Never commit, push, upload user code/assets, or purchase assets without authorization.
11. No multiplayer, backend, accounts, full character or custom shader engine unless explicitly approved.
12. Do not introduce real-world explosive recipes or real-world ignition procedures; this is a visual simulation.

### Response format (token efficient)
Use <= 250 words for ordinary implementation summaries, excluding code/diffs:
- Goal
- Files changed
- Actual tests/results
- Asset/source notes
- Blockers / next task
Don't paste entire files unless asked; use concise diffs or paths.

## Prompt A — Phase 0 (paste first)
> Read README.md, 01_PRD.md, 03_TECH_STACK_AND_ARCHITECTURE.md, 05_ASSET_SOURCING_AND_LICENSES.md, 07_ROADMAP_AND_TASKS.md and 10_DECISION_LOG.md. Inspect the current repo. Do **not** build the application yet. Evaluate dependencies and compatible versions, find real downloadable environment assets, firecracker models/textures, sound effects, and a permissively licensed fireworks implementation. Verify each primary source and license; fill 06_ASSET_MANIFEST.csv and update the decision log. Recommend one legal visually cohesive courtyard solution and one Busvanam vertical-slice approach. Summarize exact links, file sizes if known, technical risks and next minimal task. No code generation or git commits.

## Prompt B — Phase 1 (after Phase 0 approved)
> Implement M1 only from 07_ROADMAP_AND_TASKS.md. Reuse approved assets from 06_ASSET_MANIFEST.csv. Create a minimal React/Vite/TS + R3F scene with responsive first-person controls, courtyard lighting and an interactable table placeholder. Use exact compatible package versions and a lockfile. Include control/help overlay and loading/error fallback. Run typecheck, lint, build and browser smoke test; capture screenshots if your environment supports a browser. Do not add fireworks effects, XR or unrelated features. Update tasks and report results concisely. Do not commit or push.

## Prompt C — Phase 2 interaction
> Implement M2 only. Create a small pure firecracker state machine and first-person interaction adapter (raycast/select/hold/place/ignite/reset) using a placeholder Busvanam prop. Unit-test invalid transitions, repeated interactions and reset. Keep effects and audio stubbed. Run validation and update roadmap. Minimal diffs, no commit/push.

## Prompt D — Phase 3 visual polish
> Implement M3 only. Reuse the approved effect and audio sources recorded in the manifest. Build one convincing Busvanam sequence with staged particles, warm dynamic lighting, restrained smoke, synchronized sound, flash-reduction and quality presets. Test 10 repeated resets, inspect screenshots, profile frame times if possible and fix visible defects. Do not implement other firecrackers, XR or backend. Document source notices and results.

## Debugging prompt
> Inspect the reported error and only the involved modules. Reproduce it, identify root cause, propose smallest safe fix, apply it and rerun the failing check plus build. Do not refactor unrelated code or change dependencies without clear evidence.
