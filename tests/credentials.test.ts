import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { requireVoice, resolveElevenLabsConfig } from "../src/engine/audio/elevenlabs-config";

describe("missing credentials", () => {
  it("falls back to cache/mock audio when no key is set", () => {
    const cfg = resolveElevenLabsConfig({});
    expect(cfg.mode).toBe("cache-or-mock");
    expect(cfg.reasons.join(" ")).toMatch(/ELEVENLABS_API_KEY/);
  });

  it("never enables paid calls with a key but without explicit opt-in", () => {
    expect(resolveElevenLabsConfig({ ELEVENLABS_API_KEY: "x" }).mode).toBe("cache-or-mock");
    expect(resolveElevenLabsConfig({ ELEVENLABS_API_KEY: "x", ELEVENLABS_ALLOW_PAID_CALLS: "true" }).mode).toBe("elevenlabs");
  });

  it("reports a missing voice ID clearly", () => {
    expect(() => requireVoice(resolveElevenLabsConfig({}), "sunny")).toThrow(/ELEVENLABS_VOICE_SUNNY/);
  });

  it(".env is git-ignored and .env.example holds no secrets", () => {
    const root = path.resolve(__dirname, "..");
    expect(fs.readFileSync(path.join(root, ".gitignore"), "utf8")).toMatch(/^\.env$/m);
    const example = fs.readFileSync(path.join(root, ".env.example"), "utf8");
    expect(example).toMatch(/^ELEVENLABS_API_KEY=$/m);
  });
});
