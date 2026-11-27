/**
 * Reusable animation clip library (Phase 1 subset).
 *
 * A clip is a pure function: (context, incoming pose) → pose. Clips are
 * layered by the evaluator with blend-in/out envelopes, so transitions between
 * gestures are smooth and reproducible frame by frame.
 *
 * Rig conventions (character faces +Z, Y up):
 *   shoulder x < 0  → arm raises forward
 *   shoulderL z > 0 / shoulderR z < 0 → arm raises out to the side
 *   elbow x < 0     → forearm bends forward
 */
import { addPose, blendPoses, restPose, type JointName, type Pose, type Rot } from "../characters/rig";
import * as THREE from "three";
import { clamp, noise1, progress } from "./core";

export interface ClipContext {
  /** Frame relative to clip start. */
  frame: number;
  durationInFrames: number;
  fps: number;
  seed: number;
  params: Record<string, unknown>;
}

export type Clip = (ctx: ClipContext, pose: Pose) => Pose;

const num = (p: Record<string, unknown>, k: string, d: number) => (typeof p[k] === "number" ? (p[k] as number) : d);

const SIDE_SWAP: Record<string, JointName> = { shoulderR: "shoulderL", elbowR: "elbowL", wristR: "wristL", shoulderL: "shoulderR", elbowL: "elbowR", wristL: "wristR" };

/**
 * Gesture clips are authored for one arm. hand: "left" mirrors the arm joints
 * (and yaw-like rotations of the torso/head) across the character's midline.
 */
function withHand(params: Record<string, unknown>, authored: Pose, base: Pose, authoredSide: "left" | "right"): Pose {
  const hand = params.hand === "left" || params.hand === "right" ? params.hand : authoredSide;
  if (hand === authoredSide) return authored;
  const joints: Pose["joints"] = { ...base.joints };
  for (const [k, r] of Object.entries(authored.joints) as [JointName, Rot][]) {
    if (r === base.joints[k]) continue; // joint not touched by the clip
    const mirrored: Rot = [r[0], -r[1], -r[2]];
    joints[SIDE_SWAP[k] ?? k] = mirrored; // arm joints move to the other side; torso/head flip yaw & roll
  }
  return { ...authored, joints, face: { ...authored.face, gaze: [-authored.face.gaze[0], authored.face.gaze[1]] } };
}

/** Subtle breathing + weight shift. Intended to always run underneath. */
const idleBreathing: Clip = ({ frame, fps, seed }, pose) => {
  const t = frame / fps;
  const breath = Math.sin(t * Math.PI * 2 * 0.25); // 15 breaths/min
  const sway = noise1(seed, t * 0.35) * 0.025;
  const out = addPose(pose, {
    chest: [breath * 0.025, 0, 0],
    spine: [0, sway, sway * 0.6],
    neck: [-breath * 0.015, 0, 0],
    shoulderL: [0, 0, breath * 0.02],
    shoulderR: [0, 0, -breath * 0.02],
  });
  return { ...out, rootY: out.rootY + breath * 0.006 };
};

/** Friendly wave with the right hand. */
const wave: Clip = ({ frame, fps, params }, pose) => {
  const t = frame / fps;
  const osc = Math.sin(t * Math.PI * 2 * 1.6);
  const target: Pose = {
    ...pose,
    joints: {
      ...pose.joints,
      shoulderR: [-0.25, 0, -2.35 + osc * 0.12],
      elbowR: [0, 0, -0.55 + osc * 0.35],
      wristR: [0, 0, osc * 0.15],
      head: [0.04, -0.08, 0.06],
    },
    face: { ...pose.face, smile: 0.9, browRaise: 0.35 },
  };
  return withHand(params, target, pose, "right");
};

/**
 * Arm rotation (Euler XYZ) that aims a hanging arm (0,-1,0) along a direction
 * given by yaw (+ = toward the character's left, +X) and pitch (+ = up).
 */
export function aimArm(yaw: number, pitch: number): [number, number, number] {
  const d = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d);
  const e = new THREE.Euler().setFromQuaternion(q, "XYZ");
  return [e.x, e.y, e.z];
}

/**
 * Point with the right arm. params: yaw / pitch (rad, character-local), or
 * pointAt (anchor name / world position) which the scene resolves to yaw/pitch.
 * Negative yaw = toward the character's right (natural for the right arm).
 */
const point: Clip = ({ frame, params }, pose) => {
  const pitch = num(params, "pitch", 0.4);
  const left = params.hand === "left";
  // authored for the right arm: a left-hand point at yaw Y equals a mirrored right-hand point at -Y
  const yaw = left ? -num(params, "yaw", 0.6) : num(params, "yaw", -0.6);
  const settle = progress(frame, 0, 10, "easeOut");
  // Arms do not point behind the body: clamp to a comfortable side/up range,
  // and lift a little more when the target is behind (reads as "up there").
  const behind = Math.max(0, Math.abs(yaw) - 1.5);
  const arm = aimArm(Math.sign(yaw) * Math.min(Math.abs(yaw), 1.5), Math.min(1.25, pitch + behind * 0.5));
  const authored: Pose = {
    ...pose,
    joints: {
      ...pose.joints,
      shoulderR: arm,
      elbowR: [-0.1 * settle, 0, 0],
      wristR: [0.1, 0, 0],
      chest: [0, yaw * 0.15, 0],
    },
    face: { ...pose.face, smile: 0.55, browRaise: 0.25 },
  };
  return withHand(params, authored, pose, "right");
};

/**
 * Talking: procedural mouth + small head emphasis. Phase 4 replaces the mouth
 * driver with real audio amplitude / alignment data; the clip signature stays.
 */
const talk: Clip = ({ frame, fps, seed, durationInFrames }, pose) => {
  const t = frame / fps;
  const syllable = Math.max(0, Math.sin(t * Math.PI * 2 * 4.2 + noise1(seed, t * 2) * 2));
  const phrase = clamp(0.6 + noise1(seed + 7, t * 1.3) * 0.6);
  const tail = 1 - progress(frame, durationInFrames - 6, durationInFrames, "easeIn");
  const mouth = syllable * phrase * tail * 0.85;
  return addPose(
    { ...pose, face: { ...pose.face, mouthOpen: Math.max(pose.face.mouthOpen, mouth) } },
    { head: [noise1(seed + 3, t * 1.7) * 0.05, noise1(seed + 4, t * 0.9) * 0.06, 0], neck: [mouth * 0.02, 0, 0] },
  );
};

/** Open-palm explaining gesture with the left hand. */
const explain: Clip = ({ frame, fps, seed }, pose) => {
  const t = frame / fps;
  const beat = noise1(seed + 11, t * 1.4);
  return {
    ...pose,
    joints: {
      ...pose.joints,
      shoulderL: [-0.75 + beat * 0.12, -0.2, 0.35],
      elbowL: [-1.0 + beat * 0.15, 0, 0],
      wristL: [0, 0, 0.3],
    },
  };
};

const nod: Clip = ({ frame, fps }, pose) =>
  addPose(pose, { head: [Math.max(0, Math.sin((frame / fps) * Math.PI * 2 * 1.5)) * 0.18, 0, 0] });

const smile: Clip = (_ctx, pose) => ({ ...pose, face: { ...pose.face, smile: 1, browRaise: 0.2 } });

export const CLIPS: Record<string, Clip> = {
  "idle-breathing": idleBreathing,
  wave,
  point,
  talk,
  explain,
  nod,
  smile,
};

export interface ClipInstance {
  clip: string;
  from: number;
  durationInFrames: number;
  blendFrames: number;
  weight: number;
  params: Record<string, unknown>;
}

/** Trapezoid envelope for blend-in / blend-out. */
export function clipEnvelope(frame: number, c: Pick<ClipInstance, "from" | "durationInFrames" | "blendFrames">): number {
  const local = frame - c.from;
  if (local < 0 || local > c.durationInFrames) return 0;
  const b = Math.max(1, c.blendFrames);
  const fadeIn = progress(local, 0, b, "easeInOut");
  const fadeOut = 1 - progress(local, c.durationInFrames - b, c.durationInFrames, "easeInOut");
  return Math.min(fadeIn, fadeOut);
}

/**
 * Evaluate the full layered pose at a frame:
 *   rest → idle breathing (always) → each active clip blended by its envelope.
 */
export function evaluatePose(frame: number, fps: number, seed: number, clips: ClipInstance[]): Pose {
  let pose = idleBreathing({ frame, fps, seed, durationInFrames: Infinity, params: {} }, restPose());
  for (const c of clips) {
    if (c.clip === "idle-breathing") continue;
    const fn = CLIPS[c.clip];
    if (!fn) throw new Error(`Unknown animation clip "${c.clip}"`);
    const w = clipEnvelope(frame, c) * c.weight;
    if (w <= 0) continue;
    const ctx: ClipContext = { frame: frame - c.from, durationInFrames: c.durationInFrames, fps, seed, params: c.params };
    pose = blendPoses(pose, fn(ctx, pose), w);
  }
  return pose;
}
