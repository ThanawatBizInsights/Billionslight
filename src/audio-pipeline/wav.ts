/** Minimal 16-bit PCM WAV writer/reader (Node only). */
import fs from "node:fs";

export function encodeWav(samples: Float32Array, sampleRate: number, channels = 1): Buffer {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * channels * 2, 28);
  buf.writeUInt16LE(channels * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i]!)) * 32767), 44 + i * 2);
  return buf;
}

/** Wrap raw little-endian 16-bit mono PCM (e.g. ElevenLabs pcm_24000) in a WAV header. */
export function pcm16ToWav(pcm: Buffer, sampleRate: number): Buffer {
  const head = encodeWav(new Float32Array(0), sampleRate);
  head.writeUInt32LE(36 + pcm.length, 4);
  head.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([head, pcm]);
}

export interface DecodedWav {
  sampleRate: number;
  channels: number;
  samples: Float32Array; // first channel
}

export function readWav(file: string): DecodedWav {
  const b = fs.readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE") throw new Error(`${file}: not a WAV file`);
  let off = 12;
  let sampleRate = 0;
  let channels = 1;
  let bits = 16;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "fmt ") {
      channels = b.readUInt16LE(off + 10);
      sampleRate = b.readUInt32LE(off + 12);
      bits = b.readUInt16LE(off + 22);
    } else if (id === "data") {
      if (bits !== 16) throw new Error(`${file}: only 16-bit PCM is supported`);
      const frames = Math.floor(size / (2 * channels));
      const samples = new Float32Array(frames);
      for (let i = 0; i < frames; i++) samples[i] = b.readInt16LE(off + 8 + i * 2 * channels) / 32768;
      return { sampleRate, channels, samples };
    }
    off += 8 + size + (size % 2);
  }
  throw new Error(`${file}: no data chunk`);
}

/** RMS loudness envelope normalised to 0–1 (95th percentile = 1). */
export function loudnessEnvelope(samples: Float32Array, sampleRate: number, hz = 100): number[] {
  const win = Math.max(1, Math.floor(sampleRate / hz));
  const out: number[] = [];
  for (let i = 0; i < samples.length; i += win) {
    let s = 0;
    const end = Math.min(samples.length, i + win);
    for (let j = i; j < end; j++) s += samples[j]! * samples[j]!;
    out.push(Math.sqrt(s / Math.max(1, end - i)));
  }
  const sorted = [...out].sort((a, b) => a - b);
  const ref = sorted[Math.floor(sorted.length * 0.95)] || 1;
  return out.map((v) => Math.round(Math.min(1, v / ref) * 100) / 100);
}

/** Loudness of the voiced parts only (dBFS RMS over 50 ms windows above -45 dBFS). */
export function voicedLevelDb(samples: Float32Array, sampleRate: number): number {
  const win = Math.max(1, Math.round(sampleRate * 0.05));
  let sum = 0;
  let n = 0;
  for (let i = 0; i + win <= samples.length; i += win) {
    let e = 0;
    for (let j = i; j < i + win; j++) e += samples[j]! * samples[j]!;
    const ms = e / win;
    if (10 * Math.log10(ms + 1e-12) > -45) {
      sum += ms;
      n++;
    }
  }
  return n ? 10 * Math.log10(sum / n) : -100;
}
