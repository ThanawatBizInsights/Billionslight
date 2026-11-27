# CLAUDE.md — Billionslight Animation Studio project rules

These rules are persistent. Follow them in every session. Update this file
whenever a new reusable asset or capability is approved.

## Current phase

**Phase 1 — provisionally approved (2026-11-27).**
**Sunny's face: variant B ("Cinematic low-poly") APPROVED** (owner,
2026-11-27) and set as `SUNNY.defaultVariant`. Variants v1/A/C are kept for
comparison only; do not use them in episodes. Do not change the approved
face without permission (see `docs/sunny-eye-review.md`).
**Phase 2 — prototypes complete, AWAITING VISUAL APPROVAL** (review pack:
`docs/phase-2-report.md`, renders in `renders/phase-2-review/`). Do not start
Phase 3 and do not expand the asset library until the owner approves the
visuals. Approved design decisions: `docs/design-decisions-phase-2.md`.

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
- **Sunny** (`sunny`, face variant B approved): golden-orange squirrel mascot, 1.35 m incl. hard hat
  (≈79% of Ton). Large head, compact body, short limbs, large purple eyes,
  cream cheeks/muzzle, pink inner ears, small brown nose, soft faceted bushy
  tail, PURE WHITE ridged hard hat between the ears, navy + bright-blue
  uniform with yellow details and a sun emblem, navy safety boots. Never a
  child in a costume. Tablet / solar panel are removable props.
- **Ton (ต้น)** (`homeowner_male_01`): board 01 is authoritative. 1.70 m,
  stylized adult proportions, cream short-sleeved shirt, navy trousers, white
  casual shoes, dark-brown geometric hair, warm skin tone. Curious, friendly,
  occasionally humorous; represents the audience.
- **May (เมย์)** `homeowner_female_01` is RESERVED (not built). Additional
  squirrel teammates are NOT approved — do not develop or introduce them.
- Art direction: board 01 — deep navy `#0F2747`, solar yellow `#FBBF24`, warm
  amber light, muted blue shadows, wood, cream interiors, subtle greenery;
  natural architectural colours in daytime (not everything navy).
- Style: one cinematic low-poly world — soft facets, matte materials, warm
  practical light. Avoid photoreal fur, voxel-blocky characters, glossy
  plastic, high-poly geometry, inconsistent proportions.
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
- Logo placement: full official logo for openings/closings/large placements;
  a tagline-free version only if an approved one exists, otherwise use the
  full logo at a suitable size or omit. Never remove the tagline or redraw.
- Equipment: the garage/service area is the default STORYTELLING location,
  not an installation recommendation. Batteries are optional, never default;
  on-grid and hybrid are separate configurations.

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
  Phase 2 tests are silent (or temporary audio).
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

## Engine capabilities (Phase 2)

- Body plans on one shared rig: `squirrel-mascot` (ears + 5-joint tail),
  `stylized-human`. Height calibrated per plan (`NATURAL_HEIGHT`).
- Expression presets (`expressions.ts`) on a per-character `expression`
  track; clips layer on top. Eyelids close fully (blink, wink, laugh).
- Clips receive body dimensions (e.g. `sit` works for both characters);
  gestures mirror with `params.hand`.
- `props` track attaches removable props to joints for a time range.
- Camera keyframes with `easing: "hold"` are exact-frame hard cuts.
- `environment.states` animates environment values (power, lights, tv, ac);
  `lighting.transitions` blends presets (e.g. evening → power-outage).
- Environments may compute cable routes from options (garage on-grid/hybrid).
- Sunny face variants: `CharacterDefinition.defaultVariant` (= "B",
  approved) + per-cast `variant` override ("v1" | "A" | "B" | "C" — review only). New face lives in
  `src/engine/characters/sunny/` (head geometry, SunnyEye, iris texture).
  Eye review pack: `node scripts/review/build-sunny-eye-review.mjs`.
- Review pipeline: `node scripts/review/build-review-episodes.mjs` →
  `node scripts/render-stills.mjs renders/phase-2-review/stills-plan.json` →
  `python3 scripts/review/contact_sheet.py` (optional, Pillow).
- Plan camera framing numerically with `scripts/plan-shot.mjs` (remember it
  ignores character facing — check which way characters look).

## Approved reusable assets & capabilities

Approved (owner decisions): `scene-palette` (board 01 colours), character
design decisions in `docs/design-decisions-phase-2.md`, Sunny face variant B. All 3D assets below
are PROTOTYPES awaiting visual approval. Full register: `docs/asset-manifest.md`.

| ID | Type | Status |
|---|---|---|
| `sunny`, `homeowner_male_01` | characters | awaiting visual approval |
| `homeowner_female_01` | character | reserved |
| `temp-engineer` | character | superseded (Phase 1 test only) |
| `modern-thai-house`, `living-room`, `garage-service-area` | environments | awaiting visual approval |
| `gable-house-prototype` | environment | superseded (Phase 1 test only) |
| `review-studio` | environment | internal review set |
| `midday-sun`, `golden-hour`, `evening`, `night`, `power-outage` | lighting | awaiting visual approval |
| on-grid/hybrid inverter, battery stack, distribution board, EV charger, EV, utility meter, socket, switch | equipment | awaiting visual approval |
| `tablet`, `demo-solar-panel`, `coffee-mug` | props | awaiting visual approval |
| 20 animation clips, 11 expression presets | animation | awaiting visual approval |
