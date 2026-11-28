import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AssetManifest } from "../src/schemas/asset-manifest";
import manifestJson from "../src/assets/asset-manifest.json";
import { CHARACTER_LIBRARY } from "../src/engine/characters/library";
import { ENVIRONMENTS } from "../src/engine/environments/registry";
import { LIGHTING_PRESETS } from "../src/engine/lighting/presets";
import { CAMERA_PRESETS } from "../src/engine/cameras/presets";
import { PROPS } from "../src/engine/props/Props";
import { CLIPS } from "../src/engine/animation/clips";
import { SOUND_LIBRARY } from "../src/engine/audio/library";

const root = path.resolve(__dirname, "..");
const manifest = AssetManifest.parse(manifestJson);
const byId = new Map(manifest.assets.map((a) => [a.id, a]));

describe("asset manifest", () => {
  it("is valid", () => {
    expect(manifest.assets.length).toBeGreaterThan(50);
  });

  it("registers every asset the engine already implements", () => {
    const engineIds = [
      ...Object.keys(CHARACTER_LIBRARY),
      ...Object.keys(ENVIRONMENTS),
      ...Object.keys(LIGHTING_PRESETS),
      ...Object.keys(CAMERA_PRESETS),
      ...Object.keys(PROPS),
      ...Object.keys(CLIPS),
      ...Object.keys(SOUND_LIBRARY),
    ];
    for (const id of engineIds) expect(byId.has(id), `manifest missing "${id}"`).toBe(true);
  });

  it("points implementations at files that exist", () => {
    for (const a of manifest.assets) {
      if (a.implementation) expect(fs.existsSync(path.join(root, a.implementation)), `${a.id}: ${a.implementation}`).toBe(true);
    }
  });

  it("Phase 2 characters approved; May is reserved; teammates deferred", () => {
    expect(byId.get("sunny")!.status).toBe("approved");
    expect(byId.get("homeowner_male_01")!.status).toBe("approved");
    expect(byId.get("homeowner_female_01")!.status).toBe("reserved");
    expect(byId.get("squirrel-teammate-red")!.status).toBe("deferred");
    expect(byId.get("sunny")!.scale!.heightM).toBe(1.35);
    expect(byId.get("homeowner_male_01")!.scale!.heightM).toBe(1.7);
  });

  it("Phase 2 approval: Sunny (face B), Ton and the palette are approved; nothing is left awaiting review", () => {
    const approved = new Set(manifest.assets.filter((a) => a.status === "approved").map((a) => a.id));
    for (const id of ["scene-palette", "sunny-face-b", "sunny", "homeowner_male_01", "modern-thai-house", "living-room", "garage-service-area"]) expect(approved.has(id), id).toBe(true);
    expect(manifest.assets.filter((a) => a.phase <= 2 && a.status === "awaiting-visual-approval")).toEqual([]);
  });

  it("third-party material is reference-only", () => {
    for (const id of ["supplier-flyers", "vendor-product-photos", "partner-brand-logos"]) expect(byId.get(id)!.status).toBe("reference-only");
  });

  it("contains no Drive links or file IDs (public repository)", () => {
    const raw = fs.readFileSync(path.join(root, "src/assets/asset-manifest.json"), "utf8");
    expect(raw).not.toMatch(/drive\.google|docs\.google|usp=sharing/);
  });

  const refRoot = path.join(root, manifest.referenceRoot);
  it.skipIf(!fs.existsSync(refRoot))("every referenced local file exists (when references are downloaded)", () => {
    for (const a of manifest.assets) for (const r of a.references) expect(fs.existsSync(path.join(refRoot, r.file)), `${a.id}: ${r.file}`).toBe(true);
  });

  it("reference copies are git-ignored", () => {
    expect(fs.readFileSync(path.join(root, ".gitignore"), "utf8")).toMatch(/^public\/assets\/references\/drive\/$/m);
  });
});

describe("drive-id guard", () => {
  it("rejects a real-looking Drive ID but accepts kebab file names", () => {
    const base = manifestJson as unknown as { assets: Record<string, unknown>[] };
    const bad = { ...base, assets: [{ ...base.assets[0], notes: "see 1AbCdEfGhIjKlMnOpQrStUvWxYz0123456" }] };
    expect(() => AssetManifest.parse(bad)).toThrow(/Drive link/);
    const ok = { ...base, assets: [{ ...base.assets[0], notes: "boards/05-solar-house-environment-sheet.png" }] };
    expect(() => AssetManifest.parse(ok)).not.toThrow();
  });
});
