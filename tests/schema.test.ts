import { describe, expect, it } from "vitest";
import { Episode, episodeDurationInFrames, sceneStartFrames } from "../src/schemas/episode";
import foundation from "../src/episodes/foundation-test.episode.json";

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe("episode schema", () => {
  it("accepts the foundation test episode", () => {
    const ep = Episode.parse(foundation);
    expect(ep.id).toBe("foundation-test");
    expect(ep.aspectRatio).toBe("9:16");
  });

  it("applies defaults", () => {
    const ep = Episode.parse(foundation);
    expect(ep.scenes[0]!.transitionIn.type).toBe("cut");
    expect(ep.scenes[0]!.characters[0]!.clips[0]!.weight).toBe(1);
  });

  it("rejects unknown cast references", () => {
    const bad = clone(foundation);
    bad.scenes[0]!.characters[0]!.castId = "nobody";
    expect(() => Episode.parse(bad)).toThrow(/unknown cast/);
  });

  it("rejects claims that cite missing references", () => {
    const bad = clone(foundation);
    bad.technicalClaims[0]!.referenceIds = ["missing-ref"];
    expect(() => Episode.parse(bad)).toThrow(/unknown reference/);
  });

  it("rejects non-kebab asset IDs and duplicate scene IDs", () => {
    const bad = clone(foundation);
    bad.scenes[0]!.environment.id = "Modern House";
    expect(() => Episode.parse(bad)).toThrow();
    const dup = clone(foundation);
    dup.scenes.push(clone(dup.scenes[0]!));
    expect(() => Episode.parse(dup)).toThrow(/unique/);
  });

  it("rejects out-of-range electrical values", () => {
    const bad = clone(foundation);
    bad.scenes[0]!.electrical[0]!.scenario.solarIrradiance = 1.4;
    expect(() => Episode.parse(bad)).toThrow();
  });
});

describe("scene duration calculations", () => {
  it("sums scene durations and computes start frames", () => {
    const ep = Episode.parse(foundation);
    const two = { scenes: [ep.scenes[0]!, { ...ep.scenes[0]!, id: "b", durationInFrames: 120 }] };
    expect(episodeDurationInFrames(two)).toBe(270);
    expect(sceneStartFrames(two)).toEqual([0, 150]);
  });

  it("foundation test is exactly 5 s at 30 fps", () => {
    const ep = Episode.parse(foundation);
    expect(episodeDurationInFrames(ep) / ep.fps).toBe(5);
  });
});
