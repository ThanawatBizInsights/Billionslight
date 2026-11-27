# Phase 2 — approved design decisions (owner, 2026-11-27)

These decisions are approved and binding. The 3D prototypes built from them
still need **visual approval** before the asset library is expanded.

## 1. Main homeowner — Ton (ต้น), `homeowner_male_01`
- Board 01 is authoritative (§02 turnaround, §07 expressions, §08 poses).
- Cream short-sleeved shirt, navy trousers, white casual shoes, dark-brown
  geometric hair, warm skin tone, friendly Thai adult male, simple expressive
  low-poly face.
- Ordinary homeowner interested in solar, no specialist electrical knowledge.
  Curious, friendly, occasionally humorous, relatable. Identity, clothing and
  proportions stay consistent across all episodes.

## 2. Scene colours
- Board 01 is the primary cinematic colour direction: deep navy `#0F2747`,
  solar yellow `#FBBF24`.
- Warm amber light, muted blue shadows, natural wood, cream interiors, subtle
  tropical greenery. Daytime scenes use natural architectural colours, so not
  every environment is predominantly navy.
- These are art-direction colours. The official logo keeps its own colours.

## 3. Sunny — tail and geometry
- Soft faceted low-poly tail with the large, curved, bushy squirrel silhouette:
  no fur strands, no cube-shaped tail.
- The original character sheet remains the identity authority: golden-orange
  fur, cream cheeks and muzzle, large purple eyes, pink inner ears, small brown
  nose, friendly expressions, white hard hat, navy and bright-blue engineering
  uniform, yellow details, sun emblem on the chest, navy safety boots.
- Simplified for efficient rendering without changing species, personality or
  recognisable appearance.
- The solar panel and tablet are **removable props**, never part of the hands.

## 4. Hard hat
- Pure white base material, never pink. Natural warm or cool reflections from
  lighting are fine. The shape keeps its structural ridges and its relationship
  to Sunny's ears.

## 5. Character scope
- Phase 2: **Sunny** (Billionslight solar & electrical guide) and **Ton**.
- Reserved: **May (เมย์)**, `homeowner_female_01`, a female homeowner focused
  on household consumption, family needs, costs and purchasing decisions.
- Additional squirrel teammates: **not approved**; do not develop them.
- The character system stays extensible (body plans + shared rig).

## 6. Electrical equipment location
- Default storytelling location: a dedicated equipment area in the garage or
  adjacent service area, with rooftop PV, a wall-mounted inverter, an optional
  battery, a distribution board, an optional EV charger and the utility meter
  in a separate accessible location.
- Modular assets that also work on an exterior service wall, in an equipment
  room or in the demo studio.
- The garage is a storytelling location, not a universal installation
  recommendation. Real placement follows manufacturer requirements, standards,
  ventilation, clearances and professional installation guidance.
- Batteries are not included in every configuration. On-grid and hybrid
  configurations are separate.

## 7. Official logo
- Only the supplied original logo, never the AI-generated marks on the boards.
- Full logo for openings, closings and large placements. A tagline-free logo
  for small placements only if an approved version exists; otherwise use the
  full logo at a suitable size or omit the placement. Never remove the tagline,
  redraw the logo or change its typography.

## 8. Heights and proportions
- Sunny **1.35 m** including the hard hat; Ton **1.70 m**; Sunny ≈ 79% of Ton.
- Sunny: mascot proportions (large head, compact body, short limbs, large eyes,
  large tail), never a child in a squirrel costume.
- Ton: stylized adult proportions, not realistic anatomy.
- Consistent scale against furniture, doors, appliances and equipment.

## 9. Visual style
- One cinematic low-poly world: soft geometric forms, visible but controlled
  facets, matte materials, warm practical lighting, cinematic shadows,
  expressive poses, consistent scale.
- Avoid: photorealistic fur, excessively blocky voxel characters, unnecessary
  high-poly geometry, glossy plastic surfaces, inconsistent proportions, and
  mixing realistic environments with extremely simplified characters.
- The boards set the art direction; the approved character sheets win when
  they disagree.

## How the prototypes implement these decisions
| Decision | Implementation |
|---|---|
| Sunny identity | `src/engine/characters/SquirrelMascot.tsx`, colours in `library.ts` (`SUNNY`) |
| Ton identity | `src/engine/characters/StylizedHuman.tsx`, `library.ts` (`TON`) |
| Heights | `CharacterDefinition.heightM` + `NATURAL_HEIGHT` calibration in `CharacterModel.tsx`, checked on the scale-reference render |
| Removable props | `src/engine/props/Props.tsx` + `props` track on characters (episode schema) |
| Reserved May | `RESERVED_CHARACTER_IDS` in `library.ts`; manifest status `reserved` |
| Equipment modularity | `src/engine/equipment/Electrical.tsx`; garage options `system`, `battery`, `evCharger`, `car` |
| Logo rules | Not rendered in Phase 2 (no placements needed); rules in `CLAUDE.md` |
