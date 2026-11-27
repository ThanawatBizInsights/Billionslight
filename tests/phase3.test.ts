import { describe, expect, it } from "vitest";
import { evaluatePose } from "../src/engine/animation/clips";
import { episodeDurationInFrames, sceneOverlap, sceneStartFrames } from "../src/schemas/episode";
import { SHOTS, SHOT_IDS, type ShotContext } from "../src/engine/cameras/shots";
import { CUTAWAY_APPLIANCES, appliancePowered, cutawayCables } from "../src/engine/environments/CutawayHouse";
import { ENVIRONMENTS } from "../src/engine/environments/registry";

const still = { travel: 0, speed: 0 };

describe("locomotion", () => {
  it("auto-walk is deterministic and depends on travel, not frame", () => {
    const a = evaluatePose(10, 30, 7, [], undefined, undefined, { travel: 1.2, speed: 1 });
    const b = evaluatePose(10, 30, 7, [], undefined, undefined, { travel: 1.2, speed: 1 });
    expect(a).toEqual(b);
    const c = evaluatePose(10, 30, 7, [], undefined, undefined, { travel: 1.5, speed: 1 });
    expect(c.joints.hipL).not.toEqual(a.joints.hipL);
  });

  it("legs alternate while walking and stay neutral when standing", () => {
    const p = evaluatePose(10, 30, 7, [], undefined, undefined, { travel: 0.35, speed: 1 });
    const lx = p.joints.hipL?.[0] ?? 0;
    const rx = p.joints.hipR?.[0] ?? 0;
    expect(Math.sign(lx)).not.toBe(Math.sign(rx));
    const s = evaluatePose(10, 30, 7, [], undefined, undefined, still);
    expect(Math.abs(s.joints.hipL?.[0] ?? 0)).toBeLessThan(0.05);
  });

  it("autoWalk=false disables the walk layer", () => {
    const off = evaluatePose(10, 30, 7, [], undefined, undefined, { travel: 0.35, speed: 1 }, false);
    const s = evaluatePose(10, 30, 7, [], undefined, undefined, still);
    expect(off.joints.hipL).toEqual(s.joints.hipL);
  });
});

describe("scene transitions", () => {
  const scene = (d: number, type: "cut" | "fade" | "dip-to-navy" = "cut", t = 0) => ({ durationInFrames: d, transitionIn: { type, durationInFrames: t } });
  it("cuts and dips do not overlap; fades overlap the previous scene", () => {
    const ep = { scenes: [scene(60), scene(60, "fade", 15), scene(60, "dip-to-navy", 20)] } as never;
    expect(sceneOverlap(ep, 0)).toBe(0);
    expect(sceneOverlap(ep, 1)).toBe(15);
    expect(sceneOverlap(ep, 2)).toBe(0);
    expect(sceneStartFrames(ep)).toEqual([0, 45, 105]);
    expect(episodeDurationInFrames(ep)).toBe(165);
  });
  it("a fade can never exceed either scene", () => {
    const ep = { scenes: [scene(10), scene(60, "fade", 30)] } as never;
    expect(sceneOverlap(ep, 1)).toBe(10);
  });
});

describe("camera shots", () => {
  const ctx = (frame: number, params = {}): ShotContext => ({
    frame,
    durationInFrames: 90,
    aspect: 9 / 16,
    subject: (f) => [f * 0.01, 1.4, 0],
    subject2: () => [1.2, 1.3, 0.2],
    subjectYaw: () => 0,
    params,
  });
  it("every preset returns finite cameras and is deterministic", () => {
    expect(SHOT_IDS.length).toBeGreaterThanOrEqual(14);
    for (const id of SHOT_IDS) {
      for (const f of [0, 45, 89]) {
        const a = SHOTS[id]!(ctx(f));
        expect([...a.position, ...a.target, a.fov].every(Number.isFinite), id).toBe(true);
        expect(SHOTS[id]!(ctx(f))).toEqual(a);
      }
    }
  });
  it("dolly in moves closer over the shot, dolly out moves away", () => {
    const d = (id: string, f: number) => {
      const s = SHOTS[id]!({ ...ctx(f), subject: () => [0, 1, 0] });
      return Math.hypot(s.position[0], s.position[1] - 1, s.position[2]);
    };
    expect(d("slow-dolly-in", 89)).toBeLessThan(d("slow-dolly-in", 0));
    expect(d("slow-dolly-out", 89)).toBeGreaterThan(d("slow-dolly-out", 0));
  });
});

describe("energy cutaway house", () => {
  const on = { housePower: 1, backupPower: 0 };
  const outageBackup = { housePower: 0, backupPower: 1 };
  const outage = { housePower: 0, backupPower: 0 };
  const hybrid = { system: "hybrid", battery: true };
  it("is registered", () => expect(ENVIRONMENTS["energy-cutaway-house"]).toBeDefined());
  it("all appliances run on normal grid/solar supply", () => {
    for (const a of CUTAWAY_APPLIANCES) expect(appliancePowered(a, on, hybrid)).toBe(1);
  });
  it("during an outage only backup-circuit loads run, and only on a hybrid system", () => {
    expect(appliancePowered({ id: "fridge" }, outageBackup, hybrid)).toBe(1);
    expect(appliancePowered({ id: "ac-living" }, outageBackup, hybrid)).toBe(0);
    expect(appliancePowered({ id: "fridge" }, outageBackup, { system: "on-grid" })).toBe(0);
    expect(appliancePowered({ id: "fridge" }, outage, hybrid)).toBe(0);
    expect(appliancePowered({ id: "tv" }, outageBackup, { ...hybrid, backupLoads: ["tv"] })).toBe(1);
  });
  it("on-grid has no backup or battery routes; hybrid adds them", () => {
    const g = cutawayCables({ system: "on-grid" });
    expect(Object.keys(g).some((k) => k.startsWith("load:backup:") || k.includes("battery") || k === "inverter-to-backup")).toBe(false);
    const h = cutawayCables(hybrid);
    expect(h["inverter-to-backup"]).toBeDefined();
    expect(h["inverter-to-battery"]).toBeDefined();
    expect(h["load:backup:fridge"]).toBeDefined();
    expect(h["load:backup:ac-living"]).toBeUndefined();
  });
});
