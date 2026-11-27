#!/usr/bin/env node
/**
 * Energy-flow visual standard review (V3, approved travelling pulse): 5-second tests on the same house,
 * equipment layout, camera and (where appropriate) lighting.
 *   node scripts/review/build-energy-flow-review.mjs
 * → src/episodes/energy-flow-review/*.json + renders/energy-flow-review/v3/stills-plan.json
 * (08 = cable-length test: composition EnergyFlowCableTest)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "src/episodes/energy-flow-review");
fs.mkdirSync(outDir, { recursive: true });

const base = { pvRatedKw: 5, inverterRatedKw: 5, householdLoadKw: 2.5, backupLoadKw: 0.8, exportPermitted: false };
const battery = (soc) => ({ present: true, capacityKwh: 10, stateOfCharge: soc, maxPowerKw: 5 });
const fullBackup = { backupOutputConfigured: true, gridIsolationDevice: true, loadsOnBackupCircuit: true };
const onGrid = { system: "on-grid" };
const hybrid = { system: "hybrid", battery: true, backupLoads: ["fridge", "light-living", "fan"] };

/** One fixed camera for every test (comparison). */
export const REVIEW_CAMERA = { frame: 0, position: [21.44, 24.49, 45.29], target: [2.5, 1, 0.5], fov: 30 };

const TESTS = [
  { id: "01-on-grid-normal", title: "ออนกริด · ใช้งานปกติ\n(โซลาร์พอดีกับการใช้ไฟ)", options: onGrid, lighting: "midday-sun",
    scenario: { ...base, inverterType: "grid-tied", gridStatus: "connected", solarIrradiance: 0.5, householdLoadKw: 2.5 } },
  { id: "02-solar-with-grid-import", title: "โซลาร์ + ไฟฟ้าจากการไฟฟ้า", options: onGrid, lighting: "midday-sun",
    scenario: { ...base, inverterType: "grid-tied", gridStatus: "connected", solarIrradiance: 0.4, householdLoadKw: 3 } },
  { id: "03-surplus-export", title: "ส่งไฟฟ้าส่วนเกินกลับเข้าระบบ\n(เฉพาะระบบที่ได้รับอนุญาต)", options: onGrid, lighting: "midday-sun",
    scenario: { ...base, inverterType: "grid-tied", gridStatus: "connected", solarIrradiance: 0.9, householdLoadKw: 1.5, exportPermitted: true } },
  { id: "04-battery-charging", title: "ไฮบริด · ชาร์จแบตเตอรี่จากโซลาร์", options: hybrid, lighting: "midday-sun",
    scenario: { ...base, inverterType: "hybrid", gridStatus: "connected", solarIrradiance: 0.9, householdLoadKw: 1.5, battery: battery(0.5), backup: fullBackup } },
  { id: "05-battery-discharging-night", title: "ไฮบริด · กลางคืน\nจ่ายไฟจากแบตเตอรี่", options: hybrid, lighting: "night",
    scenario: { ...base, inverterType: "hybrid", gridStatus: "connected", solarIrradiance: 0, householdLoadKw: 1.8, battery: battery(0.8), backup: fullBackup } },
  { id: "06-on-grid-outage", title: "ออนกริด · ไฟดับ\nอินเวอร์เตอร์หยุดจ่ายไฟ", options: onGrid, lighting: "midday-sun",
    scenario: { ...base, inverterType: "grid-tied", gridStatus: "outage", solarIrradiance: 0.9, householdLoadKw: 2.5 } },
  { id: "07-hybrid-backup", title: "ไฮบริด · ไฟดับ\nระบบไฟสำรองทำงาน", options: hybrid, lighting: "midday-sun",
    scenario: { ...base, inverterType: "hybrid", gridStatus: "outage", solarIrradiance: 0.5, householdLoadKw: 2.5, backupLoadKw: 0.8, battery: battery(0.7), backup: fullBackup } },
  { id: "09-night-hybrid-backup", title: "กลางคืน · ไฟดับ\nแบตเตอรี่จ่ายระบบไฟสำรอง", options: hybrid, lighting: "night",
    scenario: { ...base, inverterType: "hybrid", gridStatus: "outage", solarIrradiance: 0, householdLoadKw: 2.5, backupLoadKw: 0.8, battery: battery(0.7), backup: fullBackup } },
];

const plan = { outDir: "renders/energy-flow-review/v3/stills", jobs: [] };
for (const t of TESTS) {
  const episode = {
    schemaVersion: 1,
    id: `energy-flow-${t.id}`,
    title: `Energy-flow standard review · ${t.id}`,
    topic: "Visual standard test (silent). Simplified educational model, not a wiring diagram. kW values are illustrative.",
    language: "th",
    aspectRatio: "9:16",
    fps: 30,
    cast: [],
    scenes: [
      {
        id: "test",
        durationInFrames: 150,
        environment: { id: "energy-cutaway-house", options: t.options },
        lighting: { preset: t.lighting },
        camera: { keyframes: [REVIEW_CAMERA] },
        electrical: [{ frame: 0, scenario: t.scenario, transitionFrames: 0 }],
        energyFlow: { labels: true, legend: true, pathScale: 1.8 },
        overlays: [{ id: "title", kind: "title", text: t.title, from: 0, durationInFrames: 150, anchor: [0.5, 0.04], style: "compact" }],
      },
    ],
    branding: { showLogo: false },
    approval: { status: "visual-review", history: [] },
  };
  const file = path.join(outDir, `${t.id}.json`);
  fs.writeFileSync(file, JSON.stringify(episode, null, 2) + "\n");
  plan.jobs.push({ episode: path.relative(root, file), frame: 75, out: `${t.id}.png`, quality: "preview" });
}
fs.mkdirSync(path.join(root, "renders/energy-flow-review/v3"), { recursive: true });
fs.writeFileSync(path.join(root, "renders/energy-flow-review/v3/stills-plan.json"), JSON.stringify(plan, null, 1) + "\n");
console.log(`wrote ${TESTS.length} episodes + stills plan`);
