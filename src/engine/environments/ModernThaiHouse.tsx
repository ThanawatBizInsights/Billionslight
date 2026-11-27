/**
 * Environment A — Modern Thai house (Phase 1 prototype).
 *
 * Original low-poly design: two-storey house, cantilevered upper floor, gable
 * roof with a PV array on the front slope, side-wall inverter + meter,
 * carport/driveway, tropical planting, utility pole at the street.
 *
 * Will be revised against the supplied Billionslight house reference when
 * available. Front faces +Z. Units are metres.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { SCENE_COLORS } from "../../config/palette";
import { Block, Matte } from "../core/materials";
import { ElectricMeter, Inverter, SolarArray, BatteryStorage } from "../equipment/Solar";
import type { EnergyState } from "../energy-flow/scenario";
import type { Vec3 } from "../../schemas/episode";
import { rand } from "../animation/core";

// ----------------------------------------------------------------- geometry
const G = { w: 8, d: 6.5, h: 3 }; // ground floor
const U = { w: 6.6, d: 5.8, h: 2.8, x: -0.5 }; // upper floor
const ROOF = { base: G.h + U.h, rise: 1.7, half: 3.4, length: 7.6 };
const SLOPE = Math.atan2(ROOF.rise, ROOF.half);

/** Point on the front roof slope; s = 0 eave … 1 ridge. */
const onFrontSlope = (x: number, s: number, lift = 0.12): Vec3 => [
  U.x + x,
  ROOF.base + s * ROOF.rise + Math.cos(SLOPE) * lift,
  ROOF.half * (1 - s) + Math.sin(SLOPE) * lift,
];

/** Named points other systems (cables, characters, cameras) can attach to. */
export const HOUSE_ANCHORS = {
  arrayCenter: onFrontSlope(0.2, 0.45, 0.16),
  arrayJunction: onFrontSlope(3.0, 0.2, 0.1),
  arrayNearEdge: onFrontSlope(2.4, 0.35, 0.16),
  inverter: [G.w / 2 + 0.13, 1.6, 1.0] as Vec3,
  battery: [G.w / 2 + 0.2, 0, -0.4] as Vec3,
  meter: [G.w / 2 + 0.11, 1.5, 2.4] as Vec3,
  houseEntry: [G.w / 2 - 0.05, 1.2, 1.7] as Vec3,
  utilityPole: [11.5, 0, 9.4] as Vec3,
  frontDoor: [-1.6, 0, G.d / 2 + 0.6] as Vec3,
  presenterSpot: [2.0, 0, 5.4] as Vec3,
  roofLookTarget: onFrontSlope(0.2, 0.45, 0),
};

/** Cable routes per energy flow, in world space (house at origin). */
export const HOUSE_CABLES: Record<string, Vec3[]> = {
  "pv-to-inverter": [
    HOUSE_ANCHORS.arrayCenter,
    HOUSE_ANCHORS.arrayJunction,
    [G.w / 2 + 0.12, ROOF.base - 0.1, 2.9],
    [G.w / 2 + 0.12, G.h + 0.2, 1.0],
    [G.w / 2 + 0.13, 2.0, 1.0],
  ],
  "inverter-to-house": [
    [G.w / 2 + 0.13, 1.2, 1.0],
    [G.w / 2 + 0.13, 0.9, 1.4],
    [G.w / 2 + 0.06, 0.9, 1.7],
    [G.w / 2 - 0.4, 1.0, 1.7],
    [G.w / 2 - 1.8, 1.4, 1.7],
  ],
  "grid-to-house": [
    [11.5, 6.6, 9.4],
    [8.4, 4.9, 6.2],
    [G.w / 2 + 0.12, 2.6, 2.4],
    [G.w / 2 + 0.11, 1.75, 2.4],
  ],
  "meter-to-house": [
    [G.w / 2 + 0.11, 1.25, 2.4],
    [G.w / 2 + 0.06, 1.0, 2.0],
    [G.w / 2 - 1.8, 1.4, 1.7],
  ],
  "inverter-to-battery": [
    [G.w / 2 + 0.13, 1.2, 0.8],
    [G.w / 2 + 0.16, 0.9, 0.2],
    [G.w / 2 + 0.2, 0.9, -0.4],
  ],
};

function GableRoof() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-ROOF.half, 0);
    shape.lineTo(ROOF.half, 0);
    shape.lineTo(0, ROOF.rise);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: ROOF.length, bevelEnabled: false });
    g.rotateY(Math.PI / 2);
    g.translate(-ROOF.length / 2, 0, 0);
    return g;
  }, []);
  return (
    <group position={[U.x, ROOF.base, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <Matte color={SCENE_COLORS.roofDark} />
      </mesh>
      {/* fascia board */}
      <Block size={[ROOF.length + 0.1, 0.14, 0.12]} position={[0, 0.02, ROOF.half]} color="#E8E2D6" />
      <Block size={[ROOF.length + 0.1, 0.14, 0.12]} position={[0, 0.02, -ROOF.half]} color="#E8E2D6" />
    </group>
  );
}

function Window({ position, size, glow, rotationY = 0 }: { position: Vec3; size: [number, number]; glow: number; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Block size={[size[0] + 0.16, size[1] + 0.16, 0.08]} color="#3D3A38" />
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[size[0], size[1], 0.02]} />
        <meshStandardMaterial
          color={SCENE_COLORS.glass}
          roughness={0.2}
          metalness={0.1}
          emissive={SCENE_COLORS.warmPractical}
          emissiveIntensity={glow}
          flatShading
        />
      </mesh>
      <Block size={[0.05, size[1], 0.04]} position={[0, 0, 0.07]} color="#3D3A38" />
    </group>
  );
}

function Palm({ position, seed, height = 4 }: { position: Vec3; seed: number; height?: number }) {
  const segments = 5;
  const lean = (rand(seed, 0) - 0.5) * 0.25;
  const leaves = 7;
  return (
    <group position={position} rotation={[0, rand(seed, 1) * Math.PI * 2, lean]}>
      {Array.from({ length: segments }, (_, i) => (
        <mesh key={i} position={[0, (i + 0.5) * (height / segments), 0]} castShadow>
          <cylinderGeometry args={[0.11 - i * 0.012, 0.13 - i * 0.012, height / segments, 5]} />
          <Matte color={i % 2 ? "#8A6A4A" : "#7A5C3E"} />
        </mesh>
      ))}
      {Array.from({ length: leaves }, (_, i) => (
        <group key={i} position={[0, height, 0]} rotation={[0, (i / leaves) * Math.PI * 2, 0]}>
          <mesh position={[0.75, -0.18, 0]} rotation={[0, 0, -0.45]} castShadow>
            <coneGeometry args={[0.22, 1.7, 3]} />
            <Matte color={i % 2 ? SCENE_COLORS.grass : SCENE_COLORS.grassDark} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Bush({ position, scale = 1, seed }: { position: Vec3; scale?: number; seed: number }) {
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(rand(seed, i) - 0.5) * 0.7, 0.35 + rand(seed, i + 9) * 0.15, (rand(seed, i + 3) - 0.5) * 0.5]} castShadow receiveShadow>
          <icosahedronGeometry args={[0.42 - i * 0.06, 0]} />
          <Matte color={i === 1 ? SCENE_COLORS.grassDark : "#4E8C52"} />
        </mesh>
      ))}
    </group>
  );
}

function UtilityPole({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 3.6, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 7.2, 6]} />
        <Matte color="#A3A7AD" />
      </mesh>
      <Block size={[1.8, 0.12, 0.12]} position={[0, 6.6, 0]} color="#6F737A" />
      {[-0.7, 0, 0.7].map((x) => (
        <mesh key={x} position={[x, 6.72, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.14, 5]} />
          <Matte color="#E9EDF2" />
        </mesh>
      ))}
    </group>
  );
}

export interface ModernThaiHouseProps {
  interiorGlow: number;
  energy: EnergyState;
  pvGeneration: number;
  frame: number;
  showBattery?: boolean;
  inverterVariant?: "grid-tied" | "hybrid";
}

export function ModernThaiHouse({ interiorGlow, energy, pvGeneration, frame, showBattery = false, inverterVariant = "grid-tied" }: ModernThaiHouseProps) {
  // interiorGlow already includes whether house circuits are powered (registry).
  const glow = interiorGlow;
  const inverterOutput = Math.min(1, (energy.flows["inverter-to-house"].kw + energy.flows["inverter-to-backup"].kw + energy.flows["inverter-to-grid"].kw) / 5);
  return (
    <group>
      {/* ground, lawn, driveway, street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[60, 24]} />
        <Matte color={SCENE_COLORS.grass} />
      </mesh>
      <Block size={[3.2, 0.04, 6]} position={[2.4, 0.02, 6.2]} color={SCENE_COLORS.concrete} castShadow={false} />
      <Block size={[40, 0.03, 3.6]} position={[0, 0.015, 10.6]} color="#5B6170" castShadow={false} />
      <Block size={[40, 0.05, 0.3]} position={[0, 0.03, 8.7]} color="#D9DCE2" castShadow={false} />
      {/* plinth */}
      <Block size={[G.w + 0.4, 0.25, G.d + 0.4]} position={[0, 0.125, 0]} color="#B7B2A8" />

      {/* ground floor */}
      <Block size={[G.w, G.h, G.d]} position={[0, G.h / 2 + 0.25, 0]} color={SCENE_COLORS.wallWarm} />
      {/* timber accent panel */}
      <Block size={[2.4, G.h - 0.2, 0.06]} position={[-2.6, G.h / 2 + 0.25, G.d / 2 + 0.03]} color={SCENE_COLORS.wallAccent} />
      {/* door */}
      <Block size={[1.1, 2.2, 0.08]} position={[-1.6, 1.35, G.d / 2 + 0.05]} color="#5A4636" />
      <Window position={[1.4, 1.7, G.d / 2 + 0.02]} size={[2.6, 1.7]} glow={glow} />
      <Window position={[G.w / 2 + 0.02, 1.8, -1.6]} size={[1.6, 1.3]} glow={glow * 0.8} rotationY={Math.PI / 2} />

      {/* upper floor (cantilevered) */}
      <Block size={[U.w + 0.3, 0.22, U.d + 0.5]} position={[U.x, G.h + 0.25 + 0.11, 0.2]} color="#D9D3C6" />
      <Block size={[U.w, U.h, U.d]} position={[U.x, G.h + 0.25 + U.h / 2, 0]} color="#F3EEE5" />
      <Window position={[U.x - 1.6, G.h + 1.7, U.d / 2 + 0.02]} size={[1.8, 1.4]} glow={glow * 0.9} />
      <Window position={[U.x + 1.6, G.h + 1.7, U.d / 2 + 0.02]} size={[1.8, 1.4]} glow={glow * 0.7} />
      {/* balcony rail */}
      <Block size={[U.w + 0.3, 0.06, 0.06]} position={[U.x, G.h + 1.25, U.d / 2 + 0.45]} color="#2E2F33" />

      <GableRoof />
      <SolarArray rows={2} cols={5} position={HOUSE_ANCHORS.arrayCenter} rotation={[SLOPE, 0, 0]} generation={pvGeneration} />

      {/* side-wall equipment */}
      <Inverter position={HOUSE_ANCHORS.inverter} rotation={[0, Math.PI / 2, 0]} mode={energy.inverterMode} output={inverterOutput} variant={inverterVariant} frame={frame} />
      <ElectricMeter position={HOUSE_ANCHORS.meter} rotation={[0, Math.PI / 2, 0]} active={energy.gridConnected} importing={energy.flows["grid-to-house"].active} />
      {showBattery && (
        <BatteryStorage position={HOUSE_ANCHORS.battery} rotation={[0, Math.PI / 2, 0]} charging={energy.flows["inverter-to-battery"].active} discharging={energy.flows["battery-to-inverter"].active} />
      )}

      <UtilityPole position={HOUSE_ANCHORS.utilityPole} />

      {/* landscaping */}
      <Palm position={[-5.4, 0, 3.6]} seed={3} height={4.6} />
      <Palm position={[-6.4, 0, -1.5]} seed={8} height={5.2} />
      <Palm position={[5.6, 0, -3.2]} seed={13} height={4.2} />
      <Bush position={[-3.4, 0, 4.2]} seed={21} />
      <Bush position={[0.1, 0, 4.0]} seed={22} scale={0.8} />
      <Bush position={[-4.6, 0, 5.6]} seed={23} scale={1.2} />
      <Bush position={[5.4, 0, 1.2]} seed={24} scale={0.9} />
      {/* low front wall */}
      <Block size={[6, 0.7, 0.2]} position={[-3.8, 0.35, 8.3]} color="#D4CFC4" />
    </group>
  );
}
