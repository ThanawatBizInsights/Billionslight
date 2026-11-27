# Electrical accuracy & technical validation

The energy visualisation is an **educational simplification**. It shows the
direction and relative size of power flows at one instant. It is not a system
design, sizing, protection or wiring guide.

## Rules encoded in `src/engine/energy-flow/scenario.ts` (unit-tested)

| Situation | Engine behaviour |
|---|---|
| Grid-tied inverter, grid outage | Inverter off (anti-islanding). No PV flow, house unpowered, even in full sun. |
| Grid connected, PV < load | PV supplies what it can; the remainder is imported from the grid. |
| Grid connected, PV ≥ load | No import. Surplus exported **only** if `exportPermitted`; otherwise flagged `pv-curtailed-no-export`. |
| Hybrid inverter, outage, backup not fully configured | No backup. Requires backup output configured + grid isolation device + loads on backup circuit. |
| Hybrid, outage, fully configured | Only **backup loads** are supplied (not the whole house), limited by inverter kW and battery kW. |
| Battery | Capacity (kWh) and power (kW) are separate fields; power limits flows, capacity does not. |
| Inverter fault | Inverter shows fault (red); grid still supplies the house if available. |
| Irradiance | PV available = rated kW × irradiance (0–1). Temperature, shading and clipping are not yet modelled. Phase 3 can add derating factors. |

## Validation stage (enforced from Phase 5)

1. Every on-screen or spoken technical statement is a `technicalClaims[]`
   entry with `referenceIds` pointing to `references[]` (`source` field: URL,
   standard, datasheet or engineering note).
2. Claims start as `unverified` / `needs-human-review`.
3. An episode may only move to `approved` when every claim is `verified` by a
   named reviewer. A validator script will enforce this in Phase 5.
4. Do not invent Thai utility (MEA/PEA/ERC) rules, installation requirements,
   tariffs, savings figures or product specifications. Unknown → flag for review.
5. Never depict electrical work as DIY; technicians use appropriate PPE.

## Colour conventions (visualisation only, not wiring colours)

gold = solar · blue = grid · green = battery · white = household consumption ·
grey = inactive · red = faults/warnings only. The legend labels are in
`src/components/Overlays.tsx` (`LEGEND_LABELS_TH`).
