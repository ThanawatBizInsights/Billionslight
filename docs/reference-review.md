# Reference review — Google Drive visual library (2026-11-27)

Every file in the shared folder was inspected. Local copies live in
`public/assets/references/drive/` (git-ignored). **This GitHub repository is
public**, so reference images, logo files, vendor material and Drive file IDs
are deliberately not committed. The asset manifest records each one by
local path and title (`src/assets/asset-manifest.json`, readable view in
`docs/asset-manifest.md`).

## What was supplied

| Folder | Content | Use |
|---|---|---|
| Character Sheet references | 6 boards (1536×1024): visual reference, cinematic reference, lighting grid, camera/composition, environment sheet, production reference | Primary design references |
| Solar | "Three Squirrels" (1254 px, Sunny + 2 unnamed squirrel teammates) | Highest-detail Sunny face/uniform reference |
| Solar / SGT Solar Cell | 2 supplier promo flyers (prices, savings, payback), 2 Midea ESS catalogues (PDF, not yet read) | Reference only, not a source of truth |
| Solar / vaysunic | Vendor product photos (microinverter, stacked battery, energy meter, accessories) + a quotation PDF | Shape reference only; **quotation deliberately not opened** (may hold customer/pricing data) |
| Logo | Official logo, transparent PNG ×2, plus final.ai / final.pdf / final.jpg masters | Official branding |
| Social Media, folder root | FB cover, 9 logos of distributed brands (Panasonic, Mitsubishi Electric, Schneider Electric, BCC, Chang, Yazaki, Vena, Wellux, Bio Energys) | Third-party trademarks, not for animation |
| Products | Empty | — |

## Key findings

1. **Sunny is an orange squirrel mascot**: white hard hat, navy coverall
   with bright-blue shoulder panels, gold piping and zip, a yellow sun badge
   on the chest, large violet eyes, cream muzzle and belly, pink inner ears
   and a large bushy tail. Boards 01 and 06 already show a semi-low-poly
   treatment (faceted tail and helmet). The Phase 1 `temp-engineer` has no
   relationship to this design and will be retired.
2. **Homeowner (male)** uses a blocky, voxel-like style: cube head, faceted
   hair, simple dot eyes. Each board shows a different outfit (see decisions).
3. **House (ENV01)** is a modern flat-roof, two-storey concrete/stone block
   with a cantilevered upper floor, terrace planters, full-height glazing, front
   steps and a tilted PV array on the flat roof. The Phase 1 gable-roof
   prototype does not match it and will be rebuilt.
4. **Resolution is the main blocker.** Turnaround views are about 110 px wide
   on the boards, which is enough for identity, colour and proportions but not
   for precise modelling. The promised approved low-poly adaptation should
   include large orthographic views.
5. The boards' header mark (a sun/arc "BILLIONSLIGHT") is **not** the official
   logo. Only the files in the Logo folder will be used.
6. Official logo colours, measured from the PNG: orange `#FF5E1F`, blue
   `#1B28CE`, navy `#21409A`. They differ from the illustration palette on the
   boards (navy plus warm yellow).

## Decisions needed from the owner

| # | Question | Recommendation |
|---|---|---|
| D1 | Which homeowner (male) design is canonical? A (board 01: cream shirt, navy trousers), B (board 02: blue-grey shirt), C (board 06: tan overshirt) | **A**: the only one with full turnaround, expressions and poses |
| D2 | Scene palette: board 01 (`#0F2747` / `#FBBF24`) or board 06 (`#0B1B3B` / `#FFC107`)? | Board 01 (matches the character sheet) |
| D3 | Sunny's tail: faceted low-poly (boards 01/06) or plush (board 02, Three Squirrels)? | Faceted, which fits the low-poly brief |
| D4 | Hard hat: pure white or faint pink tint? | Pure white |
| D5 | Are the female homeowner and the two squirrel teammates in scope? Names and roles? | Defer to Phase 3 |
| D6 | Where are the meter, inverter and battery on the house: side wall, garage (ENV03) or equipment room (ENV05)? | Garage/equipment room for interiors, side wall for exterior shots |
| D7 | Logo in video: with or without the Thai tagline "จำหน่ายอุปกรณ์ ไฟฟ้า ครบวงจร"? | Need a no-tagline version for small placements |
| D8 | Proposed scale: Sunny 1.55 m including helmet, homeowner 1.65 m | Confirm |

## Technical-accuracy flags on the boards

- Board 06 "Grid Outage + Backup" lights the whole house. In the engine only
  the **selected backup loads** are powered (see `docs/electrical-accuracy.md`).
- Board 04 §10 shows a checklist item "มีไฟสำรอง" next to a hybrid inverter.
  Any episode must make backup conditional on equipment and configuration.
- The supplier flyers contain prices, savings and payback figures. None of
  these will be used without independent verification and owner approval.

## Essential sheets that unlock Phase 2

| Needed | Status |
|---|---|
| Sunny approved low-poly adaptation: front/side/back/¾, ≥2048 px, plus a hand/paw close-up | ⏳ promised |
| Homeowner (male) canonical sheet (D1), same views | ⏳ |
| House exterior (any resolution ≥2048 px) and a plan/elevation sketch with rough dimensions | ⏳ (boards suffice for a first prototype) |
| Living room interior reference ≥2048 px | ⏳ (board 02 §07 suffices for a first prototype) |
| Electrical equipment sheet (inverter, battery, meter, DB) | ✅ boards 02/06 are sufficient for prototypes |
| Lighting references | ✅ board 03 |
| Official logo | ✅ (master .ai/.pdf to confirm colours) |

## Phase 2 plan once the essential sheets arrive (not started)

1. Inspect the approved references and update the manifest.
2. Build procedural prototypes: Sunny (creature rig with ears and tail chain),
   homeowner, ENV01 house (rebuild), ENV02 living room, restyled equipment.
3. Render front, side, rear and ¾ identity sheets per character.
4. Render cinematic environment previews (exterior day/golden/night, living
   room day/evening/outage).
5. 10-second living-room test: Sunny and the homeowner interact, with gestures,
   at least two camera cuts, expression changes and a lighting change
   (e.g. evening → power outage).
6. Measure render performance (draft/final) and log it.
7. Stop for visual approval. No ElevenLabs credits are used (silent/mock audio).
