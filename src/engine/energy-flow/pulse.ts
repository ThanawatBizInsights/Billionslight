/**
 * Travelling-pulse maths for the approved energy-flow style (pure functions,
 * shared by the shader uniforms, tests and review tools).
 *
 * Coordinates: s ∈ [0,1] is the normalised distance along the cable measured
 * FROM THE SOURCE (direction already applied), so the leading edge always
 * moves toward the destination. One pulse per connection; the cycle lets the
 * pulse enter from the source end and leave through the destination end, so it
 * never visibly jumps between endpoints.
 */
import { ENERGY_FLOW_PULSE } from "../../config/energy-flow";
import { clamp } from "../animation/core";

/** Pulse length (fraction of the cable) adapted for short connections. */
export function pulseFraction(lengthM: number): number {
  const p = ENERGY_FLOW_PULSE;
  const wanted = Math.max(p.lengthFraction, p.minLengthM / Math.max(lengthM, 1e-3));
  return clamp(wanted, 0.05, p.maxFraction);
}

export function clampTravelSeconds(s?: number): number {
  const [lo, hi] = ENERGY_FLOW_PULSE.travelSecondsRange;
  return clamp(s ?? ENERGY_FLOW_PULSE.travelSeconds, lo, hi);
}

/**
 * Leading-edge position (in s units) at a frame. The head moves linearly from 0
 * to 1 + pulse over one cycle (the extra `pulse` lets the tail exit cleanly),
 * at a rate of 1 cable length per `travelSeconds`. Deterministic: frame + fps only.
 */
export function pulseHead(frame: number, fps: number, pulse: number, travelSeconds: number, phase = 0): number {
  const cycle = travelSeconds * (1 + pulse); // seconds per loop
  const t = frame / fps / cycle + phase;
  const u = t - Math.floor(t);
  return u * (1 + pulse);
}

/** Approved intensity profile, x = 0 trailing end … 1 leading end. */
export function pulseProfile(x: number): number {
  if (x <= 0 || x >= 1) return 0;
  const pts = ENERGY_FLOW_PULSE.profile;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    if (x <= x1) {
      const k = (x - x0) / (x1 - x0);
      // last segment (leading edge → 0): rapid but smooth fade
      const e = i === pts.length - 1 ? k * k * (3 - 2 * k) : k;
      return y0 + (y1 - y0) * e;
    }
  }
  return 0;
}

/** Pulse intensity at cable position s (from the source) for a given head position. */
export function pulseIntensityAt(s: number, head: number, pulse: number): number {
  const behind = head - s; // 0 at the leading edge, `pulse` at the trailing end
  if (behind < 0 || behind > pulse) return 0;
  return pulseProfile(1 - behind / pulse);
}
