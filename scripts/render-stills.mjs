#!/usr/bin/env node
/**
 * Render PNG stills from episode JSON files (identity sheets, previews,
 * storyboard frames). One bundle is reused for every job.
 *
 *   node scripts/render-stills.mjs <plan.json> [--only=<substring>] [--quality=preview]
 *
 * plan.json: { "outDir": "renders/phase-2-review/stills",
 *              "jobs": [{ "episode": "src/episodes/review/x.json", "frame": 0, "out": "x.png", "quality": "final" }] }
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./lib/env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(root);
const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const planFile = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!planFile) throw new Error("usage: render-stills.mjs <plan.json>");
const plan = JSON.parse(fs.readFileSync(path.resolve(root, planFile), "utf8"));
const outDir = path.resolve(root, plan.outDir);
fs.mkdirSync(outDir, { recursive: true });

const gl = process.env.RENDER_GL || (process.platform === "darwin" ? "angle" : "swangle");
const browserExecutable = process.env.BROWSER_EXECUTABLE || null;
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });

const jobs = plan.jobs.filter((j) => !args.only || j.out.includes(args.only));
const log = [];
for (const job of jobs) {
  const episode = JSON.parse(fs.readFileSync(path.resolve(root, job.episode), "utf8"));
  const inputProps = { episode, quality: args.quality ?? job.quality ?? "final" };
  const t0 = performance.now();
  const composition = await selectComposition({ serveUrl, id: "Episode", inputProps, browserExecutable, chromiumOptions: { gl } });
  const output = path.join(outDir, job.out);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await renderStill({ composition, serveUrl, output, frame: job.frame ?? 0, inputProps, browserExecutable, chromiumOptions: { gl }, imageFormat: "png" });
  const sec = (performance.now() - t0) / 1000;
  const ok = fs.existsSync(output) && fs.statSync(output).size > 5000;
  log.push({ out: path.relative(root, output), frame: job.frame ?? 0, size: `${composition.width}x${composition.height}`, sec: +sec.toFixed(1), ok });
  console.log(`${ok ? "✔" : "✖"} ${path.relative(root, output)} (${composition.width}×${composition.height}, ${sec.toFixed(1)} s)`);
}
fs.writeFileSync(path.join(outDir, "stills-log.json"), JSON.stringify({ at: new Date().toISOString(), gl, jobs: log }, null, 2));
if (log.some((l) => !l.ok)) process.exit(1);
