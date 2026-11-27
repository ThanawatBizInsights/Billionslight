/**
 * Billionslight standard energy path: a thin luminous cable, small emissive
 * particles whose DENSITY encodes power (kW) at a CONSTANT speed, and moving
 * arrowheads that show the direction of power transfer. Inactive paths are
 * grey with no motion; warning paths pulse red. White household-load paths get
 * a dark outline so they stay readable in bright scenes.
 *
 * Fully deterministic: every position is a function of the frame and data.
 * Particles and arrows are instanced (two draw calls per path).
 */
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ENERGY_FLOW_COLORS, ENERGY_FLOW_MOTION, ENERGY_FLOW_OUTLINE, type EnergyFlowCategory } from "../../config/energy-flow";
import { clamp, rand } from "../animation/core";
import type { Vec3 } from "../../schemas/episode";

export interface EnergyFlowPathProps {
  points: Vec3[];
  frame: number;
  fps: number;
  kw: number;
  /** +1 along the points, -1 against them. */
  direction: 1 | -1;
  category: EnergyFlowCategory;
  warning?: boolean;
  visible?: boolean;
  /** Power that maps to the standard density (consistent within a scene). */
  referenceKw?: number;
  /** Quality/density multiplier (draft renders fewer particles). */
  densityScale?: number;
  seed?: number;
  /** Visual thickness multiplier for wide shots (cable, particles, arrows). */
  pathScale?: number;
}

/** Max particle slots per metre: slots light up as power rises (no popping, no randomness over time). */
const SLOTS_PER_M = ENERGY_FLOW_MOTION.densityAtReference * 2;
const UP = new THREE.Vector3(0, 1, 0);

export function particleFraction(kw: number, referenceKw: number) {
  return clamp(kw / referenceKw / 2, 0, 1);
}

export function EnergyFlowPath({ points, frame, fps, kw, direction, category, warning = false, visible = true, referenceKw = ENERGY_FLOW_MOTION.referenceKw, densityScale = 1, seed = 1, pathScale = 1 }: EnergyFlowPathProps) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.05), [points]);
  const length = useMemo(() => curve.getLength(), [curve]);
  const segs = Math.max(8, Math.round(length * 8));
  const r = ENERGY_FLOW_MOTION.cableRadius * pathScale;
  const tube = useMemo(() => new THREE.TubeGeometry(curve, segs, r, 6, false), [curve, segs, r]);
  const outlineTube = useMemo(() => new THREE.TubeGeometry(curve, segs, r * 1.9, 6, false), [curve, segs, r]);
  const glowTube = useMemo(() => new THREE.TubeGeometry(curve, segs, r * 2.4, 6, false), [curve, segs, r]);

  const active = kw > 0.005 && category !== "inactive";
  const hex = ENERGY_FLOW_COLORS[warning ? "fault" : active ? category : "inactive"];
  const white = category === "householdLoad" && active;
  const t = frame / fps;
  const travel = (t * ENERGY_FLOW_MOTION.speed) / length; // fraction of the path per second × t

  const slots = Math.max(1, Math.round(length * SLOTS_PER_M * densityScale));
  const arrows = Math.max(1, Math.floor(length / ENERGY_FLOW_MOTION.arrowSpacing));
  const frac = active && !warning ? particleFraction(kw, referenceKw) : 0;

  const particleRef = useRef<THREE.InstancedMesh>(null);
  const particleOutlineRef = useRef<THREE.InstancedMesh>(null);
  const arrowRef = useRef<THREE.InstancedMesh>(null);
  const arrowOutlineRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const place = (u: number) => {
      const uu = direction === 1 ? u : 1 - u;
      return { p: curve.getPointAt(uu), tan: curve.getTangentAt(uu).multiplyScalar(direction) };
    };
    const edgeFade = (u: number) => clamp(Math.min(u, 1 - u) / 0.05);
    // particles
    for (const ref of [particleRef, particleOutlineRef]) {
      const mesh = ref.current;
      if (!mesh) continue;
      const k = ref === particleOutlineRef ? 1.45 : 1;
      for (let i = 0; i < slots; i++) {
        // golden-ratio sequence: evenly spread for ANY power level, fixed per slot (deterministic)
        const threshold = (i * 0.6180339887 + rand(seed, 0) * 0.5) % 1;
        const on = clamp((frac - threshold) * 12);
        const u = (((i / slots + travel) % 1) + 1) % 1;
        const { p } = place(u);
        const size = 0.055 * pathScale * on * edgeFade(u) * k;
        m.compose(p, q.identity(), s.setScalar(size));
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    // arrowheads (cones) pointing along the direction of power transfer
    for (const ref of [arrowRef, arrowOutlineRef]) {
      const mesh = ref.current;
      if (!mesh) continue;
      const k = ref === arrowOutlineRef ? 1.4 : 1;
      for (let i = 0; i < arrows; i++) {
        const u = ((((i + 0.5) / arrows + travel) % 1) + 1) % 1;
        const { p, tan } = place(u);
        q.setFromUnitVectors(UP, tan.normalize());
        const size = active && !warning ? edgeFade(u) * k * pathScale : 0;
        m.compose(p, q, s.set(size, size, size));
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  if (!visible) return null;
  const pulse = warning ? 0.45 + 0.35 * Math.sin(t * Math.PI * 2 * 1.2) : 0;
  return (
    <group>
      {white && (
        <mesh geometry={outlineTube}>
          <meshBasicMaterial color={ENERGY_FLOW_OUTLINE} side={THREE.BackSide} />
        </mesh>
      )}
      <mesh geometry={tube}>
        <meshStandardMaterial color={hex} roughness={0.55} flatShading emissive={hex} emissiveIntensity={warning ? pulse : active ? 0.35 : 0} />
      </mesh>
      {(active || warning) && (
        <mesh geometry={glowTube}>
          <meshBasicMaterial color={hex} transparent opacity={warning ? 0.1 + pulse * 0.15 : 0.1} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {white && (
        <instancedMesh ref={particleOutlineRef} args={[undefined, undefined, slots]} frustumCulled={false}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={ENERGY_FLOW_OUTLINE} side={THREE.BackSide} />
        </instancedMesh>
      )}
      <instancedMesh ref={particleRef} args={[undefined, undefined, slots]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={hex} toneMapped={false} />
      </instancedMesh>
      {white && (
        <instancedMesh ref={arrowOutlineRef} args={[undefined, undefined, arrows]} frustumCulled={false}>
          <coneGeometry args={[0.1, 0.24, 10]} />
          <meshBasicMaterial color={ENERGY_FLOW_OUTLINE} side={THREE.BackSide} />
        </instancedMesh>
      )}
      <instancedMesh ref={arrowRef} args={[undefined, undefined, arrows]} frustumCulled={false}>
        <coneGeometry args={[0.1, 0.24, 10]} />
        <meshBasicMaterial color={hex} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
