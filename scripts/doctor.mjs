#!/usr/bin/env node
/** Environment check: Node, FFmpeg, packages, fonts, reference assets, credentials (presence only). */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./lib/env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(root);
const rows = [];
const check = (name, ok, detail = "") => rows.push({ name, ok, detail });
const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n")[0];
  } catch {
    return null;
  }
};

const major = Number(process.versions.node.split(".")[0]);
check("Node.js ≥ 20", major >= 20, process.version);
const ff = run("ffmpeg", ["-version"]);
check("FFmpeg (system, optional — Remotion bundles its own)", true, ff ?? "not found (OK)");
check("ffprobe (used by render verification)", !!run("ffprobe", ["-version"]), run("ffprobe", ["-version"]) ?? "missing — install with: brew install ffmpeg");
for (const p of ["remotion", "@remotion/three", "three", "@react-three/fiber", "@react-three/drei", "react", "zod"]) {
  const f = path.join(root, "node_modules", p, "package.json");
  check(`package ${p}`, fs.existsSync(f), fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).version : "run npm install");
}
for (const w of ["400", "700", "800"]) {
  const f = path.join(root, `public/assets/fonts/noto-sans-thai-thai-${w}-normal.woff2`);
  check(`Thai font ${w}`, fs.existsSync(f));
}
const ref = (p) => fs.existsSync(path.join(root, "public/assets", p)) && fs.readdirSync(path.join(root, "public/assets", p)).some((f) => !f.startsWith(".") && f !== "README.md");
const logoFiles = ["billionslight-logo-stacked.png", "billionslight-logo-horizontal.png"].filter((f) => fs.existsSync(path.join(root, "public/assets/branding", f)));
check("Official logo files for the logo overlay (public/assets/branding/)", logoFiles.length === 2, logoFiles.length === 2 ? logoFiles.join(", ") : "missing — copy the official PNGs from the Drive 'Logo' folder (git-ignored)");
check("Sunny character sheet (characters/sunny/)", fs.existsSync(path.join(root, "public/assets/characters/sunny")) && ref("characters/sunny"), "optional reference copy (Phase 2 approved)");
const behindProxy = !!(process.env.HTTPS_PROXY || process.env.https_proxy);
check("ElevenLabs key present", !!process.env.ELEVENLABS_API_KEY, process.env.ELEVENLABS_API_KEY ? "set (value hidden)" : behindProxy ? "not in env — in a cloud session the 'Billionslight' environment injects it via the proxy; run paid steps with ELEVENLABS_API_KEY=proxy-injected" : "not set → mock/imported audio only");
check("ElevenLabs model / language", (process.env.ELEVENLABS_MODEL_ID || "eleven_v4") === "eleven_v4", `${process.env.ELEVENLABS_MODEL_ID || "eleven_v4 (default)"} · language_code ${process.env.ELEVENLABS_LANGUAGE_CODE || "th (default)"}`);
const voices = ["SUNNY", "HOMEOWNER", "NARRATOR"].filter((k) => process.env[`ELEVENLABS_VOICE_${k}`]);
check("Voice IDs (Sunny, Ton, narrator)", voices.length === 3, voices.length === 3 ? "all set (values hidden)" : `missing: ${["SUNNY", "HOMEOWNER", "NARRATOR"].filter((k) => !voices.includes(k)).join(", ")}`);
const lib = path.join(root, "public/assets/audio/library");
check("Original sound library", fs.existsSync(lib) && fs.readdirSync(lib).filter((f) => f.endsWith(".wav")).length >= 7, fs.existsSync(lib) ? `${fs.readdirSync(lib).filter((f) => f.endsWith(".wav")).length} files` : "not generated — npx tsx scripts/audio/synth-library.ts");
const cache = path.join(root, "public/assets/audio/cache");
const cached = fs.existsSync(cache) ? fs.readdirSync(cache).filter((f) => f.startsWith("el-") && f.endsWith(".wav")).length : 0;
check("Voice cache (generated lines on this machine)", cached > 0, `${cached} ElevenLabs lines cached (re-renders use them for free)`);
check("Paid API calls enabled", process.env.ELEVENLABS_ALLOW_PAID_CALLS === "true", process.env.ELEVENLABS_ALLOW_PAID_CALLS === "true" ? "ENABLED" : "disabled (safe default)");

console.log(`\nBillionslight Animation Studio — doctor\n${os.type()} ${os.arch()} · ${os.cpus()[0]?.model} ×${os.cpus().length} · ${Math.round(os.totalmem() / 1e9)} GB RAM\n`);
for (const r of rows) console.log(`${r.ok ? "✔" : "•"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
console.log(`\nRender GL: ${process.env.RENDER_GL || (process.platform === "darwin" ? "angle (default on macOS)" : "swangle (default on Linux)")}`);
