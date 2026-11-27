# Phase 1 report — Technical foundation

Date: 2026-11-27 · Status: **complete, awaiting owner approval**

## 1. Environment inspected

| Item | Found |
|---|---|
| Repository | empty (no commits, no reference assets) |
| Node / npm | v22.23.5 / 10.9.9 |
| FFmpeg / ffprobe | 6.1.1 (system) |
| Build host | Linux x64 cloud container, 4× Intel Xeon 2.1 GHz, 17 GB RAM, **no GPU** |
| Browser | Remotion's browser download host was blocked; used a local Chrome Headless Shell via `BROWSER_EXECUTABLE` (not needed on a normal Mac) |

The development target is an Intel MacBook; this phase was built and rendered
in a cloud Linux container. Mac render times will differ (see §5).

## 2. What was built

- Pinned, peer-compatible dependency set (see `docs/architecture.md`).
- Episode schema (Zod) with cross-reference validation (cast, claims,
  references, unique scenes, value ranges) and duration helpers.
- Generic `EpisodeComposition`: renders any valid episode at draft/preview/final.
- Engine modules: deterministic animation core, 17-joint shared rig, layered
  clips with blending (idle-breathing, wave, point, talk, explain, nod, smile;
  left/right hand mirroring), procedural humanoid with blink/gaze/mouth/brows,
  temporary engineer, modern Thai house (anchors + cable routes), PV array,
  inverter, meter, battery, energy-flow rules + timeline + particle paths,
  5 lighting presets with gradient sky, keyframed camera + 5 presets,
  atmosphere particles, Thai overlay/legend layer with safe areas, local Thai fonts.
- Scripts: `render.mjs` (render + ffprobe verification + metrics log),
  `doctor.mjs`, `plan-shot.mjs` (numeric camera framing).
- Tests: 35 passing (schema, durations, deterministic animation, electrical
  rules, electrical timeline, asset availability, Thai text normalisation,
  missing credentials).

## 3. Test video

`renders/FoundationTest/FoundationTest-final-2026-11-27T04-11-31.mp4`
(MP4 files are git-ignored; re-create with `npm run render:test`.)

5.0 s, 1080×1920, 30 fps, 150 frames, H.264 yuv420p + AAC (silent track),
3.05 MB — verified with ffprobe.

Content: golden-hour establishing shot of the modern house with a 10-panel
rooftop array; slow dolly-in. The electrical scenario changes at frame 50 from
low irradiance (PV 1.25 kW, grid imports 1.15 kW, blue line active) to strong
irradiance (PV covers the 2.4 kW load, grid line goes grey) — the flows are
derived from the scenario, not hand-animated. The temporary engineer waves,
then turns, looks up and points at the array while "talking".

## 4. Render metrics (cloud container, software GL "swangle", concurrency 3)

| Quality | Resolution | Render time (5 s clip) | s/frame | Peak RAM (process tree) |
|---|---|---|---|---|
| draft | 360×640 | 9.0 s | 0.06 | 1.8 GB |
| final | 1080×1920 | 45.7 s | 0.30 | 2.6 GB |

Extrapolated for a 30 s episode (900 frames) at final: ~4.5 min on this host.
On an Intel MacBook with `RENDER_GL=angle` (GPU), expect similar or faster;
CPU-only Macs with 2 concurrency may take ~2× longer. Measure with
`npm run render:test` on the Mac — results append to `renders/render-log.jsonl`.

## 5. Expected technical limitations

- **Depth of field / bloom** are not enabled: post-processing is costly in
  software GL and on Intel iGPUs. Phase 3 will add an optional, quality-gated
  DoF pass (final preset only) and evaluate its cost.
- **Lip sync** is procedural for now; Phase 4 will drive the mouth from
  ElevenLabs alignment data / audio amplitude (visemes are Phase 4+).
- **Thai subtitle line breaking**: browsers break Thai using dictionary
  segmentation; long lines will need explicit break hints (`Intl.Segmenter`
  word segmentation is available in Chrome). Planned for Phase 4.
- **ElevenLabs alignment** for Thai: character-level timing is returned by the
  timestamps endpoint, but accuracy for Thai needs verifying on real samples.
- Procedural characters have limits on facial subtlety; for Sunny, a GLB
  modelled from the character sheet may eventually be preferable (Blender
  optional, not required).
- Each scene mounts its own WebGL context; cross-scene 3D transitions
  (morphing one camera into another scene) need a shared canvas — planned in
  Phase 3 alongside scene transitions.
- Shadows are a single directional shadow map; very wide shots soften shadow
  detail. Interior/cutaway scenes will need local lights (cost-managed).
- **Remotion licence:** free for individuals and companies of up to 3 people;
  larger organisations need a Remotion Company Licence (remotion.pro). Please
  confirm which applies to Billionslight.
- GLTF/GLB import is architected (registries) but not implemented yet.

## 6. Roadmap

| Phase | Deliverables | Gate |
|---|---|---|
| 2 | Sunny (from official sheet) & Homeowner prototypes; refine house to reference; living room; panel/inverter/battery/meter/DB detail; lighting pass; **character identity sheets & environment preview stills** | **STOP for visual approval** |
| 3 | Full clip library (walk, sit/stand, think, nod/shake, surprise, confusion, tablet, switch, inspect), expression presets, look-at, camera presets (14), scene transitions, equipment states, energy-flow for backup/outage/battery/export, interior cutaway | review |
| 4 | ElevenLabs client (cached, opt-in), import/mock audio, per-line regeneration, timing-driven scene durations, Thai subtitles + SRT export, music + ducking, SFX library | review |
| 5 | Demo episode, technical validation script, accuracy review, performance pass | **technical + visual approval** |
| 6 | Studio UI (Vite + React + Remotion Player): dashboard, script & storyboard editors, asset library, timeline, export centre | review |
| 7 | Script → storyboard conversion, templates, batch rendering, thumbnails/cover export | review |

## 7. Reference assets needed from you

1. **Official Billionslight logo** — SVG + transparent PNG, and brand
   guidelines (colours, clear space, fonts). → `public/assets/branding/`
2. **Sunny character sheet** — turnaround (front/side/back/¾), expressions,
   colour swatches. → `public/assets/characters/sunny/`
3. **Billionslight house reference** — photos/drawings. → `public/assets/references/`
4. Style reference videos (mood only). → `public/assets/references/`
5. Approved brand font for Thai, if not Noto Sans Thai.
6. Later (Phase 4): ElevenLabs voice IDs for Sunny / Homeowner / Technician /
   narrator, and approval before any paid generation.
7. Later: licensed music / SFX, or approval to source royalty-free ones.
8. A technical reviewer name for claim verification.
