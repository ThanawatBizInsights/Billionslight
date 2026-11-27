import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ElectricalScenario } from "../src/schemas/episode";
import { deriveEnergyState } from "../src/engine/energy-flow/scenario";
import { deriveFlowLinks, householdSupply, loadRouteKw } from "../src/engine/energy-flow/links";
import { sampleFlowLinks } from "../src/engine/energy-flow/timeline";
import { particleFraction } from "../src/engine/energy-flow/EnergyFlowPath";
import { ENERGY_FLOW_COLORS, ENERGY_FLOW_LABELS_TH, ENERGY_FLOW_MOTION } from "../src/config/energy-flow";

const S = (o: Record<string, unknown>) => ElectricalScenario.parse({ inverterType: "grid-tied", gridStatus: "connected", solarIrradiance: 0.8, pvRatedKw: 5, inverterRatedKw: 5, ...o });
const battery = (soc: number) => ({ present: true, capacityKwh: 10, stateOfCharge: soc, maxPowerKw: 5 });
const fullBackup = { backupOutputConfigured: true, gridIsolationDevice: true, loadsOnBackupCircuit: true };
const L = (o: Record<string, unknown>) => {
  const s = S(o);
  const st = deriveEnergyState(s);
  return { s, st, links: deriveFlowLinks(st, s), house: householdSupply(st, s) };
};

describe("energy-flow tokens", () => {
  it("match the owner-specified standard exactly", () => {
    expect(ENERGY_FLOW_COLORS).toEqual({
      solarDC: "#FBBF24",
      utilityGridAC: "#3B82F6",
      batteryDC: "#22C55E",
      inverterAC: "#22D3EE",
      householdLoad: "#F8FAFC",
      inactive: "#64748B",
      fault: "#EF4444",
    });
  });
  it("provides every reusable Thai label", () => {
    expect(Object.values(ENERGY_FLOW_LABELS_TH)).toEqual([
      "พลังงานแสงอาทิตย์",
      "ไฟฟ้าจากการไฟฟ้า",
      "กำลังชาร์จแบตเตอรี่",
      "กำลังจ่ายไฟจากแบตเตอรี่",
      "ไฟฟ้าจากอินเวอร์เตอร์",
      "การใช้ไฟฟ้าภายในบ้าน",
      "ส่งไฟฟ้ากลับเข้าระบบ",
      "หยุดจ่ายไฟ",
      "ระบบไฟสำรอง",
    ]);
  });
  it("the standard renderer and labels never hard-code flow colours", () => {
    for (const f of ["src/engine/energy-flow/EnergyFlowPath.tsx", "src/engine/energy-flow/FlowLabels.tsx", "src/engine/energy-flow/links.ts"]) {
      const src = fs.readFileSync(path.resolve(__dirname, "..", f), "utf8");
      for (const hex of Object.values(ENERGY_FLOW_COLORS)) expect(src.includes(hex), `${f} hard-codes ${hex}`).toBe(false);
    }
  });
});

describe("power → particle density (constant speed)", () => {
  it("0 kW shows nothing; density rises with kW; never depends on speed", () => {
    const ref = 5;
    expect(particleFraction(0, ref)).toBe(0);
    const f1 = particleFraction(1, ref);
    const f3 = particleFraction(3, ref);
    const f5 = particleFraction(5, ref);
    expect(f1).toBeGreaterThan(0);
    expect(f3).toBeGreaterThan(f1);
    expect(f5).toBeGreaterThan(f3);
    expect(f3 / f1).toBeCloseTo(3);
    expect(typeof ENERGY_FLOW_MOTION.speed).toBe("number"); // a single constant speed for every path
  });
});

describe("12 operating scenarios (all derived from the rules engine)", () => {
  it("1. solar equals consumption: no grid import, no export", () => {
    const { links } = L({ solarIrradiance: 0.5, householdLoadKw: 2.5 });
    expect(links["pv-inverter"].kw).toBe(2.5);
    expect(links["inverter-house"]).toMatchObject({ kw: 2.5, category: "inverterAC" });
    expect(links.grid.active).toBe(false);
  });

  it("2. solar lower than consumption: grid imports the shortfall (blue, grid → house)", () => {
    const { links } = L({ solarIrradiance: 0.4, householdLoadKw: 3 });
    expect(links["inverter-house"].kw).toBe(2);
    expect(links.grid).toMatchObject({ kw: 1, direction: 1, category: "utilityGridAC", label: "gridImport" });
  });

  it("3. solar exceeds consumption without export permission: no export, PV curtailed", () => {
    const { links, st } = L({ solarIrradiance: 0.9, householdLoadKw: 1.5, exportPermitted: false });
    expect(links.grid.active).toBe(false);
    expect(links["pv-inverter"].kw).toBe(1.5);
    expect(st.warnings).toContain("pv-curtailed-no-export");
  });

  it("4. permitted surplus export: same blue grid path, opposite direction", () => {
    const { links } = L({ solarIrradiance: 0.9, householdLoadKw: 1.5, exportPermitted: true });
    expect(links.grid).toMatchObject({ kw: 3, direction: -1, category: "utilityGridAC", label: "gridExport" });
  });

  it("5. zero-export operation: export is never assumed", () => {
    const { links } = L({ solarIrradiance: 1, householdLoadKw: 0.5 });
    expect(links.grid.kw).toBe(0);
    expect(links.grid.direction).toBe(1);
  });

  it("6. battery charging from solar: green, inverter → battery", () => {
    const { links } = L({ inverterType: "hybrid", solarIrradiance: 0.9, householdLoadKw: 1.5, battery: battery(0.5) });
    expect(links.battery).toMatchObject({ kw: 3, direction: 1, category: "batteryDC", label: "batteryCharging" });
  });

  it("7. battery discharging: same green path, battery → inverter; inverter output is cyan", () => {
    const { links } = L({ inverterType: "hybrid", solarIrradiance: 0, householdLoadKw: 1.8, battery: battery(0.8) });
    expect(links.battery).toMatchObject({ kw: 1.8, direction: -1, category: "batteryDC", label: "batteryDischarging" });
    expect(links["inverter-house"]).toMatchObject({ kw: 1.8, category: "inverterAC" });
    expect(links["pv-inverter"].active).toBe(false);
  });

  it("8. night-time grid consumption: no PV, grid supplies the house", () => {
    const { links, house } = L({ solarIrradiance: 0, householdLoadKw: 1.2 });
    expect(links["pv-inverter"].active).toBe(false);
    expect(links["pv-inverter"].category).toBe("inactive");
    expect(links.grid).toMatchObject({ kw: 1.2, direction: 1 });
    expect(house).toEqual({ kw: 1.2, circuit: "house" });
  });

  it("9. conventional on-grid inverter during an outage: no usable power anywhere, even in sun", () => {
    const { links, house } = L({ gridStatus: "outage", solarIrradiance: 1 });
    for (const l of Object.values(links)) expect(l.active).toBe(false);
    expect(links["inverter-house"].label).toBe("shutdown");
    expect(links.grid.warning).toBe(true);
    expect(house.kw).toBe(0);
  });

  it("10. compatible hybrid backup: grid isolated, only backup circuits supplied", () => {
    const { links, house, st } = L({ inverterType: "hybrid", gridStatus: "outage", solarIrradiance: 0.5, householdLoadKw: 2.5, backupLoadKw: 0.8, battery: battery(0.7), backup: fullBackup });
    expect(links.grid).toMatchObject({ active: false, warning: true });
    expect(links["inverter-house"].active).toBe(false);
    expect(links["inverter-backup"]).toMatchObject({ kw: 0.8, category: "inverterAC", label: "backupSystem" });
    expect(house).toEqual({ kw: 0.8, circuit: "backup" });
    expect(st.houseLoadsPowered).toBe(false);
    // only backup-circuit load routes carry power
    const kw = loadRouteKw(["load:house:tv", "load:backup:fridge", "load:backup:fan"], house, {}, {});
    expect(kw["load:house:tv"]).toBe(0);
    expect(kw["load:backup:fridge"]! + kw["load:backup:fan"]!).toBeCloseTo(0.8);
  });

  it("11. battery depletion at night during an outage: backup output stops, warning shown", () => {
    const { links, st } = L({ inverterType: "hybrid", gridStatus: "outage", solarIrradiance: 0, backupLoadKw: 0.8, battery: battery(0.03), backup: fullBackup });
    expect(st.warnings).toContain("battery-depleted");
    expect(links.battery).toMatchObject({ active: false, warning: true });
    expect(links["inverter-backup"].active).toBe(false);
    expect(st.backupLoadsPowered).toBe(false);
  });

  it("12a. inverter overload during backup: output trips (fault), no partial flow", () => {
    const { links, st } = L({ inverterType: "hybrid", gridStatus: "outage", solarIrradiance: 0.6, inverterRatedKw: 3, backupLoadKw: 4.5, battery: battery(0.9), backup: fullBackup });
    expect(st.inverterMode).toBe("fault");
    expect(st.warnings).toContain("inverter-overload");
    expect(links["inverter-backup"]).toMatchObject({ active: false, warning: true });
  });

  it("12b. equipment fault with grid available: grid supplies, inverter path shows a warning", () => {
    const { links } = L({ inverterFault: true, householdLoadKw: 2 });
    expect(links["inverter-house"]).toMatchObject({ active: false, warning: true });
    expect(links.grid).toMatchObject({ kw: 2, direction: 1 });
  });
});

describe("deterministic sampling over time", () => {
  const keys = [
    { frame: 0, scenario: S({ inverterType: "hybrid", solarIrradiance: 0.9, householdLoadKw: 1.5, battery: battery(0.5) }), transitionFrames: 0 },
    { frame: 30, scenario: S({ inverterType: "hybrid", solarIrradiance: 0, householdLoadKw: 1.8, battery: battery(0.8) }), transitionFrames: 20 },
  ];
  it("same frame → same result, any order", () => {
    const a = [40, 5, 33, 49].map((f) => sampleFlowLinks(keys, f));
    const b = [40, 5, 33, 49].map((f) => sampleFlowLinks(keys, f));
    expect(a).toEqual(b);
  });
  it("a direction reversal fades out, then in (never runs backwards at full power)", () => {
    const mid = sampleFlowLinks(keys, 40)!; // exactly halfway through the 20-frame transition
    expect(mid.links.battery.kw).toBeCloseTo(0, 5);
    const early = sampleFlowLinks(keys, 33)!;
    expect(early.links.battery.direction).toBe(1);
    const late = sampleFlowLinks(keys, 47)!;
    expect(late.links.battery.direction).toBe(-1);
  });
});
