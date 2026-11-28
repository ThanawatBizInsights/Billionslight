/**
 * Mock voice: a quiet, deterministic "speech-like" hum with syllable rhythm
 * and intonation, at the estimated duration of the Thai line. Used for
 * development and timing tests — NOT a voice, never published.
 */
import { rand } from "../engine/animation/core";
import { estimateSpeechMs } from "../engine/audio/tts-normalize";

export const MOCK_SAMPLE_RATE = 24000;

const VOICE_F0: Record<string, number> = { sunny: 255, homeowner: 135, narrator: 175, technician: 150 };

export function mockVoice(spoken: string, voiceKey: string, speed: number, seed: number) {
  const durMs = estimateSpeechMs(spoken, speed);
  const n = Math.round((durMs / 1000) * MOCK_SAMPLE_RATE);
  const out = new Float32Array(n);
  const f0 = VOICE_F0[voiceKey] ?? 180;
  const graphemes = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(spoken)].map((g) => g.segment);
  const syllables = Math.max(1, Math.round(((durMs - 350) / 1000) * 5.5 * speed));
  const lead = 0.12;
  const body = durMs / 1000 - lead - 0.18;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / MOCK_SAMPLE_RATE;
    const u = (t - lead) / body;
    let amp = 0;
    if (u >= 0 && u <= 1) {
      const s = u * syllables;
      const k = Math.floor(s);
      const within = s - k;
      const shape = Math.sin(Math.PI * within) ** 0.8; // one bump per syllable
      amp = shape * (0.55 + 0.45 * rand(seed, k));
    }
    const pitch = f0 * (1 + 0.08 * Math.sin(t * 2.1 + seed) - 0.06 * Math.max(0, u));
    ph += (2 * Math.PI * pitch) / MOCK_SAMPLE_RATE;
    out[i] = (Math.sin(ph) + 0.45 * Math.sin(2 * ph) + 0.2 * Math.sin(3 * ph)) * amp * 0.18;
  }
  // even character timings across the voiced body (for subtitles/lip sync)
  const startMs: number[] = [];
  const endMs: number[] = [];
  graphemes.forEach((_, i) => {
    startMs.push(Math.round((lead + (i / graphemes.length) * body) * 1000));
    endMs.push(Math.round((lead + ((i + 1) / graphemes.length) * body) * 1000));
  });
  // alignment uses code points like ElevenLabs: expand graphemes to characters
  const chars: string[] = [];
  const cs: number[] = [];
  const ce: number[] = [];
  graphemes.forEach((g, i) => {
    for (const ch of g) {
      chars.push(ch);
      cs.push(startMs[i]!);
      ce.push(endMs[i]!);
    }
  });
  return { samples: out, sampleRate: MOCK_SAMPLE_RATE, durationMs: durMs, alignment: { chars, startMs: cs, endMs: ce } };
}
