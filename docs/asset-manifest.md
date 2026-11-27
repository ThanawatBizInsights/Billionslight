# Asset manifest

_Generated from `src/assets/asset-manifest.json` by `node scripts/manifest-report.mjs` — edit the JSON, not this file._

Updated: 2026-11-27 · 72 assets · reference files live (git-ignored) under `public/assets/references/drive/`.

| Status | Count |
|---|---|
| awaiting-low-poly-adaptation | 1 |
| needs-owner-decision | 4 |
| reference-supplied | 54 |
| missing-reference | 9 |
| temporary | 1 |
| reference-only | 3 |

## character

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `sunny` | Sunny — Billionslight solar & electrical engineer (ซันนี่) | awaiting-low-poly-adaptation | procedural-creature-rig | 2 | 1.55 m (proposed) | 01-visual-reference-board.png §01 turnaround, §04 expressions, §05–06 key poses; 02-cinematic-reference-board.png §01 main, §04 expressions & poses; 06-production-reference-sheet.png hero, expressions, key animations; 03-cinematic-house-lighting-grid.png lighting grid — Sunny in every mood; 04-solar-composition-reference.png §02 two-character, §04 over-shoulder, §05 low-angle hero; three-squirrels-team.png centre character — highest-resolution face/uniform detail |
| `homeowner-male` | Homeowner (male) — the curious homeowner (เจ้าของบ้าน (ชาย)) | needs-owner-decision | procedural-humanoid-rig | 2 | 1.65 m (proposed) | 01-visual-reference-board.png §02 turnaround, §07 expressions, §08 key poses; 02-cinematic-reference-board.png §02; 06-production-reference-sheet.png hero; 04-solar-composition-reference.png §02, §03 close-up |
| `homeowner-female` | Homeowner (female) (เจ้าของบ้าน (หญิง)) | reference-supplied | procedural-humanoid-rig | 2 | 1.6 m (proposed) | 02-cinematic-reference-board.png §03 front/side/back |
| `technician` | Electrical technician (ช่างเทคนิค) | missing-reference | procedural-humanoid-rig | 3 |  | — |
| `squirrel-teammate-red` | Squirrel teammate (red-brown, brown eyes) | needs-owner-decision | procedural-creature-rig | 3 |  | three-squirrels-team.png side character holding acorn-shaped battery |
| `squirrel-teammate-grey` | Squirrel teammate (grey, green eyes) | needs-owner-decision | procedural-creature-rig | 3 |  | three-squirrels-team.png side character holding LED downlight |
| `temp-engineer` | Temporary engineer placeholder | temporary | procedural-humanoid-rig | 1 |  | — |

**`sunny`** — Authoritative identity. Do not redesign. Rig = shared humanoid joints + ear and 3–4 segment tail chains.
- Palette: fur `#DB9450` (sampled), fur-light `#F6AA50` (sampled), cream `#FDE6CD` (sampled), helmet `#F8F0F0` (sampled), uniform `#222C48` (sampled), uniform-panel `#2F7DE1` (estimated), trim `#B2803B` (sampled), badge `#F7B744` (sampled), iris `#6B3F8F` (estimated), inner-ear `#F4B6A8` (estimated), nose `#8A4A2A` (estimated)
- Animation: idle, walk, sit, talk, point, think, nod, surprised, confused, laugh, wave, hold-tablet, check-meter, look-upward, operate-switch, explain, hold-pv-panel, thumbs-up, arms-crossed, expr:neutral, expr:happy, expr:talk, expr:surprised, expr:thinking, expr:confused, expr:laughing, expr:wink, blink, eye-gaze, lip-sync, ear-flick, tail-sway, look-at
- ⚠ Owner will supply an approved low-poly adaptation; sheets are smooth/plush renders at ~110 px per turnaround view — too small for exact proportions. Need ≥2048 px front/side/back/¾ sheet.
- ⚠ Tail is faceted low-poly on board 01/06 but plush on board 02 and 'Three Squirrels' — confirm low-poly treatment.
- ⚠ Helmet tint varies (pure white vs. faint pink) across boards — confirm.
- ⚠ Hands: four-finger paws or mitten? Needed for tablet / switch / pointing poses.

**`homeowner-male`**
- Palette: skin `#F3C29C` (sampled), hair `#3A2A2C` (sampled), shirt `#EDE3D6` (sampled), trousers `#2B3352` (estimated), shoes `#F2F2F2` (estimated)
- Animation: idle, talk, listen, think, nod, confused, surprised, point, walk, sit, operate-switch, expr:neutral, expr:happy, expr:talk, expr:surprised, expr:thinking, expr:confused, expr:laughing, expr:concerned, blink, lip-sync, look-at
- ⚠ Three different outfits/hair across boards 01, 02 and 06 — choose one canonical design (recommend board 01: it is the only one with a full turnaround, expressions and poses).

**`homeowner-female`**
- Palette: shirt `#F2A7B5` (estimated), trousers `#5A5F6E` (estimated), hair `#4A3030` (estimated)
- Animation: idle, talk, listen, think, nod, walk, sit, blink, lip-sync, look-at
- ⚠ Only one board; no ¾ view, expressions or poses. Not in the original brief — confirm whether she is needed for Phase 2.

**`technician`**
- Animation: inspect-equipment, use-tester, walk, talk, point
- ⚠ No reference supplied. Needs PPE design (helmet, insulated gloves, safety glasses).

**`squirrel-teammate-red`**
- ⚠ Not mentioned in the brief: confirm name, role and whether this character is in scope.

**`squirrel-teammate-grey`**
- ⚠ Not mentioned in the brief: confirm name, role and whether this character is in scope.

**`temp-engineer`** — Phase 1 pipeline test only. Superseded once Sunny's prototype exists; never ship.
- Animation: idle, wave, point, talk, explain, nod, smile, blink, look-at
- Implementation: `src/engine/characters/library.ts`

## environment

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `modern-thai-house` | ENV01 Modern Thai solar house (บ้านโซลาร์) | reference-supplied | procedural-environment | 2 | 12×9 m (proposed) | 05-solar-house-environment-sheet.png ENV01 main; 01-visual-reference-board.png §09–12 exterior, angle, day/evening/night, cutaway; 02-cinematic-reference-board.png §05 exterior, §06 cutaway; 03-cinematic-house-lighting-grid.png all six lighting moods |
| `living-room` | ENV02 Living room (ห้องนั่งเล่น) | reference-supplied | procedural-environment | 2 | 6×5 m (proposed) | 02-cinematic-reference-board.png §07; 04-solar-composition-reference.png §09 living-room cutaway; 05-solar-house-environment-sheet.png other spaces — ENV02; 06-production-reference-sheet.png environments — living room |
| `dining-area` | ENV02B Dining area | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV02B |
| `bedroom` | ENV02C Bedroom | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV02C |
| `garage-ev` | ENV03 Garage — EV charger & battery | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV03 |
| `rooftop-solar` | ENV04 Rooftop solar installation | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV04; 04-solar-composition-reference.png §08 rooftop perspective |
| `equipment-room` | ENV05 Electrical equipment room | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV05; 04-solar-composition-reference.png §07 equipment macro |
| `neighbourhood-grid` | ENV06 Neighbourhood & utility grid | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV06; 06-production-reference-sheet.png neighbourhood / grid |
| `sunny-home-office` | ENV07 Sunny's home office | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV07 |
| `demo-studio` | Technical demonstration studio (dark navy) | reference-supplied | procedural-environment | 3 |  | 04-solar-composition-reference.png §10 centred product demonstration |

**`modern-thai-house`**
- Palette: concrete `#D9D6CF` (estimated), render-white `#F2EFE8` (estimated), window-frame `#2A2A2E` (estimated), interior-warm `#F59E0B` (sheet-swatch), pv-glass `#1E3A8A` (estimated), foliage `#4E8C3A` (estimated)
- Animation: day-night-cycle, interior-lights-on-off, cutaway, window-glow-by-power-state, energy-cable-anchors
- Implementation: `src/engine/environments/ModernThaiHouse.tsx`
- ⚠ Existing Phase 1 prototype (gable roof) does NOT match the reference (flat-roof modern block with terrace). It will be rebuilt; the old one is kept only until then.
- ⚠ No outdoor meter / inverter location shown on the exterior — confirm placement (side wall vs. garage ENV03 / room ENV05).

**`living-room`**
- Palette: wall `#3B3550` (estimated), sofa `#D8C8C0` (estimated), cushion-accent `#E0A63A` (estimated), floor-wood `#8A5A3C` (estimated), rug `#BDB6B0` (estimated), lamp-glow `#F59E0B` (sheet-swatch)
- Animation: day, evening, power-outage, backup-loads-only, ac-on-off, tv-on-off, lamp-on-off, ceiling-lights
- ⚠ Need: socket positions, window/garden view, whether AC wall unit is always on the left wall.

**`demo-studio`**
- ⚠ Only one composition reference; acceptable as a guide.

## equipment

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `pv-panel` | PV module | reference-supplied | procedural-mesh | 2 | 1.7 m (real-world-typical) | 02-cinematic-reference-board.png §08; 06-production-reference-sheet.png equipment library |
| `on-grid-inverter` | On-grid (grid-tied) inverter | reference-supplied | procedural-mesh | 2 | 0.5 m (real-world-typical) | 02-cinematic-reference-board.png §08; 06-production-reference-sheet.png equipment library |
| `hybrid-inverter` | Hybrid inverter | reference-supplied | procedural-mesh | 2 | 0.6 m (real-world-typical) | 02-cinematic-reference-board.png §08; 04-solar-composition-reference.png §10; 06-production-reference-sheet.png equipment library |
| `battery-storage` | Battery storage (Li-ion) | reference-supplied | procedural-mesh | 2 | 1.1 m (real-world-typical) | 02-cinematic-reference-board.png §08; 06-production-reference-sheet.png equipment library; vendor-stacked-battery.webp |
| `electricity-meter` | Electricity meter | reference-supplied | procedural-mesh | 2 | 0.3 m (real-world-typical) | 02-cinematic-reference-board.png §08; 06-production-reference-sheet.png equipment library; vendor-energy-meter.webp |
| `distribution-board` | Distribution board | reference-supplied | procedural-mesh | 2 | 0.6 m (real-world-typical) | 02-cinematic-reference-board.png §08; 05-solar-house-environment-sheet.png ENV05; 06-production-reference-sheet.png equipment library |
| `circuit-breaker` | Circuit breaker | missing-reference | procedural-mesh | 3 | 0.1 m (real-world-typical) | — |
| `rcd` | Residual current device (RCD/RCBO) | missing-reference | procedural-mesh | 3 | 0.1 m (real-world-typical) | — |
| `utility-pole` | Utility pole | reference-supplied | procedural-mesh | 3 | 9 m (real-world-typical) | 02-cinematic-reference-board.png §08; 05-solar-house-environment-sheet.png ENV06 |
| `transformer` | Pole-mounted transformer | reference-supplied | procedural-mesh | 3 | 1 m (real-world-typical) | 05-solar-house-environment-sheet.png ENV06 label |
| `ev-charger` | EV charger (wallbox) | reference-supplied | procedural-mesh | 3 | 0.5 m (real-world-typical) | 02-cinematic-reference-board.png §08; 05-solar-house-environment-sheet.png ENV03 |
| `electric-vehicle` | Electric vehicle | reference-supplied | procedural-mesh | 3 | 1.5 m (real-world-typical) | 02-cinematic-reference-board.png §08; 05-solar-house-environment-sheet.png ENV03 |
| `microinverter` | Microinverter | reference-supplied | procedural-mesh | 3 | 0.25 m (real-world-typical) | vendor-microinverter.webp |
| `cables` | Electrical cables / conduit routes | reference-supplied | procedural-mesh | 3 |  | 05-solar-house-environment-sheet.png ENV05 |

**`pv-panel`**
- Animation: generation-sheen, irradiance-driven
- Implementation: `src/engine/equipment/Solar.tsx`
- ⚠ Phase 1 prototype exists but must be restyled to match boards 02/06 (rounded matte housing, small dark display).

**`on-grid-inverter`**
- Palette: housing `#EEF0F3` (estimated), indicator-ok `#3DDC84` (estimated)
- Animation: status-led, output-bars, anti-islanding-off
- Implementation: `src/engine/equipment/Solar.tsx`
- ⚠ Phase 1 prototype exists but must be restyled to match boards 02/06 (rounded matte housing, small dark display).

**`hybrid-inverter`**
- Palette: housing `#EEF0F3` (estimated), indicator-ok `#3DDC84` (estimated)
- Animation: status-led, backup-mode, output-bars
- Implementation: `src/engine/equipment/Solar.tsx`
- ⚠ Phase 1 prototype exists but must be restyled to match boards 02/06 (rounded matte housing, small dark display).

**`battery-storage`**
- Animation: state-of-charge-bars, charge-discharge-glow
- Implementation: `src/engine/equipment/Solar.tsx`
- ⚠ Phase 1 prototype exists but must be restyled to match boards 02/06 (rounded matte housing, small dark display).

**`electricity-meter`**
- Animation: import-export-indicator, display
- Implementation: `src/engine/equipment/Solar.tsx`
- ⚠ Phase 1 prototype exists but must be restyled to match boards 02/06 (rounded matte housing, small dark display).

**`distribution-board`**
- Animation: breaker-states, door-open

**`circuit-breaker`**
- Animation: on-off-toggle, trip
- ⚠ No reference supplied.

**`rcd`**
- Animation: test-button, trip
- ⚠ No reference supplied.

**`utility-pole`**
- Animation: line-energised-state

**`transformer`**
- Animation: energised-state

**`ev-charger`**
- Animation: charging-led, cable

**`electric-vehicle`**
- Animation: charging-port-glow

**`microinverter`**
- Palette: housing `#EEF0F3` (estimated), indicator-ok `#3DDC84` (estimated)
- Animation: status-led

**`cables`**
- Animation: energy-flow-particles
- Implementation: `src/engine/energy-flow/EnergyPath.tsx`

## appliance

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `air-conditioner` | Air conditioner (wall split) | reference-supplied | procedural-mesh | 2 |  | 02-cinematic-reference-board.png §09 |
| `refrigerator` | Refrigerator | reference-supplied | procedural-mesh | 3 |  | 02-cinematic-reference-board.png §09 |
| `television` | Television | reference-supplied | procedural-mesh | 2 |  | 02-cinematic-reference-board.png §09 |
| `washing-machine` | Washing machine | reference-supplied | procedural-mesh | 3 |  | 02-cinematic-reference-board.png §09 |
| `standing-fan` | Standing fan | reference-supplied | procedural-mesh | 3 |  | 02-cinematic-reference-board.png §09 |
| `rice-cooker` | Rice cooker | reference-supplied | procedural-mesh | 3 |  | 02-cinematic-reference-board.png §09 |
| `light-bulb` | Light bulb | reference-supplied | procedural-mesh | 2 |  | 02-cinematic-reference-board.png §09 |
| `laptop` | Laptop / computer | reference-supplied | procedural-mesh | 3 |  | 02-cinematic-reference-board.png §09 |
| `floor-lamp` | Floor lamp | reference-supplied | procedural-mesh | 2 |  | 02-cinematic-reference-board.png §07 living room |
| `ceiling-light` | Ceiling light | reference-supplied | procedural-mesh | 2 |  | 02-cinematic-reference-board.png §07 living room |
| `socket` | Household socket | missing-reference | procedural-mesh | 3 |  | — |

**`air-conditioner`**
- Animation: on-off-state, power-indicator

**`refrigerator`**
- Animation: on-off-state, power-indicator

**`television`**
- Animation: on-off-state, power-indicator

**`washing-machine`**
- Animation: on-off-state, power-indicator

**`standing-fan`**
- Animation: on-off-state, power-indicator

**`rice-cooker`**
- Animation: on-off-state, power-indicator

**`light-bulb`**
- Animation: on-off-state, power-indicator

**`laptop`**
- Animation: on-off-state, power-indicator

**`floor-lamp`**
- Animation: on-off-state, power-indicator

**`ceiling-light`**
- Animation: on-off-state, power-indicator

**`socket`**
- Animation: on-off-state, power-indicator
- ⚠ No reference supplied.

## lighting-preset

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `bright-morning` | Morning (เช้า) | reference-supplied | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Morning; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `midday-sun` | Midday (กลางวัน) | reference-supplied | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Midday; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `cloudy-rainy` | Cloudy / rainy (ครึ้ม / ฝนตก) | reference-supplied | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Cloudy / rainy; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `golden-hour` | Golden hour (เย็น (แสงทอง)) | reference-supplied | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Golden hour; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `night` | Night (กลางคืน) | reference-supplied | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Night; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `power-outage` | Power outage (ไฟดับ) | reference-supplied | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Power outage; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `evening` | Evening (ค่ำ) | reference-supplied | data-preset | 2 |  | 01-visual-reference-board.png §11 day / evening / night |
| `emergency-backup` | Emergency backup lighting | missing-reference | data-preset | 3 |  | — |
| `demo-studio-light` | Technical demonstration studio lighting | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §10 |

**`bright-morning`** — Soft warm light, long shadows, fresh & calm
- Palette: key `#FFD166` (sheet-swatch)
- Implementation: `src/engine/lighting/presets.ts`
- ⚠ Phase 1 preset exists but is not yet tuned to board 03.

**`midday-sun`** — Bright, high contrast, energetic
- Palette: key `#FFD166` (sheet-swatch)
- Implementation: `src/engine/lighting/presets.ts`
- ⚠ Phase 1 preset exists but is not yet tuned to board 03.

**`cloudy-rainy`** — Soft diffused, cooler, rain atmosphere
- Palette: key `#64748B` (sheet-swatch)

**`golden-hour`** — Warm golden light, rich colour, atmospheric
- Palette: key `#F59E0B` (sheet-swatch)
- Implementation: `src/engine/lighting/presets.ts`
- ⚠ Phase 1 preset exists but is not yet tuned to board 03.

**`night`** — Warm interior light, deep blue shadows
- Palette: key `#0F1B3D` (sheet-swatch)

**`power-outage`** — No interior light, cool moonlight, dark & quiet
- Palette: key `#3B82F6` (sheet-swatch)
- Implementation: `src/engine/lighting/presets.ts`
- ⚠ Phase 1 preset exists but is not yet tuned to board 03.

**`evening`**
- Implementation: `src/engine/lighting/presets.ts`
- ⚠ Phase 1 preset exists but is not yet tuned to board 01 §11.

**`emergency-backup`**
- ⚠ Not on board 03 — proposal: power-outage + warm light only on backup circuits.

## camera-preset

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `establishing-wide` | Wide establishing | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §01 |
| `medium-two-character` | Medium two-character conversation | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §02 |
| `medium-character` | Medium single-character shot | reference-supplied | data-preset | 3 |  | 02-cinematic-reference-board.png §12 medium (dialogue) |
| `close-up` | Close-up facial reaction | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §03 |
| `over-the-shoulder` | Over-the-shoulder explanation | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §04 |
| `low-angle-hero` | Low-angle hero (Sunny) | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §05 |
| `top-down-energy-flow` | Top-down / isometric energy-flow view | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §06 |
| `equipment-macro` | Equipment macro / close-up | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §07 |
| `rooftop-perspective` | Rooftop perspective | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §08 |
| `interior-cutaway` | Living-room / interior cutaway | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §09 |
| `product-demo` | Centred product demonstration | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §10 |
| `slow-dolly-in` | Slow dolly-in | missing-reference | data-preset | 3 |  | — |
| `slow-dolly-out` | Slow dolly-out | missing-reference | data-preset | 3 |  | — |
| `orbit-equipment` | Orbit around equipment | missing-reference | data-preset | 3 |  | — |
| `tracking` | Tracking shot | missing-reference | data-preset | 3 |  | — |

**`slow-dolly-in`** — Camera move; no image reference required.
- Implementation: `src/engine/cameras/presets.ts`

**`slow-dolly-out`** — Camera move; no image reference required.
- Implementation: `src/engine/cameras/presets.ts`

**`orbit-equipment`** — Camera move; no image reference required.
- Implementation: `src/engine/cameras/presets.ts`

**`tracking`** — Camera move; no image reference required.

## branding

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `billionslight-logo` | Official Billionslight logo (horizontal & stacked) (แสงพันล้าน) | reference-supplied | 2d-overlay | 5 |  | billionslight-logo-horizontal.png transparent PNG 1028×283; billionslight-logo-stacked.png transparent PNG 663×645 |
| `partner-brand-logos` | Third-party brand logos (distributed brands) | reference-only | none | 1 |  | ; fb-cover.png |

**`billionslight-logo`**
- Palette: orange `#FF5E1F` (official), blue `#1B28CE` (official), navy `#21409A` (official)
- Animation: fade-in, uniform-scale-in
- ⚠ Master files (final.ai / final.pdf) not yet inspected — confirm exact brand colours and clear-space rules from them.
- ⚠ The reference boards use a different sun/arc 'BILLIONSLIGHT' header mark — that is NOT the official logo and will not be used.
- ⚠ Tagline 'จำหน่ายอุปกรณ์ ไฟฟ้า ครบวงจร' is part of the lock-up — confirm whether a version without the tagline exists for video.

**`partner-brand-logos`**
- ⚠ Trademarks of other companies. Must not appear in animations unless the owner confirms permission for a specific use.

## visual-language

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `energy-flow-language` | Energy-flow visual language | reference-supplied | 2d-overlay | 3 |  | 02-cinematic-reference-board.png §11; 06-production-reference-sheet.png energy-flow visual language; 04-solar-composition-reference.png §06 |
| `scene-palette` | Global scene & UI palette | needs-owner-decision | data-preset | 2 |  | 01-visual-reference-board.png §03; 06-production-reference-sheet.png colour & material palette; 03-cinematic-house-lighting-grid.png lighting palette |

**`energy-flow-language`**
- Palette: solar `#FFC53D` (sheet-swatch), grid `#4DA3FF` (sheet-swatch), battery `#3DDC84` (sheet-swatch), load `#F5F7FF` (sheet-swatch), inactive `#6B7280` (sheet-swatch), fault `#FF4D4F` (sheet-swatch)
- Implementation: `src/engine/energy-flow`
- ⚠ Board 06 'Grid Outage + Backup' lights the whole house; the engine will show only the selected backup loads (technically required).
- ⚠ Board 04 §10 checklist 'มีไฟสำรอง' next to a hybrid inverter must be conditional on backup configuration in any episode.

**`scene-palette`**
- Palette: navy-b01 `#0F2747` (sheet-swatch), yellow-b01 `#FBBF24` (sheet-swatch), navy-b06 `#0B1B3B` (sheet-swatch), yellow-b06 `#FFC107` (sheet-swatch), sunlight `#FFD166` (sheet-swatch), interior-warm `#F59E0B` (sheet-swatch), night-shadow `#0F1B3D` (sheet-swatch), moonlight `#3B82F6` (sheet-swatch), cloud `#64748B` (sheet-swatch), ambient-fill `#E2E8F0` (sheet-swatch)
- ⚠ Boards 01 and 06 give different navy (#0F2747 vs #0B1B3B) and yellow (#FBBF24 vs #FFC107). Pick one pair.
- ⚠ These illustration colours differ from the official logo colours (orange #FF5E1F / blue #1B28CE). Confirm the video-world palette may differ from the logo palette.

## prop

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `supplier-flyers` | Supplier promotional flyers (5 kW / 10 kW packages) | reference-only | none | 1 |  | supplier-flyer-5kw.jpg; supplier-flyer-10kw.jpg |
| `vendor-product-photos` | Vendor product photos (microinverter, battery, meter, accessories) | reference-only | none | 2 |  | vendor-microinverter.webp; vendor-stacked-battery.webp; vendor-energy-meter.webp; vendor-accessories.webp |

**`supplier-flyers`**
- ⚠ Third-party marketing with prices, savings and payback claims. Not a technical source — never use its figures in episodes without independent verification and owner approval.

**`vendor-product-photos`** — Shape references for generic models only. No vendor names, logos or exact product likeness in renders.
