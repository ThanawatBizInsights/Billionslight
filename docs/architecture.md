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
| Quality presets change *composition resolution* (draft 360×640, preview 540×960, final 1080×1920) plus shadow-map size and particle density | Actually reduces WebGL cost on an Intel MacBook (Remotion's `--scale` alone would still render 3D at full size). |
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
    energy-flow/              scenario rules, timeline, EnergyPath particles
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
