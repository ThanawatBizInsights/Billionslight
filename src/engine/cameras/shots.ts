/**
 * Subject-aware cinematic shot presets (Phase 3).
 *
 * A preset is a pure function of the frame: it receives resolvers for its
 * subjects (cast members' eyes, environment anchors or fixed points) and
 * returns the camera for that frame. This makes tracking shots and shots that
 * follow moving characters deterministic. Movement is slow and smooth by
 * design — no shake.
 */
import type { Vec3 } from "../../schemas/episode";
import { clamp, progress } from "../animation/core";
import type { CameraShot } from "./CameraRig";

export interface ShotContext {
  frame: number;
  durationInFrames: number;
  /** Output aspect (width / height): vertical framing needs more distance. */
  aspect: number;
  /** Primary subject point at a frame (eye level for characters). */
  subject: (frame: number) => Vec3;
  /** Secondary subject (dialogue partner, equipment …), if given. */
  subject2?: (frame: number) => Vec3;
  /** Facing (yaw) of the primary subject if it is a character. */
  subjectYaw?: (frame: number) => number;
  params: ShotParams;
}

export interface ShotParams {
  /** Horizontal angle around the subject (rad). 0 = in front along +Z (world) or the character's facing if `relative`. */
  azimuth?: number;
  relative?: boolean;
  distance?: number;
  height?: number;
  fov?: number;
  /** Fractional push in (>0) or pull out (<0) over the shot. */
  push?: number;
  /** Total orbit angle over the shot (rad). */
  orbit?: number;
  /** Which side of the foreground subject the camera sits (over-the-shoulder / two-shot): 1 or -1. */
  side?: number;
}

type Shot = (c: ShotContext) => CameraShot;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const flatDir = (a: Vec3, b: Vec3): Vec3 => {
  const d: Vec3 = [b[0] - a[0], 0, b[2] - a[2]];
  const l = Math.hypot(d[0], d[2]) || 1;
  return [d[0] / l, 0, d[2] / l];
};
const t01 = (c: ShotContext) => progress(c.frame, 0, Math.max(1, c.durationInFrames - 1), "easeInOut");

/** Camera orbiting a focus point at (azimuth, distance, height). */
function orbitShot(c: ShotContext, d: { distance: number; height: number; azimuth: number; fov: number; push?: number; orbit?: number; lookDrop?: number }): CameraShot {
  const p = c.params;
  const t = t01(c);
  const focus = c.subject(c.frame);
  let az = (p.azimuth ?? d.azimuth) + (p.orbit ?? d.orbit ?? 0) * (t - 0.5);
  if (p.relative && c.subjectYaw) az += c.subjectYaw(c.frame);
  const dist = (p.distance ?? d.distance) * (1 - (p.push ?? d.push ?? 0) * t);
  const h = p.height ?? d.height;
  // vertical frames are narrow: back off so the subject keeps breathing room
  const aspectBoost = c.aspect < 1 ? 1 + (1 - c.aspect) * 0.35 : 1;
  const position: Vec3 = [focus[0] + Math.sin(az) * dist * aspectBoost, focus[1] + h, focus[2] + Math.cos(az) * dist * aspectBoost];
  return { position, target: [focus[0], focus[1] - (d.lookDrop ?? 0), focus[2]], fov: p.fov ?? d.fov };
}

export const SHOTS: Record<string, Shot> = {
  /** Wide establishing view of a location; gentle drift. */
  "establishing-wide": (c) => orbitShot(c, { distance: 22, height: 6, azimuth: 0.45, fov: 36, orbit: 0.08, lookDrop: 1.0 }),
  /** Medium shot of one character (waist up), slight push. */
  "medium-character": (c) => orbitShot(c, { distance: 2.4, height: 0.05, azimuth: 0.25, fov: 34, push: 0.06, lookDrop: 0.18 }),
  /** Close-up on a face. */
  "close-up": (c) => orbitShot(c, { distance: 1.15, height: 0.02, azimuth: 0.2, fov: 30, push: 0.05, lookDrop: 0.03 }),
  /** Over the shoulder of subject (foreground) toward subject2. */
  "over-the-shoulder": (c) => {
    const a = c.subject(c.frame);
    const b = (c.subject2 ?? c.subject)(c.frame);
    const dir = flatDir(a, b);
    const side = c.params.side ?? 1;
    const perp: Vec3 = [dir[2] * side, 0, -dir[0] * side];
    const back = c.params.distance ?? 0.95;
    const pos = add(add(sub(a, scale(dir, back)), scale(perp, 0.42)), [0, (c.params.height ?? 0.12), 0]);
    const push = (c.params.push ?? 0.04) * t01(c);
    return { position: lerp3(pos, b, push), target: [b[0], b[1] - 0.06, b[2]], fov: c.params.fov ?? 34 };
  },
  /** Two characters in frame, camera perpendicular to the line between them. */
  "two-character": (c) => {
    const a = c.subject(c.frame);
    const b = (c.subject2 ?? c.subject)(c.frame);
    const mid = lerp3(a, b, 0.5);
    const dir = flatDir(a, b);
    const side = c.params.side ?? 1;
    const perp: Vec3 = [-dir[2] * side, 0, dir[0] * side];
    const fov = c.params.fov ?? 36;
    const hHalf = Math.atan(Math.tan(((fov / 2) * Math.PI) / 180) * c.aspect);
    const sep = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const dist = c.params.distance ?? (sep / 2 + 0.55) / Math.tan(hHalf);
    const push = (c.params.push ?? 0.05) * t01(c);
    const pos = add(mid, add(scale(perp, dist * (1 - push)), [0, c.params.height ?? 0.25, 0]));
    return { position: pos, target: [mid[0], mid[1] - 0.25, mid[2]], fov };
  },
  /** Isometric-style house view: high, 45°, long lens. */
  "isometric-house": (c) => orbitShot(c, { distance: 34, height: 26, azimuth: 0.78, fov: 24, orbit: 0.05 }),
  /** Rooftop aerial: high above the roof looking down at the array. */
  "rooftop-aerial": (c) => orbitShot(c, { distance: 7, height: 6.5, azimuth: 0.35, fov: 38, orbit: 0.12 }),
  /** Equipment close-up with a slow lateral move. */
  "equipment-close-up": (c) => orbitShot(c, { distance: 1.25, height: 0.1, azimuth: -0.25, fov: 34, orbit: 0.3 }),
  /** Interior cutaway: front-high view into an open house model. */
  "interior-cutaway": (c) => orbitShot(c, { distance: 15, height: 6, azimuth: 0.35, fov: 32, push: 0.08 }),
  "slow-dolly-in": (c) => orbitShot(c, { distance: 9, height: 1.5, azimuth: 0.3, fov: 38, push: 0.28 }),
  "slow-dolly-out": (c) => orbitShot(c, { distance: 6.5, height: 1.2, azimuth: 0.3, fov: 38, push: -0.35 }),
  "orbit-around-equipment": (c) => orbitShot(c, { distance: 2.2, height: 0.6, azimuth: -0.6, fov: 34, orbit: 1.1 }),
  /** Top-down technical view (slight tilt keeps "up" stable). */
  "top-down-technical": (c) => {
    const f = c.subject(c.frame);
    const h = c.params.height ?? 9;
    const tw = (c.params.orbit ?? 0.15) * (t01(c) - 0.5);
    return { position: [f[0] + Math.sin(tw) * 0.6, f[1] + h, f[2] + 0.6 + Math.cos(tw) * 0.05], target: f, fov: c.params.fov ?? 40 };
  },
  /** Tracking shot: follows the subject from the side with a small lag (no shake). */
  tracking: (c) => {
    const lag = 6;
    const now = c.subject(c.frame);
    const behind = c.subject(Math.max(0, c.frame - lag));
    const focus = lerp3(behind, now, 0.6);
    const az = (c.params.azimuth ?? 1.2) + (c.params.relative && c.subjectYaw ? c.subjectYaw(c.frame) : 0);
    const dist = c.params.distance ?? 3.2;
    const aspectBoost = c.aspect < 1 ? 1 + (1 - c.aspect) * 0.35 : 1;
    return { position: [focus[0] + Math.sin(az) * dist * aspectBoost, focus[1] + (c.params.height ?? 0.25), focus[2] + Math.cos(az) * dist * aspectBoost], target: [focus[0], focus[1] - 0.25, focus[2]], fov: c.params.fov ?? 36 };
  },
};

export const SHOT_IDS = Object.keys(SHOTS);

export function getShot(id: string): Shot {
  const s = SHOTS[id];
  if (!s) throw new Error(`Camera preset "${id}" not found`);
  return s;
}

export const clampFov = (fov: number) => clamp(fov, 2, 90);
