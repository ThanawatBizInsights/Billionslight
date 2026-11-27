/**
 * Body plan: squirrel mascot (Sunny).
 *
 * Built from the approved Sunny references (boards 01/02/06, "Three
 * Squirrels"): golden-orange fur, cream cheeks/muzzle, large violet eyes, pink
 * inner ears, small brown nose, white ridged hard hat between the ears, navy
 * coverall with bright-blue shoulder panels, gold piping and zip, sun emblem
 * on the chest, navy safety boots and a large curved soft-faceted tail.
 *
 * Proportions: mascot, not a child in a costume — large head (~40% of
 * height), compact pear-shaped body, short limbs. Total height with hat 1.35 m.
 */
import { useMemo } from "react";
import * as THREE from "three";
import type { Pose, Rot } from "./rig";
import type { CharacterDefinition } from "./types";
import { Brow, CartoonEye, Facet, Joint, Mouth, Part, type Attachments } from "./parts";

/** Rest orientation of the tail chain: rises back from the hips, then curls up. */
const TAIL_REST: Rot[] = [
  [-1.0, 0, -0.32],
  [0.55, 0, 0],
  [0.5, 0, 0],
  [0.45, 0, 0],
  [0.55, 0, 0],
];
const TAIL_SEG = [
  { len: 0.11, r: 0.1 },
  { len: 0.16, r: 0.15 },
  { len: 0.19, r: 0.19 },
  { len: 0.19, r: 0.185 },
  { len: 0.14, r: 0.135 },
];
const TAIL_JOINTS = ["tail1", "tail2", "tail3", "tail4", "tail5"] as const;

function useTorsoGeometry() {
  return useMemo(() => {
    // pear-shaped coverall body, lathed with few segments for soft facets
    const pts = [
      [0.0, -0.07],
      [0.16, -0.06],
      [0.215, 0.02],
      [0.225, 0.1],
      [0.205, 0.18],
      [0.16, 0.245],
      [0.09, 0.285],
      [0.0, 0.295],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 10);
  }, []);
}

export function SquirrelMascot({ def, pose, blink, look, attachments }: { def: CharacterDefinition; pose: Pose; blink: number; look: [number, number]; attachments?: Attachments }) {
  const c = def.colors as Record<string, string>;
  const b = def.body;
  const torso = useTorsoGeometry();
  const face = pose.face;
  const lidL = Math.min(1, face.eyelids[0] + blink);
  const lidR = Math.min(1, face.eyelids[1] + blink);
  const headR = 0.27;

  const arm = (side: 1 | -1) => {
    const sh = side === 1 ? "shoulderL" : "shoulderR";
    const el = side === 1 ? "elbowL" : "elbowR";
    const wr = side === 1 ? "wristL" : "wristR";
    return (
      <Joint name={sh} pose={pose} position={[side * b.shoulderHalfWidth, b.shoulderAboveHip - 0.03, 0]} attachments={attachments}>
        {/* bright-blue shoulder panel */}
        <Part position={[0, -0.005, 0]} scale={[1.05, 0.7, 1]} color={c.uniformPanel!}>
          <icosahedronGeometry args={[0.072, 1]} />
        </Part>
        <Part position={[0, -b.upperArm * 0.3, 0]} color={c.uniformPanel!}>
          <cylinderGeometry args={[0.066, 0.064, b.upperArm * 0.6, 8]} />
        </Part>
        <Part position={[0, -b.upperArm * 0.8, 0]} color={c.uniform!}>
          <cylinderGeometry args={[0.064, 0.06, b.upperArm * 0.4, 8]} />
        </Part>
        <Joint name={el} pose={pose} position={[0, -b.upperArm, 0]} attachments={attachments}>
          <Part position={[0, -b.forearm / 2, 0]} color={c.uniform!}>
            <cylinderGeometry args={[0.06, 0.063, b.forearm, 8]} />
          </Part>
          {/* gold cuff */}
          <Part position={[0, -b.forearm + 0.012, 0]} color={c.trim!}>
            <cylinderGeometry args={[0.066, 0.066, 0.018, 8]} />
          </Part>
          <Joint name={wr} pose={pose} position={[0, -b.forearm, 0]} attachments={attachments}>
            {/* mitten paw + thumb */}
            <Part position={[0, -0.045, 0.005]} scale={[1, 1.05, 0.85]} color={c.fur!}>
              <icosahedronGeometry args={[0.062, 1]} />
            </Part>
            <Part position={[-side * 0.04, -0.03, 0.035]} color={c.fur!}>
              <icosahedronGeometry args={[0.025, 0]} />
            </Part>
          </Joint>
        </Joint>
      </Joint>
    );
  };

  const leg = (side: 1 | -1) => {
    const hp = side === 1 ? "hipL" : "hipR";
    const kn = side === 1 ? "kneeL" : "kneeR";
    const an = side === 1 ? "ankleL" : "ankleR";
    return (
      <Joint name={hp} pose={pose} position={[side * 0.1, 0, 0]} attachments={attachments}>
        <Part position={[0, -b.thigh / 2, 0]} color={c.uniform!}>
          <cylinderGeometry args={[0.085, 0.078, b.thigh, 8]} />
        </Part>
        <Joint name={kn} pose={pose} position={[0, -b.thigh, 0]} attachments={attachments}>
          <Part position={[0, -b.shin / 2, 0]} color={c.uniform!}>
            <cylinderGeometry args={[0.078, 0.082, b.shin, 8]} />
          </Part>
          <Joint name={an} pose={pose} position={[0, -b.shin, 0]} attachments={attachments}>
            {/* navy safety boot with lighter sole */}
            <Part position={[0, -0.02, 0.03]} scale={[1, 0.7, 1.3]} color={c.boot!}>
              <icosahedronGeometry args={[0.088, 1]} />
            </Part>
            <Part position={[0, -0.072, 0.035]} color={c.sole!}>
              <boxGeometry args={[0.15, 0.022, 0.21]} />
            </Part>
          </Joint>
        </Joint>
      </Joint>
    );
  };

  // tail chain
  let tail = null as React.ReactNode;
  for (let i = TAIL_SEG.length - 1; i >= 0; i--) {
    const seg = TAIL_SEG[i]!;
    const prev = i > 0 ? TAIL_SEG[i - 1]! : null;
    const r = TAIL_REST[i]!;
    const p = pose.joints[TAIL_JOINTS[i]!] ?? [0, 0, 0];
    tail = (
      <group name={TAIL_JOINTS[i]} position={[0, prev ? prev.len : 0, 0]} rotation={[r[0] + p[0], r[1] + p[1], r[2] + p[2]]}>
        <Part position={[0, seg.len * 0.55, 0]} scale={[1.05, 1.35, 0.92]} color={i % 2 ? c.fur! : c.furLight!}>
          <icosahedronGeometry args={[seg.r, 1]} />
        </Part>
        {/* cream underside on the outer half of the tail */}
        {i >= 2 && (
          <Part position={[0, seg.len * 0.55, seg.r * 0.35]} scale={[0.8, 1.15, 0.75]} color={c.cream!}>
            <icosahedronGeometry args={[seg.r, 1]} />
          </Part>
        )}
        {tail}
      </group>
    );
  }

  const ear = (side: 1 | -1) => (
    <Joint name={side === 1 ? "earL" : "earR"} pose={pose} position={[side * 0.25, 0.12, -0.02]}>
      <group rotation={[0.05, 0, -side * 0.55]}>
        <Part position={[0, 0.1, 0]} scale={[1, 1, 0.55]} color={c.fur!}>
          <coneGeometry args={[0.1, 0.23, 6]} />
        </Part>
        <Part position={[0, 0.085, 0.035]} scale={[1, 1, 0.3]} color={c.innerEar!} castShadow={false}>
          <coneGeometry args={[0.065, 0.16, 6]} />
        </Part>
      </group>
    </Joint>
  );

  return (
    <group position={[0, b.hipHeight + pose.rootY, pose.rootZ]}>
      <Joint name="hips" pose={pose} position={[0, 0, 0]} attachments={attachments}>
        {leg(1)}
        {leg(-1)}
        <group position={[0, 0.02, -0.15]}>{tail}</group>
        <Joint name="spine" pose={pose} position={[0, 0.02, 0]} attachments={attachments}>
          <Joint name="chest" pose={pose} position={[0, 0, 0]} attachments={attachments}>
            <mesh geometry={torso} scale={[1, 1, 0.86]} castShadow receiveShadow>
              <Facet color={c.uniform!} />
            </mesh>
            {/* gold waist piping */}
            <Part position={[0, 0.07, 0]} scale={[1, 1, 0.86]} rotation={[Math.PI / 2, 0, 0]} color={c.trim!}>
              <torusGeometry args={[0.212, 0.008, 4, 20]} />
            </Part>
            {/* zip */}
            <Part position={[0, 0.17, 0.182]} rotation={[-0.15, 0, 0]} color={c.trim!}>
              <boxGeometry args={[0.014, 0.25, 0.01]} />
            </Part>
            {/* chest pocket flaps with gold edges */}
            {[1, -1].map((s) => (
              <group key={s} position={[s * 0.1, 0.205, 0.165]} rotation={[-0.3, s * 0.42, 0]}>
                <Part color={c.uniform!}>
                  <boxGeometry args={[0.085, 0.03, 0.012]} />
                </Part>
                <Part position={[0, -0.016, 0.004]} color={c.trim!}>
                  <boxGeometry args={[0.085, 0.006, 0.01]} />
                </Part>
              </group>
            ))}
            {/* sun emblem on the chest (character's left) */}
            <group position={[0.1, 0.245, 0.155]} rotation={[-0.3, 0.45, 0]}>
              <mesh>
                <circleGeometry args={[0.022, 10]} />
                <meshStandardMaterial color={c.badge} emissive={c.badge} emissiveIntensity={0.25} roughness={0.6} flatShading />
              </mesh>
              {Array.from({ length: 8 }, (_, i) => (
                <mesh key={i} rotation={[0, 0, (i / 8) * Math.PI * 2]} position={[Math.cos((i / 8) * Math.PI * 2) * 0.032, Math.sin((i / 8) * Math.PI * 2) * 0.032, 0]}>
                  <boxGeometry args={[0.012, 0.005, 0.003]} />
                  <meshBasicMaterial color={c.badge} />
                </mesh>
              ))}
            </group>
            {/* collar: navy with blue facing */}
            <Part position={[0, 0.272, 0.01]} rotation={[Math.PI / 2 - 0.2, 0, 0]} color={c.uniformPanel!}>
              <torusGeometry args={[0.1, 0.03, 5, 12]} />
            </Part>
            {arm(1)}
            {arm(-1)}
            <Joint name="neck" pose={pose} position={[0, 0.285, 0]} attachments={attachments}>
              <Joint name="head" pose={pose} position={[0, 0.22, 0.015]} attachments={attachments} extraRotation={[-look[1], look[0], 0]}>
                {/* large round head (semi-axes 0.316 × 0.232 × 0.281) */}
                <Part scale={[1.17, 0.86, 1.04]} color={c.fur!}>
                  <icosahedronGeometry args={[headR, 2]} />
                </Part>
                {/* cream cheek puffs, muzzle and chin */}
                {[1, -1].map((s) => (
                  <Part key={s} position={[s * 0.15, -0.085, 0.165]} scale={[1.05, 0.82, 0.72]} color={c.cream!}>
                    <icosahedronGeometry args={[0.112, 1]} />
                  </Part>
                ))}
                <Part position={[0, -0.135, 0.13]} scale={[0.95, 0.42, 0.75]} color={c.cream!}>
                  <icosahedronGeometry args={[0.2, 1]} />
                </Part>
                <Part position={[0, -0.095, 0.238]} scale={[1.3, 0.8, 0.72]} color={c.cream!}>
                  <icosahedronGeometry args={[0.068, 1]} />
                </Part>
                {/* forehead fur tuft */}
                <Part position={[0, 0.1, 0.235]} rotation={[0.9, 0, 0]} scale={[1, 1, 0.5]} color={c.furLight!}>
                  <coneGeometry args={[0.045, 0.07, 5]} />
                </Part>
                <Part position={[0, -0.052, 0.284]} scale={[1.3, 0.85, 0.9]} color={c.nose!}>
                  <icosahedronGeometry args={[0.024, 1]} />
                </Part>
                {[1, -1].map((s) => (
                  <CartoonEye
                    key={s}
                    side={s as 1 | -1}
                    position={[s * 0.118, -0.002, 0.222]}
                    yaw={s * 0.4}
                    radius={0.084}
                    white="#FFFFFF"
                    iris={c.iris!}
                    pupil={c.pupil!}
                    lidColor={c.fur!}
                    closure={s === 1 ? lidL : lidR}
                    gaze={face.gaze}
                    squint={face.squint}
                  />
                ))}
                {[1, -1].map((s) => (
                  <Brow key={s} side={s as 1 | -1} position={[s * 0.12, 0.092, 0.262]} width={0.055} thickness={0.013} color={c.brow!} face={face} />
                ))}
                <Mouth position={[0, -0.108, 0.287]} width={0.085} face={face} lineColor={c.mouthLine!} innerColor={c.mouthInner!} tongueColor={c.tongue!} />
                {/* blush */}
                {[1, -1].map((s) => (
                  <mesh key={s} position={[s * 0.205, -0.065, 0.2]} rotation={[0, s * 0.8, 0]}>
                    <circleGeometry args={[0.03, 8]} />
                    <meshBasicMaterial color={c.blush} transparent opacity={0.35 + face.squint * 0.3} depthWrite={false} />
                  </mesh>
                ))}
                {ear(1)}
                {ear(-1)}
                {/* white hard hat: faceted dome, brim with front peak, three ridges */}
                <group position={[0, 0.118, -0.015]}>
                  <Part scale={[1.1, 0.92, 1.08]} color={c.helmet!}>
                    <sphereGeometry args={[0.29, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  </Part>
                  <Part position={[0, 0.004, 0.03]} scale={[1, 1, 1.12]} color={c.helmet!}>
                    <cylinderGeometry args={[0.33, 0.335, 0.026, 16]} />
                  </Part>
                  {[0, -0.12, 0.12].map((x) => (
                    <Part key={x} position={[x, 0, 0]} scale={[1, 0.92 * (x === 0 ? 1 : 0.92), 1.08 * (x === 0 ? 1 : 0.92)]} rotation={[0, Math.PI / 2, 0]} color={c.helmetRidge!}>
                      <torusGeometry args={[x === 0 ? 0.292 : 0.27, 0.016, 4, 14, Math.PI]} />
                    </Part>
                  ))}
                </group>
              </Joint>
            </Joint>
          </Joint>
        </Joint>
      </Joint>
    </group>
  );
}
