import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Episode } from "../src/schemas/episode";
import foundation from "../src/episodes/foundation-test.episode.json";
import { LIGHTING_PRESETS } from "../src/engine/lighting/presets";
import { CAMERA_PRESETS } from "../src/engine/cameras/presets";
import { CHARACTER_LIBRARY } from "../src/engine/characters/library";
import { CLIPS } from "../src/engine/animation/clips";
import { HOUSE_ANCHORS } from "../src/engine/environments/ModernThaiHouse";

const root = path.resolve(__dirname, "..");

describe("asset availability", () => {
  it("Thai fonts are bundled locally", () => {
    for (const w of ["400", "700", "800"]) {
      for (const subset of ["thai", "latin"]) {
        const f = path.join(root, `public/assets/fonts/noto-sans-thai-${subset}-${w}-normal.woff2`);
        expect(fs.existsSync(f), f).toBe(true);
        expect(fs.statSync(f).size).toBeGreaterThan(1000);
      }
    }
  });

  it("every asset referenced by the foundation episode exists in a library", () => {
    const ep = Episode.parse(foundation);
    for (const c of ep.cast) expect(CHARACTER_LIBRARY[c.characterId], c.characterId).toBeDefined();
    for (const s of ep.scenes) {
      expect(LIGHTING_PRESETS[s.lighting.preset]).toBeDefined();
      if (s.camera.preset) expect(CAMERA_PRESETS[s.camera.preset]).toBeDefined();
      for (const t of s.characters) {
        for (const c of t.clips) {
          expect(CLIPS[c.clip], c.clip).toBeDefined();
          const target = c.params.pointAt;
          if (typeof target === "string") expect(HOUSE_ANCHORS[target as keyof typeof HOUSE_ANCHORS], target).toBeDefined();
        }
      }
    }
  });

  it("temporary characters are flagged as such", () => {
    expect(CHARACTER_LIBRARY["temp-engineer"]!.status).toBe("temporary");
    // Sunny must not exist until the official character sheet is approved.
    expect(CHARACTER_LIBRARY["sunny"]).toBeUndefined();
  });
});

describe("thai text", () => {
  it("Thai strings in the episode are NFC-normalised (vowel/tone mark order)", () => {
    const texts: string[] = [];
    JSON.stringify(foundation, (_k, v) => {
      if (typeof v === "string" && /[฀-๿]/.test(v)) texts.push(v);
      return v;
    });
    expect(texts.length).toBeGreaterThan(0);
    for (const t of texts) {
      expect(t.normalize("NFC")).toBe(t);
      // a tone mark must never directly precede an upper/lower vowel (common typing error)
      expect(/[่-๋][ัิ-ฺ็]/.test(t), t).toBe(false);
    }
  });
});
