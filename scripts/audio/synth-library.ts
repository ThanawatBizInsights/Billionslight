/**
 * Generates the ORIGINAL sound library (music bed, room tone, SFX) into
 * public/assets/audio/library/. Deterministic: same code → identical files.
 *   npx tsx scripts/audio/synth-library.ts [--force]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeWav } from "../../src/audio-pipeline/wav";
import { SOUND_LIBRARY } from "../../src/engine/audio/library";
import { rand } from "../../src/engine/animation/core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SR = 44100;
const TAU = Math.PI * 2;

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const buf = (ms: number) => new Float32Array(Math.round((ms / 1000) * SR));
const noise = (seed: number, i: number) => rand(seed, i) * 2 - 1;

function normalize(x: Float32Array, peak: number) {
  let m = 0;
  for (const v of x) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] = (x[i]! / m) * peak;
  return x;
}

/** One-pole low-pass in place. */
function lowpass(x: Float32Array, cutoff: number) {
  const a = Math.exp((-TAU * cutoff) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) x[i] = y = (1 - a) * x[i]! + a * y;
  return x;
}

// ---------------------------------------------------------------- music bed
function musicBed(): Float32Array {
  const ms = 32000;
  const out = buf(ms);
  const add = (i: number, v: number) => {
    out[((i % out.length) + out.length) % out.length]! += v; // circular → seamless loop
  };
  const bar = 2.0; // 120 BPM, 4/4
  // I – vi – IV – V in C, two bars each, twice (16 bars = 32 s)
  const chords = [
    [60, 64, 67, 71],
    [57, 60, 64, 67],
    [53, 57, 60, 64],
    [55, 59, 62, 65],
  ];
  for (let b = 0; b < 16; b++) {
    const chord = chords[Math.floor(b / 2) % 4]!;
    const t0 = b * bar;
    // pad: soft triangle-ish partials, slow swell, overlapping into the next bar
    if (b % 2 === 0) {
      const len = bar * 2 + 0.6;
      const n = Math.round(len * SR);
      for (const note of chord) {
        const f = midi(note);
        for (let i = 0; i < n; i++) {
          const t = i / SR;
          const env = Math.min(1, t / 0.6) * Math.min(1, (len - t) / 0.6);
          const v = (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t + 0.3) + 0.08 * Math.sin(TAU * 3 * f * t)) * env * 0.05;
          add(Math.round(t0 * SR) + i, v);
        }
      }
    }
    // bass on the root
    const root = midi(chord[0]! - 24);
    for (let i = 0; i < Math.round(1.8 * SR); i++) {
      const t = i / SR;
      add(Math.round(t0 * SR) + i, Math.sin(TAU * root * t) * Math.exp(-t * 1.6) * 0.12);
    }
    // plucked arpeggio, eighth notes, gentle
    const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
    for (let k = 0; k < 8; k++) {
      const f = midi(chord[pattern[k]!]! + 12);
      const start = Math.round((t0 + k * 0.25) * SR);
      const accent = k % 4 === 0 ? 1 : 0.7;
      for (let i = 0; i < Math.round(0.6 * SR); i++) {
        const t = i / SR;
        const env = Math.min(1, t / 0.004) * Math.exp(-t * 7);
        add(start + i, (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t)) * env * 0.06 * accent);
      }
    }
  }
  return normalize(lowpass(out, 6000), 0.8);
}

// ---------------------------------------------------------------- ambience
function roomTone(): Float32Array {
  const out = buf(8000);
  for (let i = 0; i < out.length; i++) out[i] = noise(11, i);
  lowpass(out, 400);
  lowpass(out, 400);
  // seamless loop: crossfade the last 0.5 s into the start
  const xf = Math.round(0.5 * SR);
  for (let i = 0; i < xf; i++) {
    const k = i / xf;
    out[i] = out[i]! * k + out[out.length - xf + i]! * (1 - k);
  }
  return normalize(out.subarray(0, out.length - xf).slice(), 0.25);
}

// ---------------------------------------------------------------- SFX
function click(): Float32Array {
  const out = buf(250);
  const hit = (at: number, amp: number, f: number) => {
    const s = Math.round(at * SR);
    for (let i = 0; i < Math.round(0.03 * SR); i++) {
      const t = i / SR;
      out[s + i]! += (Math.sin(TAU * f * t) * 0.7 + noise(21, s + i) * 0.5) * Math.exp(-t * 180) * amp;
    }
  };
  hit(0.005, 1, 2100);
  hit(0.055, 0.45, 1500);
  return normalize(lowpass(out, 7000), 0.9);
}

function sweep(ms: number, f0: number, f1: number, decay: number, seed: number, noiseAmt: number): Float32Array {
  const out = buf(ms);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / out.length;
    const f = f0 * Math.pow(f1 / f0, t);
    ph += (TAU * f) / SR;
    const env = Math.min(1, i / (0.01 * SR)) * Math.pow(1 - t, decay);
    out[i] = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + noiseAmt * noise(seed, i)) * env;
  }
  return out;
}

function powerDown(): Float32Array {
  const out = sweep(1200, 240, 38, 1.4, 31, 0.08);
  // a soft "thunk" at the start
  for (let i = 0; i < Math.round(0.08 * SR); i++) out[i]! += Math.sin((TAU * 70 * i) / SR) * Math.exp(-i / (0.02 * SR)) * 0.8;
  return normalize(lowpass(out, 3000), 0.85);
}

function powerUp(): Float32Array {
  const out = sweep(900, 140, 520, 0.6, 41, 0.02);
  // small chime at the top
  const s = Math.round(0.62 * SR);
  for (let i = 0; i < out.length - s; i++) {
    const t = i / SR;
    out[s + i]! += Math.sin(TAU * 1046.5 * t) * Math.exp(-t * 9) * 0.4;
  }
  return normalize(lowpass(out, 5000), 0.8);
}

function whoosh(): Float32Array {
  const out = buf(700);
  for (let i = 0; i < out.length; i++) out[i] = noise(51, i);
  lowpass(out, 1800);
  for (let i = 0; i < out.length; i++) {
    const t = i / out.length;
    out[i] = out[i]! * Math.sin(Math.PI * t) ** 2;
  }
  return normalize(out, 0.7);
}

function pop(): Float32Array {
  const out = buf(200);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += (TAU * (620 - 300 * Math.min(1, t / 0.08))) / SR;
    out[i] = Math.sin(ph) * Math.min(1, t / 0.002) * Math.exp(-t * 30);
  }
  return normalize(out, 0.8);
}

const GENERATORS: Record<string, () => Float32Array> = {
  "music-bright-bed": musicBed,
  "amb-room-tone": roomTone,
  "sfx-switch-click": click,
  "sfx-power-down": powerDown,
  "sfx-power-up": powerUp,
  "sfx-whoosh-soft": whoosh,
  "sfx-pop": pop,
};

export function synthLibrary(force = false): string[] {
  const written: string[] = [];
  for (const s of Object.values(SOUND_LIBRARY)) {
    const out = path.join(root, "public", s.file);
    if (!force && fs.existsSync(out)) continue;
    const gen = GENERATORS[s.id];
    if (!gen) throw new Error(`no generator for ${s.id}`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, encodeWav(gen(), SR));
    written.push(s.file);
  }
  return written;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const w = synthLibrary(process.argv.includes("--force"));
  console.log(w.length ? `generated: ${w.join(", ")}` : "sound library up to date");
}
