import { describe, expect, it } from "vitest";
import { ElectricalScenario } from "../src/schemas/episode";
import { deriveEnergyState } from "../src/engine/energy-flow/scenario";
import { sampleElectrical } from "../src/engine/energy-flow/timeline";

const S = (o: Record<string, unknown>) => ElectricalScenario.parse({ inverterType: "grid-tied", gridStatus: "connected", solarIrradiance: 0.8, ...o });

const fullBackup = { backupOutputConfigured: true, gridIsolationDevice: true, loadsOnBackupCircuit: true };

describe("electrical scenario rules", () => {
  it("grid-tied + grid outage → inverter stops (anti-islanding), even in strong sun", () => {
    const st = deriveEnergyState(S({ gridStatus: "outage", solarIrradiance: 1 }));
    expect(st.inverterMode).toBe("off");
    expect(Object.values(st.flows).every((f) => !f.active)).toBe(true);
    expect(st.houseLoadsPowered).toBe(false);
    expect(st.warnings).toContain("anti-islanding-shutdown");
  });

  it("grid connected, insufficient solar → house imports the shortfall", () => {
    const st = deriveEnergyState(S({ solarIrradiance: 0.2, pvRatedKw: 5, householdLoadKw: 3 }));
    expect(st.flows["inverter-to-house"].kw).toBe(1);
    expect(st.flows["grid-to-house"].kw).toBe(2);
    expect(st.houseLoadsPowered).toBe(true);
  });

  it("solar covers the load → no grid import", () => {
    const st = deriveEnergyState(S({ solarIrradiance: 0.9, householdLoadKw: 2.4 }));
    expect(st.flows["grid-to-house"].active).toBe(false);
    expect(st.flows["inverter-to-house"].kw).toBe(2.4);
  });

  it("surplus is exported only when permitted", () => {
    const no = deriveEnergyState(S({ solarIrradiance: 1, householdLoadKw: 1 }));
    expect(no.flows["inverter-to-grid"].active).toBe(false);
    expect(no.warnings).toContain("pv-curtailed-no-export");
    const yes = deriveEnergyState(S({ solarIrradiance: 1, householdLoadKw: 1, exportPermitted: true }));
    expect(yes.flows["inverter-to-grid"].kw).toBe(4);
  });

  it("hybrid inverter without full backup configuration does NOT supply during outage", () => {
    const st = deriveEnergyState(S({ inverterType: "hybrid", gridStatus: "outage", battery: { present: true }, backup: { backupOutputConfigured: true, gridIsolationDevice: false, loadsOnBackupCircuit: true } }));
    expect(st.inverterMode).toBe("off");
    expect(st.backupLoadsPowered).toBe(false);
    expect(st.warnings).toContain("hybrid-without-backup-configuration");
  });

  it("correctly configured hybrid supplies ONLY backup loads during outage", () => {
    const st = deriveEnergyState(S({ inverterType: "hybrid", gridStatus: "outage", solarIrradiance: 0, householdLoadKw: 3, backupLoadKw: 0.8, battery: { present: true, stateOfCharge: 0.7 }, backup: fullBackup }));
    expect(st.inverterMode).toBe("backup");
    expect(st.backupLoadsPowered).toBe(true);
    expect(st.houseLoadsPowered).toBe(false);
    expect(st.flows["battery-to-inverter"].kw).toBe(0.8);
    expect(st.flows["grid-to-house"].active).toBe(false);
    expect(st.unservedLoadKw).toBeCloseTo(2.2);
  });

  it("backup is limited by inverter power (kW), independent of battery energy (kWh)", () => {
    const st = deriveEnergyState(S({ inverterType: "hybrid", gridStatus: "outage", solarIrradiance: 0, inverterRatedKw: 3, backupLoadKw: 5, battery: { present: true, capacityKwh: 20, maxPowerKw: 5 }, backup: fullBackup }));
    expect(st.flows["inverter-to-backup"].kw).toBe(3);
    expect(st.backupLoadsPowered).toBe(false);
    expect(st.warnings).toContain("backup-capacity-insufficient");
  });

  it("inverter fault: grid still supplies the house, inverter shows fault", () => {
    const st = deriveEnergyState(S({ inverterFault: true, householdLoadKw: 2 }));
    expect(st.inverterMode).toBe("fault");
    expect(st.flows["grid-to-house"].kw).toBe(2);
    expect(st.flows["pv-to-inverter"].active).toBe(false);
  });

  it("night (no irradiance) → no PV flow", () => {
    const st = deriveEnergyState(S({ solarIrradiance: 0 }));
    expect(st.flows["pv-to-inverter"].active).toBe(false);
    expect(st.inverterMode).toBe("standby");
  });
});

describe("electrical timeline", () => {
  const keys = [
    { frame: 0, transitionFrames: 0, scenario: S({ solarIrradiance: 0.25, householdLoadKw: 2.4 }) },
    { frame: 50, transitionFrames: 30, scenario: S({ solarIrradiance: 0.9, householdLoadKw: 2.4 }) },
  ];
  it("switches discrete state at the keyframe and cross-fades visuals", () => {
    expect(sampleElectrical(keys, 49)!.state.flows["grid-to-house"].active).toBe(true);
    const mid = sampleElectrical(keys, 65)!;
    expect(mid.state.flows["grid-to-house"].active).toBe(false);
    expect(mid.intensity["grid-to-house"]).toBeGreaterThan(0);
    expect(sampleElectrical(keys, 80)!.intensity["grid-to-house"]).toBe(0);
  });
  it("is deterministic", () => {
    expect(sampleElectrical(keys, 63)).toEqual(sampleElectrical(keys, 63));
  });
});
