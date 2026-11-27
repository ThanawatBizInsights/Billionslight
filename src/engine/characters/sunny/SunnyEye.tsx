/**
 * SunnyEye — reusable stylised mascot eye.
 *
 * Layers, all inside one scaled "eye space" (unit sphere → ellipsoid
 * width 2r, height 2r·heightRatio, depth r·depth) so everything follows the
 * same curvature and nothing floats:
 *   1. eyeball (smooth, 32×24) carrying   2. sclera, 3. iris, 4. pupil
 *      as one curved procedural texture (eyeTexture.ts); rotates for gaze
 *   5. primary + 6. secondary catchlight: thin patches ON the eyeball surface
 *      that stay fixed to the light (consistent direction on both eyes)
 *   7. upper eyelid: smooth shell + soft brown lid line (gentle arch)
 *   8. lower eyelid: smooth cream shell that rises with smiles / squints
 *   optional thin brown rim behind the eyeball.
 * Blinking moves the lids; the eyeball is never squashed.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { irisTexture } from "./eyeTexture";
import { SUNNY_EYE_COLORS, type SunnyFaceVariant } from "./faceVariants";

export interface SunnyEyeProps {
  variant: SunnyFaceVariant;
  position: THREE.Vector3;
  /** Eye forward direction in head space. */
  forward: THREE.Vector3;
  /** 0 open … 1 closed (negative = wider, e.g. surprise). Includes blinks. */
  closure: number;
  /** Lower-lid lift from smiling cheeks / laughing (0–1). */
  squint: number;
  smile: number;
  /** Gaze in radians [yaw (+ = character's left), pitch (+ = up)]. */
  gaze: [number, number];
  lidColor: string;
}

/** Catchlight directions in eye space (upper-left, lower-right as seen from the front). */
const PRIMARY_DIR = new THREE.Vector3(-0.34, 0.42, 0.84).normalize();
const SECONDARY_DIR = new THREE.Vector3(0.3, -0.36, 0.88).normalize();
const UP = new THREE.Vector3(0, 1, 0);

function Catchlight({ dir, halfAngle, opacity = 1 }: { dir: THREE.Vector3; halfAngle: number; opacity?: number }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(UP, dir), [dir]);
  return (
    <mesh quaternion={q} renderOrder={2}>
      {/* spherical cap around +Y, rotated onto the eye surface; radius just above the eyeball */}
      <sphereGeometry args={[1.006, 16, 4, 0, Math.PI * 2, 0, halfAngle]} />
      <meshBasicMaterial color={SUNNY_EYE_COLORS.catchlight} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export function SunnyEye({ variant: v, position, forward, closure, squint, smile, gaze, lidColor }: SunnyEyeProps) {
  const tex = useMemo(() => irisTexture(v.irisWidth, v.pupilWidth, v.eyeHeightRatio), [v.irisWidth, v.pupilWidth, v.eyeHeightRatio]);
  const yaw = Math.atan2(forward.x, forward.z);
  const pitch = -Math.asin(Math.max(-1, Math.min(1, forward.y)));
  const r = v.eyeRadius;
  const [ws, hs] = v.eyeSegments;

  // eyelid angles (see docs/sunny-eye-review.md for the derivation)
  const c = Math.max(-0.4, Math.min(1, closure));
  const upper = c >= 0 ? v.upperLidOpen + c * (0.12 - v.upperLidOpen) : Math.max(-1.35, v.upperLidOpen + c * 0.6);
  // Laughing (strong squint): lids close fully and a soft brown ∩ arc is drawn on the
  // closed lid — a lid edge through the eye centre would project as a flat line.
  const laugh = Math.min(1, Math.max(0, (squint - 0.6) / 0.3));
  const cl = Math.max(c, laugh);
  const upperFinal = cl >= 0 ? v.upperLidOpen + cl * (0.12 - v.upperLidOpen) : upper;
  // Lower lid rises with smiling cheeks and meets the upper lid on blinks.
  const lift = Math.max(squint * 0.62 + Math.max(0, smile) * 0.14, cl > 0 ? cl * cl * (v.lowerLidOpen - 0.04) : 0);
  const lower = Math.max(0.0, v.lowerLidOpen - lift);
  // gaze: eyeball rotation, clamped so the iris never disappears under the lids
  const gYaw = Math.max(-0.42, Math.min(0.42, gaze[0]));
  const gPitch = Math.max(-0.32, Math.min(0.32, gaze[1]));

  const lidMat = <meshStandardMaterial color={lidColor} roughness={0.75} metalness={0} />;
  return (
    <group position={position} rotation={new THREE.Euler(pitch, yaw, 0, "YXZ")}>
      <group scale={[r, r * v.eyeHeightRatio, r * v.eyeDepth]}>
        {/* thin brown rim behind the eyeball (outline without a hard black ring) */}
        {v.rimWidth > 0 && (
          <mesh position={[0, 0, -0.12]} scale={[1 + v.rimWidth * 2, 1 + v.rimWidth * 2, 1]}>
            <sphereGeometry args={[1, ws, hs]} />
            <meshStandardMaterial color={SUNNY_EYE_COLORS.upperLid} roughness={0.8} />
          </mesh>
        )}
        {/* eyeball with sclera / iris / pupil texture; rotates for gaze */}
        <group rotation={[-gPitch, gYaw, 0]}>
          <mesh rotation={[0, 0, 0]}>
            <sphereGeometry args={[1, ws, hs]} />
            {/* faint self-illumination keeps the purple readable under the hard-hat brim */}
            <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#FFFFFF" emissiveIntensity={0.22} roughness={v.eyeRoughness} metalness={0} />
          </mesh>
        </group>
        {/* catchlights: on the surface, fixed to the light */}
        <Catchlight dir={PRIMARY_DIR} halfAngle={v.catchlightPrimary} />
        <Catchlight dir={SECONDARY_DIR} halfAngle={v.catchlightSecondary} opacity={0.9} />
        {/* upper eyelid: smooth shell + soft brown lid line along its rim */}
        <group rotation={[upperFinal, 0, 0]}>
          <mesh>
            <sphereGeometry args={[1.045, ws, Math.max(6, hs / 2), 0, Math.PI * 2, 0, Math.PI / 2]} />
            {lidMat}
          </mesh>
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh rotation={[0, 0, -0.08 * Math.PI]}>
              <torusGeometry args={[1.045, 0.06, 6, 28, Math.PI * 1.16]} />
              <meshStandardMaterial color={SUNNY_EYE_COLORS.upperLid} roughness={0.7} transparent opacity={1 - laugh * 0.85} />
            </mesh>
          </group>
        </group>
        {/* happy closed eye (laughing): soft ∩ arc resting on the closed lids */}
        {laugh > 0.02 && (
          <mesh position={[0, -0.32, 1.0]} rotation={[0, 0, Math.PI * 0.14]}>
            <torusGeometry args={[0.62, 0.075, 6, 24, Math.PI * 0.72]} />
            <meshStandardMaterial color={SUNNY_EYE_COLORS.upperLid} roughness={0.7} transparent opacity={laugh} />
          </mesh>
        )}
        {/* lower eyelid: cream shell that blends into the cheek */}
        <group rotation={[lower, 0, 0]}>
          <group rotation={[Math.PI, 0, 0]}>
            <mesh>
              <sphereGeometry args={[1.04, ws, Math.max(6, hs / 2), 0, Math.PI * 2, 0, Math.PI / 2]} />
              {lidMat}
            </mesh>
            <group rotation={[-Math.PI / 2, 0, 0]}>
              <mesh rotation={[0, 0, 0.1 * Math.PI]}>
                <torusGeometry args={[1.04, 0.03, 5, 24, Math.PI * 0.8]} />
                <meshStandardMaterial color={SUNNY_EYE_COLORS.lowerLidLine} roughness={0.8} transparent opacity={Math.min(1, 0.35 + Math.min(1, lift) * 0.6) * (1 - laugh)} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
