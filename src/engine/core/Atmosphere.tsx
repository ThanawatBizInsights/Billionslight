/** Subtle floating dust/pollen motes. Fully deterministic per frame. */
import { noise1, rand } from "../animation/core";
import type { Vec3 } from "../../schemas/episode";

export function Atmosphere({
  frame,
  fps,
  center = [0, 3, 4],
  size = [18, 7, 14],
  count = 60,
  color = "#FFE2A8",
  seed = 7,
}: {
  frame: number;
  fps: number;
  center?: Vec3;
  size?: Vec3;
  count?: number;
  color?: string;
  seed?: number;
}) {
  const t = frame / fps;
  const motes = [];
  for (let i = 0; i < count; i++) {
    const bx = (rand(seed, i * 3) - 0.5) * size[0];
    const by = (rand(seed, i * 3 + 1) - 0.5) * size[1];
    const bz = (rand(seed, i * 3 + 2) - 0.5) * size[2];
    const x = center[0] + bx + noise1(seed + i, t * 0.15) * 0.6;
    const y = center[1] + by + ((t * 0.08 + rand(seed + 9, i)) % 1) * 0.8;
    const z = center[2] + bz + noise1(seed + i + 500, t * 0.15) * 0.6;
    const twinkle = 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.3 + i));
    motes.push(
      <mesh key={i} position={[x, y, z]} scale={0.025 + rand(seed + 3, i) * 0.02}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.55 * twinkle} depthWrite={false} toneMapped={false} />
      </mesh>,
    );
  }
  return <group>{motes}</group>;
}
