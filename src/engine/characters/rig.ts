/**
 * Shared humanoid rig definition.
 *
 * All characters (Sunny, Homeowner, Technician, temporary prototypes) use the
 * same joint names so every animation clip works on every character. Character
 * definitions only change proportions, materials and accessories.
 */
import { lerp, lerpAngle } from "../animation/core";

export const JOINTS = [
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
export type JointName = (typeof JOINTS)[number];

/** Euler rotation [x, y, z] in radians. */
export type Rot = [number, number, number];

export interface FaceState {
  /** 0 open – 1 closed (added on top of blink). */
  eyelids: number;
  /** Eye direction offset in radians [yaw, pitch]. */
  gaze: [number, number];
  /** Mouth opening 0–1 (speech). */
  mouthOpen: number;
  /** -1 frown … 0 neutral … 1 smile. */
  smile: number;
  /** -1 angry/concentrated … 1 raised/surprised. */
  browRaise: number;
  /** Asymmetric brow for confusion: -1…1 */
  browTilt: number;
}

export interface Pose {
  joints: Partial<Record<JointName, Rot>>;
  /** Vertical root offset (breathing bob, sitting). */
  rootY: number;
  face: FaceState;
}

export const NEUTRAL_FACE: FaceState = { eyelids: 0, gaze: [0, 0], mouthOpen: 0, smile: 0.15, browRaise: 0, browTilt: 0 };

/** Relaxed standing pose — arms slightly away from the body. */
export const restPose = (): Pose => ({
  joints: {
    shoulderL: [0, 0, 0.12],
    shoulderR: [0, 0, -0.12],
    elbowL: [-0.12, 0, 0],
    elbowR: [-0.12, 0, 0],
  },
  rootY: 0,
  face: { ...NEUTRAL_FACE },
});

const ZERO: Rot = [0, 0, 0];

/** Blend pose b over pose a by weight w (0 = a, 1 = b). */
export function blendPoses(a: Pose, b: Pose, w: number): Pose {
  if (w <= 0) return a;
  const joints: Pose["joints"] = {};
  for (const j of JOINTS) {
    const ra = a.joints[j] ?? ZERO;
    const rb = b.joints[j] ?? ra;
    if (!a.joints[j] && !b.joints[j]) continue;
    joints[j] = [lerpAngle(ra[0], rb[0], w), lerpAngle(ra[1], rb[1], w), lerpAngle(ra[2], rb[2], w)];
  }
  const fa = a.face;
  const fb = b.face;
  return {
    joints,
    rootY: lerp(a.rootY, b.rootY, w),
    face: {
      eyelids: lerp(fa.eyelids, fb.eyelids, w),
      gaze: [lerp(fa.gaze[0], fb.gaze[0], w), lerp(fa.gaze[1], fb.gaze[1], w)],
      mouthOpen: lerp(fa.mouthOpen, fb.mouthOpen, w),
      smile: lerp(fa.smile, fb.smile, w),
      browRaise: lerp(fa.browRaise, fb.browRaise, w),
      browTilt: lerp(fa.browTilt, fb.browTilt, w),
    },
  };
}

/** Additively apply joint deltas (used for breathing / gestures layered on a base). */
export function addPose(base: Pose, delta: Partial<Record<JointName, Rot>>, w = 1): Pose {
  const joints = { ...base.joints };
  for (const [k, d] of Object.entries(delta) as [JointName, Rot][]) {
    const r = joints[k] ?? ZERO;
    joints[k] = [r[0] + d[0] * w, r[1] + d[1] * w, r[2] + d[2] * w];
  }
  return { ...base, joints };
}
