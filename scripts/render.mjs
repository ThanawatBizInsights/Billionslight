#!/usr/bin/env node
/**
 * Render an episode composition to H.264/AAC MP4 with a quality preset, then
 * verify the output with ffprobe and append metrics to renders/render-log.jsonl.
 *
 *   node scripts/render.mjs FoundationTest --quality=final
 *   node scripts/render.mjs Episode --episode=src/episodes/my-episode.episode.json --quality=draft
 *   node scripts/render.mjs FoundationTest --quality=preview --frames=0-59
 *
 * Env: RENDER_GL (angle|swangle|egl), BROWSER_EXECUTABLE, RENDER_CONCURRENCY.
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./lib/env.mjs";
import { verifyVideo } from "./lib/verify.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(root);

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.slice(2).split("=");
    return [k, v ?? "true"];
  }),
);
const compositionId = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "FoundationTest";
const quality = args.quality ?? "preview";
if (!["draft", "preview", "final"].includes(quality)) throw new Error(`Unknown quality "${quality}"`);
const CRF = { draft: 28, preview: 23, final: 18 }[quality];
const JPEG = { draft: 70, preview: 80, final: 92 }[quality];

const inputProps = { quality };
if (args.episode) inputProps.episode = JSON.parse(fs.readFileSync(path.resolve(root, args.episode), "utf8"));

// ---- Phase 4: dialogue audio + subtitles. Renders never make paid calls:
// --audio=mock (default; cached voices first, else free mock voices) | cache (cached/imported only) | none.
// Paid ElevenLabs generation is a separate, approved step: scripts/audio/prepare-episode-audio.ts --audio=elevenlabs.
const audioMode = args.audio ?? "mock";
if (!["mock", "cache", "none"].includes(audioMode)) throw new Error(`--audio must be mock, cache or none (paid generation is a separate approved step)`);
let srtFile = null;
const hasDialogue = inputProps.episode?.scenes?.some((s) => (s.dialogue ?? []).length > 0);
if (inputProps.episode && hasDialogue && audioMode !== "none") {
  const timedOut = path.join(root, "public/assets/audio/episodes", inputProps.episode.id, `timed-${audioMode}.json`);
  console.log(`▶ Preparing audio (${audioMode})…`);
  const r = spawnSync("npx", ["tsx", "scripts/audio/prepare-episode-audio.ts", path.resolve(root, args.episode), `--audio=${audioMode}`, `--out=${timedOut}`], { cwd: root, stdio: "inherit", env: process.env });
  if (r.status !== 0) throw new Error("audio preparation failed");
  inputProps.episode = JSON.parse(fs.readFileSync(timedOut, "utf8"));
  srtFile = path.join(path.dirname(timedOut), `${inputProps.episode.id}.th.srt`);
}

const gl = process.env.RENDER_GL || (process.platform === "darwin" ? "angle" : "swangle");
const concurrency = Number(process.env.RENDER_CONCURRENCY || Math.max(1, Math.min(3, os.cpus().length - 1)));
const browserExecutable = process.env.BROWSER_EXECUTABLE || null;

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const episodeId = inputProps.episode?.id ?? compositionId;
const outDir = path.join(root, "renders", episodeId);
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.resolve(root, args.out ?? path.join(outDir, `${episodeId}-${quality}-${stamp}.mp4`));

console.log(`▶ Bundling…`);
const t0 = performance.now();
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), onProgress: () => {} });
const tBundle = performance.now();

const chromiumOptions = { gl };
const composition = await selectComposition({ serveUrl, id: compositionId, inputProps, browserExecutable, chromiumOptions });
console.log(`▶ ${composition.id}: ${composition.width}×${composition.height} @ ${composition.fps}fps, ${composition.durationInFrames} frames — quality=${quality}, gl=${gl}, concurrency=${concurrency}`);

// Sample memory of this process tree while rendering (browser included).
let peakTreeRssMb = 0;
const sampleTree = () => {
  try {
    const out = execFileSync("ps", ["-A", "-o", "pid=,ppid=,rss="], { encoding: "utf8" });
    const rows = out.trim().split("\n").map((l) => l.trim().split(/\s+/).map(Number));
    const children = new Map();
    for (const [pid, ppid] of rows) children.set(ppid, [...(children.get(ppid) ?? []), pid]);
    const rss = new Map(rows.map(([pid, , r]) => [pid, r]));
    let total = 0;
    const stack = [process.pid];
    while (stack.length) {
      const p = stack.pop();
      total += rss.get(p) ?? 0;
      stack.push(...(children.get(p) ?? []));
    }
    peakTreeRssMb = Math.max(peakTreeRssMb, total / 1024);
  } catch {}
};
const sampler = setInterval(sampleTree, 1000);

let frameRange = null;
if (args.frames) {
  const [a, b] = args.frames.split("-").map(Number);
  frameRange = b === undefined ? a : [a, b];
}

let lastPct = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  audioCodec: "aac",
  pixelFormat: "yuv420p",
  colorSpace: "bt709",
  crf: CRF,
  imageFormat: "jpeg",
  jpegQuality: JPEG,
  outputLocation: outFile,
  inputProps,
  concurrency,
  browserExecutable,
  chromiumOptions,
  frameRange,
  // Always include an audio track (silent until Phase 4) so every MP4 has AAC audio.
  enforceAudioTrack: true,
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 10) * 10;
    if (pct !== lastPct) {
      lastPct = pct;
      process.stdout.write(`  ${pct}%`);
    }
  },
});
clearInterval(sampler);
sampleTree();
const tEnd = performance.now();
process.stdout.write("\n");

const usage = process.resourceUsage();
const verification = verifyVideo(outFile, {
  width: composition.width,
  height: composition.height,
  fps: composition.fps,
  frames: frameRange ? (Array.isArray(frameRange) ? frameRange[1] - frameRange[0] + 1 : 1) : composition.durationInFrames,
});
const renderSec = (tEnd - tBundle) / 1000;
const frames = verification.frames ?? composition.durationInFrames;
const metrics = {
  at: new Date().toISOString(),
  composition: composition.id,
  episode: episodeId,
  quality,
  output: path.relative(root, outFile),
  resolution: `${composition.width}x${composition.height}`,
  frames,
  bundleSec: +((tBundle - t0) / 1000).toFixed(1),
  renderSec: +renderSec.toFixed(1),
  secondsPerFrame: +(renderSec / frames).toFixed(3),
  realtimeFactor: +((frames / composition.fps) / renderSec).toFixed(3),
  peakProcessTreeRssMb: Math.round(peakTreeRssMb),
  nodeCpuUserSec: +(usage.userCPUTime / 1e6).toFixed(1),
  host: { platform: process.platform, arch: process.arch, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model, totalMemGb: Math.round(os.totalmem() / 1e9) },
  gl,
  concurrency,
  audio: hasDialogue ? audioMode : "silent",
  verification,
};
fs.appendFileSync(path.join(root, "renders", "render-log.jsonl"), JSON.stringify(metrics) + "\n");
console.log(JSON.stringify(metrics, null, 2));
if (!verification.ok) {
  console.error("✖ Verification FAILED:", verification.errors.join("; "));
  process.exit(1);
}
if (srtFile && fs.existsSync(srtFile)) {
  const dest = outFile.replace(/\.mp4$/, ".th.srt");
  fs.copyFileSync(srtFile, dest);
  console.log(`✔ Thai subtitles: ${path.relative(root, dest)}`);
}
console.log(`✔ Rendered and verified: ${outFile}`);
