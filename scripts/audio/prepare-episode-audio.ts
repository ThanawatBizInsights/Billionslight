/**
 * Prepare an episode's audio and write the TIMED episode + subtitles.
 *
 *   npx tsx scripts/audio/prepare-episode-audio.ts <episode.json> [--audio=mock|cache|elevenlabs]
 *        [--dry-run] [--confirm-paid] [--max-characters=2500] [--regenerate=lineA,lineB] [--out=path]
 *
 * mock        (default) cached voice if present, otherwise a free mock voice
 * cache       cached/imported voices only; fails if any line is missing (final renders)
 * elevenlabs  PAID for uncached lines — needs ELEVENLABS_API_KEY,
 *             ELEVENLABS_ALLOW_PAID_CALLS=true, --confirm-paid and the owner's approval.
 *             Always run with --dry-run first to see the character count.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareEpisodeAudio, type AudioMode } from "../../src/audio-pipeline/prepare";
import { episodeSrt } from "../../src/engine/subtitles/captions";
import { episodeDurationInFrames } from "../../src/schemas/episode";
import { synthLibrary } from "./synth-library";
// @ts-expect-error — plain .mjs helper
import { loadEnv } from "../lib/env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export async function runPrepare(argv: string[]) {
  loadEnv(root);
  const args = Object.fromEntries(argv.filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.slice(2).split("=");
    return [k, v ?? "true"];
  })) as Record<string, string>;
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file) throw new Error("usage: prepare-episode-audio.ts <episode.json> [--audio=mock|cache|elevenlabs]");
  const mode = (args.audio ?? "mock") as AudioMode;
  if (!["mock", "cache", "elevenlabs"].includes(mode)) throw new Error(`unknown --audio=${mode}`);
  synthLibrary(false);
  const input = JSON.parse(fs.readFileSync(path.resolve(root, file), "utf8"));
  const res = await prepareEpisodeAudio(input, {
    mode,
    root,
    env: process.env,
    confirmPaid: args["confirm-paid"] === "true",
    maxCharacters: args["max-characters"] ? Number(args["max-characters"]) : undefined,
    regenerate: args.regenerate ? args.regenerate.split(",") : [],
    dryRun: args["dry-run"] === "true",
  });
  const ep = res.episode;
  const outDir = path.join(root, "public/assets/audio/episodes", ep.id);
  const out = args.out ? path.resolve(root, args.out) : path.join(outDir, "timed.json");
  console.log(`audio mode: ${mode}  (ElevenLabs: ${res.config.mode}${res.config.reasons.length ? " — " + res.config.reasons.join("; ") : ""})`);
  for (const l of res.lines) console.log(`  ${l.sceneId}/${l.lineId.padEnd(14)} ${l.voiceKey.padEnd(10)} ${l.source.padEnd(17)} ${String(l.characters).padStart(4)} chars ${l.durationMs ? (l.durationMs / 1000).toFixed(2) + " s" : ""}${l.note ? "  ⚠ " + l.note : ""}`);
  const wouldBill = res.lines.filter((l) => l.source === "elevenlabs-new").reduce((n, l) => n + l.characters, 0);
  if (args["dry-run"] === "true") {
    console.log(`dry run: ${wouldBill} characters would be billed to ElevenLabs; nothing written.`);
    return { episode: ep, out: null as string | null, srt: null as string | null };
  }
  if (res.billedCharacters) console.log(`billed this run: ${res.billedCharacters} characters (see public/assets/audio/cache/ledger.jsonl)`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(ep, null, 1));
  const srt = path.join(path.dirname(out), `${ep.id}.th.srt`);
  fs.writeFileSync(srt, episodeSrt(ep));
  console.log(`timed episode: ${path.relative(root, out)}  (${(episodeDurationInFrames(ep) / ep.fps).toFixed(2)} s)\nsubtitles:     ${path.relative(root, srt)}`);
  return { episode: ep, out, srt };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPrepare(process.argv.slice(2)).catch((e) => {
    console.error(String(e instanceof Error ? e.message : e));
    process.exit(1);
  });
}
