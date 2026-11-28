import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chunkCaptions, segmentThai, timeCaptions, visualLength, wrapThai } from "../src/engine/subtitles/thai";
import { normalizeForTts, estimateSpeechMs } from "../src/engine/audio/tts-normalize";
import { applyDialogueTiming, cueFade, dialogueIntervals, duckGain, layoutSceneDialogue } from "../src/engine/audio/timing";
import { mouthForLine } from "../src/engine/audio/lipsync";
import { episodeSrt, sceneCaptions } from "../src/engine/subtitles/captions";
import { cacheKey, prepareEpisodeAudio } from "../src/audio-pipeline/prepare";
import { buildTtsRequest, synthesize } from "../src/audio-pipeline/elevenlabs";
import { encodeWav, loudnessEnvelope, readWav } from "../src/audio-pipeline/wav";
import { SOUND_LIBRARY } from "../src/engine/audio/library";
import { Episode, Scene } from "../src/schemas/episode";

const scene = (dialogue: unknown[], extra: Record<string, unknown> = {}) =>
  Scene.parse({ id: "s", durationInFrames: 60, environment: { id: "living-room" }, lighting: { preset: "evening" }, camera: {}, dialogue, ...extra });
const episode = (scenes: unknown[]) =>
  Episode.parse({ schemaVersion: 1, id: "t", title: "t", cast: [{ id: "sunny", characterId: "sunny" }, { id: "ton", characterId: "homeowner_male_01" }], scenes });

describe("Thai subtitles", () => {
  const sample = "ซันนี่ วันนี้แดดแรงมาก บ้านเราใช้ไฟจากโซลาร์อยู่ใช่ไหม";
  it("measures visual length without combining marks", () => {
    expect(visualLength("ที่")).toBe(1);
    expect(visualLength("ไฟ")).toBe(2);
  });
  it("keeps loanwords and spoken compounds together", () => {
    expect(segmentThai("โซลาร์เซลล์ยังไง")).toEqual(["โซลาร์เซลล์", "ยังไง"]);
  });
  it("wraps at word boundaries, within the limit, without losing text", () => {
    for (const max of [14, 20, 26]) {
      const lines = wrapThai(sample, max);
      for (const l of lines) expect(visualLength(l)).toBeLessThanOrEqual(max);
      expect(lines.join("").replace(/\s/g, "")).toBe(sample.replace(/\s/g, ""));
    }
  });
  it("prefers the spaces Thai uses between phrases", () => {
    expect(wrapThai(sample, 26)).toEqual(["ซันนี่ วันนี้แดดแรงมาก", "บ้านเราใช้ไฟจากโซลาร์อยู่ใช่ไหม"]);
  });
  it("captions cover the whole line contiguously", () => {
    const caps = timeCaptions("เส้นสีเหลืองคือพลังงานแสงอาทิตย์จากแผงโซลาร์ ส่วนเส้นสีฟ้าอมเขียวคือไฟฟ้าจากอินเวอร์เตอร์", 6000, 14, 2);
    expect(caps.length).toBeGreaterThan(1);
    expect(caps[0]!.startMs).toBe(0);
    expect(caps.at(-1)!.endMs).toBe(6000);
    for (let i = 1; i < caps.length; i++) expect(caps[i]!.startMs).toBe(caps[i - 1]!.endMs);
    for (const c of caps) expect(c.lines.length).toBeLessThanOrEqual(2);
  });
  it("chunks keep source order", () => {
    const chunks = chunkCaptions(sample, 10, 1);
    for (let i = 1; i < chunks.length; i++) expect(chunks[i]!.start).toBeGreaterThanOrEqual(chunks[i - 1]!.end - 1);
  });
});

describe("TTS text", () => {
  it("speaks units in Thai, never letter-by-letter", () => {
    expect(normalizeForTts("ผลิตได้ 3 kW")).toBe("ผลิตได้ 3 กิโลวัตต์");
    expect(normalizeForTts("แบตเตอรี่ 10 kWh")).toBe("แบตเตอรี่ 10 กิโลวัตต์ชั่วโมง");
    expect(normalizeForTts("ประมาณ 80%")).toBe("ประมาณ 80 เปอร์เซ็นต์");
  });
  it("estimates longer speech for longer text and slower delivery", () => {
    expect(estimateSpeechMs("สวัสดีครับ วันนี้เราจะคุยเรื่องโซลาร์เซลล์กัน")).toBeGreaterThan(estimateSpeechMs("สวัสดีครับ"));
    expect(estimateSpeechMs("สวัสดีครับ", 0.8)).toBeGreaterThan(estimateSpeechMs("สวัสดีครับ", 1));
  });
});

describe("dialogue timing", () => {
  const withAudio = (id: string, from: number, ms: number, castId = "sunny") => ({ id, castId, text: "ทดสอบ", from, audio: { source: "mock", file: "x.wav", durationMs: ms } });
  it("never overlaps or shortens speech; later lines move, earlier ones don't", () => {
    const lines = layoutSceneDialogue(scene([withAudio("a", 10, 2000), withAudio("b", 30, 1000)]), 30);
    expect(lines[0]).toMatchObject({ id: "a", from: 10, durationInFrames: 60 });
    expect(lines[1]!.from).toBeGreaterThanOrEqual(10 + 60);
    expect(lines[1]!.durationInFrames).toBe(30);
  });
  it("scenes grow to fit speech and never shrink", () => {
    const ep = applyDialogueTiming(episode([scene([withAudio("a", 0, 4000)], { durationInFrames: 60 }), scene([], { id: "s2", durationInFrames: 90 })]));
    expect(ep.scenes[0]!.durationInFrames).toBeGreaterThanOrEqual(120);
    expect(ep.scenes[1]!.durationInFrames).toBe(90);
  });
  it("music ducks under speech with smooth ramps and recovers after", () => {
    const ep = applyDialogueTiming(episode([scene([withAudio("a", 30, 1000)], { durationInFrames: 120 })]));
    const iv = dialogueIntervals(ep);
    expect(duckGain(10, iv, 0.25, 8)).toBe(1);
    expect(duckGain(40, iv, 0.25, 8)).toBe(0.25);
    const mid = duckGain(26, iv, 0.25, 8);
    expect(mid).toBeGreaterThan(0.25);
    expect(mid).toBeLessThan(1);
    expect(duckGain(110, iv, 0.25, 8)).toBe(1);
  });
  it("cue fades", () => {
    expect(cueFade(0, 100, 10, 10)).toBe(0);
    expect(cueFade(50, 100, 10, 10)).toBe(1);
    expect(cueFade(100, 100, 10, 10)).toBe(0);
  });
});

describe("lip sync", () => {
  const line = { id: "a", castId: "sunny", text: "x", from: 10, durationInFrames: 30, subtitle: true, lipSync: true, audio: { source: "mock" as const, envelopeHz: 30, envelope: Array.from({ length: 30 }, (_, i) => (i % 2 ? 1 : 0)) } };
  it("is silent outside the line and follows the envelope inside", () => {
    expect(mouthForLine(line, 5, 30)).toBeNull();
    expect(mouthForLine(line, 40, 30)).toBeNull();
    expect(mouthForLine(line, 11, 30)!.open).toBeGreaterThan(mouthForLine(line, 12, 30)!.open);
  });
});

describe("subtitles export", () => {
  it("SRT matches the on-screen caption timeline", () => {
    const ep = applyDialogueTiming(episode([scene([{ id: "a", castId: "ton", text: "แล้วเราจะรู้ได้ยังไงว่าไฟมาจากไหน", from: 15, audio: { source: "mock", durationMs: 3000 } }], { durationInFrames: 120 })]));
    const srt = episodeSrt(ep);
    const caps = sceneCaptions(ep.scenes[0]!, 30, ep.subtitles);
    expect(srt).toMatch(/^1\n00:00:00,500 --> 00:00:03,500\n/);
    expect(srt.split("\n\n").filter(Boolean).length).toBe(caps.length);
  });
});

describe("audio pipeline (no network)", () => {
  const tmp = () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), "bl-audio-"));
    fs.mkdirSync(path.join(d, "public"), { recursive: true });
    return d;
  };
  const ep = () => episode([scene([{ id: "l1", castId: "sunny", text: "ผลิตได้ 3 kW", from: 0 }, { id: "l2", castId: "ton", text: "เยี่ยมเลย", from: 10 }], { durationInFrames: 30 })]);
  const paidEnv = { ELEVENLABS_API_KEY: "test-key", ELEVENLABS_ALLOW_PAID_CALLS: "true", ELEVENLABS_VOICE_SUNNY: "voice-s", ELEVENLABS_VOICE_HOMEOWNER: "voice-t" };
  const fakeTts = () => {
    const calls: { text: string; voiceId: string }[] = [];
    const impl = async (req: { text: string; voiceId: string }) => {
      calls.push({ text: req.text, voiceId: req.voiceId });
      const samples = new Float32Array(24000).map((_, i) => Math.sin(i / 10) * 0.3);
      const wav = encodeWav(samples, 24000);
      return { pcm: wav.subarray(44), sampleRate: 24000, alignment: null };
    };
    return { calls, impl };
  };

  it("cache keys are stable and change with text, voice or settings", () => {
    const k = cacheKey("elevenlabs", "m", "sunny", "สวัสดี", { speed: 1 });
    expect(cacheKey("elevenlabs", "m", "sunny", "สวัสดี", { speed: 1 })).toBe(k);
    expect(cacheKey("elevenlabs", "m", "sunny", "สวัสดีครับ", { speed: 1 })).not.toBe(k);
    expect(cacheKey("elevenlabs", "m", "homeowner", "สวัสดี", { speed: 1 })).not.toBe(k);
    expect(cacheKey("elevenlabs", "m", "sunny", "สวัสดี", { speed: 0.9 })).not.toBe(k);
    expect(cacheKey("mock", "m", "sunny", "สวัสดี", { speed: 1 })).not.toBe(k);
  });

  it("mock mode is free: generates mock voices, times the episode, bills nothing", async () => {
    const root = tmp();
    const r = await prepareEpisodeAudio(ep(), { mode: "mock", root, env: {} });
    expect(r.billedCharacters).toBe(0);
    expect(r.lines.every((l) => l.source === "mock")).toBe(true);
    const l1 = r.episode.scenes[0]!.dialogue[0]!;
    expect(l1.audio!.source).toBe("mock");
    expect(l1.durationInFrames).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(root, "public", l1.audio!.file!))).toBe(true);
    expect(r.episode.scenes[0]!.dialogue[1]!.from).toBeGreaterThanOrEqual(l1.from + l1.durationInFrames!);
  });

  it("cache mode refuses to render with missing voices", async () => {
    await expect(prepareEpisodeAudio(ep(), { mode: "cache", root: tmp(), env: {} })).rejects.toThrow(/Voice cache incomplete/);
  });

  it("paid generation is refused without key + opt-in flag + --confirm-paid + budget + voice IDs", async () => {
    const { calls, impl } = fakeTts();
    const run = (env: Record<string, string>, o: Record<string, unknown> = {}) => prepareEpisodeAudio(ep(), { mode: "elevenlabs", root: tmp(), env, synthesizeImpl: impl as never, ...o });
    await expect(run({}, { confirmPaid: true })).rejects.toThrow(/ELEVENLABS_API_KEY/);
    await expect(run({ ...paidEnv, ELEVENLABS_ALLOW_PAID_CALLS: "false" }, { confirmPaid: true })).rejects.toThrow(/ALLOW_PAID_CALLS/);
    await expect(run(paidEnv)).rejects.toThrow(/--confirm-paid/);
    await expect(run(paidEnv, { confirmPaid: true, maxCharacters: 5 })).rejects.toThrow(/budget/);
    await expect(run({ ...paidEnv, ELEVENLABS_VOICE_HOMEOWNER: "" }, { confirmPaid: true })).rejects.toThrow(/ELEVENLABS_VOICE_HOMEOWNER/);
    expect(calls).toEqual([]);
  });

  it("dry run reports the billable characters and calls nothing", async () => {
    const { calls, impl } = fakeTts();
    const r = await prepareEpisodeAudio(ep(), { mode: "elevenlabs", root: tmp(), env: paidEnv, dryRun: true, synthesizeImpl: impl as never });
    expect(calls).toEqual([]);
    expect(r.lines.filter((l) => l.source === "elevenlabs-new").length).toBe(2);
  });

  it("approved generation caches every line; a second run bills nothing; regenerate is per line", async () => {
    const root = tmp();
    const { calls, impl } = fakeTts();
    const o = { mode: "elevenlabs" as const, root, env: paidEnv, confirmPaid: true, synthesizeImpl: impl as never };
    const first = await prepareEpisodeAudio(ep(), o);
    expect(calls.map((c) => c.text)).toEqual(["ผลิตได้ 3 กิโลวัตต์", "เยี่ยมเลย"]); // the voice says the normalised text
    expect(calls.map((c) => c.voiceId)).toEqual(["voice-s", "voice-t"]);
    expect(first.billedCharacters).toBe("ผลิตได้ 3 กิโลวัตต์".length + "เยี่ยมเลย".length);
    expect(fs.readFileSync(path.join(root, "public/assets/audio/cache/ledger.jsonl"), "utf8").trim().split("\n")).toHaveLength(2);
    expect(first.episode.scenes[0]!.dialogue[0]!.text).toBe("ผลิตได้ 3 kW"); // subtitles keep the written form
    const second = await prepareEpisodeAudio(ep(), o);
    expect(second.billedCharacters).toBe(0);
    expect(calls).toHaveLength(2);
    // mock mode picks up the paid cache for free
    const mock = await prepareEpisodeAudio(ep(), { mode: "mock", root, env: {} });
    expect(mock.lines.every((l) => l.source === "elevenlabs-cache")).toBe(true);
    const third = await prepareEpisodeAudio(ep(), { ...o, regenerate: ["l2"] });
    expect(third.billedCharacters).toBe("เยี่ยมเลย".length);
    expect(calls).toHaveLength(3);
  });

  it("imported audio is used as-is", async () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, "public/assets/audio/imported"), { recursive: true });
    fs.writeFileSync(path.join(root, "public/assets/audio/imported/l1.wav"), encodeWav(new Float32Array(48000).fill(0.2), 24000));
    const e = episode([scene([{ id: "l1", castId: "sunny", text: "ทดสอบ", from: 0, audio: { source: "imported", file: "assets/audio/imported/l1.wav" } }])]);
    const r = await prepareEpisodeAudio(e, { mode: "cache", root, env: {} });
    expect(r.lines[0]!.source).toBe("imported");
    expect(r.episode.scenes[0]!.dialogue[0]!.audio!.durationMs).toBe(2000);
  });
});

describe("ElevenLabs request", () => {
  it("uses with-timestamps + PCM, sends the key only as a header", async () => {
    const { url, body } = buildTtsRequest({ voiceId: "v1", modelId: "eleven_multilingual_v2", text: "สวัสดี", speed: 0.9 });
    expect(url).toBe("https://api.elevenlabs.io/v1/text-to-speech/v1/with-timestamps?output_format=pcm_24000");
    expect(body).toMatchObject({ text: "สวัสดี", model_id: "eleven_multilingual_v2", voice_settings: { speed: 0.9 } });
    let seen: { url: string; headers: Record<string, string> } | null = null;
    const pcm = Buffer.alloc(4800);
    const fetchImpl = async (u: string, init: { headers: Record<string, string> }) => {
      seen = { url: u, headers: init.headers };
      return { ok: true, status: 200, json: async () => ({ audio_base64: pcm.toString("base64"), alignment: { characters: ["ส"], character_start_times_seconds: [0], character_end_times_seconds: [0.1] } }), text: async () => "" };
    };
    const r = await synthesize({ voiceId: "v1", modelId: "m", text: "ส" }, "secret-key", fetchImpl as never);
    expect(seen!.url).not.toContain("secret-key");
    expect(seen!.headers["xi-api-key"]).toBe("secret-key");
    expect(r.alignment).toEqual({ chars: ["ส"], startMs: [0], endMs: [100] });
  });
  it("reports HTTP errors without echoing the key", async () => {
    const fetchImpl = async () => ({ ok: false, status: 401, json: async () => ({}), text: async () => "invalid api key" });
    await expect(synthesize({ voiceId: "v", modelId: "m", text: "x" }, "secret-key", fetchImpl as never)).rejects.toThrow(/HTTP 401/);
    await expect(synthesize({ voiceId: "v", modelId: "m", text: "x" }, "secret-key", fetchImpl as never)).rejects.not.toThrow(/secret-key/);
  });
});

describe("WAV + sound library", () => {
  it("round-trips WAV and measures loudness", () => {
    const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "bl-wav-")), "x.wav");
    const s = new Float32Array(2400).map((_, i) => (i < 1200 ? 0 : Math.sin(i) * 0.5));
    fs.writeFileSync(f, encodeWav(s, 24000));
    const w = readWav(f);
    expect(w.sampleRate).toBe(24000);
    expect(w.samples.length).toBe(2400);
    const env = loudnessEnvelope(w.samples, 24000, 100);
    expect(env[0]).toBe(0);
    expect(env.at(-1)).toBeGreaterThan(0.5);
  });
  it("library sounds are all original and registered with files under public/", () => {
    for (const s of Object.values(SOUND_LIBRARY)) {
      expect(s.license).toMatch(/^Original/);
      expect(s.file.startsWith("assets/audio/library/")).toBe(true);
    }
  });
});
