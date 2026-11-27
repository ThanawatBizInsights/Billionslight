# CLAUDE.md — Billionslight Animation Studio project rules

These rules are persistent. Follow them in every session. Update this file
whenever a new reusable asset or capability is approved.

## Current phase

**Phase 1 — provisionally approved (2026-11-27).**
**Phase 2 — ON HOLD until the essential reference sheets arrive** (approved
Sunny low-poly adaptation, canonical homeowner sheet — see
`docs/reference-review.md`). Do not build Phase 2 prototypes before then. When
they arrive: inspect → prototype → front/side/rear/¾ renders → environment
previews → 10 s living-room test (Sunny + homeowner) → measure → STOP for
visual approval. Do not expand the asset library before that approval.

| Phase | Scope | Gate |
|---|---|---|
| 1 | Foundation, schema, 3D test render | ⏸ owner approval |
| 2 | Sunny + Homeowner prototypes, house + living room, solar equipment, lighting, identity sheets | ⏸ **visual approval** |
| 3 | Animation engine, expressions, cameras, transitions, equipment states, energy visualisation | |
| 4 | ElevenLabs, audio cache, dialogue sync, Thai subtitles, music, SFX | |
| 5 | Demo episode "ไฟดับตอนแดดแรง โซลาร์ยังจ่ายไฟให้บ้านไหม?" | ⏸ technical + visual review |
| 6 | Studio UI | |
| 7 | Script→storyboard, templates, batch rendering | |

## Identity & branding

- **Preserve approved character identities.** Sunny's official character sheet
  (`public/assets/characters/sunny/`) is authoritative. Do not redesign Sunny,
  or change any approved character, without explicit approval.
- **Sunny is an orange squirrel mascot** (white hard hat, navy coverall with
  blue shoulder panels, gold trim, sun badge, violet eyes, bushy tail). The
  approved low-poly adaptation, when supplied, is the modelling authority.
- `temp-engineer` is a TEMPORARY placeholder. Never present it as Sunny.
- Reference images are design guides; final assets must be genuine,
  reusable, programmable 3D assets (procedural rigs/meshes, or GLB later).
- **Preserve official Billionslight branding.** Use the supplied logo files
  only; never redraw, recolour, re-typeset or change proportions. Do not invent
  brand colours — take them from official files.
- Official logo colours (measured from the PNG; confirm against final.ai):
  orange `#FF5E1F`, blue `#1B28CE`, navy `#21409A`. The boards' sun/arc
  header mark is NOT the official logo.
- Original visual style only: do not reproduce the reference creator's
  characters, branding or environments.
- Third-party brand logos and vendor product branding must not appear in
  animations without the owner's explicit permission.

## Asset manifest & references

- Every reusable asset is registered in `src/assets/asset-manifest.json`
  (validated by `src/schemas/asset-manifest.ts`; `npm run manifest` writes
  `docs/asset-manifest.md`). Add/update an entry whenever an asset or
  capability is introduced. Status `approved` is set only on the owner's word.
- **The GitHub repo is PUBLIC.** Reference copies live in
  `public/assets/references/drive/` (git-ignored). Never commit reference
  images, logo files, vendor material, quotations or Google Drive IDs/links.
- The Drive folder is the source of truth for references; fetch them through
  the Google Drive connector (direct downloads are blocked in cloud sessions).

## Engineering rules

- **Deterministic, frame-based animation only.** Everything is a pure function
  of `useCurrentFrame()` + data. No `useFrame()`, no `Math.random()`, no
  `Date.now()`, no self-running shaders. Use `rand()/noise1()` from
  `src/engine/animation/core.ts` with explicit seeds.
- **No episode-specific logic in the engine.** Episodes are JSON validated by
  `src/schemas/episode.ts`. New episodes = new data + existing asset IDs.
  If an episode needs a new capability, add it to the engine generically.
- **Reuse assets** via the registries (characters, clips, environments,
  lighting, camera presets). Asset IDs are kebab-case.
- **Do not modify approved assets without permission.** Add variants instead.
- Inside `<ThreeCanvas>`, any `<Sequence>` needs `layout="none"`.
- **Keep rendering practical for an Intel MacBook:** low-poly geometry, flat
  shading, small instance counts, configurable shadow map size, no heavy
  post-processing by default. Use quality presets (draft/preview/final).
- Run `npm run typecheck && npm test` before committing.
- Never claim a render succeeded unless `scripts/render.mjs` verification
  (ffprobe) passed and the file exists.

## Electrical accuracy (see docs/electrical-accuracy.md)

- Energy flows are **derived** from the electrical scenario
  (`src/engine/energy-flow/scenario.ts`), never hand-animated decoration.
- Grid-tied inverters stop supplying during a grid outage (anti-islanding).
- A hybrid inverter does not automatically mean whole-house backup: backup
  needs a configured backup output, grid isolation and loads on the backup
  circuit, within inverter/battery power limits.
- Distinguish kW (power) from kWh (energy). Export is never assumed.
- Never present electrical work as DIY. Models are simplified and are not
  installation or wiring instructions.
- Energy colours are visualisation conventions, NOT wiring colour codes:
  gold = solar, blue = grid, green = battery, white = household consumption,
  grey = inactive, red = faults/warnings only.
- Do not invent Thai utility regulations, installation requirements, savings
  figures or product specs. Every technical claim needs a `referenceIds` entry;
  uncertain claims stay `needs-human-review`. Episodes cannot be `approved`
  until claims are verified by a human.

## Paid services

- **No ElevenLabs credits during Phase 2** (owner instruction, 2026-11-27).
- **Avoid unnecessary paid API calls.** ElevenLabs is only called when
  `ELEVENLABS_API_KEY` is set AND `ELEVENLABS_ALLOW_PAID_CALLS=true`, and only
  with the owner's approval. Development/testing uses mock or imported audio.
  Cache every generated line; regenerate single lines only on request.
- Secrets live in `.env` (git-ignored). Never commit keys or print them.

## Content

- Audience-facing text is natural Thai unless configured otherwise. Use the
  bundled Noto Sans Thai (or an approved brand font). Keep text inside the
  9:16 safe area (`SAFE_AREA_9_16`) and do not overcrowd the frame.
- Background music stays below dialogue (ducking). Only original or properly
  licensed audio.

## Useful commands

```
npm run doctor                 # environment check
npm run studio                 # Remotion Studio preview
npm run render:test:draft      # 360×640 draft
npm run render:test            # 1080×1920 final
node scripts/render.mjs Episode --episode=src/episodes/<id>.episode.json --quality=preview
node scripts/plan-shot.mjs '<json>'   # numeric camera framing
npm run manifest               # regenerate docs/asset-manifest.md
npm test && npm run typecheck
```

On Linux/CI without a GPU set `RENDER_GL=swangle`; if Remotion cannot download
its browser, set `BROWSER_EXECUTABLE` to a Chrome Headless Shell binary.

## Approved reusable assets & capabilities

_(Nothing has visual approval yet. Full register: `docs/asset-manifest.md`.)_

| ID | Type | Status |
|---|---|---|
| `temp-engineer` | character | temporary placeholder |
| `modern-thai-house` | environment | prototype (pending house reference) |
| `golden-hour`, `bright-morning`, `midday-sun`, `evening`, `power-outage` | lighting | prototype |
| `establishing-wide`, `slow-dolly-in`, `slow-dolly-out`, `orbit-equipment`, `medium-character` | camera | prototype |
| `idle-breathing`, `wave`, `point`, `talk`, `explain`, `nod`, `smile` | animation clips | prototype |
| solar panel/array, inverter, meter, battery | equipment | prototype |
