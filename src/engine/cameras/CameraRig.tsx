/**
 * Keyframed cinematic camera. Position, target and FOV are sampled from the
 * scene's camera track each frame (pure), then applied to the default camera.
 */
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { lerp, lerpVec3, sampleTrack, type Keyframe } from "../animation/core";
import type { Vec3 } from "../../schemas/episode";

export interface CameraShot {
  position: Vec3;
  target: Vec3;
  fov: number;
}

export const mixShot = (a: CameraShot, b: CameraShot, t: number): CameraShot => ({
  position: lerpVec3(a.position, b.position, t),
  target: lerpVec3(a.target, b.target, t),
  fov: lerp(a.fov, b.fov, t),
});

export function sampleCamera(keys: Keyframe<CameraShot>[], frame: number): CameraShot {
  return sampleTrack(keys, frame, mixShot);
}

export function CameraRig({ shot, aspect }: { shot: CameraShot; aspect: number }) {
  const m = new THREE.Matrix4().lookAt(new THREE.Vector3(...shot.position), new THREE.Vector3(...shot.target), new THREE.Vector3(0, 1, 0));
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  return (
    <PerspectiveCamera
      makeDefault
      position={shot.position}
      quaternion={q}
      fov={shot.fov}
      aspect={aspect}
      near={0.1}
      far={400}
    />
  );
}
