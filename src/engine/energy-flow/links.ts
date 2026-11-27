/**
 * Energy-flow LINKS — the Billionslight visual standard's data model.
 *
 * A link is one physical path between two pieces of equipment. Its power,
 * direction, category and warning state are DERIVED from the electrical rules
 * engine (deriveEnergyState); nothing here is decorative. Import and export
 * share the grid link (blue) with opposite directions; charging and
 * discharging share the battery link (green) with opposite directions.
 */
import type { EnergyFlowCategory, EnergyFlowLabelKey } from "../../config/energy-flow";
import type { ElectricalScenario } from "../../schemas/episode";
import type { EnergyState } from "./scenario";

export type LinkId = "pv-inverter" | "inverter-house" | "inverter-backup" | "grid" | "battery";

export interface FlowLink {
  id: string;
  /** Source and destination equipment of the path's FORWARD direction. */
  from: string;
  to: string;
  /** Power (kW). Illustrative unless the scenario is referenced. */
  kw: number;
  /** +1 = power moves from `from` to `to`; -1 = the reverse. */
  direction: 1 | -1;
  active: boolean;
  category: EnergyFlowCategory;
  /** Abnormal condition on this connection (red indicator). */
  warning: boolean;
  /** Thai label for the current state, if any. */
  label?: EnergyFlowLabelKey;
}

/** Legacy cable-route IDs → standard links. Routes not listed (e.g. the reversed duplicates) are ignored. */
export const ROUTE_TO_LINK: Record<string, LinkId> = {
  "pv-to-inverter": "pv-inverter",
  "inverter-to-house": "inverter-house",
  "inverter-to-backup": "inverter-backup",
  "grid-to-house": "grid",
  "meter-to-house": "grid",
  "inverter-to-battery": "battery",
};

const r2 = (v: number) => Math.round(v * 100) / 100;

export function deriveFlowLinks(state: EnergyState, scenario: ElectricalScenario): Record<LinkId, FlowLink> {
  const f = state.flows;
  const w = new Set(state.warnings);
  const mk = (id: LinkId, from: string, to: string, kw: number, category: EnergyFlowCategory, direction: 1 | -1 = 1, extra: Partial<FlowLink> = {}): FlowLink => {
    const active = kw > 0.005;
    return { id, from, to, kw: r2(kw), direction, active, category: active ? category : "inactive", warning: false, ...extra };
  };

  const exporting = f["inverter-to-grid"].active;
  const gridKw = exporting ? f["inverter-to-grid"].kw : f["grid-to-house"].kw;
  const discharging = f["battery-to-inverter"].active;
  const batteryKw = discharging ? f["battery-to-inverter"].kw : f["inverter-to-battery"].kw;
  const fault = state.inverterMode === "fault";
  const shutdown = w.has("anti-islanding-shutdown") || w.has("hybrid-without-backup-configuration");

  const pv = mk("pv-inverter", "pv-array", "inverter", f["pv-to-inverter"].kw, "solarDC");
  if (pv.active) pv.label = "solar";

  const house = mk("inverter-house", "inverter", "distribution-board", f["inverter-to-house"].kw, "inverterAC");
  if (house.active) house.label = "inverterOutput";
  if (shutdown && scenario.inverterType !== "none") house.label = "shutdown";
  if (fault) house.warning = true;

  const backup = mk("inverter-backup", "inverter", "backup-board", f["inverter-to-backup"].kw, "inverterAC");
  if (backup.active) backup.label = "backupSystem";
  if (w.has("inverter-overload") || w.has("backup-capacity-insufficient")) backup.warning = true;
  if (fault) backup.warning = true;

  const grid = mk("grid", "utility-grid", "distribution-board", gridKw, "utilityGridAC", exporting ? -1 : 1);
  if (grid.active) grid.label = exporting ? "gridExport" : "gridImport";
  if (!state.gridConnected) grid.warning = true;

  const battery = mk("battery", "inverter", "battery", batteryKw, "batteryDC", discharging ? -1 : 1);
  if (battery.active) battery.label = discharging ? "batteryDischarging" : "batteryCharging";
  if (w.has("battery-depleted")) battery.warning = true;

  return { "pv-inverter": pv, "inverter-house": house, "inverter-backup": backup, grid, battery };
}

/** Household consumption actually supplied (kW) and on which circuit. */
export function householdSupply(state: EnergyState, scenario: ElectricalScenario): { kw: number; circuit: "house" | "backup" | "none" } {
  if (state.houseLoadsPowered) return { kw: r2(scenario.householdLoadKw), circuit: "house" };
  if (state.backupLoadsPowered) return { kw: r2(scenario.backupLoadKw), circuit: "backup" };
  return { kw: 0, circuit: "none" };
}

/**
 * Split the supplied household power over the environment's load routes
 * ("load:house:<appliance>" / "load:backup:<appliance>") by relative weight.
 * Weights are illustrative; only the total is a scenario value.
 */
export function loadRouteKw(routeIds: string[], supply: { kw: number; circuit: string }, weights: Record<string, number>, switches: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  const live = routeIds.filter((id) => id.startsWith(`load:${supply.circuit}:`));
  const wOf = (id: string) => {
    const a = id.split(":")[2]!;
    return (weights[a] ?? 1) * (switches[a] ?? 1);
  };
  const total = live.reduce((s, id) => s + wOf(id), 0);
  for (const id of routeIds) out[id] = 0;
  if (supply.kw <= 0 || total <= 0) return out;
  for (const id of live) out[id] = r2((supply.kw * wOf(id)) / total);
  return out;
}
