/**
 * Procedural low-poly humanoid. Renders any CharacterDefinition in any Pose.
 * Hierarchy: root → hips → spine → chest → (neck → head) + arms; hips → legs.
 * Every joint is a <group> at its pivot so clips only set rotations.
 */
import type { ReactNode } from "react";
import { Matte } from "../core/materials";
import type { Pose, JointName, Rot } from "./rig";
import type { CharacterDefinition } from "./types";

/** Phase 1 placeholder body plan ("basic-human"): fixed proportions/accessories. */
const BASIC = { headScale: 1.25, build: { shoulderWidth: 0.24, torsoWidth: 0.42, torsoDepth: 0.26 }, accessories: ["hard-hat", "id-badge"] as string[] };
type Colors = Record<"skin" | "hair" | "shirt" | "shirtAccent" | "pants" | "shoes" | "eyes" | "mouth", string>;

const R = (pose: Pose, j: JointName): Rot => pose.joints[j] ?? [0, 0, 0];

const Limb = ({ length, radius, color, segments = 6 }: { length: number; radius: number; color: string; segments?: number }) => (
  <mesh position={[0, -length / 2, 0]} castShadow>
    <cylinderGeometry args={[radius, radius * 0.88, length, segments]} />
    <Matte color={color} />
  </mesh>
);

const Joint = ({ name, pose, position, children }: { name: JointName; pose: Pose; position: [number, number, number]; children?: ReactNode }) => (
  <group name={name} position={position} rotation={R(pose, name)}>
    {children}
  </group>
);

function Face({ def, pose, blink, r }: { def: CharacterDefinition; pose: Pose; blink: number; r: number }) {
  const f = pose.face;
  const colors = def.colors as Colors;
  const lid = Math.min(1, Math.max(f.eyelids[0], f.eyelids[1]) + blink);
  const eyeY = r * 0.12;
  const eyeX = r * 0.36;
  const z = r * 0.9;
  const gx = f.gaze[0] * r * 0.25;
  const gy = f.gaze[1] * r * 0.2;
  const smileAngle = f.smile * 0.45;
  const mouthW = r * 0.22;
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* eye — scaled vertically by eyelid closure */}
          <mesh position={[s * eyeX + gx, eyeY + gy, z]} scale={[1, Math.max(0.08, 1 - lid), 0.6]}>
            <sphereGeometry args={[r * 0.11, 6, 5]} />
            <meshBasicMaterial color={colors.eyes} />
          </mesh>
          {/* eye highlight */}
          {lid < 0.5 && (
            <mesh position={[s * eyeX + gx + r * 0.035, eyeY + gy + r * 0.04, z + r * 0.06]}>
              <sphereGeometry args={[r * 0.03, 4, 3]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          )}
          {/* brow */}
          <mesh
            position={[s * eyeX, eyeY + r * 0.28 + f.browRaise * r * 0.08 + s * f.browTilt * r * 0.05, z - r * 0.02]}
            rotation={[0, 0, s * (-0.12 - f.browRaise * 0.1) + f.browTilt * 0.25]}
          >
            <boxGeometry args={[r * 0.3, r * 0.06, r * 0.05]} />
            <meshBasicMaterial color={colors.hair} />
          </mesh>
        </group>
      ))}
      {/* mouth: two halves angled by smile + an opening for speech */}
      <group position={[0, -r * 0.33, z - r * 0.02]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[(s * mouthW) / 2, 0, 0]} rotation={[0, 0, s * smileAngle]}>
            <boxGeometry args={[mouthW, r * 0.045, r * 0.04]} />
            <meshBasicMaterial color={colors.mouth} />
          </mesh>
        ))}
        <mesh position={[0, -r * 0.03, 0.005]} scale={[1, Math.max(0.01, f.mouthOpen), 1]}>
          <sphereGeometry args={[r * 0.13, 6, 4]} />
          <meshBasicMaterial color="#3A1418" />
        </mesh>
      </group>
    </group>
  );
}

export interface HumanoidProps {
  def: CharacterDefinition;
  pose: Pose;
  blink: number;
  position?: [number, number, number];
  rotationY?: number;
  /** Extra head yaw/pitch from look-at targets. */
  look?: [number, number];
}

export function Humanoid({ def, pose, blink, position = [0, 0, 0], rotationY = 0, look = [0, 0] }: HumanoidProps) {
  const c = def.colors as Colors;
  const r = 0.2 * BASIC.headScale;
  const { shoulderWidth: sw, torsoWidth: tw, torsoDepth: td } = BASIC.build;
  const head = R(pose, "head");
  const headRot: Rot = [head[0] - look[1], head[1] + look[0], head[2]];
  const hasHat = BASIC.accessories.includes("hard-hat");

  const arm = (side: 1 | -1) => {
    const sh = side === 1 ? "shoulderL" : "shoulderR";
    const el = side === 1 ? "elbowL" : "elbowR";
    const wr = side === 1 ? "wristL" : "wristR";
    return (
      <Joint name={sh} pose={pose} position={[side * sw, 0.5, 0]}>
        <mesh position={[0, -0.02, 0]} castShadow>
          <icosahedronGeometry args={[0.075, 0]} />
          <Matte color={c.shirt} />
        </mesh>
        <Limb length={0.3} radius={0.058} color={c.shirt} />
        <Joint name={el} pose={pose} position={[0, -0.3, 0]}>
          <Limb length={0.27} radius={0.048} color={c.skin} />
          <Joint name={wr} pose={pose} position={[0, -0.27, 0]}>
            <mesh position={[0, -0.05, 0]} castShadow>
              <dodecahedronGeometry args={[0.06, 0]} />
              <Matte color={c.skin} />
            </mesh>
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
      <Joint name={hp} pose={pose} position={[side * 0.11, 0, 0]}>
        <Limb length={0.42} radius={0.075} color={c.pants} />
        <Joint name={kn} pose={pose} position={[0, -0.42, 0]}>
          <Limb length={0.4} radius={0.065} color={c.pants} />
          <Joint name={an} pose={pose} position={[0, -0.4, 0]}>
            <mesh position={[0, -0.04, 0.05]} castShadow>
              <boxGeometry args={[0.12, 0.08, 0.24]} />
              <Matte color={c.shoes} />
            </mesh>
          </Joint>
        </Joint>
      </Joint>
    );
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group position={[0, 0.9 + pose.rootY, 0]}>
        <Joint name="hips" pose={pose} position={[0, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[tw * 0.95, 0.16, td * 0.95]} />
            <Matte color={c.pants} />
          </mesh>
          {leg(1)}
          {leg(-1)}
          <Joint name="spine" pose={pose} position={[0, 0.06, 0]}>
            <Joint name="chest" pose={pose} position={[0, 0.0, 0]}>
              {/* faceted torso: tapered 6-sided prism */}
              <mesh position={[0, 0.3, 0]} castShadow>
                <cylinderGeometry args={[tw * 0.62, tw * 0.52, 0.56, 6]} />
                <Matte color={c.shirt} />
              </mesh>
              {/* collar accent strip */}
              <mesh position={[0, 0.555, 0]} castShadow>
                <cylinderGeometry args={[tw * 0.38, tw * 0.6, 0.05, 6]} />
                <Matte color={c.shirtAccent} />
              </mesh>
              {BASIC.accessories.includes("id-badge") && (
                <mesh position={[-0.1, 0.38, td * 0.62]} rotation={[-0.08, 0, 0]}>
                  <boxGeometry args={[0.07, 0.09, 0.01]} />
                  <Matte color="#F2F4F8" />
                </mesh>
              )}
              {arm(1)}
              {arm(-1)}
              <Joint name="neck" pose={pose} position={[0, 0.58, 0]}>
                <mesh position={[0, 0.04, 0]} castShadow>
                  <cylinderGeometry args={[0.055, 0.065, 0.09, 6]} />
                  <Matte color={c.skin} />
                </mesh>
                <group name="head" position={[0, 0.08 + r * 0.9, 0]} rotation={headRot}>
                  <mesh castShadow>
                    <icosahedronGeometry args={[r, 1]} />
                    <Matte color={c.skin} />
                  </mesh>
                  {/* hair cap */}
                  <mesh position={[0, r * 0.18, -r * 0.08]} scale={[1.03, 0.9, 1.03]} castShadow>
                    <icosahedronGeometry args={[r, 1]} />
                    <Matte color={c.hair} />
                  </mesh>
                  {/* ears */}
                  {[-1, 1].map((s) => (
                    <mesh key={s} position={[s * r * 0.98, 0, 0]} castShadow>
                      <icosahedronGeometry args={[r * 0.2, 0]} />
                      <Matte color={c.skin} />
                    </mesh>
                  ))}
                  {/* nose */}
                  <mesh position={[0, -r * 0.08, r * 0.98]}>
                    <tetrahedronGeometry args={[r * 0.12, 0]} />
                    <Matte color={c.skin} />
                  </mesh>
                  <Face def={def} pose={pose} blink={blink} r={r} />
                  {hasHat && (
                    <group position={[0, r * 0.55, 0]}>
                      <mesh castShadow>
                        <sphereGeometry args={[r * 1.08, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <Matte color={c.shirtAccent} roughness={0.7} />
                      </mesh>
                      <mesh position={[0, 0.0, r * 0.25]} castShadow>
                        <cylinderGeometry args={[r * 1.18, r * 1.2, 0.025, 10]} />
                        <Matte color={c.shirtAccent} roughness={0.7} />
                      </mesh>
                    </group>
                  )}
                </group>
              </Joint>
            </Joint>
          </Joint>
        </Joint>
      </group>
    </group>
  );
}
