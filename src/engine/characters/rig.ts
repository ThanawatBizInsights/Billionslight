/**
 * Shared character rig.
 *
 * Every character uses the same core joint names, so every animation clip
 * works on every character. Body plans may add optional secondary chains
 * (ears, tail); clips that do not know about them simply leave them alone.
 */
import { lerp, lerpAngle } from "../animation/core";

export const CORE_JOINTS = [
  "hips",
  "spine",
  "chest",
  "neck",
  "head",
  "shoulderL",
  "elbowL",
  "wristL",
  "shoulderR",
  "elbowR",
  "wristR",
  "hipL",
  "kneeL",
  "ankleL",
  "hipR",
  "kneeR",
  "ankleR",
] as const;

/** Optional secondary joints (creature body plans). */
export const SECONDARY_JOINTS = ["earL", "earR", "tail1", "tail2", "tail3", "tail4", "tail5"] as const;

export const JOINTS = [...CORE_JOINTS, ...SECONDARY_JOINTS] as const;
export type JointName = (typeof JOINTS)[number];

/** Euler rotation [x, y, z] in radians. */
export type Rot = [number, number, number];

export interface FaceState {
  /** Per-eye closure 0 (open) – 1 (closed), added on top of blinking. [left, right] */
  eyelids: [number, number];
  /** Eye direction offset in radians [yaw, pitch]. */
  gaze: [number, number];
  /** Mouth opening 0–1. */
  mouthOpen: number;
  /** Mouth shape: 0 = wide/smile-open, 1 = round "o" (surprise, "oo"). */
  mouthRound: number;
  /** -1 frown … 0 neutral … 1 big smile. */
  smile: number;
  /** -1 lowered/concentrated … 1 raised/surprised. */
  browRaise: number;
  /** Asymmetric brow (confusion / scepticism): -1 … 1. */
  browTilt: number;
  /** Cheek squash for laughing / big smiles 0–1. */
  squint: number;
}

export interface Pose {
  joints: Partial<Record<JointName, Rot>>;
  /** Vertical root offset in metres (breathing bob, sitting). */
  rootY: number;
  /** Forward root offset in metres (sitting back on a seat). */
  rootZ: number;
  face: FaceState;
}

export const NEUTRAL_FACE: FaceState = {
  eyelids: [0, 0],
  gaze: [0, 0],
  mouthOpen: 0,
  mouthRound: 0,
  smile: 0.2,
  browRaise: 0,
  browTilt: 0,
  squint: 0,
};

/** Relaxed standing pose — arms slightly away from the body. */
export const restPose = (face: FaceState = NEUTRAL_FACE): Pose => ({
  joints: {
    shoulderL: [0, 0, 0.14],
    shoulderR: [0, 0, -0.14],
    elbowL: [-0.15, 0, 0],
    elbowR: [-0.15, 0, 0],
  },
  rootY: 0,
  rootZ: 0,
  face: { ...face, eyelids: [...face.eyelids], gaze: [...face.gaze] },
});

const ZERO: Rot = [0, 0, 0];

export function blendFaces(fa: FaceState, fb: FaceState, w: number): FaceState {
  return {
    eyelids: [lerp(fa.eyelids[0], fb.eyelids[0], w), lerp(fa.eyelids[1], fb.eyelids[1], w)],
    gaze: [lerp(fa.gaze[0], fb.gaze[0], w), lerp(fa.gaze[1], fb.gaze[1], w)],
    mouthOpen: lerp(fa.mouthOpen, fb.mouthOpen, w),
    mouthRound: lerp(fa.mouthRound, fb.mouthRound, w),
    smile: lerp(fa.smile, fb.smile, w),
    browRaise: lerp(fa.browRaise, fb.browRaise, w),
    browTilt: lerp(fa.browTilt, fb.browTilt, w),
    squint: lerp(fa.squint, fb.squint, w),
  };
}

/** Blend pose b over pose a by weight w (0 = a, 1 = b). */
export function blendPoses(a: Pose, b: Pose, w: number): Pose {
  if (w <= 0) return a;
  const joints: Pose["joints"] = {};
  for (const j of JOINTS) {
    if (!a.joints[j] && !b.joints[j]) continue;
    const ra = a.joints[j] ?? ZERO;
    const rb = b.joints[j] ?? ra;
    joints[j] = [lerpAngle(ra[0], rb[0], w), lerpAngle(ra[1], rb[1], w), lerpAngle(ra[2], rb[2], w)];
  }
  return { joints, rootY: lerp(a.rootY, b.rootY, w), rootZ: lerp(a.rootZ, b.rootZ, w), face: blendFaces(a.face, b.face, w) };
}

/** Additively apply joint deltas (breathing, sway, gestures layered on a base). */
export function addPose(base: Pose, delta: Partial<Record<JointName, Rot>>, w = 1): Pose {
  const joints = { ...base.joints };
  for (const [k, d] of Object.entries(delta) as [JointName, Rot][]) {
    const r = joints[k] ?? ZERO;
    joints[k] = [r[0] + d[0] * w, r[1] + d[1] * w, r[2] + d[2] * w];
  }
  return { ...base, joints };
}
