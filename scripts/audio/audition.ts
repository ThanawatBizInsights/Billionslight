/**
 * Voice audition tool (PAID — owner approval per run).
 *
 *   npx tsx scripts/audio/audition.ts <spec.json> [--dry-run] [--confirm-paid] [--max-characters=N]
 *
 * spec.json: { "outDir": "renders/…", "model": "eleven_v4", "languageCode": "th",
 *   "takes": [{ "id": "sunny-pat", "voiceId": "…", "text": "spoken text" }],
 *   "sequences": [{ "id": "pair1-v4", "takes": ["ton-a", "sunny-a"], "gapMs": 350 }] }
 *
 * - Generates each take once (cached by model/voice/text, same cache as the pipeline).
 * - Writes the raw WAV per take and a dialogue-only sequence per pairing,
 *   loudness-matched (EBU R128, -16 LUFS) — no music, SFX, pitch or time change.
 * - Reports duration, speaking pitch (median f0) and loudness per take.
 * - Appends billed characters to public/assets/audio/cache/ledger.jsonl.
 * The API key is only read from the environment / proxy and never printed.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { synthesize } from "../../src/audio-pipeline/elevenlabs";
import { encodeWav, pcm16ToWav, readWav } from "../../src/audio-pipeline/wav";
// @ts-expect-error — plain .mjs helper
import { loadEnv } from "../lib/env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

interface Take {
  id: string;
  voiceId: string;
  text: string;
  model?: string;
}
interface Spec {
  outDir: string;
  model: string;
  languageCode?: string;
  takes: Take[];
  sequences?: { id: string; takes: string[]; gapMs?: number }[];
}

/** Median speaking pitch (Hz) by autocorrelation over voiced 40 ms windows. */
export function medianF0(samples: Float32Array, sr: number): number {
  const win = Math.round(sr * 0.04);
  const lo = Math.floor(sr / 400);
  const hi = Math.floor(sr / 60);
  const f0s: number[] = [];
  for (let s = 0; s + win + hi < samples.length; s += win) {
    let energy = 0;
    for (let i = 0; i < win; i++) energy += samples[s + i]! ** 2;
    if (energy / win < 1e-4) continue; // unvoiced / silence
    let best = 0;
    let bestLag = 0;
    for (let lag = lo; lag <= hi; lag++) {
      let c = 0;
      for (let i = 0; i < win; i++) c += samples[s + i]! * samples[s + i + lag]!;
      if (c > best) [best, bestLag] = [c, lag];
    }
    if (bestLag && best / energy > 0.3) f0s.push(sr / bestLag);
  }
  f0s.sort((a, b) => a - b);
  return f0s.length ? Math.round(f0s[Math.floor(f0s.length / 2)]!) : 0;
}

const keyOf = (t: Take, model: string, lang?: string) =>
  "aud-" + crypto.createHash("sha256").update(JSON.stringify({ model, lang, voice: t.voiceId, text: t.text.normalize("NFC") })).digest("hex").slice(0, 24);

async function main(argv: string[]) {
  loadEnv(root);
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const maxArg = argv.find((a) => a.startsWith("--max-characters="));
  const maxChars = maxArg ? Number(maxArg.split("=")[1]) : 1500;
  const specFile = argv.find((a) => !a.startsWith("--"));
  if (!specFile) throw new Error("usage: audition.ts <spec.json> [--dry-run] [--confirm-paid]");
  const spec = JSON.parse(fs.readFileSync(path.resolve(root, specFile), "utf8")) as Spec;
  const out = path.resolve(root, spec.outDir);
  const cache = path.join(root, "public/assets/audio/cache");
  fs.mkdirSync(out, { recursive: true });
  fs.mkdirSync(cache, { recursive: true });

  const todo = spec.takes.filter((t) => !fs.existsSync(path.join(cache, `${keyOf(t, t.model ?? spec.model, spec.languageCode)}.wav`)));
  const chars = todo.reduce((n, t) => n + t.text.length, 0);
  console.log(`model(s): ${[...new Set(spec.takes.map((t) => t.model ?? spec.model))].join(", ")}  language_code: ${spec.languageCode ?? "(none)"}`);
  console.log(`${spec.takes.length} takes, ${todo.length} not cached → ${chars} characters to bill`);
  if (flags.has("--dry-run")) {
    for (const t of todo) console.log(`  would generate ${t.id} (${t.model ?? spec.model}, ${t.text.length} chars): ${t.text}`);
    return;
  }
  if (todo.length) {
    const problems: string[] = [];
    if (!process.env.ELEVENLABS_API_KEY) problems.push("ELEVENLABS_API_KEY is not set");
    if (process.env.ELEVENLABS_ALLOW_PAID_CALLS !== "true") problems.push("ELEVENLABS_ALLOW_PAID_CALLS is not 'true'");
    if (!flags.has("--confirm-paid")) problems.push("--confirm-paid was not given");
    if (chars > maxChars) problems.push(`${chars} characters exceed the budget of ${maxChars}`);
    if (problems.length) throw new Error("Paid audition refused:\n - " + problems.join("\n - "));
  }

  const rows: string[] = [];
  for (const t of spec.takes) {
    const model = t.model ?? spec.model;
    const key = keyOf(t, model, spec.languageCode);
    const wavPath = path.join(cache, `${key}.wav`);
    if (!fs.existsSync(wavPath)) {
      try {
        const r = await synthesize({ voiceId: t.voiceId, modelId: model, languageCode: spec.languageCode, text: t.text }, process.env.ELEVENLABS_API_KEY ?? "");
        fs.writeFileSync(wavPath, pcm16ToWav(r.pcm, r.sampleRate));
        fs.writeFileSync(path.join(cache, `${key}.json`), JSON.stringify({ key, kind: "audition", model, languageCode: spec.languageCode, voiceId: t.voiceId, spoken: t.text, alignment: r.alignment }));
        fs.appendFileSync(path.join(cache, "ledger.jsonl"), JSON.stringify({ at: new Date().toISOString(), episode: "audition", line: t.id, key, model, characters: t.text.length, requestId: r.requestId }) + "\n");
      } catch (e) {
        rows.push(`${t.id.padEnd(22)} ${model.padEnd(16)} FAILED: ${String(e instanceof Error ? e.message : e)}`);
        continue;
      }
    }
    fs.copyFileSync(wavPath, path.join(out, `${t.id}.wav`));
    const w = readWav(wavPath);
    let rms = 0;
    for (const v of w.samples) rms += v * v;
    const db = 10 * Math.log10(rms / w.samples.length + 1e-12);
    rows.push(`${t.id.padEnd(22)} ${model.padEnd(16)} ${(w.samples.length / w.sampleRate).toFixed(2)} s  f0 ${String(medianF0(w.samples, w.sampleRate)).padStart(3)} Hz  ${db.toFixed(1)} dBFS`);
  }
  console.log(rows.join("\n"));

  for (const seq of spec.sequences ?? []) {
    const parts = seq.takes.map((id) => path.join(out, `${id}.wav`)).filter((f) => fs.existsSync(f));
    if (parts.length !== seq.takes.length) {
      console.log(`sequence ${seq.id}: skipped (missing takes)`);
      continue;
    }
    // natural conversational gap between turns, no time/pitch processing
    const gap = path.join(out, `_gap.wav`);
    fs.writeFileSync(gap, encodeWav(new Float32Array(Math.round(24000 * (seq.gapMs ?? 350) / 1000)), 24000));
    const list = path.join(out, `_${seq.id}.txt`);
    fs.writeFileSync(list, parts.flatMap((p, i) => (i ? [gap, p] : [p])).map((p) => `file '${p}'`).join("\n"));
    const raw = path.join(out, `_${seq.id}-raw.wav`);
    spawnSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", raw], { stdio: "inherit" });
    // loudness-matched listening copy (EBU R128 -16 LUFS); gain only
    spawnSync("ffmpeg", ["-loglevel", "error", "-y", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "2", path.join(out, `${seq.id}.wav`)], { stdio: "inherit" });
    fs.rmSync(list);
    fs.rmSync(raw);
    console.log(`sequence ${seq.id}: ${path.relative(root, path.join(out, `${seq.id}.wav`))}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if ((process.env.HTTPS_PROXY || process.env.https_proxy) && process.env.NODE_USE_ENV_PROXY !== "1") {
    const r = spawnSync(process.execPath, [...process.execArgv, ...process.argv.slice(1)], { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" } });
    process.exit(r.status ?? 1);
  }
  main(process.argv.slice(2)).catch((e) => {
    console.error(String(e instanceof Error ? e.message : e));
    process.exit(1);
  });
}
