/**
 * Electrical scenario → energy-flow state.
 *
 * This is the single source of truth for WHAT the visualisation shows. It is a
 * simplified EDUCATIONAL model (power balance at one instant). It is not a
 * design tool and does not represent installation or wiring instructions.
 *
 * Encoded rules (see docs/electrical-accuracy.md):
 *  - Grid-tied inverters stop exporting/supplying during a grid outage
 *    (anti-islanding protection). Sunlight on the panels does not change this.
 *  - A hybrid inverter supplies backup ONLY when a backup output is
 *    configured, the system is isolated from the grid, and the loads are on
 *    the backup circuit. Only those backup loads are supplied — not the whole
 *    house — and only within inverter/battery power limits.
 *  - When solar is insufficient and the grid is available, the house imports.
 *  - Export only if exportPermitted (depends on equipment configuration and
 *    utility requirements — never assumed).
 *  - kW (power) and kWh (energy) are separate quantities.
 */
import type { ElectricalScenario } from "../../schemas/episode";

export type FlowId =
  | "pv-to-inverter"
  | "inverter-to-house"
  | "inverter-to-backup"
  | "grid-to-house"
  | "inverter-to-grid"
  | "inverter-to-battery"
  | "battery-to-inverter";

export type EnergyKind = "solar" | "grid" | "battery" | "load";

export interface Flow {
  id: FlowId;
  active: boolean;
  /** Power in kW (illustrative). */
  kw: number;
  kind: EnergyKind;
}

export type InverterMode = "off" | "grid-tied" | "backup" | "standby" | "fault";

export interface EnergyState {
  flows: Record<FlowId, Flow>;
  pvAvailableKw: number;
  pvUsedKw: number;
  inverterMode: InverterMode;
  gridConnected: boolean;
  /** Whole-house loads (lights, AC …) are powered. */
  houseLoadsPowered: boolean;
  /** Loads on the backup circuit are powered. */
  backupLoadsPowered: boolean;
  unservedLoadKw: number;
  warnings: string[];
}

const ALL_FLOWS: [FlowId, EnergyKind][] = [
  ["pv-to-inverter", "solar"],
  ["inverter-to-house", "solar"],
  ["inverter-to-backup", "solar"],
  ["grid-to-house", "grid"],
  ["inverter-to-grid", "solar"],
  ["inverter-to-battery", "solar"],
  ["battery-to-inverter", "battery"],
];

const round = (v: number) => Math.round(v * 100) / 100;

export function deriveEnergyState(s: ElectricalScenario): EnergyState {
  const flows = Object.fromEntries(ALL_FLOWS.map(([id, kind]) => [id, { id, kind, active: false, kw: 0 }])) as Record<FlowId, Flow>;
  const set = (id: FlowId, kw: number, kind?: EnergyKind) => {
    const f = flows[id];
    f.kw = round(Math.max(0, kw));
    f.active = f.kw > 0.005;
    if (kind) f.kind = kind;
  };
  const warnings: string[] = [];
  const gridConnected = s.gridStatus === "connected";
  const battery = s.battery;
  const hasBattery = s.inverterType === "hybrid" && battery.present;
  const pvAvailableKw = s.inverterType === "none" ? 0 : Math.min(s.pvRatedKw * s.solarIrradiance, s.pvRatedKw);
  const inv = s.inverterRatedKw;

  const base: Omit<EnergyState, "flows"> = {
    pvAvailableKw: round(pvAvailableKw),
    pvUsedKw: 0,
    inverterMode: "off",
    gridConnected,
    houseLoadsPowered: false,
    backupLoadsPowered: false,
    unservedLoadKw: 0,
    warnings,
  };

  // ---- fault ---------------------------------------------------------------
  if (s.inverterType !== "none" && s.inverterFault) {
    warnings.push("inverter-fault");
    if (gridConnected) set("grid-to-house", s.householdLoadKw);
    return { ...base, flows, inverterMode: "fault", houseLoadsPowered: gridConnected, backupLoadsPowered: gridConnected, unservedLoadKw: gridConnected ? 0 : round(s.householdLoadKw) };
  }

  // ---- grid available ------------------------------------------------------
  if (gridConnected) {
    let mode: InverterMode = s.inverterType === "none" ? "off" : "grid-tied";
    const solarToHouse = Math.min(pvAvailableKw, inv, s.householdLoadKw);
    let surplus = Math.min(pvAvailableKw, inv) - solarToHouse;
    let batteryCharge = 0;
    let batteryDischarge = 0;
    if (hasBattery) {
      if (surplus > 0 && battery.stateOfCharge < 1) {
        batteryCharge = Math.min(surplus, battery.maxPowerKw);
        surplus -= batteryCharge;
      }
    }
    const remaining = s.householdLoadKw - solarToHouse;
    if (hasBattery && remaining > 0 && battery.stateOfCharge <= 0.2) warnings.push("battery-reserve-reached");
    if (hasBattery && remaining > 0 && battery.stateOfCharge > 0.2) {
      batteryDischarge = Math.min(remaining, battery.maxPowerKw, inv - solarToHouse);
    }
    const gridImport = s.householdLoadKw - solarToHouse - batteryDischarge;
    const exportKw = s.exportPermitted ? surplus : 0;
    if (!s.exportPermitted && surplus > 0.05) warnings.push("pv-curtailed-no-export");

    const pvUsed = solarToHouse + batteryCharge + exportKw;
    set("pv-to-inverter", pvUsed);
    set("inverter-to-house", solarToHouse + batteryDischarge, solarToHouse > 0 ? "solar" : "battery");
    set("grid-to-house", gridImport);
    set("inverter-to-grid", exportKw);
    set("inverter-to-battery", batteryCharge);
    set("battery-to-inverter", batteryDischarge);
    if (s.inverterType !== "none" && pvUsed <= 0.005 && batteryDischarge <= 0) mode = "standby";
    return { ...base, flows, pvUsedKw: round(pvUsed), inverterMode: mode, houseLoadsPowered: true, backupLoadsPowered: true };
  }

  // ---- grid outage ---------------------------------------------------------
  if (s.inverterType === "none") {
    return { ...base, flows, unservedLoadKw: round(s.householdLoadKw) };
  }
  if (s.inverterType === "grid-tied") {
    // Anti-islanding: the inverter disconnects and stops supplying power.
    warnings.push("anti-islanding-shutdown");
    return { ...base, flows, inverterMode: "off", unservedLoadKw: round(s.householdLoadKw) };
  }

  // hybrid
  const b = s.backup;
  const backupReady = b.backupOutputConfigured && b.gridIsolationDevice && b.loadsOnBackupCircuit;
  if (!backupReady) {
    warnings.push("hybrid-without-backup-configuration");
    return { ...base, flows, inverterMode: "off", unservedLoadKw: round(s.householdLoadKw) };
  }
  const depleted = hasBattery && battery.stateOfCharge <= 0.05;
  if (depleted) warnings.push("battery-depleted");
  const batteryAvail = hasBattery && !depleted ? battery.maxPowerKw : 0;
  const demand = s.backupLoadKw;
  // Overload: the backup demand exceeds the inverter's continuous rating → the
  // backup output trips (no partial supply is shown).
  if (demand > inv + 0.005) {
    warnings.push("inverter-overload");
    return { ...base, flows, inverterMode: "fault", unservedLoadKw: round(s.householdLoadKw) };
  }
  const supplyLimit = Math.min(inv, pvAvailableKw + batteryAvail);
  // Not enough PV + battery power for the backup circuit → the output cannot be
  // sustained; it is shown as off rather than as a partial, contradictory flow.
  const sufficient = demand > 0 && supplyLimit >= demand - 0.005;
  if (!sufficient && demand > 0) warnings.push("backup-capacity-insufficient");
  const served = sufficient ? demand : 0;
  const solarToBackup = Math.min(pvAvailableKw, served);
  const fromBattery = served - solarToBackup;
  const charge = hasBattery && battery.stateOfCharge < 1 ? Math.max(0, Math.min(pvAvailableKw - solarToBackup, battery.maxPowerKw, inv - served)) : 0;
  const backupPowered = sufficient;

  set("pv-to-inverter", solarToBackup + charge);
  set("inverter-to-backup", served, solarToBackup > 0 ? "solar" : "battery");
  set("battery-to-inverter", fromBattery);
  set("inverter-to-battery", charge);
  return {
    ...base,
    flows,
    pvUsedKw: round(solarToBackup + charge),
    inverterMode: served > 0 || charge > 0 ? "backup" : "standby",
    houseLoadsPowered: false,
    backupLoadsPowered: backupPowered,
    // Non-backup household circuits remain unpowered during the outage.
    unservedLoadKw: round(Math.max(0, s.householdLoadKw - s.backupLoadKw) + (demand - served)),
  };
}
