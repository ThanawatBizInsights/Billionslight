# Billionslight energy-flow visual standard

Status: **built, awaiting owner visual approval.** Until approved it is opt-in
per scene (`"energyFlow": { "style": "standard" }`); existing episodes keep the
legacy renderer. After approval the schema default flips to `"standard"`.

Educational visualisation colours — **not** electrical conductor
identification colours. All tokens live in `src/config/energy-flow.ts`; every
path, label and legend imports them (a test fails if the renderer hard-codes a
flow colour).

## Colours and meanings

| Token | Hex | Meaning | Thai label(s) |
|---|---|---|---|
| `solarDC` | `#FBBF24` | Solar DC generation from the PV panels | พลังงานแสงอาทิตย์ |
| `utilityGridAC` | `#3B82F6` | Utility grid AC — import **or** export (direction shows which) | ไฟฟ้าจากการไฟฟ้า · ส่งไฟฟ้ากลับเข้าระบบ |
| `batteryDC` | `#22C55E` | Battery charging **or** discharging (direction shows which) | กำลังชาร์จแบตเตอรี่ · กำลังจ่ายไฟจากแบตเตอรี่ |
| `inverterAC` | `#22D3EE` | Converted AC output from the inverter | ไฟฟ้าจากอินเวอร์เตอร์ · ระบบไฟสำรอง |
| `householdLoad` | `#F8FAFC` | Electricity supplied to household loads after distribution (dark outline) | การใช้ไฟฟ้าภายในบ้าน |
| `inactive` | `#64748B` | Inactive, isolated or disconnected | หยุดจ่ายไฟ |
| `fault` | `#EF4444` | Abnormal conditions and warnings only | — |

On-grid and hybrid are **configurations**, not energy sources: no colour of
their own.

## Links (data model)

Flows are **derived** from the rules engine (`deriveEnergyState` →
`deriveFlowLinks`, `src/engine/energy-flow/links.ts`). One link per physical
path, each with source, destination, kW, direction, active state, category and
warning state:

| Link | Forward direction | Reverse direction |
|---|---|---|
| `pv-inverter` | PV → inverter | — |
| `inverter-house` | inverter → distribution board | — |
| `inverter-backup` | inverter → backup board | — |
| `grid` | grid → house (import) | house → grid (permitted export) |
| `battery` | inverter → battery (charging) | battery → inverter (discharging) |
| `load:house:*`, `load:backup:*` | board → appliance | — |

Environments keep their cable routes; `ROUTE_TO_LINK` maps route IDs to links.
Household kW is split over load routes by illustrative weights
(`EnvironmentDefinition.loadWeights`); only the total is a scenario value.

## Motion

- **Constant speed** (0.9 m/s) on every path at every power level — power
  never makes particles "faster".
- **Particle density = power**: linear in kW against `energyFlow.referenceKw`
  (default 5 kW; keep one value per comparison scene). 0 kW = no particles.
  Slots light up in a fixed golden-ratio order, so density changes never pop
  or reshuffle.
- **Arrowheads** travel with the flow and point along the power transfer.
- Direction reversals (import ↔ export, charge ↔ discharge) fade out, then in.
- Inactive: grey, still. Warning: red, slow pulse, no particles.
- `pathScale` thickens cables/particles/arrows for wide shots (no effect on
  density or speed).
- Deterministic: positions are functions of the frame and data only;
  instanced meshes (2–4 draw calls per path) keep Intel-Mac renders practical.

## Labels and legend (accessibility)

Colour is never the only cue: moving arrowheads, Thai text labels with kW,
icons (➜, ⏻ shutdown, ⚠ warning), leader lines to the path and a legend with
line swatches + arrows. Labels are HTML (Noto Sans Thai) projected from 3D with
the scene camera, kept inside the 9:16 safe area. Per-environment anchors:
`EnvironmentDefinition.flowLabelAnchors`.

## Scene options

```json
"energyFlow": { "style": "standard", "referenceKw": 5, "labels": true, "legend": true, "hidden": [], "pathScale": 1 }
```

## Operating scenarios covered by tests (`tests/energy-flow-standard.test.ts`)

1 solar = consumption · 2 solar < consumption · 3 solar > consumption (no
export → curtailed) · 4 permitted export · 5 zero-export · 6 battery charging ·
7 battery discharging · 8 night grid consumption · 9 on-grid outage
(anti-islanding: no usable power even in sun) · 10 hybrid backup (grid
isolated, backup circuits only) · 11 battery depletion · 12 inverter overload /
equipment fault.

Rules changes made for consistency: a backup demand above the inverter rating
trips the backup output (fault, no partial flow); insufficient PV + battery
power shows the backup output off rather than a partial flow; battery
depletion/reserve warnings.

## Review material

`renders/energy-flow-review/`: reference sheet (PNG + 5 s MP4) and six 5 s tests
(same house, equipment, camera; midday except the night battery test):
01 on-grid normal · 02 surplus export · 03 battery charging · 04 battery
discharging at night · 05 on-grid outage · 06 hybrid backup.
Regenerate: `node scripts/review/build-energy-flow-review.mjs`, then
`scripts/render.mjs` per episode and
`npx remotion still src/index.ts EnergyFlowReference …`.
