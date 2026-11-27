/**
 * ENV01 — Modern Thai solar house (Phase 2), after board 05 "ENV01 Solar
 * House (Main)" and board 01 §09–12.
 *
 * Flat-roof two-storey block: pale board-formed concrete ground floor with
 * full-height glazing, front steps on a plinth, a cantilevered stone-clad
 * upper floor set back behind a terrace with planters, a thin roof slab with a
 * tilted PV array on racks, a garage/service wing on the right, the utility
 * meter on a separate boundary-wall pillar, and tropical landscaping.
 * Front faces +Z; units metres.
 */
import { rand } from "../animation/core";
import { SolarPanel } from "../equipment/Solar";
import { UtilityMeter } from "../equipment/Electrical";
import type { EnergyState } from "../energy-flow/scenario";
import type { Vec3 } from "../../schemas/episode";
import { Bollard, CanopyTree, GrassTuft, Palm, Planter, PottedPlant, Shrub } from "./nature";

const C = {
  concrete: "#D9D5CC",
  concreteDark: "#C2BCB1",
  render: "#F1EEE7",
  stone: "#CFC8BB",
  frame: "#2B2C30",
  glassDay: "#7F9DB8",
  interior: "#F2B467",
  paving: "#CFCBC3",
  step: "#E3DFD7",
  lawn: "#5E9447",
  road: "#545A66",
  garageDoor: "#B9BDC4",
  roof: "#BDB7AC",
};

const GF = { x0: -5, x1: 5, z0: -4, z1: 3, y0: 0.36, h: 3.2 }; // ground floor
const UF = { x0: -4.2, x1: 2.4, z0: -4, z1: 0.6, y0: GF.y0 + GF.h + 0.3, h: 3.0 }; // upper floor (set back)
const ROOF_Y = UF.y0 + UF.h;
const GAR = { x0: 5, x1: 9, z0: -4, z1: 3, h: 3.2 }; // garage wing

/** Tilted PV rack layout on the flat roof (exported for cables/anchors). */
const PV = { cx: -0.9, cz: -1.0, rows: 2, cols: 5, tilt: 0.32, y: ROOF_Y + 0.6 };

export const SOLAR_HOUSE_ANCHORS: Record<string, Vec3> = {
  arrayCenter: [PV.cx, PV.y, PV.cz],
  roofLookTarget: [PV.cx, ROOF_Y + 0.3, PV.cz + 1.2],
  frontDoor: [0.7, GF.y0, GF.z1 + 0.9],
  frontSteps: [0.2, 0, GF.z1 + 1.9],
  terrace: [-1, GF.y0 + GF.h + 0.3, 1.8],
  garageDoor: [7, 0, GAR.z1 + 0.6],
  meterPillar: [9.7, 1.3, 6.4],
  utilityPole: [13.2, 0, 9.6],
  presenterSpot: [3.6, 0, 6.2],
  lawnCenter: [-3.5, 0, 6],
};

export const SOLAR_HOUSE_CABLES: Record<string, Vec3[]> = {
  // array → down the garage-side parapet → into the garage (inverter inside)
  "pv-to-inverter": [
    [PV.cx + 3.2, PV.y - 0.2, PV.cz],
    [GF.x1 - 0.3, ROOF_Y + 0.1, -2.5],
    [GF.x1 + 0.08, ROOF_Y - 0.4, -2.5],
    [GF.x1 + 0.08, GF.y0 + GF.h + 0.2, -2.5],
    [GAR.x0 + 0.6, GF.y0 + GF.h + 0.05, -2.5],
  ],
  // utility pole → meter pillar → underground → garage service area
  "grid-to-house": [
    [13.2, 7.0, 9.6],
    [11.4, 4.0, 8.0],
    [9.7, 1.75, 6.45],
    [9.7, 0.6, 6.45],
    [9.0, 0.05, 5.4],
    [8.4, 0.05, 3.3],
  ],
};

/** Depth of the visible room behind each glazed façade. */
const RECESS = 1.7;

function Glazing({ x0, x1, y0, h, z, glow, mullion = 1.2, door }: { x0: number; x1: number; y0: number; h: number; z: number; glow: number; mullion?: number; door?: [number, number] }) {
  const w = x1 - x0;
  const n = Math.max(1, Math.round(w / mullion));
  const cx = (x0 + x1) / 2;
  return (
    <group>
      {/* the room behind the glass: floor, ceiling, side walls and a warm back wall */}
      <mesh position={[cx, y0 + 0.01, z - RECESS / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, RECESS]} />
        <meshStandardMaterial color="#9C7356" roughness={0.8} emissive="#5A3A22" emissiveIntensity={glow * 0.4} />
      </mesh>
      <mesh position={[cx, y0 + h - 0.01, z - RECESS / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, RECESS]} />
        <meshStandardMaterial color="#EFE6D8" roughness={0.9} emissive="#FFD9A8" emissiveIntensity={glow * 0.6} />
      </mesh>
      {[x0, x1].map((x, i) => (
        <mesh key={i} position={[x, y0 + h / 2, z - RECESS / 2]} rotation={[0, i ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <planeGeometry args={[RECESS, h]} />
          <meshStandardMaterial color="#E9DDCB" roughness={0.9} emissive="#FFC98A" emissiveIntensity={glow * 0.45} />
        </mesh>
      ))}
      <mesh position={[cx, y0 + h / 2, z - RECESS + 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={C.interior} emissive={C.interior} emissiveIntensity={0.08 + glow * 0.9} roughness={0.9} />
      </mesh>
      {[0.25, 0.6].map((f, i) => (
        <mesh key={i} position={[x0 + w * f, y0 + 0.35, z - 1.1]}>
          <boxGeometry args={[w * 0.22, 0.55, 0.7]} />
          <meshStandardMaterial color={i ? "#8A6A4E" : "#CFC3B6"} roughness={0.9} flatShading />
        </mesh>
      ))}
      {glow > 0.05 && <pointLight position={[cx, y0 + h - 0.4, z - 0.6]} color="#FFB867" intensity={glow * 7} distance={8} decay={1.6} />}
      <mesh position={[(x0 + x1) / 2, y0 + h / 2, z]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={C.glassDay} transparent opacity={0.35 - glow * 0.15} roughness={0.08} metalness={0.4} emissive="#FFB867" emissiveIntensity={glow * 0.12} />
      </mesh>
      {Array.from({ length: n + 1 }, (_, i) => (
        <mesh key={i} position={[x0 + (i * w) / n, y0 + h / 2, z + 0.02]} castShadow>
          <boxGeometry args={[0.06, h, 0.08]} />
          <meshStandardMaterial color={C.frame} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[(x0 + x1) / 2, y0 + h - 0.03, z + 0.02]}>
        <boxGeometry args={[w, 0.07, 0.09]} />
        <meshStandardMaterial color={C.frame} roughness={0.5} />
      </mesh>
      {door && (
        <mesh position={[(door[0] + door[1]) / 2, y0 + (h - 0.2) / 2, z + 0.04]} castShadow>
          <boxGeometry args={[door[1] - door[0], h - 0.2, 0.06]} />
          <meshStandardMaterial color="#2E2A27" roughness={0.6} flatShading />
        </mesh>
      )}
    </group>
  );
}

function Box({ size, position, color, roughness = 0.92 }: { size: [number, number, number]; position: Vec3; color: string; roughness?: number }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} flatShading />
    </mesh>
  );
}

/** Board-formed concrete: thin horizontal reveal lines on a wall face. */
function Reveals({ x0, x1, y0, h, z, spacing = 0.45 }: { x0: number; x1: number; y0: number; h: number; z: number; spacing?: number }) {
  const lines = Math.floor(h / spacing);
  return (
    <group>
      {Array.from({ length: lines }, (_, i) => (
        <mesh key={i} position={[(x0 + x1) / 2, y0 + (i + 1) * spacing, z]}>
          <boxGeometry args={[x1 - x0, 0.012, 0.01]} />
          <meshStandardMaterial color={C.concreteDark} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export interface SolarHouseProps {
  interiorGlow: number;
  energy: EnergyState;
  pvGeneration: number;
  /** 0–1 garden light glow (evening/night). */
  gardenLights: number;
  frame: number;
}

export function ModernSolarHouse({ interiorGlow, energy, pvGeneration, gardenLights }: SolarHouseProps) {
  const glow = interiorGlow;
  const pvRowsZ = [PV.cz - 1.0, PV.cz + 0.75];
  return (
    <group>
      {/* ground, road, pavements */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[70, 28]} />
        <meshStandardMaterial color={C.lawn} roughness={1} flatShading />
      </mesh>
      <Box size={[60, 0.03, 4]} position={[0, 0.015, 11.5]} color={C.road} />
      <Box size={[60, 0.08, 1.4]} position={[0, 0.04, 8.9]} color="#D7D3CB" />
      {/* driveway to garage + stepping-stone path to the steps */}
      <Box size={[4, 0.05, 6]} position={[7, 0.025, 6]} color={C.paving} />
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} size={[1.6, 0.05, 0.7]} position={[0.2, 0.025, 4.5 + i * 0.95]} color={C.paving} />
      ))}
      {/* plinth + front steps */}
      <Box size={[GF.x1 - GF.x0 + 0.8, GF.y0, GF.z1 - GF.z0 + 1.6]} position={[0, GF.y0 / 2, (GF.z0 + GF.z1) / 2 + 0.6]} color={C.step} />
      {[0, 1, 2].map((i) => (
        <Box key={i} size={[3.6 - i * 0.3, 0.12, 0.42]} position={[0.2, 0.06 + i * 0.12, GF.z1 + 1.95 - i * 0.38]} color={C.step} />
      ))}

      {/* ground floor */}
      {/* ground floor: solid back block + piers framing the recessed glass room (x −3.8…3.3) */}
      <Box size={[GF.x1 - GF.x0, GF.h, GF.z1 - RECESS - GF.z0]} position={[(GF.x0 + GF.x1) / 2, GF.y0 + GF.h / 2, (GF.z0 + GF.z1 - RECESS) / 2]} color={C.concrete} />
      <Box size={[-3.8 - GF.x0, GF.h, RECESS]} position={[(GF.x0 - 3.8) / 2, GF.y0 + GF.h / 2, GF.z1 - RECESS / 2]} color={C.concrete} />
      <Box size={[GF.x1 - 3.3, GF.h, RECESS]} position={[(GF.x1 + 3.3) / 2, GF.y0 + GF.h / 2, GF.z1 - RECESS / 2]} color={C.concrete} />
      <Box size={[7.1, 0.25, RECESS]} position={[-0.25, GF.y0 + GF.h - 0.125, GF.z1 - RECESS / 2]} color={C.concrete} />
      <Reveals x0={GF.x0} x1={-3.9} y0={GF.y0} h={GF.h} z={GF.z1 + 0.006} />
      <Reveals x0={3.4} x1={GF.x1} y0={GF.y0} h={GF.h} z={GF.z1 + 0.006} />
      <Glazing x0={-3.8} x1={3.3} y0={GF.y0} h={GF.h - 0.25} z={GF.z1 + 0.01} glow={glow} door={[0.2, 1.2]} />
      {/* white cantilevered terrace slab with planters */}
      <Box size={[GF.x1 - GF.x0 + 0.4, 0.32, GF.z1 - UF.z1 + 0.6]} position={[(GF.x0 + GF.x1) / 2, GF.y0 + GF.h + 0.16, (UF.z1 + GF.z1) / 2 + 0.3]} color={C.render} />
      <Planter position={[-2.6, GF.y0 + GF.h + 0.32, GF.z1 + 0.25]} length={4.2} seed={3} />
      <Planter position={[2.6, GF.y0 + GF.h + 0.32, GF.z1 + 0.25]} length={3.2} seed={7} />

      {/* upper floor: stone-clad block with full glazing */}
      <Box size={[UF.x1 - UF.x0, UF.h, UF.z1 - RECESS - UF.z0]} position={[(UF.x0 + UF.x1) / 2, UF.y0 + UF.h / 2, (UF.z0 + UF.z1 - RECESS) / 2]} color={C.stone} />
      <Box size={[-3.6 - UF.x0, UF.h, RECESS]} position={[(UF.x0 - 3.6) / 2, UF.y0 + UF.h / 2, UF.z1 - RECESS / 2]} color={C.stone} />
      <Box size={[UF.x1 - 1.9, UF.h, RECESS]} position={[(UF.x1 + 1.9) / 2, UF.y0 + UF.h / 2, UF.z1 - RECESS / 2]} color={C.stone} />
      <Box size={[5.5, 0.3, RECESS]} position={[-0.85, UF.y0 + UF.h - 0.15, UF.z1 - RECESS / 2]} color={C.stone} />
      <Reveals x0={UF.x0} x1={UF.x1} y0={UF.y0} h={UF.h} z={UF.z1 + 0.006} spacing={0.35} />
      <Glazing x0={-3.6} x1={1.9} y0={UF.y0} h={UF.h - 0.3} z={UF.z1 + 0.01} glow={glow * 0.85} mullion={1.4} />
      <Box size={[0.9, 2.2, 0.06]} position={[UF.x1 + 0.03, UF.y0 + 1.3, -1.5]} color={C.frame} />
      {/* roof slab + parapet */}
      <Box size={[UF.x1 - UF.x0 + 0.5, 0.22, UF.z1 - UF.z0 + 0.5]} position={[(UF.x0 + UF.x1) / 2, ROOF_Y + 0.11, (UF.z0 + UF.z1) / 2]} color={C.render} />
      <Box size={[GF.x1 - UF.x1, 0.1, UF.z1 - UF.z0]} position={[(UF.x1 + GF.x1) / 2, GF.y0 + GF.h + 0.36, (UF.z0 + UF.z1) / 2]} color={C.roof} />

      {/* tilted PV array on racks (flat roof) */}
      {pvRowsZ.map((z, r) => (
        <group key={r} position={[PV.cx, ROOF_Y + 0.55 + (r === 0 ? 0.15 : 0), z]}>
          {Array.from({ length: PV.cols }, (_, c) => (
            <SolarPanel key={c} position={[(c - (PV.cols - 1) / 2) * 1.08, 0, 0]} rotation={[PV.tilt, 0, 0]} generation={pvGeneration} scale={1} />
          ))}
          {[-3, 3].map((x) => (
            <group key={x}>
              <Box size={[0.06, 0.55, 0.06]} position={[x, -0.25, -0.6]} color="#8D96A3" />
              <Box size={[0.06, 0.22, 0.06]} position={[x, -0.42, 0.6]} color="#8D96A3" />
            </group>
          ))}
        </group>
      ))}

      {/* garage / service wing */}
      <Box size={[GAR.x1 - GAR.x0, GAR.h, GAR.z1 - GAR.z0]} position={[(GAR.x0 + GAR.x1) / 2, GF.y0 + GAR.h / 2 - 0.36, (GAR.z0 + GAR.z1) / 2]} color={C.concreteDark} />
      <Box size={[GAR.x1 - GAR.x0 + 0.3, 0.2, GAR.z1 - GAR.z0 + 0.3]} position={[(GAR.x0 + GAR.x1) / 2, GAR.h + 0.1, (GAR.z0 + GAR.z1) / 2]} color={C.render} />
      {/* slatted garage door */}
      {Array.from({ length: 8 }, (_, i) => (
        <Box key={i} size={[3.2, 0.3, 0.06]} position={[7, 0.2 + i * 0.32, GAR.z1 + 0.03]} color={i % 2 ? C.garageDoor : "#AEB3BA"} roughness={0.7} />
      ))}
      <mesh position={[7, 2.85, GAR.z1 + 0.08]}>
        <boxGeometry args={[2.6, 0.05, 0.05]} />
        <meshStandardMaterial color="#FFE2A8" emissive="#FFB867" emissiveIntensity={gardenLights * 2.5} toneMapped={false} />
      </mesh>

      {/* boundary wall with the utility meter pillar (separate, accessible) */}
      <Box size={[0.45, 1.6, 0.45]} position={[9.7, 0.8, 6.2]} color={C.concrete} />
      <UtilityMeter position={[9.7, 1.25, 6.45]} importing={energy.flows["grid-to-house"].active} exporting={energy.flows["inverter-to-grid"].active} powered={energy.gridConnected} />
      <Box size={[6.2, 0.9, 0.22]} position={[-3.2, 0.45, 8.0]} color={C.render} />
      <Box size={[0.22, 0.9, 1.8]} position={[9.7, 0.45, 7.3]} color={C.render} />

      {/* utility pole */}
      <group position={[13.2, 0, 9.6]}>
        <mesh position={[0, 3.7, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.17, 7.4, 6]} />
          <meshStandardMaterial color="#A3A7AD" roughness={0.9} flatShading />
        </mesh>
        <Box size={[1.8, 0.12, 0.12]} position={[0, 6.9, 0]} color="#6F737A" />
      </group>

      {/* landscaping */}
      <Palm position={[-6.6, 0, 3.4]} seed={3} height={5.4} />
      <Palm position={[-7.4, 0, -1.8]} seed={8} height={6.2} />
      <Palm position={[10.5, 0, -2.6]} seed={13} height={5} />
      <CanopyTree position={[-9, 0, -6]} seed={2} height={6} spread={3} />
      <CanopyTree position={[4, 0, -8]} seed={5} height={6.5} spread={3.2} />
      <CanopyTree position={[13, 0, -4]} seed={9} height={5.5} spread={2.6} />
      {Array.from({ length: 9 }, (_, i) => (
        <GrassTuft key={i} position={[-4.8 + i * 0.55, 0.36, GF.z1 + 1.15 + rand(31, i) * 0.3]} seed={40 + i} height={0.7 + rand(32, i) * 0.4} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <GrassTuft key={`r${i}`} position={[2.6 + i * 0.4, 0.36, GF.z1 + 1.3 + rand(33, i) * 0.3]} seed={60 + i} height={0.6 + rand(34, i) * 0.4} />
      ))}
      <Shrub position={[-5.6, 0, 5.4]} seed={21} scale={1.3} />
      <Shrub position={[-1.6, 0, 6.4]} seed={22} scale={0.9} />
      <Shrub position={[4.2, 0, 7.4]} seed={23} scale={1.1} />
      <Shrub position={[-7.5, 0, 6.8]} seed={24} scale={1.4} />
      <PottedPlant position={[-0.9, GF.y0, GF.z1 + 0.6]} seed={4} height={1.2} />
      <PottedPlant position={[1.9, GF.y0, GF.z1 + 0.6]} seed={6} height={1.0} />
      {[-1.4, 1.8].map((x, i) => (
        <Bollard key={i} position={[x, 0, 5.2 + i * 1.6]} glow={gardenLights} />
      ))}
      <Bollard position={[5.2, 0, 4.4]} glow={gardenLights} />
      <Bollard position={[5.2, 0, 7.6]} glow={gardenLights} />
      {/* background neighbours (silhouettes) */}
      {[
        [-16, -10, 7, 6],
        [17, -8, 8, 5],
        [-2, -18, 10, 7],
      ].map(([x, z, w, h], i) => (
        <Box key={i} size={[w!, h!, 6]} position={[x!, h! / 2, z!]} color={i % 2 ? "#CBC6BC" : "#D6D1C8"} />
      ))}
    </group>
  );
}
