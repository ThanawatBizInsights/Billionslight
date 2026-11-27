/**
 * Reusable animation clip library.
 *
 * A clip is a pure function: (context, incoming pose) → pose. The evaluator
 * layers clips with blend-in/out envelopes over the base expression, so
 * transitions are smooth and reproducible frame by frame.
 *
 * Rig conventions (character faces +Z, Y up):
 *   shoulder x < 0  → arm raises forward
 *   shoulderL z > 0 / shoulderR z < 0 → arm raises out to the side
 *   elbow x < 0     → forearm bends forward
 *   hip x < 0       → thigh raises forward;  knee x > 0 → shin folds back
 *
 * Gesture clips are authored for one hand; `params.hand` mirrors them.
 */
import * as THREE from "three";
import { addPose, blendFaces, blendPoses, restPose, type FaceState, type JointName, type Pose, type Rot } from "../characters/rig";
import type { BodyDims } from "../characters/types";
import { clamp, noise1, progress } from "./core";

export interface ClipBody extends BodyDims {
  /** Model scale (world metres per body-plan unit). */
  scale: number;
}

export interface ClipContext {
  /** Frame relative to clip start. */
  frame: number;
  durationInFrames: number;
  fps: number;
  seed: number;
  params: Record<string, unknown>;
  body: ClipBody;
}

export type Clip = (ctx: ClipContext, pose: Pose) => Pose;

const num = (p: Record<string, unknown>, k: string, d: number) => (typeof p[k] === "number" ? (p[k] as number) : d);

const SIDE_SWAP: Record<string, JointName> = { shoulderR: "shoulderL", elbowR: "elbowL", wristR: "wristL", shoulderL: "shoulderR", elbowL: "elbowR", wristL: "wristR", earL: "earR", earR: "earL" };

/** Mirror a clip's result across the character's midline when params.hand differs from the authored side. */
function withHand(params: Record<string, unknown>, authored: Pose, base: Pose, authoredSide: "left" | "right"): Pose {
  const hand = params.hand === "left" || params.hand === "right" ? params.hand : authoredSide;
  if (hand === authoredSide) return authored;
  const joints: Pose["joints"] = { ...base.joints };
  for (const [k, r] of Object.entries(authored.joints) as [JointName, Rot][]) {
    if (r === base.joints[k]) continue; // joint not touched by the clip
    joints[SIDE_SWAP[k] ?? k] = [r[0], -r[1], -r[2]];
  }
  return { ...authored, joints, face: { ...authored.face, gaze: [-authored.face.gaze[0], authored.face.gaze[1]] } };
}

/** Override joints without touching others. */
const setJoints = (pose: Pose, j: Partial<Record<JointName, Rot>>, face?: Partial<FaceState>): Pose => ({
  ...pose,
  joints: { ...pose.joints, ...j },
  face: face ? { ...pose.face, ...face } : pose.face,
});

/**
 * Arm rotation (Euler XYZ) that aims a hanging arm (0,-1,0) along a direction
 * given by yaw (+ = toward the character's left, +X) and pitch (+ = up).
 */
export function aimArm(yaw: number, pitch: number): Rot {
  const d = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d);
  const e = new THREE.Euler().setFromQuaternion(q, "XYZ");
  return [e.x, e.y, e.z];
}

// ------------------------------------------------------------------ clips

/** Breathing, weight shift, ear flicks and tail sway. Always runs underneath. */
const idleBreathing: Clip = ({ frame, fps, seed }, pose) => {
  const t = frame / fps;
  const breath = Math.sin(t * Math.PI * 2 * 0.25);
  const sway = noise1(seed, t * 0.35) * 0.025;
  const flick = Math.max(0, noise1(seed + 50, t * 0.6) - 0.6) * 1.5; // occasional ear flick
  const out = addPose(pose, {
    chest: [breath * 0.025, 0, 0],
    spine: [0, sway, sway * 0.6],
    neck: [-breath * 0.015, 0, 0],
    shoulderL: [0, 0, breath * 0.02],
    shoulderR: [0, 0, -breath * 0.02],
    earL: [flick * 0.25, 0, noise1(seed + 51, t * 0.8) * 0.05],
    earR: [noise1(seed + 52, t * 0.7) * 0.04, 0, -flick * 0.15],
    tail1: [noise1(seed + 60, t * 0.4) * 0.05, noise1(seed + 61, t * 0.5) * 0.12, 0],
    tail2: [noise1(seed + 62, t * 0.45) * 0.06, noise1(seed + 63, t * 0.55) * 0.1, 0],
    tail3: [noise1(seed + 64, t * 0.5) * 0.07, 0, noise1(seed + 65, t * 0.6) * 0.08],
    tail4: [noise1(seed + 66, t * 0.55) * 0.08, 0, noise1(seed + 67, t * 0.65) * 0.1],
    tail5: [noise1(seed + 68, t * 0.6) * 0.12, 0, noise1(seed + 69, t * 0.7) * 0.12],
  });
  return { ...out, rootY: out.rootY + breath * 0.004 };
};

/** Friendly wave (authored right hand). */
const wave: Clip = ({ frame, fps, params }, pose) => {
  const osc = Math.sin((frame / fps) * Math.PI * 2 * 1.6);
  const p = setJoints(pose, { shoulderR: [-0.25, 0, -2.35 + osc * 0.12], elbowR: [0, 0, -0.55 + osc * 0.35], wristR: [0, 0, osc * 0.15], head: [0.04, -0.08, 0.06] }, { smile: Math.max(pose.face.smile, 0.85), browRaise: 0.35 });
  return withHand(params, p, pose, "right");
};

/** Point with an arm toward yaw/pitch (or `pointAt`, resolved by the scene). */
const point: Clip = ({ frame, params }, pose) => {
  const pitch = num(params, "pitch", 0.2);
  const left = params.hand === "left";
  const yaw = left ? -num(params, "yaw", 0.6) : num(params, "yaw", -0.6);
  const settle = progress(frame, 0, 10, "easeOut");
  const behind = Math.max(0, Math.abs(yaw) - 1.5);
  const arm = aimArm(Math.sign(yaw) * Math.min(Math.abs(yaw), 1.5), Math.min(1.25, pitch + behind * 0.5));
  const p = setJoints(pose, { shoulderR: arm, elbowR: [-0.1 * settle, 0, 0], wristR: [0.1, 0, 0], chest: [0, yaw * 0.15, 0] }, { browRaise: Math.max(pose.face.browRaise, 0.25) });
  return withHand(params, p, pose, "right");
};

/** Procedural speech mouth + head emphasis. Phase 4 drives the mouth from audio. */
const talk: Clip = ({ frame, fps, seed, durationInFrames, params }, pose) => {
  const t = frame / fps;
  const energy = num(params, "energy", 1);
  const syllable = Math.max(0, Math.sin(t * Math.PI * 2 * 4.2 + noise1(seed, t * 2) * 2));
  const phrase = clamp(0.6 + noise1(seed + 7, t * 1.3) * 0.6);
  const tail = 1 - progress(frame, durationInFrames - 6, durationInFrames, "easeIn");
  const mouth = syllable * phrase * tail * 0.75 * energy;
  return addPose(
    { ...pose, face: { ...pose.face, mouthOpen: Math.max(pose.face.mouthOpen, mouth), mouthRound: pose.face.mouthRound * (1 - mouth) + mouth * 0.25 * (noise1(seed + 9, t * 3) + 1) } },
    { head: [noise1(seed + 3, t * 1.7) * 0.05 * energy, noise1(seed + 4, t * 0.9) * 0.06 * energy, noise1(seed + 5, t * 0.7) * 0.03], neck: [mouth * 0.02, 0, 0] },
  );
};

/** Open-palm explaining gesture (authored left hand). */
const explain: Clip = ({ frame, fps, seed, params }, pose) => {
  const beat = noise1(seed + 11, (frame / fps) * 1.4);
  const p = setJoints(pose, { shoulderL: [-0.75 + beat * 0.12, -0.2, 0.35], elbowL: [-1.0 + beat * 0.15, 0, 0], wristL: [0, 0, 0.3] });
  return withHand(params, p, pose, "left");
};

/** Both hands open, presenting an idea ("look at this"). */
const openHands: Clip = ({ frame, fps, seed }, pose) => {
  const beat = noise1(seed + 13, (frame / fps) * 1.2) * 0.1;
  return setJoints(pose, {
    shoulderL: [-0.6 + beat, 0, 0.55],
    shoulderR: [-0.6 - beat, 0, -0.55],
    elbowL: [-0.9, 0, 0],
    elbowR: [-0.9, 0, 0],
    wristL: [0, 0, 0.4],
    wristR: [0, 0, -0.4],
  });
};

const nod: Clip = ({ frame, fps }, pose) => addPose(pose, { head: [Math.max(0, Math.sin((frame / fps) * Math.PI * 2 * 1.6)) * 0.2, 0, 0] });

const shakeHead: Clip = ({ frame, fps }, pose) => addPose(pose, { head: [0.03, Math.sin((frame / fps) * Math.PI * 2 * 2) * 0.28, 0] });

/** Listening: slight head tilt toward the speaker, small occasional nods. */
const listen: Clip = ({ frame, fps, seed }, pose) => {
  const t = frame / fps;
  const nods = Math.max(0, Math.sin(t * Math.PI * 2 * 0.7)) * Math.max(0, noise1(seed + 21, t * 0.5)) * 0.12;
  return addPose({ ...pose, face: { ...pose.face, browRaise: Math.max(pose.face.browRaise, 0.1) } }, { head: [nods, 0, 0.1], neck: [0.03, 0, 0.03] });
};

/** Thinking: hand to chin (authored right hand), head tilted, eyes up-left. */
const think: Clip = ({ params }, pose) => {
  const p = setJoints(pose, { shoulderR: [-1.1, 0.25, -0.1], elbowR: [-2.1, 0, 0], wristR: [0.3, 0, 0], head: [-0.12, 0.12, 0.12] }, { gaze: [0.35, 0.35] });
  return withHand(params, p, pose, "right");
};

/** Surprise: quick head pull-back, arms lift. */
const surprised: Clip = ({ frame }, pose) => {
  const pop = progress(frame, 0, 6, "easeOut");
  return setJoints(pose, { head: [-0.18 * pop, 0, 0], chest: [-0.08 * pop, 0, 0], shoulderL: [-0.3, 0, 0.6 * pop], shoulderR: [-0.3, 0, -0.6 * pop], elbowL: [-1.2 * pop, 0, 0], elbowR: [-1.2 * pop, 0, 0] });
};

/** Laughing: shoulders bounce, head tips back. */
const laugh: Clip = ({ frame, fps }, pose) => {
  const b = Math.abs(Math.sin((frame / fps) * Math.PI * 2 * 3)) * 0.06;
  return addPose({ ...pose, rootY: pose.rootY + b * 0.05 }, { head: [-0.15 - b, 0, 0], chest: [-0.06 - b * 0.5, 0, 0], shoulderL: [0, 0, b], shoulderR: [0, 0, -b] });
};

/** Thumbs-up (authored right hand). */
const thumbsUp: Clip = ({ params }, pose) => withHand(params, setJoints(pose, { shoulderR: [-0.9, 0, -0.35], elbowR: [-1.4, 0, 0], wristR: [0, 0, -0.6] }, { smile: Math.max(pose.face.smile, 0.9) }), pose, "right");

/** Hold a tablet / prop in front with both hands, slightly to the left. */
const holdTablet: Clip = ({ frame, fps, seed }, pose) => {
  const s = noise1(seed + 31, (frame / fps) * 0.5) * 0.03;
  return setJoints(pose, { shoulderL: [-0.55 + s, 0.25, 0.1], shoulderR: [-0.55 - s, -0.25, -0.1], elbowL: [-1.05, 0, 0], elbowR: [-1.05, 0, 0], wristL: [0, 0, -0.2], wristR: [0, 0, 0.2], head: [0.25, 0, 0] }, { gaze: [0, -0.4] });
};

/** Present a prop toward the viewer with one hand (authored right hand). */
const presentProp: Clip = ({ params }, pose) => withHand(params, setJoints(pose, { shoulderR: [-1.0, 0.3, -0.25], elbowR: [-0.6, 0, 0], wristR: [-0.2, 0, 0] }), pose, "right");

/** Look upward (sky / roof): head and chest tilt back. */
const lookUpward: Clip = (_ctx, pose) => setJoints(pose, { head: [-0.45, 0, 0], neck: [-0.15, 0, 0] }, { gaze: [0, 0.6], browRaise: Math.max(pose.face.browRaise, 0.3) });

/** Lean in toward the person in front (interest). */
const leanIn: Clip = (_ctx, pose) => addPose(pose, { spine: [0.14, 0, 0], head: [-0.05, 0, 0] });

/**
 * Sit on a seat of height params.seatHeight (world metres, default 0.45).
 * Works for any body plan because it uses the character's leg dimensions.
 */
const sit: Clip = ({ params, body }, pose) => {
  const seat = num(params, "seatHeight", 0.45) / body.scale; // to body-plan units
  const rootY = seat - body.hipHeight;
  return {
    ...setJoints(pose, {
      hipL: [-1.5, 0, 0.06],
      hipR: [-1.5, 0, -0.06],
      kneeL: [1.45, 0, 0],
      kneeR: [1.45, 0, 0],
      ankleL: [0.05, 0, 0],
      ankleR: [0.05, 0, 0],
      spine: [-0.06, 0, 0],
      shoulderL: [-0.45, 0, 0.12],
      shoulderR: [-0.45, 0, -0.12],
      elbowL: [-0.55, 0, 0],
      elbowR: [-0.55, 0, 0],
    }),
    rootY: pose.rootY + rootY,
  };
};

/** Shrug (palms up, shoulders raised). */
const shrug: Clip = ({ frame }, pose) => {
  const k = progress(frame, 0, 8, "easeOut");
  return setJoints(pose, { shoulderL: [-0.35, 0, 0.4 * k], shoulderR: [-0.35, 0, -0.4 * k], elbowL: [-1.2, 0.3, 0], elbowR: [-1.2, -0.3, 0], head: [0, 0, 0.15 * k] }, { browRaise: 0.5 * k });
};

/** Deliberate blink (in addition to the automatic blinks): closes and reopens over ~6 frames. */
const blink: Clip = ({ frame }, pose) => {
  const k = frame <= 2 ? frame / 2 : Math.max(0, 1 - (frame - 2) / 4);
  return { ...pose, face: { ...pose.face, eyelids: [Math.max(pose.face.eyelids[0], k), Math.max(pose.face.eyelids[1], k)] } };
};

const smile: Clip = (_ctx, pose) => ({ ...pose, face: { ...pose.face, smile: 1, browRaise: 0.2 } });

export const CLIPS: Record<string, Clip> = {
  "idle-breathing": idleBreathing,
  wave,
  point,
  talk,
  explain,
  "open-hands": openHands,
  nod,
  "shake-head": shakeHead,
  listen,
  think,
  surprised,
  laugh,
  "thumbs-up": thumbsUp,
  "hold-tablet": holdTablet,
  "present-prop": presentProp,
  "look-upward": lookUpward,
  "lean-in": leanIn,
  sit,
  shrug,
  blink,
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

/** Trapezoid envelope for blend-in / blend-out. Clips with holdEnd keep full weight after their end. */
export function clipEnvelope(frame: number, c: Pick<ClipInstance, "from" | "durationInFrames" | "blendFrames">): number {
  const local = frame - c.from;
  if (local < 0 || local > c.durationInFrames) return 0;
  const b = Math.max(1, c.blendFrames);
  const fadeIn = progress(local, 0, b, "easeInOut");
  const fadeOut = 1 - progress(local, c.durationInFrames - b, c.durationInFrames, "easeInOut");
  return Math.min(fadeIn, fadeOut);
}

const DEFAULT_BODY: ClipBody = { hipHeight: 0.9, thigh: 0.42, shin: 0.4, shoulderAboveHip: 0.56, shoulderHalfWidth: 0.24, upperArm: 0.3, forearm: 0.27, eyeHeight: 1.6, scale: 1 };

/**
 * Evaluate the full layered pose at a frame:
 *   rest (with base face) → idle breathing (always) → each active clip blended by its envelope.
 */
export function evaluatePose(frame: number, fps: number, seed: number, clips: ClipInstance[], baseFace?: FaceState, body: ClipBody = DEFAULT_BODY): Pose {
  let pose = idleBreathing({ frame, fps, seed, durationInFrames: Infinity, params: {}, body }, restPose(baseFace));
  for (const c of clips) {
    if (c.clip === "idle-breathing") continue;
    const fn = CLIPS[c.clip];
    if (!fn) throw new Error(`Unknown animation clip "${c.clip}"`);
    const w = clipEnvelope(frame, c) * c.weight;
    if (w <= 0) continue;
    const ctx: ClipContext = { frame: frame - c.from, durationInFrames: c.durationInFrames, fps, seed, params: c.params, body };
    pose = blendPoses(pose, fn(ctx, pose), w);
  }
  return pose;
}

export { blendFaces };
