/**
 * Deterministic, frame-based animation primitives.
 *
 * RULE: every value here is a pure function of (frame, fps, data). No clocks,
 * no Math.random(), no useFrame(). Rendering frame N in isolation must give
 * exactly the same picture as reaching it by playback.
 */
import type { EasingName, Vec3 } from "../../schemas/episode";

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Shortest-path angle interpolation. */
export const lerpAngle = (a: number, b: number, t: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

export const EASINGS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  hold: () => 0,
};

/** Smooth 0→1 progress between two frames. */
export const progress = (frame: number, from: number, to: number, easing: EasingName = "easeInOut") =>
  to <= from ? (frame >= to ? 1 : 0) : EASINGS[easing](clamp((frame - from) / (to - from)));

export interface Keyframe<T> {
  frame: number;
  value: T;
  /** Easing used when travelling FROM the previous keyframe TO this one. */
  easing?: EasingName;
}

/** Sample a keyframe track. Keyframes need not be sorted. Holds at both ends. */
export function sampleTrack<T>(keys: Keyframe<T>[], frame: number, mix: (a: T, b: T, t: number) => T): T {
  if (keys.length === 0) throw new Error("sampleTrack: empty track");
  const sorted = keys.length > 1 ? [...keys].sort((a, b) => a.frame - b.frame) : keys;
  const first = sorted[0]!;
  if (frame <= first.frame) return first.value;
  for (let i = 1; i < sorted.length; i++) {
    const k = sorted[i]!;
    if (frame <= k.frame) {
      const prev = sorted[i - 1]!;
      const t = progress(frame, prev.frame, k.frame, k.easing ?? "easeInOut");
      return mix(prev.value, k.value, t);
    }
  }
  return sorted[sorted.length - 1]!.value;
}

export const sampleNumber = (keys: Keyframe<number>[], frame: number) => sampleTrack(keys, frame, lerp);
export const sampleVec3 = (keys: Keyframe<Vec3>[], frame: number) => sampleTrack(keys, frame, lerpVec3);

// ------------------------------------------------------------ seeded random
/** 32-bit integer hash (deterministic). */
export function hash32(n: number): number {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

/** Deterministic pseudo-random in [0,1) for (seed, index). */
export const rand = (seed: number, index = 0) => hash32(hash32(seed) + index * 0x9e3779b9) / 4294967296;

export const stringSeed = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Smooth 1-D value noise, deterministic. Good for subtle sway. */
export function noise1(seed: number, x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(rand(seed, i), rand(seed, i + 1), u) * 2 - 1;
}

/**
 * Blink schedule: returns eyelid closure 0 (open) – 1 (closed).
 * Blinks are placed pseudo-randomly every ~2.5–4.5 s, each lasting ~5 frames.
 */
export function blinkAmount(frame: number, fps: number, seed: number): number {
  const slot = Math.round(fps * 3.5);
  const index = Math.floor(frame / slot);
  for (const k of [index - 1, index]) {
    if (k < 0) continue;
    const start = k * slot + Math.floor(rand(seed, k) * (slot - 8));
    const d = frame - start;
    if (d >= 0 && d <= 5) return d <= 2 ? d / 2 : 1 - (d - 2) / 3;
  }
  return 0;
}
