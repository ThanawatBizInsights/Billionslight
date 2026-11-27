import { describe, expect, it } from "vitest";
import { CHARACTER_LIBRARY, getCharacter, SUNNY, TON } from "../src/engine/characters/library";
import { eyeHeightWorld, modelScale } from "../src/engine/characters/CharacterModel";
import { EXPRESSIONS, getExpression } from "../src/engine/characters/expressions";
import { evaluatePose } from "../src/engine/animation/clips";
import { PROPS, PROP_GRIPS } from "../src/engine/props/Props";
import { Episode } from "../src/schemas/episode";
import { sampleEnvironmentState, sampleLighting, sampleExpression } from "../src/engine/scene/SceneView";
import { sampleCamera } from "../src/engine/cameras/CameraRig";
import { cameraKeysForScene } from "../src/engine/scene/SceneView";
import { blendPresets, getLightingPreset } from "../src/engine/lighting/presets";
import test10s from "../src/episodes/phase2-living-room-test.episode.json";

describe("approved character design decisions", () => {
  it("Sunny is 1.35 m and ≈79% of Ton (1.70 m)", () => {
    expect(SUNNY.heightM).toBe(1.35);
    expect(TON.heightM).toBe(1.7);
    expect(SUNNY.heightM / TON.heightM).toBeCloseTo(0.794, 2);
  });
  it("Ton uses the owner-approved ID and name", () => {
    expect(TON.id).toBe("homeowner_male_01");
    expect(TON.displayName).toBe("Ton");
    expect(TON.displayNameTh).toBe("ต้น");
  });
  it("Sunny's hard hat is pure white, not pink", () => {
    const c = SUNNY.colors.helmet!.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
    expect(Math.min(r!, g!, b!)).toBeGreaterThan(235);
    expect(Math.max(r!, g!, b!) - Math.min(r!, g!, b!)).toBeLessThan(8);
  });
  it("model scale maps each body plan to its approved height", () => {
    expect(modelScale(SUNNY)).toBeGreaterThan(1);
    expect(modelScale(TON)).toBeLessThan(1);
    expect(eyeHeightWorld(SUNNY)).toBeLessThan(eyeHeightWorld(TON));
  });
  it("reserved IDs give a clear error", () => {
    expect(() => getCharacter("homeowner_female_01")).toThrow(/reserved/);
    expect(Object.keys(CHARACTER_LIBRARY)).not.toContain("homeowner_female_01");
  });
  it("every default expression exists", () => {
    for (const c of Object.values(CHARACTER_LIBRARY)) expect(() => getExpression(c.defaultExpression)).not.toThrow();
    expect(Object.keys(EXPRESSIONS).length).toBeGreaterThanOrEqual(10);
  });
  it("props are separate assets with grips", () => {
    for (const id of Object.keys(PROPS)) expect(PROP_GRIPS[id], id).toBeDefined();
  });
});

describe("sitting adapts to each body", () => {
  it("hips land on the seat for both characters", () => {
    for (const def of [SUNNY, TON]) {
      const s = modelScale(def);
      const pose = evaluatePose(20, 30, def.seed, [{ clip: "sit", from: 0, durationInFrames: 60, blendFrames: 1, weight: 1, params: { seatHeight: 0.5 } }], undefined, { ...def.body, scale: s });
      expect((def.body.hipHeight + pose.rootY) * s).toBeCloseTo(0.5, 1);
    }
  });
});

describe("10-second living-room test episode", () => {
  const ep = Episode.parse(test10s);
  const scene = ep.scenes[0]!;
  it("is 10 s, vertical, silent, two approved-scope characters", () => {
    expect(scene.durationInFrames / ep.fps).toBe(10);
    expect(ep.aspectRatio).toBe("9:16");
    expect(ep.cast.map((c) => c.characterId).sort()).toEqual(["homeowner_male_01", "sunny"]);
    expect(scene.audio).toEqual([]);
  });
  it("has at least three camera set-ups joined by hard cuts", () => {
    const keys = cameraKeysForScene(scene, [0, 0, 0]);
    const cuts = keys.filter((k) => k.easing === "hold");
    expect(cuts.length).toBeGreaterThanOrEqual(2);
    // a cut changes the camera between two consecutive frames
    for (const c of cuts) {
      const before = sampleCamera(keys, c.frame - 1).position;
      const after = sampleCamera(keys, c.frame).position;
      expect(Math.hypot(before[0] - after[0], before[1] - after[1], before[2] - after[2])).toBeGreaterThan(0.5);
    }
  });
  it("power cuts at 200: lights off, lighting blends evening → power-outage", () => {
    const st = (f: number) => sampleEnvironmentState(scene, { power: 1, lights: 1 }, f);
    expect(st(199).power).toBe(1);
    expect(st(205).power).toBe(0);
    expect(sampleLighting(scene, 150).id).toBe("evening");
    expect(sampleLighting(scene, 260).id).toBe("power-outage");
  });
  it("uses eye contact (look-at between the two characters)", () => {
    for (const t of scene.characters) expect(t.lookAt.some((l) => typeof l.target === "object" && !Array.isArray(l.target))).toBe(true);
  });
  it("expressions change over the shot", () => {
    const ton = scene.characters.find((c) => c.castId === "ton")!;
    expect(sampleExpression(ton, TON, 230).mouthOpen).toBeGreaterThan(sampleExpression(ton, TON, 150).mouthOpen);
  });
});

describe("lighting blend", () => {
  it("is an endpoint-exact interpolation", () => {
    const a = getLightingPreset("evening");
    const b = getLightingPreset("power-outage");
    expect(blendPresets(a, b, 0)).toBe(a);
    expect(blendPresets(a, b, 1)).toBe(b);
    expect(blendPresets(a, b, 0.5).interiorGlow).toBeCloseTo((a.interiorGlow + b.interiorGlow) / 2);
  });
});
