import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Episode } from "../src/schemas/episode";

const dir = path.resolve(__dirname, "../src/episodes");
const load = (f: string) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
const base = () => load("phase5-blackout-sunny-day.episode.json");

describe("episode approval gate", () => {
  it("every top-level episode is approved by the owner and validates", () => {
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".episode.json"))) {
      const ep = Episode.parse(load(f));
      expect(ep.approval.status, f).toBe("approved");
      expect(ep.approval.history.some((h) => h.status === "approved" && h.by === "owner"), f).toBe(true);
      for (const c of ep.technicalClaims) expect(c.status, `${f} ${c.id}`).toBe("verified");
    }
  });

  it("refuses an approved episode with an unverified claim", () => {
    const ep = base();
    ep.technicalClaims[0].status = "needs-human-review";
    expect(() => Episode.parse(ep)).toThrow(/must be verified by a named human reviewer/);
  });

  it("refuses a verified claim without a named reviewer", () => {
    const ep = base();
    delete ep.technicalClaims[0].reviewer;
    expect(() => Episode.parse(ep)).toThrow(/named human reviewer/);
  });

  it("refuses approval without an approval history entry", () => {
    const ep = base();
    ep.approval.history = [];
    expect(() => Episode.parse(ep)).toThrow(/approval history/);
  });

  it("drafts may still carry unverified claims", () => {
    const ep = base();
    ep.approval = { status: "draft", history: [] };
    ep.technicalClaims[0].status = "needs-human-review";
    expect(() => Episode.parse(ep)).not.toThrow();
  });
});
