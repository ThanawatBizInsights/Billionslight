# Architecture

## Overview

```
Episode JSON ──► Zod schema (validation gate) ──► EpisodeComposition (Remotion)
                                                    │  one <Sequence> per scene
                                                    ▼
                                SceneView (3D, ThreeCanvas)    SceneOverlays (2D HTML)
                                 ├─ LightingRig   ◄─ lighting preset ID
                                 ├─ CameraRig     ◄─ camera keyframes / preset ID
                                 ├─ Environment   ◄─ environment registry ID (+ anchors, cable routes)
                                 ├─ Humanoid ×n   ◄─ character library ID + layered clips
                                 ├─ EnergyPath ×n ◄─ deriveEnergyState(electrical scenario)
                                 └─ Atmosphere
```

Every visual is a **pure function of (frame, episode data)**. Remotion renders
frames in parallel and out of order; determinism is what makes that safe.

## Key decisions

| Decision | Why |
|---|---|
| Project at repo root (not a `billionslight-animation-studio/` sub-folder) | The repository *is* the studio; one `package.json`, simpler paths. |
| Remotion is the render engine; the Phase 6 studio UI will be a Vite app embedding `@remotion/player` | One renderer for preview and export — what you preview is what renders. Vite is deferred until Phase 6 so we don't build a dashboard before the engine works. |
| Episodes are JSON validated with Zod at `calculateMetadata` | Invalid episodes fail before any frame renders; duration/size are derived from data. |
| Registries (characters, clips, environments, lighting, cameras) keyed by kebab-case IDs | New episodes select assets by ID with no code changes. |
| A single shared humanoid rig (17 joints) for all characters | Every animation clip works on every character; characters differ only in proportions, materials and accessories. |
| Clips are pure functions `(ctx, pose) → pose`, layered with blend envelopes | Deterministic blending and transitions; easy to test. |
| Energy flows derived from an electrical *scenario*, not keyframed | Visualisation cannot contradict the physics/rules; rules are unit-tested. |
| Environments expose named **anchors** and **cable routes** | Characters can `pointAt`/`lookAt` "arrayCenter"; energy paths follow the building. |
| Quality presets change *composition resolution* (draft 360×640, preview 540×960, final 1080×1920) plus shadow-map size and atmosphere particle count | Actually reduces WebGL cost on an Intel MacBook (Remotion's `--scale` alone would still render 3D at full size). |
| Thai fonts bundled locally (Noto Sans Thai, OFL) | Offline-safe renders; Remotion waits for fonts before capture. |
| Procedural geometry first; GLTF/GLB later via drei `useGLTF` + `delayRender` | No Blender dependency now; imported assets slot into the same registries. |
| TypeScript 5.9, not 7.x | TS 7 (native port) is very new; 5.9 is what the Remotion/R3F ecosystem is tested against. |

## Pinned versions (checked for peer compatibility)

| Package | Version | Note |
|---|---|---|
| remotion, @remotion/* | 4.0.547 | all Remotion packages must share one version |
| three / @types/three | 0.180.0 | Remotion tests against 0.178; 0.180 is conservative vs latest 0.187 |
| @react-three/fiber | 9.8.2 | peer: react ≥19 <19.4 |
| @react-three/drei | 10.7.9 | peer: fiber ^9, three ≥0.159 |
| react / react-dom | 19.2.4 | inside fiber's supported range |
| zod | 4.6.7 | same major Remotion uses internally |
| typescript | 5.9.3 | |
| vitest | 5.1.2 | |

## Folder map

```
src/
  index.ts, Root.tsx          Remotion entry + composition registration
  compositions/               EpisodeComposition (generic episode renderer)
  schemas/episode.ts          episode schema + duration helpers
  config/                     formats/quality presets, palette (energy colours)
  engine/
    animation/                core (easing, keyframes, seeded noise, blink), clips
    characters/               rig (joints, pose, blending), Humanoid, library
    environments/             ModernThaiHouse, registry (anchors, cables)
    equipment/                PV panel/array, inverter, meter, battery
    energy-flow/              scenario rules, timeline, links, pulse maths, EnergyFlowPath (V3 pulse), labels
    cameras/                  CameraRig, presets
    lighting/                 presets, LightingRig (sky dome, sun, fill, fog)
    audio/                    ElevenLabs config guard (Phase 4 builds on this)
    subtitles/                Thai font loading (Phase 4: subtitle tracks, SRT)
    scene/                    SceneView (generic 3D scene renderer)
    core/                     materials, atmosphere
  components/Overlays.tsx     titles, labels, legend in the safe area
  episodes/                   episode JSON files
  studio/                     (Phase 6) production dashboard
public/assets/                fonts, branding, characters, environments, equipment, audio, references
scripts/                      render.mjs, doctor.mjs, plan-shot.mjs, lib/
tests/                        vitest suites
renders/                      outputs (MP4s git-ignored) + render-log.jsonl
docs/                         architecture, electrical accuracy, limitations, phase reports
```

## Phase 2 additions

```
CharacterDefinition (data: body plan, height, body dims, colours, seed)
        │
        ▼
CharacterModel ──► SquirrelMascot (Sunny)  ┐  shared joints + optional ears/tail
               └─► StylizedHuman  (Ton)    ┘  scaled to the approved height
pose = evaluatePose(frame, clips, base face from expression track, body dims)
       + look-at (head turn + eye gaze) + props attached to joints
```

| Decision | Why |
|---|---|
| Body plans instead of one humanoid | A squirrel mascot and an adult human need different silhouettes, but the same joint names keep every clip reusable on both. New characters (May) reuse a body plan with new data. |
| Height calibration (`NATURAL_HEIGHT`) | Body plans are modelled in convenient units; each character is scaled to its owner-approved height, verified on a ruler render. |
| Expressions as data presets + a track | Writers choose `happy`, `confused` … per frame; blending is automatic; `talk` layers mouth motion on top. |
| Props are separate assets on a `props` track | Owner requirement: tablet and solar panel must be removable. Props render in the hand joint's space with a counter-scale. |
| `hold` easing = hard cut | Several camera set-ups in one scene without extra scenes or canvases. Cuts land on exactly the keyframe frame. |
| `environment.states` + `lighting.transitions` | Story beats such as "the power goes out" are data, not code: power gates lights/TV/AC; lighting blends to the outage preset. |
| Environment `adjustLighting` | Outdoor presets are reused indoors; interiors swap grass-green bounce light for a warm floor bounce, and drop outdoor haze. |
| Option-dependent cable routes | The garage draws different energy paths for on-grid vs hybrid (battery and backup circuit only when configured). |
| Review content = episodes | Identity sheets, scale reference, expressions, poses and environment previews are generated episode JSON rendered by the same engine, so what is approved is what episodes will use. |

## Phase 3 additions — animation engine

```
character keyframes ──► sampleMotion(frame) ─► {travel, speed, heading}
                                   │                │
                                   ▼                ▼ (faceMovement)
evaluatePose(frame, clips, face, body, motion) ─► auto walk layer (gait = travel / stride)
                                                  + interaction clips (reach / operate-switch …)
scene.camera.shots[] ─► SHOTS[preset](ShotContext{subject(f), subject2(f), aspect, params})
scene.transitionIn ─► sceneStartFrames / sceneOverlap ─► TransitionLayer (fade, dip-to-navy)
electrical keyframes ─► deriveEnergyState ─► flows + housePower/backupPower
                                            └► environment: appliance on/off, load routes (white)
```

| Decision | Why |
|---|---|
| Walk driven by distance travelled, not time | Feet never slide whatever the keyframe timing; standing still blends the walk out automatically. Opt out with `autoWalk: false`. |
| Point/reach targets resolved by the scene | Clips stay body-local (yaw/pitch/dist); episodes name an anchor (`lightSwitch`, `inverter`) or a cast member. |
| Subject-aware shot presets | A shot is a pure function of the frame and its subjects, so tracking, two-shots and over-the-shoulder follow moving characters deterministically. Vertical frames get extra distance automatically. |
| Shot lists with hard cuts | `camera.shots[]` cut on `from`; explicit keyframes still override everything. |
| Crossfades overlap the timeline | A `fade` transition starts the scene earlier (overlap = transition length), so total duration stays exact; dip-to-navy splits its length between outgoing and incoming scenes. |
| Appliance power derived from the scenario | Appliances run when house circuits are powered; backup-circuit appliances (hybrid only, `options.backupLoads`) run when the backup supply is active. Nothing is hand-animated. Per-appliance switches live in `environment.states`. |
| Consumption routes are a naming convention | `load:house:<appliance>` / `load:backup:<appliance>` cables render white flows at the house / backup power level, so any environment can add them without engine changes. |


## Energy-flow visual standard

```
ElectricalScenario ─► deriveEnergyState (rules) ─► deriveFlowLinks ─► links {kW, direction, category, warning, label}
                                                          │
environment cable routes ─► ROUTE_TO_LINK ────────────────┤
                                                          ▼
                     EnergyFlowPath (V3: one travelling pulse per connection — gradient shader
                                     on the cable tube; direction from the link; never tied to kW)
                     FlowLabels (projected Thai labels + kW) · FlowLegend (pulse swatches)
```

Applies to every scene with electrical data; tokens in `src/config/energy-flow.ts`.
