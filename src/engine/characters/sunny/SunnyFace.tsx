/**
 * SunnyFace — head surface + facial features for the redesigned face
 * variants (A/B/C). Rendered inside SquirrelMascot's head joint, replacing the
 * v1 head block; helmet, ears, rig and body are untouched.
 *
 * Expression controls come from the shared FaceState (expression presets +
 * clips + look-at + blink), so every existing animation interface still works:
 *   eyelids  → upper lid closure per eye (blink, wink, laughing)
 *   squint   → lower lids + cheeks rise (smiles, laughing)
 *   gaze     → both eyeballs rotate toward the same target
 *   browRaise / browTilt → soft curved brows
 *   smile / mouthOpen / mouthRound → mouth
 */
import { useMemo } from "react";
import * as THREE from "three";
import type { FaceState } from "../rig";
import { Mouth } from "../parts";
import { buildHeadGeometry, eyeDirection, headSurface } from "./headGeometry";
import { SUNNY_EYE_COLORS, type SunnyFaceVariant } from "./faceVariants";
import { SunnyEye } from "./SunnyEye";

const Z = new THREE.Vector3(0, 0, 1);

/** Orientation (Euler YXZ) that makes local +Z face along `n`. */
const facing = (n: THREE.Vector3) => new THREE.Euler(-Math.asin(Math.max(-1, Math.min(1, n.y))), Math.atan2(n.x, n.z), 0, "YXZ");

function Brow({ point, normal, side, face }: { point: THREE.Vector3; normal: THREE.Vector3; side: 1 | -1; face: FaceState }) {
  // gentle arch; raise for surprise/curiosity, inner end up when worried, never sharply inward-down
  const worried = Math.max(0, -face.smile) * 0.6 + Math.max(0, face.browRaise) * 0.2;
  const lift = face.browRaise * 0.014 + side * face.browTilt * 0.008;
  const tilt = side * (worried * 0.22 - Math.max(0, -face.browRaise) * 0.1) + face.browTilt * 0.2;
  const R = 0.045;
  const arc = Math.PI * 0.62;
  return (
    <group position={point.clone().addScaledVector(normal, 0.004).add(new THREE.Vector3(0, lift, 0))} rotation={facing(normal)}>
      <group rotation={[0, 0, tilt]}>
        <mesh position={[0, -R * 0.55, 0]} scale={[1, 0.55, 0.6]} rotation={[0, 0, Math.PI / 2 - arc / 2]}>
          <torusGeometry args={[R, 0.0085, 6, 16, arc]} />
          <meshStandardMaterial color={SUNNY_EYE_COLORS.brow} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

export function SunnyFace({ variant: v, face, blink, colors }: { variant: SunnyFaceVariant; face: FaceState; blink: number; colors: Record<string, string> }) {
  const head = useMemo(() => buildHeadGeometry(v, colors.fur!, colors.cream!), [v, colors.fur, colors.cream]);

  const layout = useMemo(() => {
    const eyes = ([1, -1] as const).map((side) => {
      const s = headSurface(v, eyeDirection(v, side));
      const forward = s.normal.clone().lerp(Z, 0.75).normalize();
      // partially embedded: eyeball centre sits behind the surface
      const position = s.point.clone().addScaledVector(s.normal, -v.eyeRadius * v.eyeDepth * 0.4);
      return { side, position, forward };
    });
    const at = (x: number, y: number) => {
      const [a, b] = [0.316, 0.232];
      const dx = x / a;
      const dy = y / b;
      return headSurface(v, new THREE.Vector3(dx, dy, Math.sqrt(Math.max(0.05, 1 - dx * dx - dy * dy))));
    };
    const brows = ([1, -1] as const).map((side) => ({ side, ...at(side * v.eyeSpacing * 0.96, v.eyeY + v.eyeRadius * v.eyeHeightRatio + 0.024) }));
    const nose = at(0, -0.052);
    const mouth = at(0, -0.108);
    const cheeks = ([1, -1] as const).map((side) => ({ side, ...at(side * 0.19, -0.075) }));
    return { eyes, brows, nose, mouth, cheeks };
  }, [v]);

  const smile = face.smile + v.restingSmile;
  const mouthFace: FaceState = { ...face, smile: Math.max(-1, Math.min(1, smile)) };

  return (
    <group>
      <mesh geometry={head} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.82} metalness={0} />
      </mesh>
      {layout.eyes.map((e) => (
        <SunnyEye
          key={e.side}
          variant={v}
          position={e.position}
          forward={e.forward}
          closure={Math.min(1, face.eyelids[e.side === 1 ? 0 : 1] + blink)}
          squint={face.squint}
          smile={smile}
          gaze={face.gaze}
          lidColor={colors.cream!}
        />
      ))}
      {layout.brows.map((b) => (
        <Brow key={b.side} point={b.point} normal={b.normal} side={b.side} face={face} />
      ))}
      {/* small brown nose (smooth) */}
      <mesh position={layout.nose.point.clone().addScaledVector(layout.nose.normal, 0.008)} rotation={facing(layout.nose.normal)} scale={[1.35, 0.9, 0.85]}>
        <sphereGeometry args={[0.022, 16, 12]} />
        <meshStandardMaterial color={SUNNY_EYE_COLORS.nose} roughness={0.45} />
      </mesh>
      <group position={layout.mouth.point.clone().addScaledVector(layout.mouth.normal, 0.003)} rotation={facing(layout.mouth.normal)}>
        <Mouth position={[0, 0, 0]} width={0.08} face={mouthFace} lineColor={colors.mouthLine!} innerColor={colors.mouthInner!} tongueColor={colors.tongue!} />
      </group>
      {/* soft blush on the cheeks */}
      {layout.cheeks.map((c) => (
        <mesh key={c.side} position={c.point.clone().addScaledVector(c.normal, 0.002)} rotation={facing(c.normal)} scale={[1.5, 0.85, 1]}>
          <circleGeometry args={[0.028, 20]} />
          <meshBasicMaterial color={SUNNY_EYE_COLORS.blush} transparent opacity={v.blush + face.squint * 0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
