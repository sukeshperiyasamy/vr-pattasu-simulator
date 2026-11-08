# Firework Effect Implementation Specifications

## Shared requirements
Use an existing permissively licensed particle/effect implementation wherever suitable. Adapt without copying code of unknown license. Per cracker: start, update, stop, reset, dispose; controls for density, reduced flashes, sound gain and duration. Use object pooling where beneficial. Effects are graphical simulations only; do not incorporate real explosive formulations or ignition procedures.

## Stage and timing model
For each effect maintain graphical phases: `idle`, `igniting`, `emitting`, `decaying`, `finished`. Audio cues are attached to events. Timing is visual-design data, not instructions for real firecracker use.

## A — Busvanam (Flower Pot) — first vertical slice
- **Shape:** short tapered/conical prop placed on floor; primitive model fallback.
- **Interaction:** select → hold → position on allowed ground → virtually ignite.
- **Effect:** upward fountain; golden color gradient; sparks rise and fall with gravity; emissive core and intermittent small bursts.
- **Lighting:** local warm point light controlled by emission amplitude; avoid excessive post-processing.
- **Audio:** initial ignition cue, continuous crackle loop or layered oneshots, fade at end.
- **End:** emission tapers, sparks and smoke dissipate, prop becomes interactable again.
- **Test:** no spark emission before ignition; no duplicate audio; works after ten resets.

## B — Kambi Mathappu (Sparkler)
- **Shape:** slender handheld rod, attach to player hand/view prop in desktop mode.
- **Interaction:** pickup → virtual ignite while held → move around.
- **Effect:** moving emitter at tip; short-lived gold/white sparks following hand trajectory; restrained glow; optional faint trail.
- **Audio:** gentle localized crackle, no large explosion sound.
- **Test:** emission origin follows tip; reset fully stops emitter and audio.

## C — Sangu Chakram (Ground Spinner)
- **Shape:** small ground-centered disc.
- **Interaction:** place flat on floor, then virtually ignite.
- **Effect:** increasing rotation rate and curved radial spark streams, glowing rings and faint smoke; deceleration at finish.
- **Audio:** continuous spinning/crackling layer, fading with motion.
- **Test:** center remains fixed, spin stops properly and lighting doesn't persist.

## D — Sky Shot (Aerial)
- **Shape:** ground placement module; simulate distant aerial bursts.
- **Interaction:** place and ignite.
- **Effect:** upward luminous trail, then one or more colored 3D spherical bursts; speed, gravity, wind and falloff are purely artistic.
- **Audio:** launch cue then spatialized delayed burst for dramatic distance, not precise real-world timing.
- **Test:** frame-rate independent trajectories; no particles left after finish; upper scene view remains comfortable.

## Particle performance strategy
Start with an existing Three.js fireworks implementation for the sky effect (candidate research: `https://github.com/toddegray/fireworks`, verify repository state, license and integration). For fountains and handheld effects prefer a common simple emitter before building custom GLSL shaders. Limit transparent overdraw; avoid spawning one React component per particle. Add dynamic quality presets; profile GPU on actual phones.

## Sounds
Store actual downloaded files under `public/assets/audio/`; document each source and license. Browsers require a user gesture before sound playback. Attach playback to game events; always stop sounds on reset/pause. No sound should start unintentionally on loading.

## Quality presets — starting hypotheses, not benchmarks
- Low: simple particles, modest counts, no heavy bloom, limited smoke.
- Medium: higher density and select additive effects.
- High: richer particle detail and lighting, still capped by profiler.
Do not claim frame-rate targets achieved without measurements.
