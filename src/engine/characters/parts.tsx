/**
 * Shared building blocks for character body plans: joints with prop
 * attachment slots, the faceted matte material, and procedural facial
 * features (eyes, brows, mouth) driven by FaceState.
 */
import type { ReactNode } from "react";
import type { FaceState, JointName, Pose, Rot } from "./rig";

export type Attachments = Partial<Record<JointName, ReactNode>>;

export const jointRot = (pose: Pose, j: JointName): Rot => pose.joints[j] ?? [0, 0, 0];

/** A rig joint: a group at its pivot, rotated by the pose, plus any attached props. */
export function Joint({
  name,
  pose,
  position,
  attachments,
  extraRotation,
  children,
}: {
  name: JointName;
  pose: Pose;
  position: [number, number, number];
  attachments?: Attachments;
  /** Added to the pose rotation (e.g. look-at on the head). */
  extraRotation?: Rot;
  children?: ReactNode;
}) {
  const r = jointRot(pose, name);
  const rot: Rot = extraRotation ? [r[0] + extraRotation[0], r[1] + extraRotation[1], r[2] + extraRotation[2]] : r;
  return (
    <group name={name} position={position} rotation={rot}>
      {children}
      {attachments?.[name]}
    </group>
  );
}

/** Soft faceted matte surface — the Billionslight character look. */
export const Facet = ({ color, roughness = 0.85, emissive, emissiveIntensity = 0 }: { color: string; roughness?: number; emissive?: string; emissiveIntensity?: number }) => (
  <meshStandardMaterial color={color} roughness={roughness} metalness={0} flatShading emissive={emissive ?? "#000000"} emissiveIntensity={emissiveIntensity} />
);

/** Unlit material for eye whites/pupils/highlights so faces stay readable in any light. */
export const Flat = ({ color }: { color: string }) => <meshBasicMaterial color={color} toneMapped={false} />;

/** Mesh helper with shadows on. */
export function Part({
  position,
  rotation,
  scale,
  color,
  children,
  castShadow = true,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  color: string;
  children: ReactNode;
  castShadow?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow={castShadow} receiveShadow>
      {children}
      <Facet color={color} />
    </mesh>
  );
}

// ------------------------------------------------------------------- faces

export interface CartoonEyeProps {
  side: 1 | -1; // +1 = character's left (+X)
  position: [number, number, number];
  radius: number;
  iris: string;
  pupil: string;
  white: string;
  lidColor: string;
  closure: number; // 0 open – 1 closed
  gaze: [number, number];
  squint: number;
  /** Rotation so the eye sits on a curved face. */
  yaw?: number;
}

/**
 * Large mascot eye: white, coloured iris, dark pupil, two highlights. Blink
 * and squint are drawn with an eyelid shell that closes over the eye, so the
 * eye shape stays round rather than squashing.
 */
export function CartoonEye({ side, position, radius: r, iris, pupil, white, lidColor, closure, gaze, squint, yaw = 0 }: CartoonEyeProps) {
  const c = Math.min(1, Math.max(0, closure));
  const gx = gaze[0] * r * 0.35;
  const gy = gaze[1] * r * 0.3;
  // Upper lid rotates down from fully open (-1.25 rad) to closed (+0.15 rad)
  const upper = -1.3 + c * 1.45;
  // Lower lid rises with squint (laughing / smiling cheeks)
  // Lower lid rises with squint (smiling cheeks) and meets the upper lid on a full blink/wink
  const lower = 1.3 - Math.max(squint * 0.55, c * c * 1.25);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh scale={[1, 1.1, 0.55]}>
        <sphereGeometry args={[r, 14, 10]} />
        <Flat color={white} />
      </mesh>
      <group position={[gx, gy, r * 0.5]}>
        <mesh scale={[1, 1.1, 0.3]}>
          <sphereGeometry args={[r * 0.86, 16, 10]} />
          <Flat color={iris} />
        </mesh>
        {/* pupil + highlights as discs in front of the iris (no depth fighting) */}
        <mesh position={[0, -r * 0.04, r * 0.27]} scale={[1, 1.1, 1]}>
          <circleGeometry args={[r * 0.46, 16]} />
          <Flat color={pupil} />
        </mesh>
        <mesh position={[side * -r * 0.25 + r * 0.03, r * 0.3, r * 0.285]}>
          <circleGeometry args={[r * 0.2, 12]} />
          <Flat color="#FFFFFF" />
        </mesh>
        <mesh position={[side * r * 0.24, -r * 0.32, r * 0.285]}>
          <circleGeometry args={[r * 0.09, 8]} />
          <Flat color="#FFFFFF" />
        </mesh>
      </group>
      {/* eyelids: partial spheres in fur colour that rotate over the eye */}
      <group rotation={[upper, 0, 0]}>
        <mesh scale={[1.07, 1.17, 0.98]}>
          <sphereGeometry args={[r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Facet color={lidColor} />
        </mesh>
      </group>
      <group rotation={[lower, 0, 0]}>
        <mesh scale={[1.07, 1.17, 0.98]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Facet color={lidColor} />
        </mesh>
      </group>
    </group>
  );
}

/** Small dot eye (Ton): an oval that squashes to a line when closed. */
export function DotEye({ position, size, color, closure, gaze, squint }: { position: [number, number, number]; size: [number, number]; color: string; closure: number; gaze: [number, number]; squint: number }) {
  const open = Math.max(0.12, 1 - Math.min(1, Math.max(0, closure)) - squint * 0.35);
  return (
    <group position={[position[0] + gaze[0] * size[0] * 0.6, position[1] + gaze[1] * size[1] * 0.4, position[2]]}>
      <mesh scale={[1, open, 1]}>
        <boxGeometry args={[size[0], size[1], size[0] * 0.6]} />
        <Flat color={color} />
      </mesh>
      {open > 0.5 && (
        <mesh position={[size[0] * 0.18, size[1] * 0.22, size[0] * 0.32]}>
          <boxGeometry args={[size[0] * 0.32, size[0] * 0.32, 0.002]} />
          <Flat color="#FFFFFF" />
        </mesh>
      )}
    </group>
  );
}

export function Brow({ position, width, thickness, color, side, face }: { position: [number, number, number]; width: number; thickness: number; color: string; side: 1 | -1; face: FaceState }) {
  const lift = face.browRaise * thickness * 1.6 + side * face.browTilt * thickness * 1.2;
  // inner end down when concentrated, up when worried
  const angle = side * (-0.08 - face.browRaise * 0.18) + face.browTilt * 0.3;
  return (
    <mesh position={[position[0], position[1] + lift, position[2]]} rotation={[0, 0, angle]}>
      <boxGeometry args={[width, thickness, thickness * 0.8]} />
      <Facet color={color} />
    </mesh>
  );
}

/**
 * Mouth: a curved line (smile / frown) plus an opening that grows with
 * mouthOpen and rounds with mouthRound. Tongue shows when open.
 */
export function Mouth({ position, width, face, lineColor, innerColor, tongueColor }: { position: [number, number, number]; width: number; face: FaceState; lineColor: string; innerColor: string; tongueColor: string }) {
  const open = Math.max(0, Math.min(1, face.mouthOpen));
  const curve = Math.max(-1, Math.min(1, face.smile));
  const w = width * (1 - face.mouthRound * 0.45);
  const h = width * (0.12 + open * (0.7 + face.mouthRound * 0.25));
  const tube = width * 0.075;
  return (
    <group position={position}>
      {/* smile / frown curve: a half torus flattened by |curve|, flipped for frowns */}
      {open < 0.25 && (
        <mesh rotation={[0, 0, curve >= 0 ? Math.PI : 0]} scale={[1, Math.max(0.12, Math.abs(curve)) * 0.55, 1]} position={[0, curve >= 0 ? width * 0.05 : -width * 0.05, 0]}>
          <torusGeometry args={[w / 2, tube, 4, 10, Math.PI]} />
          <Flat color={lineColor} />
        </mesh>
      )}
      {open >= 0.05 && (
        <group position={[0, -h * 0.25 + curve * width * 0.04, 0]}>
          <mesh scale={[w / 2, h / 2, width * 0.12]}>
            <sphereGeometry args={[1, 12, 8]} />
            <Flat color={innerColor} />
          </mesh>
          <mesh position={[0, -h * 0.22, width * 0.06]} scale={[w * 0.32, h * 0.22, width * 0.08]}>
            <sphereGeometry args={[1, 10, 6]} />
            <Flat color={tongueColor} />
          </mesh>
        </group>
      )}
    </group>
  );
}
