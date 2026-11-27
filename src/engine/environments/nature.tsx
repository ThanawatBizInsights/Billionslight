/** Reusable low-poly vegetation and garden props (deterministic via seeds). */
import { rand } from "../animation/core";

type V3 = [number, number, number];
const Matte = ({ color }: { color: string }) => <meshStandardMaterial color={color} roughness={0.9} flatShading />;

export const GREENS = ["#4E8C3A", "#5E9E4A", "#3F7A3A", "#6BAA52", "#2F6A35"];

export function Palm({ position, seed, height = 4.5, sway = 0 }: { position: V3; seed: number; height?: number; sway?: number }) {
  const segments = 6;
  const lean = (rand(seed, 0) - 0.5) * 0.25;
  const leaves = 8;
  return (
    <group position={position} rotation={[0, rand(seed, 1) * Math.PI * 2, lean]}>
      {Array.from({ length: segments }, (_, i) => (
        <mesh key={i} position={[0, (i + 0.5) * (height / segments), 0]} castShadow>
          <cylinderGeometry args={[0.1 - i * 0.008, 0.12 - i * 0.008, height / segments, 6]} />
          <Matte color={i % 2 ? "#8A6A4A" : "#7A5C3E"} />
        </mesh>
      ))}
      <group position={[0, height, 0]} rotation={[sway, 0, sway * 0.5]}>
        {Array.from({ length: leaves }, (_, i) => (
          <group key={i} rotation={[0, (i / leaves) * Math.PI * 2 + rand(seed, i + 5) * 0.3, 0]}>
            <mesh position={[0.85, -0.22, 0]} rotation={[0, 0, -0.5 - rand(seed, i + 9) * 0.2]} scale={[1, 1, 0.35]} castShadow>
              <coneGeometry args={[0.3, 1.9, 4]} />
              <Matte color={GREENS[i % GREENS.length]!} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Rounded canopy tree (tropical shade tree, board 05 background). */
export function CanopyTree({ position, seed, height = 5, spread = 2.2 }: { position: V3; seed: number; height?: number; spread?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, height * 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, height * 0.7, 6]} />
        <Matte color="#6E5238" />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          position={[(rand(seed, i) - 0.5) * spread, height * 0.75 + rand(seed, i + 10) * height * 0.25, (rand(seed, i + 20) - 0.5) * spread]}
          scale={[1, 0.75, 1]}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[spread * (0.45 + rand(seed, i + 30) * 0.25), 1]} />
          <Matte color={GREENS[(i + seed) % GREENS.length]!} />
        </mesh>
      ))}
    </group>
  );
}

export function Shrub({ position, scale = 1, seed, color }: { position: V3; scale?: number; seed: number; color?: string }) {
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(rand(seed, i) - 0.5) * 0.7, 0.32 + rand(seed, i + 9) * 0.15, (rand(seed, i + 3) - 0.5) * 0.5]} castShadow receiveShadow>
          <icosahedronGeometry args={[0.4 - i * 0.06, 0]} />
          <Matte color={color ?? GREENS[(i + seed) % GREENS.length]!} />
        </mesh>
      ))}
    </group>
  );
}

/** Ornamental grass tuft (tall thin blades). */
export function GrassTuft({ position, seed, height = 0.8, color = "#9DB06A" }: { position: V3; seed: number; height?: number; color?: string }) {
  return (
    <group position={position}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, height / 2, 0]} rotation={[(rand(seed, i) - 0.5) * 0.7, rand(seed, i + 7) * Math.PI, (rand(seed, i + 14) - 0.5) * 0.7]} castShadow>
          <coneGeometry args={[0.035, height, 3]} />
          <Matte color={i % 2 ? color : "#B5C27A"} />
        </mesh>
      ))}
    </group>
  );
}

/** Planter box with trailing greenery (terrace edges). */
export function Planter({ position, length, seed, rotationY = 0 }: { position: V3; length: number; seed: number; rotationY?: number }) {
  const n = Math.max(2, Math.round(length / 0.45));
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.4, 0.5]} />
        <meshStandardMaterial color="#E9E5DC" roughness={0.9} flatShading />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[-length / 2 + (i + 0.5) * (length / n), 0.4, 0]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <icosahedronGeometry args={[0.24 + rand(seed, i) * 0.08, 0]} />
            <Matte color={GREENS[(i + seed) % GREENS.length]!} />
          </mesh>
          {/* trailing leaves over the front edge */}
          <mesh position={[0, -0.15, 0.27]} scale={[1, 1.6, 0.5]} castShadow>
            <icosahedronGeometry args={[0.15, 0]} />
            <Matte color={GREENS[(i + seed + 2) % GREENS.length]!} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function PottedPlant({ position, seed, height = 1.1 }: { position: V3; seed: number; height?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.16, 0.36, 8]} />
        <meshStandardMaterial color="#D8CFC2" roughness={0.8} flatShading />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh
          key={i}
          position={[(rand(seed, i) - 0.5) * 0.3, 0.36 + height * 0.45, (rand(seed, i + 3) - 0.5) * 0.3]}
          rotation={[(rand(seed, i + 5) - 0.5) * 1.2, rand(seed, i + 6) * Math.PI, (rand(seed, i + 8) - 0.5) * 1.2]}
          scale={[0.5, 1, 0.12]}
          castShadow
        >
          <sphereGeometry args={[height * 0.42, 5, 4]} />
          <Matte color={GREENS[(i + seed) % GREENS.length]!} />
        </mesh>
      ))}
    </group>
  );
}

/** Garden bollard light; glow 0–1. */
export function Bollard({ position, glow }: { position: V3; glow: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.6, 6]} />
        <meshStandardMaterial color="#2E3138" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.08, 6]} />
        <meshStandardMaterial color="#FFE2A8" emissive="#FFB867" emissiveIntensity={glow * 3} toneMapped={false} />
      </mesh>
    </group>
  );
}
