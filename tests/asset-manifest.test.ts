import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AssetManifest } from "../src/schemas/asset-manifest";
import manifestJson from "../src/assets/asset-manifest.json";
import { CHARACTER_LIBRARY } from "../src/engine/characters/library";
import { ENVIRONMENTS } from "../src/engine/environments/registry";
import { LIGHTING_PRESETS } from "../src/engine/lighting/presets";
import { CAMERA_PRESETS } from "../src/engine/cameras/presets";

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
    ];
    for (const id of engineIds) expect(byId.has(id), `manifest missing "${id}"`).toBe(true);
  });

  it("points implementations at files that exist", () => {
    for (const a of manifest.assets) {
      if (a.implementation) expect(fs.existsSync(path.join(root, a.implementation)), `${a.id}: ${a.implementation}`).toBe(true);
    }
  });

  it("nothing is approved yet — approval is recorded by the owner only", () => {
    expect(manifest.assets.filter((a) => a.status === "approved")).toEqual([]);
  });

  it("Sunny stays authoritative: no engine implementation until the low-poly adaptation is approved", () => {
    const sunny = byId.get("sunny")!;
    expect(sunny.status).not.toBe("approved");
    expect(CHARACTER_LIBRARY["sunny"]).toBeUndefined();
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
