import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { SUNNY_FACE_VARIANTS, SUNNY_EYE_COLORS, isNewFace } from "../src/engine/characters/sunny/faceVariants";
import { buildHeadGeometry, eyeDirection, headSurface } from "../src/engine/characters/sunny/headGeometry";
import { irisTexture } from "../src/engine/characters/sunny/eyeTexture";
import { EXPRESSIONS } from "../src/engine/characters/expressions";
import { CLIPS, evaluatePose } from "../src/engine/animation/clips";
import { Episode } from "../src/schemas/episode";
import { SUNNY } from "../src/engine/characters/library";
import blinkTest from "../src/episodes/review/sunny-eye/blink-gaze-test.json";

describe("Sunny face redesign", () => {
  it("defines variants A, B, C; the owner-approved variant B is Sunny's default", () => {
    expect(Object.keys(SUNNY_FACE_VARIANTS)).toEqual(["A", "B", "C"]);
    expect(isNewFace("v1")).toBe(false);
    expect(SUNNY.defaultVariant).toBe("B");
  });

  it("uses the owner eye palette", () => {
    expect(SUNNY_EYE_COLORS.sclera).toBe("#FFF4E8");
    expect(SUNNY_EYE_COLORS.irisBase).toBe("#8050A1");
    expect(SUNNY_EYE_COLORS.irisHighlight).toBe("#B68AC8");
    expect(SUNNY_EYE_COLORS.pupil).toBe("#302039");
    expect(SUNNY_EYE_COLORS.upperLid).toBe("#59382D");
  });

  it.each(["A", "B", "C"] as const)("variant %s: proportions within the brief", (id) => {
    const v = SUNNY_FACE_VARIANTS[id];
    expect(v.eyeHeightRatio).toBeGreaterThanOrEqual(1.15);
    expect(v.irisWidth).toBeGreaterThanOrEqual(0.8);
    expect(v.pupilWidth).toBeLessThan(v.irisWidth);
    expect(v.catchlightPrimary).toBeGreaterThan(v.catchlightSecondary);
    expect(v.eyeRoughness).toBeGreaterThanOrEqual(0.25);
    expect(v.eyeRoughness).toBeLessThanOrEqual(0.4);
  });

  it.each(["A", "B", "C"] as const)("variant %s: head is smooth on the face, faceted on the sides, with a cream region", (id) => {
    const v = SUNNY_FACE_VARIANTS[id];
    const g = buildHeadGeometry(v, "#E8913A", "#FDE6CD");
    const pos = g.attributes.position!;
    const nrm = g.attributes.normal!;
    const col = g.attributes.color!;
    expect(pos.count / 3).toBeLessThanOrEqual(5120); // moderate complexity
    // facets on the back: the three vertex normals of a back triangle are identical
    let backFlat = 0;
    let backTris = 0;
    let creamFront = 0;
    let frontTris = 0;
    for (let t = 0; t < pos.count; t += 3) {
      const z = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3;
      if (z < -0.1) {
        backTris++;
        const a = new THREE.Vector3().fromBufferAttribute(nrm, t);
        const b = new THREE.Vector3().fromBufferAttribute(nrm, t + 1);
        if (a.distanceTo(b) < 1e-4) backFlat++;
      }
      if (z > 0.2) frontTris++;
      if (z > 0.2 && col.getY(t) > 0.6) creamFront++; // linear: cream G ≈ 0.79, fur G ≈ 0.28
    }
    expect(backFlat / backTris).toBeGreaterThan(0.95);
    // a substantial cream facial region on the front of the head
    expect(creamFront / frontTris).toBeGreaterThan(0.1);
  });

  it("eyes sit on the head surface, symmetric and facing forward", () => {
    const v = SUNNY_FACE_VARIANTS.A;
    const l = headSurface(v, eyeDirection(v, 1));
    const r = headSurface(v, eyeDirection(v, -1));
    expect(l.point.x).toBeCloseTo(-r.point.x, 5);
    expect(l.point.y).toBeCloseTo(r.point.y, 5);
    expect(l.normal.z).toBeGreaterThan(0.7);
  });

  it("iris texture is deterministic", () => {
    const a = irisTexture(0.84, 0.6, 1.2);
    expect(irisTexture(0.84, 0.6, 1.2)).toBe(a); // cached
    const d = a.image.data as Uint8Array;
    expect(d.length).toBe(512 * 256 * 4);
  });

  it("expression controls exist for every requested state", () => {
    for (const e of ["neutral", "happy", "talk", "listening", "thinking", "surprised", "concerned", "laughing", "look-left", "look-right", "look-up", "look-down"]) {
      expect(EXPRESSIONS[e], e).toBeDefined();
    }
    expect(CLIPS.blink).toBeDefined();
    // a deliberate blink closes both eyes mid-way, deterministically
    const p = evaluatePose(2, 30, 7, [{ clip: "blink", from: 0, durationInFrames: 7, blendFrames: 1, weight: 1, params: {} }]);
    expect(p.face.eyelids[0]).toBeGreaterThan(0.9);
    expect(p.face.eyelids[1]).toBeGreaterThan(0.9);
  });

  it("the 5-second test is valid and uses all three variants", () => {
    const ep = Episode.parse(blinkTest);
    expect(ep.scenes[0]!.durationInFrames / ep.fps).toBe(5);
    expect(ep.cast.map((c) => c.variant)).toEqual(["A", "B", "C"]);
  });
});
