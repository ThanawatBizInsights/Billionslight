import { describe, expect, it } from "vitest";
import { blinkAmount, noise1, progress, rand, sampleNumber } from "../src/engine/animation/core";
import { aimArm, clipEnvelope, evaluatePose } from "../src/engine/animation/clips";
import * as THREE from "three";

const clips = [
  { clip: "wave", from: 6, durationInFrames: 56, blendFrames: 10, weight: 1, params: { hand: "left" } },
  { clip: "point", from: 66, durationInFrames: 84, blendFrames: 12, weight: 1, params: { yaw: -1, pitch: 0.6 } },
  { clip: "talk", from: 72, durationInFrames: 70, blendFrames: 4, weight: 1, params: {} },
];

describe("deterministic animation", () => {
  it("evaluates identical poses for the same frame regardless of order", () => {
    const forward = Array.from({ length: 150 }, (_, f) => evaluatePose(f, 30, 101, clips));
    const random = [97, 3, 149, 66, 0, 120];
    for (const f of random) expect(evaluatePose(f, 30, 101, clips)).toEqual(forward[f]);
  });

  it("seeded random and noise are reproducible", () => {
    expect(rand(5, 10)).toBe(rand(5, 10));
    expect(rand(5, 10)).not.toBe(rand(6, 10));
    expect(noise1(3, 1.25)).toBe(noise1(3, 1.25));
    expect(Math.abs(noise1(3, 1.25))).toBeLessThanOrEqual(1);
  });

  it("blinks are short, bounded and reproducible", () => {
    const values = Array.from({ length: 300 }, (_, f) => blinkAmount(f, 30, 42));
    expect(values.every((v) => v >= 0 && v <= 1)).toBe(true);
    expect(values.filter((v) => v > 0.9).length).toBeGreaterThan(0);
    expect(values.filter((v) => v > 0).length).toBeLessThan(60);
  });

  it("keyframe sampling holds at the ends and eases between", () => {
    const keys = [{ frame: 10, value: 0 }, { frame: 20, value: 10, easing: "linear" as const }];
    expect(sampleNumber(keys, 0)).toBe(0);
    expect(sampleNumber(keys, 15)).toBe(5);
    expect(sampleNumber(keys, 99)).toBe(10);
    expect(progress(5, 0, 10, "easeInOut")).toBeCloseTo(0.5);
  });

  it("clip envelopes blend in and out", () => {
    const c = { from: 10, durationInFrames: 40, blendFrames: 10 };
    expect(clipEnvelope(9, c)).toBe(0);
    expect(clipEnvelope(30, c)).toBe(1);
    expect(clipEnvelope(15, c)).toBeGreaterThan(0);
    expect(clipEnvelope(15, c)).toBeLessThan(1);
    expect(clipEnvelope(51, c)).toBe(0);
  });

  it("left-hand clips move the left arm, not the right", () => {
    const pose = evaluatePose(30, 30, 1, [clips[0]!]);
    expect(pose.joints.shoulderL![2]).toBeGreaterThan(1.5); // raised out to the side
    expect(Math.abs(pose.joints.shoulderR![2])).toBeLessThan(0.3);
  });

  it("aimArm points a hanging arm in the requested direction", () => {
    const [x, y, z] = aimArm(-Math.PI / 2, 0); // character's right, horizontal
    const v = new THREE.Vector3(0, -1, 0).applyEuler(new THREE.Euler(x, y, z, "XYZ"));
    expect(v.x).toBeCloseTo(-1, 5);
    expect(v.y).toBeCloseTo(0, 5);
  });

  it("rejects unknown clips", () => {
    expect(() => evaluatePose(10, 30, 1, [{ clip: "moonwalk", from: 0, durationInFrames: 20, blendFrames: 2, weight: 1, params: {} }])).toThrow(/Unknown animation clip/);
  });
});
