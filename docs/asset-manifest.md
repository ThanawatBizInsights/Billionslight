# Asset manifest

_Generated from `src/assets/asset-manifest.json` by `node scripts/manifest-report.mjs` — edit the JSON, not this file._

Updated: 2026-11-27 · 142 assets · reference files live (git-ignored) under `public/assets/references/drive/`.

| Status | Count |
|---|---|
| approved | 92 |
| reserved | 1 |
| missing-reference | 8 |
| deferred | 2 |
| superseded | 2 |
| reference-supplied | 32 |
| reference-only | 3 |
| in-progress | 2 |

## character

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `sunny` | Sunny — Billionslight solar & electrical engineer (ซันนี่) | approved | procedural-creature-rig | 2 | 1.35 m (owner-approved) | 01-visual-reference-board.png §01 turnaround, §04 expressions, §05–06 key poses; 02-cinematic-reference-board.png §01 main, §04 expressions & poses; 06-production-reference-sheet.png hero, expressions, key animations; 03-cinematic-house-lighting-grid.png lighting grid — Sunny in every mood; 04-solar-composition-reference.png §02 two-character, §04 over-shoulder, §05 low-angle hero; three-squirrels-team.png centre character — highest-resolution face/uniform detail |
| `homeowner_male_01` | Ton (ต้น) — main male homeowner (ต้น) | approved | procedural-humanoid-rig | 2 | 1.7 m (owner-approved) | 01-visual-reference-board.png §02 turnaround, §07 expressions, §08 key poses (authoritative) |
| `homeowner_female_01` | May (เมย์) — female homeowner (reserved) (เมย์) | reserved | procedural-humanoid-rig | 2 | 1.6 m (proposed) | 02-cinematic-reference-board.png §03 front/side/back |
| `technician` | Electrical technician (ช่างเทคนิค) | missing-reference | procedural-humanoid-rig | 3 |  | — |
| `squirrel-teammate-red` | Squirrel teammate (red-brown, brown eyes) | deferred | procedural-creature-rig | 3 |  | three-squirrels-team.png side character holding acorn-shaped battery |
| `squirrel-teammate-grey` | Squirrel teammate (grey, green eyes) | deferred | procedural-creature-rig | 3 |  | three-squirrels-team.png side character holding LED downlight |
| `temp-engineer` | Temporary engineer placeholder | superseded | procedural-humanoid-rig | 1 |  | — |
| `sunny-face-b` | Sunny face — variant B (Cinematic low-poly) | approved | procedural-creature-rig | 2 |  | 01-visual-reference-board.png §01/§04 Sunny face; three-squirrels-team.png centre character |

**`sunny`** — Authoritative identity from the original character sheet. Soft faceted low-poly; tail = 5-joint chain; removable props (tablet, demo solar panel); pure-white hard hat with ridges between the ears. Face variants: v1 (Phase 2 prototype, not approved), A/B/C (SunnyFace: soft-faceted head with cream facial region, SunnyEye with curved iris texture, surface catchlights, eyelids). Default face: variant B (approved). v1/A/C kept for comparison only.
- Palette: fur `#E8913A` (prototype), fur-light `#F4AA55` (prototype), cream `#FDE6CD` (sampled), helmet `#F6F4F2` (owner-approved), uniform `#1F2A4A` (prototype), uniform-panel `#2F7DE1` (prototype), trim `#E0A93B` (prototype), badge `#FBBF24` (owner-approved), iris `#7A4BA8` (prototype), inner-ear `#F4B6A8` (prototype), nose `#7A4127` (prototype), boot `#1A2238` (prototype), eye-sclera `#FFF4E8` (owner-approved), eye-iris `#8050A1` (owner-approved), eye-iris-highlight `#B68AC8` (owner-approved), eye-pupil `#302039` (owner-approved), eye-upper-lid `#59382D` (owner-approved)
- Animation: idle-breathing, wave, point, talk, explain, open-hands, nod, shake-head, listen, think, surprised, laugh, thumbs-up, hold-tablet, present-prop, look-upward, lean-in, sit, shrug, ear-flick, tail-sway, blink, eye-gaze, look-at, expr:neutral, expr:happy, expr:talk, expr:surprised, expr:thinking, expr:confused, expr:laughing, expr:wink, expr:concerned, expr:listening, expr:curious, walk (Phase 3)
- Implementation: `src/engine/characters/sunny`

**`homeowner_male_01`** — Curious, friendly, occasionally humorous; asks practical questions. Cream short-sleeved shirt, navy trousers, white casual shoes, dark-brown geometric hair, warm skin tone.
- Palette: skin `#E9B48A` (prototype), hair `#3B2A24` (prototype), shirt `#EFE6D6` (prototype), trousers `#1F2D52` (prototype), shoes `#F4F4F2` (prototype), belt `#3A2E26` (prototype)
- Animation: idle-breathing, wave, point, talk, explain, open-hands, nod, shake-head, listen, think, surprised, laugh, thumbs-up, hold-tablet, present-prop, look-upward, lean-in, sit, shrug, blink, eye-gaze, look-at, expr:neutral, expr:happy, expr:talk, expr:surprised, expr:thinking, expr:confused, expr:laughing, expr:concerned, expr:listening, expr:curious, walk (Phase 3)
- Implementation: `src/engine/characters/StylizedHuman.tsx`

**`homeowner_female_01`** — Reserved ID. Focus: household energy use, family needs, electricity costs, purchasing decisions. Not built in Phase 2; uses the stylized-human body plan when approved.
- Palette: shirt `#F2A7B5` (estimated), trousers `#5A5F6E` (estimated), hair `#4A3030` (estimated)
- Animation: idle, talk, listen, think, nod, walk, sit, blink, lip-sync, look-at

**`technician`**
- Animation: inspect-equipment, use-tester, walk, talk, point
- ⚠ No reference supplied. Not in Phase 2 scope.

**`squirrel-teammate-red`**
- ⚠ Not approved for Phase 2 (owner decision 5). Do not develop or introduce.

**`squirrel-teammate-grey`**
- ⚠ Not approved for Phase 2 (owner decision 5). Do not develop or introduce.

**`temp-engineer`** — Phase 1 placeholder; kept only so the Phase 1 foundation test still renders. Superseded by sunny.
- Animation: idle, wave, point, talk, explain, nod, smile, blink, look-at
- Implementation: `src/engine/characters/library.ts`

**`sunny-face-b`** — Soft polygonal facial contours (55% smoothing, head detail 3), 20×14 eyeballs, iris 0.88 / pupil 0.56 of eye width, no rim, roughness 0.38. Approved 2026-11-27.
- Palette: sclera `#FFF4E8` (owner-approved), iris `#8050A1` (owner-approved), iris-highlight `#B68AC8` (owner-approved), pupil `#302039` (owner-approved), upper-lid `#59382D` (owner-approved)
- Animation: lid-blink, smile-lower-lids, happy-closed-eyes, surprise, gaze-left-right-up-down, look-at, brows
- Implementation: `src/engine/characters/sunny`

## environment

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `modern-thai-house` | ENV01 Modern Thai solar house (บ้านโซลาร์) | approved | procedural-environment | 2 | 12×9 m (proposed) | 05-solar-house-environment-sheet.png ENV01 main; 01-visual-reference-board.png §09–12 exterior, angle, day/evening/night, cutaway; 02-cinematic-reference-board.png §05 exterior, §06 cutaway; 03-cinematic-house-lighting-grid.png all six lighting moods |
| `living-room` | ENV02 Living room (ห้องนั่งเล่น) | approved | procedural-environment | 2 | 6×5 m (proposed) | 02-cinematic-reference-board.png §07; 04-solar-composition-reference.png §09 living-room cutaway; 05-solar-house-environment-sheet.png other spaces — ENV02; 06-production-reference-sheet.png environments — living room |
| `dining-area` | ENV02B Dining area | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV02B |
| `bedroom` | ENV02C Bedroom | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV02C |
| `garage-service-area` | ENV03 Garage & electrical service area (default equipment storytelling location) | approved | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV03 |
| `rooftop-solar` | ENV04 Rooftop solar installation | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV04; 04-solar-composition-reference.png §08 rooftop perspective |
| `equipment-room` | ENV05 Electrical equipment room | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV05; 04-solar-composition-reference.png §07 equipment macro |
| `neighbourhood-grid` | ENV06 Neighbourhood & utility grid | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV06; 06-production-reference-sheet.png neighbourhood / grid |
| `sunny-home-office` | ENV07 Sunny's home office | reference-supplied | procedural-environment | 3 |  | 05-solar-house-environment-sheet.png ENV07 |
| `demo-studio` | Technical demonstration studio (dark navy) | reference-supplied | procedural-environment | 3 |  | 04-solar-composition-reference.png §10 centred product demonstration |
| `review-studio` | Review studio (identity sheets, scale ruler, seats) | in-progress | procedural-environment | 2 |  | — |
| `gable-house-prototype` | Phase 1 gable-roof house prototype | superseded | procedural-environment | 1 |  | — |
| `energy-cutaway-house` | ENV04 Energy cutaway house | approved | procedural-environment | 3 |  | — |

**`modern-thai-house`** — Rebuilt to board 05 ENV01: flat-roof two-storey block, recessed glazing with lit interiors, terrace planters, tilted PV array on racks, garage/service wing, utility meter on a separate boundary-wall pillar, tropical landscaping. Day/golden/night/blackout via lighting presets + power state.
- Palette: concrete `#D9D6CF` (estimated), render-white `#F2EFE8` (estimated), window-frame `#2A2A2E` (estimated), interior-warm `#F59E0B` (sheet-swatch), pv-glass `#1E3A8A` (estimated), foliage `#4E8C3A` (estimated)
- Animation: power-state, interior-lights, garden-lights, pv-generation-sheen, energy-cable-anchors
- Implementation: `src/engine/environments/ModernSolarHouse.tsx`

**`living-room`** — Cutaway room 6.4×5 m, ceiling 2.8 m. State: power, lights, tv, ac, daylight. Sofa, coffee table, TV + console, wall AC, floor lamp, pendant + downlights, window with garden view, sockets, light switch.
- Palette: wall `#3B3550` (estimated), sofa `#D8C8C0` (estimated), cushion-accent `#E0A63A` (estimated), floor-wood `#8A5A3C` (estimated), rug `#BDB6B0` (estimated), lamp-glow `#F59E0B` (sheet-swatch)
- Animation: day, evening, power-outage, lights-on-off, tv-on-off, ac-on-off, sockets, light-switch
- Implementation: `src/engine/environments/LivingRoom.tsx`

**`garage-service-area`** — Options: system on-grid\|hybrid, battery (hybrid only), evCharger, car. Storytelling location only — not an installation recommendation. Energy-flow routes derived from the configuration.
- Animation: on-grid-config, hybrid-config, optional-battery, optional-ev-charger, backup-circuit-indicator, energy-flow-routes
- Implementation: `src/engine/environments/GarageServiceArea.tsx`

**`demo-studio`**
- ⚠ Only one composition reference; acceptable as a guide.

**`review-studio`** — Internal review set, not for episodes.
- Animation: height-ruler, seats
- Implementation: `src/engine/environments/ReviewStudio.tsx`

**`gable-house-prototype`** — Superseded by modern-thai-house; kept for the Phase 1 foundation test.
- Implementation: `src/engine/environments/ModernThaiHouse.tsx`

**`energy-cutaway-house`** — Isometric two-storey section with rooms, appliances, garage service area, meter and pole. Appliance power derived from the electrical scenario. Simplified educational model, not a wiring diagram.
- Animation: energy-flows, appliance-states, backup-circuit, outage-marker, clouds
- Implementation: `src/engine/environments/CutawayHouse.tsx`

## equipment

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `pv-panel` | PV module | approved | procedural-mesh | 2 | 1.7 m (real-world-typical) | 02-cinematic-reference-board.png §08; 06-production-reference-sheet.png equipment library |
| `on-grid-inverter` | On-grid (grid-tied) inverter | approved | procedural-mesh | 2 | 0.5 m (real-world-typical) | 02-cinematic-reference-board.png §08; 06-production-reference-sheet.png equipment library |
| `hybrid-inverter` | Hybrid inverter | approved | procedural-mesh | 2 | 0.6 m (real-world-typical) | 02-cinematic-reference-board.png §08; 04-solar-composition-reference.png §10; 06-production-reference-sheet.png equipment library |
| `battery-storage` | Battery storage (Li-ion) | approved | procedural-mesh | 2 | 1.1 m (real-world-typical) | 02-cinematic-reference-board.png §08; 06-production-reference-sheet.png equipment library; vendor-stacked-battery.webp |
| `electricity-meter` | Electricity meter | approved | procedural-mesh | 2 | 0.3 m (real-world-typical) | 02-cinematic-reference-board.png §08; 06-production-reference-sheet.png equipment library; vendor-energy-meter.webp |
| `distribution-board` | Distribution board | approved | procedural-mesh | 2 | 0.6 m (real-world-typical) | 02-cinematic-reference-board.png §08; 05-solar-house-environment-sheet.png ENV05; 06-production-reference-sheet.png equipment library |
| `circuit-breaker` | Circuit breaker | missing-reference | procedural-mesh | 3 | 0.1 m (real-world-typical) | — |
| `rcd` | Residual current device (RCD/RCBO) | missing-reference | procedural-mesh | 3 | 0.1 m (real-world-typical) | — |
| `utility-pole` | Utility pole | reference-supplied | procedural-mesh | 3 | 9 m (real-world-typical) | 02-cinematic-reference-board.png §08; 05-solar-house-environment-sheet.png ENV06 |
| `transformer` | Pole-mounted transformer | reference-supplied | procedural-mesh | 3 | 1 m (real-world-typical) | 05-solar-house-environment-sheet.png ENV06 label |
| `ev-charger` | EV charger (wallbox) | approved | procedural-mesh | 3 | 0.5 m (real-world-typical) | 02-cinematic-reference-board.png §08; 05-solar-house-environment-sheet.png ENV03 |
| `electric-vehicle` | Electric vehicle | approved | procedural-mesh | 3 | 1.5 m (real-world-typical) | 02-cinematic-reference-board.png §08; 05-solar-house-environment-sheet.png ENV03 |
| `microinverter` | Microinverter | reference-supplied | procedural-mesh | 3 | 0.25 m (real-world-typical) | vendor-microinverter.webp; micro-inverter-2-panel.webp; micro-inverter-4-panel.webp |
| `cables` | Electrical cables / conduit routes | reference-supplied | procedural-mesh | 3 |  | 05-solar-house-environment-sheet.png ENV05 |
| `light-switch` | Light switch | approved | procedural-mesh | 2 |  | — |

**`pv-panel`**
- Animation: generation-sheen, irradiance-driven
- Implementation: `src/engine/equipment/Solar.tsx`

**`on-grid-inverter`** — WallInverter (variant on-grid). Generic, unbranded; placeable in garage, exterior service wall, equipment room or demo studio.
- Palette: housing `#EEF0F3` (estimated), indicator-ok `#22D3EE` (official)
- Animation: status-led, output-bars, anti-islanding-off
- Implementation: `src/engine/equipment/Electrical.tsx`

**`hybrid-inverter`** — WallInverter (variant hybrid). Generic, unbranded; placeable in garage, exterior service wall, equipment room or demo studio.
- Palette: housing `#EEF0F3` (estimated), indicator-ok `#22D3EE` (official)
- Animation: status-led, backup-mode, output-bars
- Implementation: `src/engine/equipment/Electrical.tsx`

**`battery-storage`** — BatteryStack. Generic, unbranded; placeable in garage, exterior service wall, equipment room or demo studio.
- Animation: state-of-charge-bars, charge-discharge-glow
- Implementation: `src/engine/equipment/Electrical.tsx`

**`electricity-meter`** — UtilityMeter. Generic, unbranded; placeable in garage, exterior service wall, equipment room or demo studio.
- Animation: import-export-indicator, display
- Implementation: `src/engine/equipment/Electrical.tsx`

**`distribution-board`** — DistributionBoard. Generic, unbranded; placeable in garage, exterior service wall, equipment room or demo studio.
- Animation: breaker-states, door-open
- Implementation: `src/engine/equipment/Electrical.tsx`

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

**`ev-charger`** — EVCharger. Generic, unbranded; placeable in garage, exterior service wall, equipment room or demo studio.
- Animation: charging-led, cable
- Implementation: `src/engine/equipment/Electrical.tsx`

**`electric-vehicle`** — ElectricCar. Generic, unbranded; placeable in garage, exterior service wall, equipment room or demo studio.
- Animation: charging-port-glow
- Implementation: `src/engine/equipment/Electrical.tsx`

**`microinverter`** —  Supplied references show dark ribbed housings in 1-, 2- and 4-input sizes with a mounting tab, DC connector pairs and an AC trunk lead; build a generic unbranded model (no vendor name).
- Palette: housing `#EEF0F3` (estimated), indicator-ok `#22D3EE` (official)
- Animation: status-led

**`cables`**
- Animation: energy-flow-pulse
- Implementation: `src/engine/energy-flow/EnergyFlowPath.tsx`

**`light-switch`**
- Animation: on-off-rocker
- Implementation: `src/engine/equipment/Electrical.tsx`

## appliance

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `air-conditioner` | Air conditioner (wall split) | approved | procedural-mesh | 2 |  | 02-cinematic-reference-board.png §09 |
| `refrigerator` | Refrigerator | reference-supplied | procedural-mesh | 3 |  | 02-cinematic-reference-board.png §09 |
| `television` | Television | approved | procedural-mesh | 2 |  | 02-cinematic-reference-board.png §09 |
| `washing-machine` | Washing machine | reference-supplied | procedural-mesh | 3 |  | 02-cinematic-reference-board.png §09 |
| `standing-fan` | Standing fan | reference-supplied | procedural-mesh | 3 |  | 02-cinematic-reference-board.png §09 |
| `rice-cooker` | Rice cooker | reference-supplied | procedural-mesh | 3 |  | 02-cinematic-reference-board.png §09 |
| `light-bulb` | Light bulb | reference-supplied | procedural-mesh | 2 |  | 02-cinematic-reference-board.png §09 |
| `laptop` | Laptop / computer | reference-supplied | procedural-mesh | 3 |  | 02-cinematic-reference-board.png §09 |
| `floor-lamp` | Floor lamp | approved | procedural-mesh | 2 |  | 02-cinematic-reference-board.png §07 living room |
| `ceiling-light` | Ceiling light | approved | procedural-mesh | 2 |  | 02-cinematic-reference-board.png §07 living room |
| `socket` | Household socket | approved | procedural-mesh | 3 |  | — |

**`air-conditioner`**
- Animation: on-off-state, power-indicator
- Implementation: `src/engine/environments/LivingRoom.tsx`

**`refrigerator`**
- Animation: on-off-state, power-indicator

**`television`**
- Animation: on-off-state, power-indicator
- Implementation: `src/engine/environments/LivingRoom.tsx`

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
- Implementation: `src/engine/environments/LivingRoom.tsx`

**`ceiling-light`**
- Animation: on-off-state, power-indicator
- Implementation: `src/engine/environments/LivingRoom.tsx`

**`socket`**
- Animation: on-off-state, power-indicator
- Implementation: `src/engine/equipment/Electrical.tsx`

## lighting-preset

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `bright-morning` | Morning (เช้า) | approved | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Morning; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `midday-sun` | Midday (กลางวัน) | approved | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Midday; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `cloudy-rainy` | Cloudy / rainy (ครึ้ม / ฝนตก) | reference-supplied | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Cloudy / rainy; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `golden-hour` | Golden hour (เย็น (แสงทอง)) | approved | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Golden hour; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `night` | Night (กลางคืน) | approved | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Night; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `power-outage` | Power outage (ไฟดับ) | approved | data-preset | 2 |  | 03-cinematic-house-lighting-grid.png Power outage; 02-cinematic-reference-board.png §10; 06-production-reference-sheet.png lighting moods |
| `evening` | Evening (ค่ำ) | approved | data-preset | 2 |  | 01-visual-reference-board.png §11 day / evening / night |
| `emergency-backup` | Emergency backup lighting | missing-reference | data-preset | 3 |  | — |
| `demo-studio-light` | Technical demonstration studio lighting | reference-supplied | data-preset | 3 |  | 04-solar-composition-reference.png §10 |
| `review-studio-light` | Review studio soft key + fill | in-progress | data-preset | 2 |  | — |
| `portrait-warm` | Cinematic portrait (warm amber key, soft navy shadows) | approved | data-preset | 2 |  | — |

**`bright-morning`** — Soft warm light, long shadows, fresh & calm
- Palette: key `#FFD166` (sheet-swatch)
- Implementation: `src/engine/lighting/presets.ts`

**`midday-sun`** — Bright, high contrast, energetic
- Palette: key `#FFD166` (sheet-swatch)
- Implementation: `src/engine/lighting/presets.ts`

**`cloudy-rainy`** — Soft diffused, cooler, rain atmosphere
- Palette: key `#64748B` (sheet-swatch)

**`golden-hour`** — Warm golden light, rich colour, atmospheric
- Palette: key `#F59E0B` (sheet-swatch)
- Implementation: `src/engine/lighting/presets.ts`

**`night`** — Warm interior light, deep blue shadows
- Palette: key `#0F1B3D` (sheet-swatch)
- Implementation: `src/engine/lighting/presets.ts`

**`power-outage`** — No interior light, cool moonlight, dark & quiet
- Palette: key `#3B82F6` (sheet-swatch)
- Implementation: `src/engine/lighting/presets.ts`

**`emergency-backup`**
- ⚠ Not on board 03 — proposal: power-outage + warm light only on backup circuits.

**`review-studio-light`** — Engine ID: review-studio (lighting).
- Implementation: `src/engine/lighting/presets.ts`

**`portrait-warm`** — Used for the Sunny eye review cinematic close-ups.
- Palette: key `#FFB867` (prototype), shadow `#0F2747` (owner-approved)
- Implementation: `src/engine/lighting/presets.ts`

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
| `two-character` | Camera: two-character | approved | data-preset | 3 |  | — |
| `isometric-house` | Camera: isometric-house | approved | data-preset | 3 |  | — |
| `rooftop-aerial` | Camera: rooftop-aerial | approved | data-preset | 3 |  | — |
| `equipment-close-up` | Camera: equipment-close-up | approved | data-preset | 3 |  | — |
| `orbit-around-equipment` | Camera: orbit-around-equipment | approved | data-preset | 3 |  | — |
| `top-down-technical` | Camera: top-down-technical | approved | data-preset | 3 |  | — |

**`slow-dolly-in`** — Camera move; no image reference required.
- Implementation: `src/engine/cameras/presets.ts`

**`slow-dolly-out`** — Camera move; no image reference required.
- Implementation: `src/engine/cameras/presets.ts`

**`orbit-equipment`** — Camera move; no image reference required.
- Implementation: `src/engine/cameras/presets.ts`

**`tracking`** — Camera move; no image reference required.

**`two-character`** — Two-shot perpendicular to the line between two subjects; auto distance by aspect
- Animation: subject-aware, deterministic
- Implementation: `src/engine/cameras/shots.ts`

**`isometric-house`** — High 45° long-lens house view
- Animation: subject-aware, deterministic
- Implementation: `src/engine/cameras/shots.ts`

**`rooftop-aerial`** — High view over the roof array with slow orbit
- Animation: subject-aware, deterministic
- Implementation: `src/engine/cameras/shots.ts`

**`equipment-close-up`** — Equipment close-up with slow lateral move
- Animation: subject-aware, deterministic
- Implementation: `src/engine/cameras/shots.ts`

**`orbit-around-equipment`** — Slow orbit around a piece of equipment
- Animation: subject-aware, deterministic
- Implementation: `src/engine/cameras/shots.ts`

**`top-down-technical`** — Top-down technical view
- Animation: subject-aware, deterministic
- Implementation: `src/engine/cameras/shots.ts`

## branding

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `billionslight-logo` | Official Billionslight logo (horizontal & stacked) (แสงพันล้าน) | reference-supplied | 2d-overlay | 5 |  | billionslight-logo-horizontal.png transparent PNG 1028×283; billionslight-logo-stacked.png transparent PNG 663×645; logo-brand-sheet.jpg designer brand sheet (final.jpg): colour codes, lock-ups, concept; logo-master.pdf master final.pdf (same one-page sheet, vector) |
| `partner-brand-logos` | Third-party brand logos (distributed brands) | reference-only | none | 1 |  | ; fb-cover.png |

**`billionslight-logo`**
- Palette: orange `#FF5E1F` (official), blue `#1B28CE` (official), navy `#21409A` (official)
- Animation: fade-in, uniform-scale-in
- ⚠ The reference boards use a different sun/arc 'BILLIONSLIGHT' header mark — that is NOT the official logo and will not be used.
- ⚠ Tagline 'จำหน่ายอุปกรณ์ ไฟฟ้า ครบวงจร' is part of the lock-up — the master sheet has no approved tagline-free lock-up (only a cap mock-up without it) — keep the full logo unless the owner supplies/approves one.

**`partner-brand-logos`**
- ⚠ Trademarks of other companies. Must not appear in animations unless the owner confirms permission for a specific use.

## visual-language

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `energy-flow-language` | Energy-flow visual language | reference-supplied | 2d-overlay | 3 |  | 02-cinematic-reference-board.png §11; 06-production-reference-sheet.png energy-flow visual language; 04-solar-composition-reference.png §06 |
| `scene-palette` | Global scene & UI palette | approved | data-preset | 2 |  | 01-visual-reference-board.png §03; 06-production-reference-sheet.png colour & material palette; 03-cinematic-house-lighting-grid.png lighting palette |
| `scene-transitions` | Scene transitions (cut, fade, dip-to-navy) | approved | data-preset | 3 |  | — |
| `energy-flow-standard` | Billionslight energy-flow visual standard (V3 travelling pulse) | approved | data-preset | 3 |  | — |
| `thai-subtitles` | Thai subtitle system | approved | 2d-overlay | 4 |  | — |
| `audio-pipeline` | Dialogue audio pipeline (ElevenLabs + cache + mock) | approved | data-preset | 4 |  | — |

**`energy-flow-language`** —  Superseded palette: see energy-flow-standard (V3).
- Palette: solarDC `#FBBF24` (official), utilityGridAC `#3B82F6` (official), batteryDC `#22C55E` (official), inverterAC `#22D3EE` (official), householdLoad `#F8FAFC` (official), inactive `#64748B` (official), fault `#EF4444` (official)
- Implementation: `src/engine/energy-flow`
- ⚠ Board 06 'Grid Outage + Backup' lights the whole house; the engine will show only the selected backup loads (technically required).
- ⚠ Board 04 §10 checklist 'มีไฟสำรอง' next to a hybrid inverter must be conditional on backup configuration in any episode.

**`scene-palette`** — Board 01 is the primary cinematic colour direction. Warm amber light, muted blue shadows, natural wood, cream interiors, subtle tropical greenery; natural architectural colours in daytime. The official logo keeps its own brand colours.
- Palette: deep-navy `#0F2747` (owner-approved), solar-yellow `#FBBF24` (owner-approved)

**`scene-transitions`**
- Animation: cut, crossfade, dip-to-navy
- Implementation: `src/compositions/EpisodeComposition.tsx`

**`energy-flow-standard`** — Owner approved Variant B (bright leading edge, fading tail) as the permanent style on 2026-11-27. Implementation previews (renders/energy-flow-review/v3/) await approval before existing educational videos are regenerated. See docs/energy-flow-standard.md.
- Palette: solarDC `#FBBF24` (official), utilityGridAC `#3B82F6` (official), batteryDC `#22C55E` (official), inverterAC `#22D3EE` (official), householdLoad `#F8FAFC` (official), inactive `#64748B` (official), fault `#EF4444` (official)
- Animation: travelling-pulse, bright-leading-edge, fading-tail, direction-from-rules-engine, inactive-static, warning-indicator, thai-labels, legend
- Implementation: `src/engine/energy-flow`

**`thai-subtitles`** — Noto Sans Thai, safe area, legend-aware. See docs/audio-pipeline.md.
- Animation: word-boundary-wrap, balanced-lines, srt-export
- Implementation: `src/engine/subtitles/thai.ts`

**`audio-pipeline`** — Paid generation only with owner approval. See docs/audio-pipeline.md.
- Animation: voice-cache, paid-call-guard, dialogue-timing, lip-sync, ducking
- Implementation: `src/audio-pipeline/prepare.ts`

## animation-clip

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `idle-breathing` | Clip: idle-breathing | approved | data-preset | 2 |  | — |
| `wave` | Clip: wave | approved | data-preset | 2 |  | — |
| `point` | Clip: point | approved | data-preset | 2 |  | — |
| `talk` | Clip: talk | approved | data-preset | 2 |  | — |
| `explain` | Clip: explain | approved | data-preset | 2 |  | — |
| `open-hands` | Clip: open-hands | approved | data-preset | 2 |  | — |
| `nod` | Clip: nod | approved | data-preset | 2 |  | — |
| `shake-head` | Clip: shake-head | approved | data-preset | 2 |  | — |
| `listen` | Clip: listen | approved | data-preset | 2 |  | — |
| `think` | Clip: think | approved | data-preset | 2 |  | — |
| `surprised` | Clip: surprised | approved | data-preset | 2 |  | — |
| `laugh` | Clip: laugh | approved | data-preset | 2 |  | — |
| `thumbs-up` | Clip: thumbs-up | approved | data-preset | 2 |  | — |
| `hold-tablet` | Clip: hold-tablet | approved | data-preset | 2 |  | — |
| `present-prop` | Clip: present-prop | approved | data-preset | 2 |  | — |
| `look-upward` | Clip: look-upward | approved | data-preset | 2 |  | — |
| `lean-in` | Clip: lean-in | approved | data-preset | 2 |  | — |
| `sit` | Clip: sit | approved | data-preset | 2 |  | — |
| `shrug` | Clip: shrug | approved | data-preset | 2 |  | — |
| `smile` | Clip: smile | approved | data-preset | 2 |  | — |
| `blink` | Clip: blink (deliberate blink via eyelids) | approved | data-preset | 2 |  | — |
| `walk` | Clip: walk | approved | data-preset | 3 |  | — |
| `reach` | Clip: reach | approved | data-preset | 3 |  | — |
| `operate-switch` | Clip: operate-switch | approved | data-preset | 3 |  | — |
| `check-equipment` | Clip: check-equipment | approved | data-preset | 3 |  | — |
| `shade-eyes` | Clip: shade-eyes | approved | data-preset | 3 |  | — |
| `scratch-head` | Clip: scratch-head | approved | data-preset | 3 |  | — |

**`idle-breathing`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`wave`**
- Animation: blend-in-out, hand-mirroring
- Implementation: `src/engine/animation/clips.ts`

**`point`**
- Animation: blend-in-out, hand-mirroring
- Implementation: `src/engine/animation/clips.ts`

**`talk`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`explain`**
- Animation: blend-in-out, hand-mirroring
- Implementation: `src/engine/animation/clips.ts`

**`open-hands`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`nod`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`shake-head`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`listen`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`think`**
- Animation: blend-in-out, hand-mirroring
- Implementation: `src/engine/animation/clips.ts`

**`surprised`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`laugh`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`thumbs-up`**
- Animation: blend-in-out, hand-mirroring
- Implementation: `src/engine/animation/clips.ts`

**`hold-tablet`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`present-prop`**
- Animation: blend-in-out, hand-mirroring
- Implementation: `src/engine/animation/clips.ts`

**`look-upward`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`lean-in`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`sit`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`shrug`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`smile`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`blink`**
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`walk`** — Procedural walk cycle driven by travel distance (no foot sliding); also applied automatically while a character moves
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`reach`** — Reach toward a world target (yaw/pitch/distance), optional press
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`operate-switch`** — Reach and press a switch or breaker at a target
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`check-equipment`** — Lean in and inspect equipment
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`shade-eyes`** — Hand above the eyes, looking into the distance
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

**`scratch-head`** — Puzzled head scratch
- Animation: blend-in-out
- Implementation: `src/engine/animation/clips.ts`

## prop

| ID | Name | Status | Model | Phase | Scale | Reference |
|---|---|---|---|---|---|---|
| `supplier-flyers` | Supplier promotional flyers (5 kW / 10 kW packages) | reference-only | none | 1 |  | supplier-flyer-5kw.jpg; supplier-flyer-10kw.jpg |
| `vendor-product-photos` | Vendor product photos (microinverter, battery, meter, accessories) | reference-only | none | 2 |  | vendor-microinverter.webp; vendor-stacked-battery.webp; vendor-energy-meter.webp; vendor-accessories.webp; micro-inverter-2-panel.webp; micro-inverter-4-panel.webp |
| `tablet` | Tablet (hand-held prop, screen glow) | approved | procedural-mesh | 2 |  | 01-visual-reference-board.png Sunny holding tablet / panel |
| `demo-solar-panel` | Demonstration solar panel (hand-held prop) | approved | procedural-mesh | 2 |  | 01-visual-reference-board.png Sunny holding tablet / panel |
| `coffee-mug` | Coffee mug (hand-held prop) | approved | procedural-mesh | 2 |  | 04-solar-composition-reference.png §02 mugs on table |

**`supplier-flyers`**
- ⚠ Third-party marketing with prices, savings and payback claims. Not a technical source — never use its figures in episodes without independent verification and owner approval.

**`vendor-product-photos`** — Shape references for generic models only. No vendor names, logos or exact product likeness in renders.

**`tablet`**
- Animation: attach-to-joint, screen-glow
- Implementation: `src/engine/props/Props.tsx`

**`demo-solar-panel`**
- Animation: attach-to-joint, static
- Implementation: `src/engine/props/Props.tsx`

**`coffee-mug`**
- Animation: attach-to-joint, static
- Implementation: `src/engine/props/Props.tsx`
