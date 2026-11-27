/**
 * Body plan: stylized human (Ton and future human characters such as May).
 *
 * Reference: board 01 §02/§07/§08 (Ton). Rounded-cube head, faceted hair
 * clusters, simple dot eyes, soft-faceted limbs. Stylized adult proportions:
 * head ≈ 1/5 of height (larger than realistic, smaller than the chibi
 * sheet) so Ton reads as an adult next to furniture and doors.
 */
import { RoundedBox } from "@react-three/drei";
import { rand } from "../animation/core";
import type { Pose } from "./rig";
import type { CharacterDefinition } from "./types";
import { Brow, DotEye, Facet, Joint, Mouth, Part, type Attachments } from "./parts";

const HEAD = { w: 0.34, h: 0.35, d: 0.32 };

/** Deterministic faceted hair clusters (seeded so the hairstyle never changes). */
function Hair({ color, seed, style }: { color: string; seed: number; style: string }) {
  const chunks: Array<{ p: [number, number, number]; s: [number, number, number]; r: [number, number, number]; size: number }> = [];
  if (style === "geometric-tousled") {
    // full cap over the top of the head (no skin showing from above/behind)
    chunks.push({ p: [0, HEAD.h / 2 - 0.01, -0.01], s: [1.08, 0.42, 1.06], r: [0, 0, 0], size: 0.19 });
    // crown / top volume
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      chunks.push({
        p: [Math.cos(a) * 0.115, HEAD.h / 2 + 0.035 + rand(seed, i) * 0.025, Math.sin(a) * 0.1 - 0.015],
        s: [1.1, 0.7, 1],
        r: [rand(seed, i + 20) * 0.6, a, rand(seed, i + 40) * 0.6],
        size: 0.09 + rand(seed, i + 60) * 0.03,
      });
    }
    chunks.push({ p: [0, HEAD.h / 2 + 0.07, -0.01], s: [1.3, 0.75, 1.2], r: [0.2, 0.4, 0], size: 0.12 });
    // fringe pointing forward / to the side
    for (let i = 0; i < 6; i++) {
      const x = -0.13 + i * 0.052;
      chunks.push({ p: [x, HEAD.h / 2 + 0.005, HEAD.d / 2 - 0.02], s: [0.9, 0.7, 0.9], r: [0.9, 0, -0.3 + rand(seed, i + 80) * 0.3], size: 0.055 + rand(seed, i + 90) * 0.015 });
    }
    // sides & back
    for (const s of [1, -1]) {
      chunks.push({ p: [s * (HEAD.w / 2), HEAD.h / 2 - 0.06, -0.03], s: [0.45, 1, 1.3], r: [0, 0, s * 0.25], size: 0.08 });
      chunks.push({ p: [s * (HEAD.w / 2 - 0.01), HEAD.h / 2 - 0.1, -0.1], s: [0.45, 1, 1], r: [0, 0, s * 0.2], size: 0.07 });
    }
    // back of the head down to the nape
    chunks.push({ p: [0, HEAD.h / 2 - 0.07, -HEAD.d / 2 + 0.01], s: [1.6, 1.1, 0.55], r: [0, 0, 0], size: 0.11 });
    chunks.push({ p: [0, HEAD.h / 2 - 0.16, -HEAD.d / 2 + 0.005], s: [1.45, 0.9, 0.45], r: [0.2, 0, 0], size: 0.1 });
    for (const s of [1, -1]) chunks.push({ p: [s * 0.08, HEAD.h / 2 - 0.02, -HEAD.d / 2 + 0.03], s: [1, 1, 0.7], r: [0.4, s * 0.3, 0], size: 0.08 });
  }
  return (
    <group>
      {chunks.map((c, i) => (
        <Part key={i} position={c.p} rotation={c.r} scale={c.s} color={color}>
          <dodecahedronGeometry args={[c.size, 0]} />
        </Part>
      ))}
    </group>
  );
}

export function StylizedHuman({ def, pose, blink, look, attachments }: { def: CharacterDefinition; pose: Pose; blink: number; look: [number, number]; attachments?: Attachments }) {
  const c = def.colors as Record<string, string>;
  const b = def.body;
  const face = pose.face;
  const lidL = Math.min(1, face.eyelids[0] + blink);
  const lidR = Math.min(1, face.eyelids[1] + blink);
  const shortSleeve = c.sleeve === "short";

  const arm = (side: 1 | -1) => {
    const sh = side === 1 ? "shoulderL" : "shoulderR";
    const el = side === 1 ? "elbowL" : "elbowR";
    const wr = side === 1 ? "wristL" : "wristR";
    return (
      <Joint name={sh} pose={pose} position={[side * b.shoulderHalfWidth, b.shoulderAboveHip - 0.04, 0]} attachments={attachments}>
        {/* sleeve (shirt colour) then bare upper arm below a short sleeve */}
        <Part position={[0, shortSleeve ? -0.07 : -b.upperArm / 2, 0]} color={c.shirt!}>
          <cylinderGeometry args={[0.085, 0.078, shortSleeve ? 0.15 : b.upperArm, 7]} />
        </Part>
        {shortSleeve && (
          <Part position={[0, -0.07 - b.upperArm / 2 + 0.04, 0]} color={c.skin!}>
            <cylinderGeometry args={[0.058, 0.055, b.upperArm - 0.1, 7]} />
          </Part>
        )}
        <Joint name={el} pose={pose} position={[0, -b.upperArm, 0]} attachments={attachments}>
          <Part position={[0, -b.forearm / 2, 0]} color={c.skin!}>
            <cylinderGeometry args={[0.055, 0.047, b.forearm, 7]} />
          </Part>
          <Joint name={wr} pose={pose} position={[0, -b.forearm, 0]} attachments={attachments}>
            <RoundedBox args={[0.085, 0.11, 0.055]} radius={0.018} smoothness={1} position={[0, -0.05, 0]} castShadow>
              <Facet color={c.skin!} />
            </RoundedBox>
            <RoundedBox args={[0.022, 0.05, 0.025]} radius={0.008} smoothness={1} position={[-side * 0.04, -0.03, 0.015]} rotation={[0, 0, side * 0.4]} castShadow>
              <Facet color={c.skin!} />
            </RoundedBox>
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
      <Joint name={hp} pose={pose} position={[side * 0.11, 0, 0]} attachments={attachments}>
        <Part position={[0, -b.thigh / 2, 0]} color={c.trousers!}>
          <cylinderGeometry args={[0.105, 0.09, b.thigh, 7]} />
        </Part>
        <Joint name={kn} pose={pose} position={[0, -b.thigh, 0]} attachments={attachments}>
          <Part position={[0, -b.shin / 2, 0]} color={c.trousers!}>
            <cylinderGeometry args={[0.09, 0.085, b.shin, 7]} />
          </Part>
          <Joint name={an} pose={pose} position={[0, -b.shin, 0]} attachments={attachments}>
            <RoundedBox args={[0.13, 0.08, 0.27]} radius={0.032} smoothness={2} position={[0, -0.03, 0.05]} castShadow>
              <Facet color={c.shoes!} />
            </RoundedBox>
            <mesh position={[0, -0.064, 0.05]}>
              <boxGeometry args={[0.132, 0.012, 0.272]} />
              <Facet color={c.sole!} />
            </mesh>
          </Joint>
        </Joint>
      </Joint>
    );
  };

  const torsoH = b.shoulderAboveHip;
  return (
    <group position={[0, b.hipHeight + pose.rootY, pose.rootZ]}>
      <Joint name="hips" pose={pose} position={[0, 0, 0]} attachments={attachments}>
        <Part position={[0, 0.02, 0]} scale={[1, 1, 0.7]} color={c.trousers!}>
          <cylinderGeometry args={[0.22, 0.2, 0.17, 8]} />
        </Part>
        {/* waistband / belt: hides the shirt-trouser seam in every pose */}
        <Part position={[0, 0.1, 0]} scale={[1, 1, 0.7]} color={c.belt ?? "#2A2622"}>
          <cylinderGeometry args={[0.232, 0.226, 0.05, 8]} />
        </Part>
        {leg(1)}
        {leg(-1)}
        <Joint name="spine" pose={pose} position={[0, 0.08, 0]} attachments={attachments}>
          <Joint name="chest" pose={pose} position={[0, 0, 0]} attachments={attachments}>
            {/* shirt: softly tapered, faceted */}
            <Part position={[0, torsoH / 2 - 0.06, 0]} scale={[1, 1, 0.66]} color={c.shirt!}>
              <cylinderGeometry args={[0.245, 0.215, torsoH - 0.02, 8]} />
            </Part>
            <Part position={[0, torsoH - 0.06, 0]} scale={[1, 0.42, 0.64]} color={c.shirt!}>
              <icosahedronGeometry args={[0.245, 1]} />
            </Part>
            {/* collar */}
            {[1, -1].map((s) => (
              <Part key={s} position={[s * 0.06, torsoH - 0.03, 0.11]} rotation={[-0.5, s * 0.3, s * 0.5]} color={c.collar!}>
                <boxGeometry args={[0.08, 0.016, 0.07]} />
              </Part>
            ))}
            {/* placket + buttons */}
            <Part position={[0, torsoH / 2 - 0.02, 0.152]} color={c.collar!}>
              <boxGeometry args={[0.03, torsoH - 0.1, 0.006]} />
            </Part>
            {[0.1, 0.2, 0.3].map((y) => (
              <mesh key={y} position={[0, y, 0.157]}>
                <boxGeometry args={[0.012, 0.012, 0.006]} />
                <Facet color={c.button!} />
              </mesh>
            ))}
            {arm(1)}
            {arm(-1)}
            <Joint name="neck" pose={pose} position={[0, torsoH - 0.02, 0]} attachments={attachments}>
              <Part position={[0, 0.03, 0]} color={c.skin!}>
                <cylinderGeometry args={[0.055, 0.06, 0.08, 7]} />
              </Part>
              <Joint name="head" pose={pose} position={[0, 0.045 + HEAD.h / 2, 0.005]} attachments={attachments} extraRotation={[-look[1], look[0], 0]}>
                <RoundedBox args={[HEAD.w, HEAD.h, HEAD.d]} radius={0.05} smoothness={2} castShadow receiveShadow>
                  <Facet color={c.skin!} />
                </RoundedBox>
                {[1, -1].map((s) => (
                  <RoundedBox key={s} args={[0.035, 0.07, 0.05]} radius={0.012} smoothness={1} position={[s * (HEAD.w / 2 + 0.01), -0.01, 0]} castShadow>
                    <Facet color={c.skin!} />
                  </RoundedBox>
                ))}
                <Part position={[0, -0.025, HEAD.d / 2 + 0.008]} scale={[1, 1, 0.8]} color={c.skinShade!}>
                  <boxGeometry args={[0.03, 0.04, 0.025]} />
                </Part>
                {[1, -1].map((s) => (
                  <DotEye key={s} position={[s * 0.075, 0.02, HEAD.d / 2 + 0.002]} size={[0.03, 0.05]} color={c.eyes!} closure={s === 1 ? lidL : lidR} gaze={face.gaze} squint={face.squint} />
                ))}
                {[1, -1].map((s) => (
                  <Brow key={s} side={s as 1 | -1} position={[s * 0.075, 0.088, HEAD.d / 2 + 0.006]} width={0.06} thickness={0.014} color={c.hair!} face={face} />
                ))}
                <Mouth position={[0, -0.085, HEAD.d / 2 + 0.006]} width={0.085} face={face} lineColor={c.mouthLine!} innerColor={c.mouthInner!} tongueColor={c.tongue!} />
                <Hair color={c.hair!} seed={def.seed} style={c.hairStyle ?? "geometric-tousled"} />
              </Joint>
            </Joint>
          </Joint>
        </Joint>
      </Joint>
    </group>
  );
}
