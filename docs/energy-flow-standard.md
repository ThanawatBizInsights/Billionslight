# Billionslight energy-flow visual standard — V3 (approved style)

**Style approved by the owner (2026-11-27): Variant B — bright leading edge
with a fading tail.** It is the permanent energy-flow animation for every
scene with electrical data, rendered by the shared `EnergyFlowPath`.
Implementation previews: `renders/energy-flow-review/v3/`. Existing
educational videos are regenerated only after the owner approves these
previews.

Educational visualisation colours — **not** electrical conductor
identification colours. The pulse shows the *direction of energy transfer*,
not the movement or speed of electrons.

## Colours (`ENERGY_FLOW_COLORS`, `src/config/energy-flow.ts`)

| Token | Hex | Meaning | Thai label(s) |
|---|---|---|---|
| `solarDC` | `#FBBF24` | Solar DC generation, PV → inverter | พลังงานแสงอาทิตย์ |
| `utilityGridAC` | `#3B82F6` | Grid import (grid → board) or permitted export (board → grid) | ไฟฟ้าจากการไฟฟ้า · ส่งไฟฟ้ากลับเข้าระบบ |
| `batteryDC` | `#22C55E` | Charging (inverter → battery) or discharging (battery → inverter) | กำลังชาร์จแบตเตอรี่ · กำลังจ่ายไฟจากแบตเตอรี่ |
| `inverterAC` | `#22D3EE` | Inverter AC output, inverter → board | ไฟฟ้าจากอินเวอร์เตอร์ · ระบบไฟสำรอง |
| `householdLoad` | `#F8FAFC` | Board → appliances (dark outline in bright scenes) | การใช้ไฟฟ้าภายในบ้าน |
| `inactive` | `#64748B` | Inactive, isolated or disconnected — static | หยุดจ่ายไฟ |
| `fault` | `#EF4444` | Fault / warning indicator only | — |

On-grid and hybrid are configurations, not energy sources — no colour of
their own. Nothing may hard-code these values (a test enforces it).

## The travelling pulse (`ENERGY_FLOW_PULSE`, `pulse.ts`, `EnergyFlowPath.tsx`)

Each connection = **one thin coloured line + one travelling pulse**.

| Parameter | Value |
|---|---|
| Pulses per connection | 1 |
| Pulse length | 35 % of the connection (short cables: ≥ 0.55 m, ≤ 60 %) |
| Travel time source → destination | 1.2 s default (scene `energyFlow.pulseSeconds`, 0.8–1.5 s) |
| Movement | linear, continuous, seamless loop |
| Base line intensity | 30 % |
| Peak pulse intensity | 100 % |
| Line thickness | constant (`pathScale` thickens uniformly for wide shots) |
| Glow | soft additive halo on the line itself; no full-scene bloom |

Intensity profile, trailing end → leading end: 0 % → 0, 25 % → 15 %, 50 % → 40 %,
75 % → 75 %, 90 % → 100 %, 100 % → rapid smooth fade to 0. The leading edge
blends 45 % toward a lighter tint of its own colour (colour identity kept).

The head runs from 0 to 1 + pulse length each cycle, so the pulse enters
from the source and fully leaves through the destination before the next one
starts — it never jumps between endpoints. Direction comes from the rules
engine; reversing a flow reverses both movement and gradient, so the bright
edge always faces the destination.

**Never tied to power:** speed, length, brightness and thickness are identical
at every kW. Power is shown separately (labels with kW) when educationally
relevant.

Removed in V3: arrowheads, particles, particle density/spacing, multiple
pulses, lightning effects, bloom, the legacy particle renderer.

### Implementation

- Procedural gradient `ShaderMaterial` on the existing `TubeGeometry`
  (uv.x = arc length), so straight and curved routes behave identically.
- Uniforms set from `useCurrentFrame()` + composition fps every frame;
  no clocks, no randomness. Two draw calls per active connection.
- Inactive: static grey line, no pulse, no glow.
- Warning (fault, overload, outage on the grid connection, depleted
  battery): stopped grey line + red pulsing ring on the affected connection.
  An outage marks only the affected connection, never every line.

## Data model (unchanged rules engine)

`deriveEnergyState` → `deriveFlowLinks` (`links.ts`): one link per physical
path with source, destination, kW, direction, active, category, warning, label.
Environment cable routes map to links via `ROUTE_TO_LINK`; household routes are
`load:house:*` / `load:backup:*`.

## Scene options

```json
"energyFlow": { "labels": true, "legend": true, "hidden": [], "pathScale": 1, "pulseSeconds": 1.2 }
```

`labels` and `legend` are off by default (educational scenes opt in).
Deprecated fields are accepted for old episodes: `style: "legacy"` migrates to
the approved style; `referenceKw` is ignored.

## Accessibility

Colour is never the only cue: the pulse's leading edge shows direction; Thai
labels carry the kW value and icons (⏻ shutdown, ⚠ warning) with leader lines;
the legend shows a pulse swatch per colour.

## Operating scenarios (tests: `tests/energy-flow-standard.test.ts`)

1 solar = consumption · 2 solar < consumption (grid import) · 3 solar >
consumption without export (curtailed) · 4 permitted export · 5 zero-export ·
6 battery charging · 7 battery discharging · 8 night grid consumption ·
9 on-grid outage (anti-islanding: no usable power even in sun) · 10 hybrid
backup (grid isolated, backup circuits only) · 11 battery depletion ·
12 inverter overload / equipment fault. Pulse tests cover the profile,
direction, linear motion, seamless loop, short-cable adaptation, the
0.8–1.5 s range and independence from kW.

## Review material (`renders/energy-flow-review/v3/`)

`full/` (1080×1920) and `mobile/` (540×960):
01 on-grid normal · 02 solar + grid import · 03 surplus export · 04 battery
charging · 05 battery discharging (night) · 06 on-grid outage · 07 hybrid
backup · 08 short/medium/long cables · 09 night hybrid backup.
Reference sheet: `energy-flow-reference-sheet-v3.png/.mp4`.
Regenerate: `node scripts/review/build-energy-flow-review.mjs`, then
`scripts/render.mjs` per episode; compositions `EnergyFlowReference` and
`EnergyFlowCableTest`. V2 (particles) previews are archived in
`renders/energy-flow-review/v2/` for comparison only.
