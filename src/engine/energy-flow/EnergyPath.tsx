/**
 * Visual energy path: a cable polyline with a glow, and particles travelling
 * along it. Particle positions are a pure function of the frame.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { ENERGY_COLORS, type EnergyColorKey } from "../../config/palette";
import { rand } from "../animation/core";
import type { Vec3 } from "../../schemas/episode";

export interface EnergyPathProps {
  points: Vec3[];
  frame: number;
  fps: number;
  /** 0 = inactive (grey cable, no particles) … 1 = full flow. */
  intensity: number;
  color: EnergyColorKey;
  /** Particles per metre at full intensity. */
  density?: number;
  /** Metres per second. */
  speed?: number;
  seed?: number;
  cableRadius?: number;
  particleMultiplier?: number;
  showCable?: boolean;
}

export function EnergyPath({
  points,
  frame,
  fps,
  intensity,
  color,
  density = 2.2,
  speed = 1.4,
  seed = 1,
  cableRadius = 0.03,
  particleMultiplier = 1,
  showCable = true,
}: EnergyPathProps) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.05),
    [points],
  );
  const length = useMemo(() => curve.getLength(), [curve]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, Math.max(8, Math.round(length * 6)), cableRadius, 5, false), [curve, length, cableRadius]);
  const glowTube = useMemo(() => new THREE.TubeGeometry(curve, Math.max(8, Math.round(length * 6)), cableRadius * 2.4, 6, false), [curve, length, cableRadius]);

  const count = Math.max(2, Math.round(length * density * particleMultiplier));
  const hex = ENERGY_COLORS[color];
  const cableColor = new THREE.Color(ENERGY_COLORS.inactive).lerp(new THREE.Color(hex), Math.min(1, intensity) * 0.85);
  const t = frame / fps;

  const particles = [];
  if (intensity > 0.01) {
    for (let i = 0; i < count; i++) {
      const u = (((i + rand(seed, i) * 0.6) / count + (t * speed) / length) % 1 + 1) % 1;
      const p = curve.getPointAt(u);
      // fade particles at the ends so they appear to flow out of equipment
      const edge = Math.min(1, u / 0.06, (1 - u) / 0.06);
      const pulse = 0.75 + 0.25 * Math.sin(t * 6 + i * 1.7);
      const s = (0.055 + rand(seed + 5, i) * 0.03) * edge * pulse * Math.min(1, intensity * 1.4);
      particles.push(
        <mesh key={i} position={p} scale={s}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={hex} toneMapped={false} transparent opacity={Math.min(1, intensity)} />
        </mesh>,
      );
    }
  }

  return (
    <group>
      {showCable && (
        <mesh geometry={tube} castShadow>
          <meshStandardMaterial color={cableColor} roughness={0.6} emissive={hex} emissiveIntensity={intensity * 0.5} flatShading />
        </mesh>
      )}
      {intensity > 0.01 && (
        <mesh geometry={glowTube}>
          <meshBasicMaterial color={hex} transparent opacity={0.18 * intensity} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {particles}
    </group>
  );
}
