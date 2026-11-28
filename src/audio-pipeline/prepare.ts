/**
 * Episode audio preparation (Node only).
 *
 * For every dialogue line: resolve audio in this order
 *   1. imported file (line.audio.source = "imported")
 *   2. cached generated voice (ElevenLabs cache, keyed by text + voice + model + settings)
 *   3. paid ElevenLabs generation — ONLY in mode "elevenlabs" with the guard passed
 *   4. mock voice (mode "mock" only)
 * then measure duration, loudness envelope and character alignment, lay out
 * dialogue timing (scenes grow to fit speech) and return a TIMED episode.
 *
 * Cache: public/assets/audio/cache/<key>.wav + <key>.json (never regenerated
 * unless the line ID is listed in `regenerate`). Paid generations are also
 * appended to cache/ledger.jsonl (characters billed, no secrets).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Episode, type EpisodeInput } from "../schemas/episode";
import { resolveElevenLabsConfig, type ElevenLabsConfig } from "../engine/audio/elevenlabs-config";
import { normalizeForTts } from "../engine/audio/tts-normalize";
import { applyDialogueTiming } from "../engine/audio/timing";
import { getCharacter } from "../engine/characters/library";
import { encodeWav, loudnessEnvelope, pcm16ToWav, readWav, voicedLevelDb } from "./wav";
import { mockVoice } from "./mock-voice";
import { synthesize, type TtsResult } from "./elevenlabs";

export type AudioMode = "mock" | "cache" | "elevenlabs";

export interface PrepareOptions {
  mode: AudioMode;
  /** Project root (public/ lives here). */
  root: string;
  env: Record<string, string | undefined>;
  /** Required for any paid call (CLI: --confirm-paid). */
  confirmPaid?: boolean;
  /** Max characters billed in this run. */
  maxCharacters?: number;
  /** Line IDs to regenerate even if cached (paid in elevenlabs mode). */
  regenerate?: string[];
  /** List what would happen, call nothing, write nothing. */
  dryRun?: boolean;
  /** Injected for tests. */
  synthesizeImpl?: (req: Parameters<typeof synthesize>[0], key: string) => Promise<TtsResult>;
}

export interface LineReport {
  sceneId: string;
  lineId: string;
  voiceKey: string;
  source: "imported" | "elevenlabs-cache" | "elevenlabs-new" | "mock" | "missing";
  characters: number;
  durationMs?: number;
  file?: string;
  note?: string;
}

export interface PrepareResult {
  episode: Episode;
  lines: LineReport[];
  billedCharacters: number;
  config: Pick<ElevenLabsConfig, "mode" | "modelId" | "languageCode" | "reasons">;
}

export const CACHE_DIR = "assets/audio/cache";
export const ENVELOPE_HZ = 100;
export const DEFAULT_MAX_CHARACTERS = 2500;

export function voiceKeyFor(ep: Episode, castId: string | undefined): string {
  if (!castId) return "narrator";
  const cast = ep.cast.find((c) => c.id === castId);
  if (cast?.voiceKey) return cast.voiceKey;
  const def = cast ? getCharacter(cast.characterId) : undefined;
  return def?.voiceKey ?? castId;
}

export interface VoiceSettings {
  speed: number;
  stability?: number;
  similarity?: number;
  style?: number;
}

/** Cache key: everything that changes the generated audio, nothing else. */
export function cacheKey(provider: "elevenlabs" | "mock", modelId: string, voiceKey: string, spoken: string, settings: VoiceSettings, languageCode?: string): string {
  const canonical = JSON.stringify({ v: 1, provider, modelId: provider === "mock" ? "mock" : modelId, voiceKey, spoken: spoken.normalize("NFC"), settings, ...(provider === "elevenlabs" && languageCode ? { languageCode } : {}) });
  return `${provider === "mock" ? "mock" : "el"}-${crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 24)}`;
}

interface CacheMeta {
  key: string;
  provider: "elevenlabs" | "mock";
  voiceKey: string;
  voiceId?: string;
  modelId: string;
  languageCode?: string;
  spoken: string;
  durationMs: number;
  envelopeHz: number;
  envelope: number[];
  alignment: { chars: string[]; startMs: number[]; endMs: number[] } | null;
  createdAt: string;
}

const seedOf = (key: string) => parseInt(crypto.createHash("sha256").update(key).digest("hex").slice(0, 8), 16) % 100000;

export async function prepareEpisodeAudio(input: EpisodeInput | Episode, opts: PrepareOptions): Promise<PrepareResult> {
  const ep = Episode.parse(input);
  const cfg = resolveElevenLabsConfig(opts.env);
  const pub = path.join(opts.root, "public");
  const cacheAbs = path.join(pub, CACHE_DIR);
  if (!opts.dryRun) fs.mkdirSync(cacheAbs, { recursive: true });
  const regenerate = new Set(opts.regenerate ?? []);
  const maxChars = opts.maxCharacters ?? DEFAULT_MAX_CHARACTERS;
  const reports: LineReport[] = [];
  let billed = 0;

  // ---- plan: what is missing and would be billed (budget is checked BEFORE any call)
  type Job = { si: number; di: number; spoken: string; voiceKey: string; settings: VoiceSettings; elKey: string; mockKey: string };
  const jobs: Job[] = [];
  ep.scenes.forEach((s, si) =>
    s.dialogue.forEach((d, di) => {
      const spoken = d.speak ?? normalizeForTts(d.text);
      const voiceKey = voiceKeyFor(ep, d.castId);
      const settings: VoiceSettings = { speed: d.delivery?.speed ?? 1, stability: d.delivery?.stability, similarity: d.delivery?.similarity, style: d.delivery?.styleExaggeration };
      jobs.push({ si, di, spoken, voiceKey, settings, elKey: cacheKey("elevenlabs", cfg.modelId, voiceKey, spoken, settings, cfg.languageCode), mockKey: cacheKey("mock", "mock", voiceKey, spoken, settings) });
    }),
  );
  const needsPaid = jobs.filter((j) => {
    const d = ep.scenes[j.si]!.dialogue[j.di]!;
    if (d.audio?.source === "imported") return false;
    const cached = fs.existsSync(path.join(cacheAbs, `${j.elKey}.json`));
    return !cached || regenerate.has(d.id);
  });
  const paidChars = needsPaid.reduce((n, j) => n + j.spoken.length, 0);
  if (opts.mode === "elevenlabs" && needsPaid.length > 0 && !opts.dryRun) {
    const problems: string[] = [];
    if (cfg.mode !== "elevenlabs") problems.push(...cfg.reasons);
    if (!opts.confirmPaid) problems.push("--confirm-paid was not given (owner approval required for paid generation)");
    if (paidChars > maxChars) problems.push(`this run would bill ${paidChars} characters, above the budget of ${maxChars} (--max-characters)`);
    for (const j of needsPaid) if (!cfg.voices[j.voiceKey]) problems.push(`no voice ID for "${j.voiceKey}" (set ELEVENLABS_VOICE_${j.voiceKey.toUpperCase()})`);
    if (problems.length) throw new Error(`Paid ElevenLabs generation refused:\n - ${[...new Set(problems)].join("\n - ")}`);
  }

  // ---- resolve each line
  for (const j of jobs) {
    const scene = ep.scenes[j.si]!;
    const d = scene.dialogue[j.di]!;
    const base = { sceneId: scene.id, lineId: d.id, voiceKey: j.voiceKey, characters: j.spoken.length };

    if (d.audio?.source === "imported") {
      const file = d.audio.file;
      if (!file || !fs.existsSync(path.join(pub, file))) {
        reports.push({ ...base, source: "missing", note: `imported file not found: ${file ?? "(none)"}` });
        continue;
      }
      if (!opts.dryRun) {
        const w = readWav(path.join(pub, file));
        const durationMs = Math.round((w.samples.length / w.sampleRate) * 1000);
        d.audio = { ...d.audio, durationMs, envelopeHz: ENVELOPE_HZ, envelope: loudnessEnvelope(w.samples, w.sampleRate, ENVELOPE_HZ) };
        d.durationInFrames = undefined;
        reports.push({ ...base, source: "imported", durationMs, file });
      } else reports.push({ ...base, source: "imported", file });
      continue;
    }

    const elMeta = path.join(cacheAbs, `${j.elKey}.json`);
    let meta: CacheMeta | null = null;
    let source: LineReport["source"] = "missing";
    if (fs.existsSync(elMeta) && !regenerate.has(d.id)) {
      meta = JSON.parse(fs.readFileSync(elMeta, "utf8")) as CacheMeta;
      source = "elevenlabs-cache";
      const configured = cfg.voices[j.voiceKey];
      if (configured && meta.voiceId && configured !== meta.voiceId) base.characters = j.spoken.length; // voice changed: reported below
    } else if (opts.mode === "elevenlabs") {
      if (opts.dryRun) {
        reports.push({ ...base, source: "elevenlabs-new", note: "would be generated (paid)" });
        continue;
      }
      const voiceId = cfg.voices[j.voiceKey]!;
      const call = opts.synthesizeImpl ?? ((req, key) => synthesize(req, key));
      const r = await call({ voiceId, modelId: cfg.modelId, languageCode: cfg.languageCode, text: j.spoken, speed: j.settings.speed, stability: j.settings.stability, similarity: j.settings.similarity, style: j.settings.style }, opts.env.ELEVENLABS_API_KEY ?? "");
      const wav = pcm16ToWav(r.pcm, r.sampleRate);
      fs.writeFileSync(path.join(cacheAbs, `${j.elKey}.wav`), wav);
      const w = readWav(path.join(cacheAbs, `${j.elKey}.wav`));
      meta = {
        key: j.elKey,
        provider: "elevenlabs",
        voiceKey: j.voiceKey,
        voiceId,
        modelId: cfg.modelId,
        languageCode: cfg.languageCode,
        spoken: j.spoken,
        durationMs: Math.round((w.samples.length / w.sampleRate) * 1000),
        envelopeHz: ENVELOPE_HZ,
        envelope: loudnessEnvelope(w.samples, w.sampleRate, ENVELOPE_HZ),
        alignment: r.alignment,
        createdAt: new Date().toISOString(),
      };
      fs.writeFileSync(elMeta, JSON.stringify(meta));
      fs.appendFileSync(path.join(cacheAbs, "ledger.jsonl"), JSON.stringify({ at: meta.createdAt, episode: ep.id, line: d.id, key: j.elKey, voiceKey: j.voiceKey, characters: j.spoken.length, requestId: r.requestId }) + "\n");
      billed += j.spoken.length;
      source = "elevenlabs-new";
    } else if (opts.mode === "mock") {
      const mockMeta = path.join(cacheAbs, `${j.mockKey}.json`);
      if (fs.existsSync(mockMeta)) meta = JSON.parse(fs.readFileSync(mockMeta, "utf8")) as CacheMeta;
      else if (!opts.dryRun) {
        const m = mockVoice(j.spoken, j.voiceKey, j.settings.speed, seedOf(j.mockKey));
        fs.writeFileSync(path.join(cacheAbs, `${j.mockKey}.wav`), encodeWav(m.samples, m.sampleRate));
        meta = { key: j.mockKey, provider: "mock", voiceKey: j.voiceKey, modelId: "mock", spoken: j.spoken, durationMs: m.durationMs, envelopeHz: ENVELOPE_HZ, envelope: loudnessEnvelope(m.samples, m.sampleRate, ENVELOPE_HZ), alignment: m.alignment, createdAt: "mock" };
        fs.writeFileSync(mockMeta, JSON.stringify(meta));
      }
      source = "mock";
    }

    if (!meta) {
      reports.push({ ...base, source: opts.dryRun && source === "mock" ? "mock" : "missing", note: opts.mode === "cache" ? "not in the voice cache (run with --audio=mock, or generate with approval)" : undefined });
      continue;
    }
    const note = cfg.voices[j.voiceKey] && meta.voiceId && cfg.voices[j.voiceKey] !== meta.voiceId ? "cached with a different voice ID — regenerate only on request (--regenerate=<lineId>)" : undefined;
    d.audio = {
      source: meta.provider === "mock" ? "mock" : "elevenlabs",
      file: `${CACHE_DIR}/${meta.key}.wav`,
      cacheKey: meta.key,
      voiceKey: j.voiceKey,
      durationMs: meta.durationMs,
      envelopeHz: meta.envelopeHz,
      envelope: meta.envelope,
      // alignment of the SPOKEN text; subtitles use it only when it matches the displayed text
      alignment: meta.alignment ?? undefined,
    };
    d.durationInFrames = undefined;
    reports.push({ ...base, source, durationMs: meta.durationMs, file: d.audio.file, note });
  }

  if (opts.mode === "cache") {
    const missing = reports.filter((r) => r.source === "missing");
    if (missing.length) throw new Error(`Voice cache incomplete for ${missing.length} line(s): ${missing.map((m) => m.lineId).join(", ")}`);
  }
  if (!opts.dryRun) balanceCharacterLevels(ep, pub);
  const timed = opts.dryRun ? ep : applyDialogueTiming(ep);
  return { episode: Episode.parse(timed), lines: reports, billedCharacters: billed, config: { mode: cfg.mode, modelId: cfg.modelId, languageCode: cfg.languageCode, reasons: cfg.reasons } };
}

/**
 * Per-character level balance: measure each character's average voiced level
 * across all of their lines and apply ONE static gain per character (≤ 0 dB,
 * matched to the quietest character). No compression and no per-line
 * levelling, so the natural variation within and between lines is kept.
 */
export function balanceCharacterLevels(ep: Episode, pub: string): Record<string, { levelDb: number; gainDb: number }> {
  const byVoice = new Map<string, { lines: Episode["scenes"][number]["dialogue"]; energy: number; n: number }>();
  for (const s of ep.scenes)
    for (const d of s.dialogue) {
      const f = d.audio?.file;
      if (!f || !fs.existsSync(path.join(pub, f))) continue;
      const w = readWav(path.join(pub, f));
      const db = voicedLevelDb(w.samples, w.sampleRate);
      const key = d.audio!.voiceKey ?? d.castId ?? "narrator";
      const e = byVoice.get(key) ?? { lines: [], energy: 0, n: 0 };
      e.lines.push(d);
      e.energy += 10 ** (db / 10);
      e.n++;
      byVoice.set(key, e);
    }
  const levels = [...byVoice.entries()].map(([k, v]) => [k, 10 * Math.log10(v.energy / v.n)] as const);
  if (levels.length === 0) return {};
  const target = Math.min(...levels.map(([, l]) => l));
  const out: Record<string, { levelDb: number; gainDb: number }> = {};
  for (const [k, level] of levels) {
    const gainDb = Math.round(Math.min(0, target - level) * 10) / 10;
    out[k] = { levelDb: Math.round(level * 10) / 10, gainDb };
    for (const d of byVoice.get(k)!.lines) d.audio = { ...d.audio!, gainDb };
  }
  return out;
}
