/**
 * Camera preset generators. Each returns keyframes relative to a focus point
 * so the same move works in any environment. Moves are deliberately slow and
 * smooth — no shake.
 */
import type { Keyframe } from "../animation/core";
import type { Vec3 } from "../../schemas/episode";
import type { CameraShot } from "./CameraRig";

export interface ShotParams {
  focus: Vec3;
  durationInFrames: number;
  /** Distance from focus. */
  distance?: number;
  /** Camera height above focus. */
  height?: number;
  /** Horizontal angle (rad) around the focus, 0 = +Z (front). */
  azimuth?: number;
  fov?: number;
}

const orbitPoint = (focus: Vec3, distance: number, height: number, azimuth: number): Vec3 => [
  focus[0] + Math.sin(azimuth) * distance,
  focus[1] + height,
  focus[2] + Math.cos(azimuth) * distance,
];

export type CameraPresetFn = (p: ShotParams) => Keyframe<CameraShot>[];

export const CAMERA_PRESETS: Record<string, CameraPresetFn> = {
  "establishing-wide": ({ focus, durationInFrames, distance = 22, height = 7, azimuth = 0.45, fov = 38 }) => [
    { frame: 0, value: { position: orbitPoint(focus, distance, height, azimuth), target: focus, fov } },
    { frame: durationInFrames, value: { position: orbitPoint(focus, distance * 0.96, height, azimuth - 0.04), target: focus, fov }, easing: "linear" },
  ],
  "slow-dolly-in": ({ focus, durationInFrames, distance = 14, height = 3, azimuth = 0.35, fov = 40 }) => [
    { frame: 0, value: { position: orbitPoint(focus, distance, height, azimuth), target: focus, fov } },
    { frame: durationInFrames, value: { position: orbitPoint(focus, distance * 0.72, height * 0.8, azimuth), target: focus, fov }, easing: "easeInOutCubic" },
  ],
  "slow-dolly-out": ({ focus, durationInFrames, distance = 10, height = 2.5, azimuth = 0.35, fov = 40 }) => [
    { frame: 0, value: { position: orbitPoint(focus, distance, height, azimuth), target: focus, fov } },
    { frame: durationInFrames, value: { position: orbitPoint(focus, distance * 1.35, height * 1.3, azimuth), target: focus, fov }, easing: "easeInOutCubic" },
  ],
  "orbit-equipment": ({ focus, durationInFrames, distance = 4, height = 1, azimuth = -0.4, fov = 35 }) => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => ({
      frame: Math.round((durationInFrames * i) / steps),
      value: { position: orbitPoint(focus, distance, height, azimuth + (i / steps) * 0.9), target: focus, fov },
      easing: "linear" as const,
    }));
  },
  "medium-character": ({ focus, durationInFrames, distance = 4.2, height = 0.3, azimuth = 0.2, fov = 35 }) => [
    { frame: 0, value: { position: orbitPoint(focus, distance, height, azimuth), target: focus, fov } },
    { frame: durationInFrames, value: { position: orbitPoint(focus, distance * 0.94, height, azimuth + 0.03), target: focus, fov }, easing: "linear" },
  ],
};

export function getCameraPreset(id: string): CameraPresetFn {
  const p = CAMERA_PRESETS[id];
  if (!p) throw new Error(`Camera preset "${id}" not found`);
  return p;
}
