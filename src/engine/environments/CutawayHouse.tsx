/**
 * ENV — Energy cutaway house (Phase 3): an isometric "dollhouse" section of a
 * two-storey Thai home for explaining energy flows (board 02 §06, board 04 §06).
 * Front (+Z) is cut open; rooms, appliances and the garage service area are
 * visible together with the roof PV array, meter pillar and utility pole.
 *
 * Every appliance's on/off state is DERIVED from the electrical scenario:
 *   - normal circuits run when house circuits are powered (energy.housePower)
 *   - appliances listed in options.backupLoads run during an outage only if
 *     the backup supply is active (energy.backupPower)
 * Options:
 *   system: "on-grid" | "hybrid"   battery: boolean (hybrid only)
 *   backupLoads: string[]          default ["fridge", "light-living", "fan"]
 *   clouds: boolean                drifting clouds (visual only)
 * Simplified educational model — not a wiring or installation diagram.
 */
import { RoundedBox } from "@react-three/drei";
import { EQUIPMENT_INDICATOR_COLORS } from "../../config/energy-flow";
import { rand } from "../animation/core";
import { SolarPanel } from "../equipment/Solar";
import { BatteryStack, DistributionBoard, UtilityMeter, WallInverter } from "../equipment/Electrical";
import type { EnergyState } from "../energy-flow/scenario";
import type { Vec3 } from "../../schemas/episode";
import { CanopyTree, Palm, Shrub } from "./nature";

const H = { x0: -4.5, x1: 4.5, z0: -3, z1: 3, floor: 2.8, slab: 0.15 };
const G = { x0: 4.5, x1: 8.2 }; // garage wing (ground floor only)
const UP = H.slab + H.floor + H.slab; // upper floor level
const ROOF = UP + H.floor;
const C = {
  wall: "#EFE6D8",
  wallIn: "#E7DCCB",
  cut: "#3A5486",
  floor: "#B88A62",
  floor2: "#C29A72",
  garageFloor: "#A9ADB3",
  roof: "#D9D5CC",
  wood: "#8C5E3C",
  sofa: "#D9CFC4",
};

export type ApplianceKind = "light" | "ac" | "tv" | "fridge" | "fan" | "rice-cooker" | "washer" | "laptop";

interface Appliance {
  id: string;
  kind: ApplianceKind;
  label: string;
  position: Vec3;
  rotationY?: number;
}

/** Appliance layout (ids are referenced by options.backupLoads and cable routes). */
export const CUTAWAY_APPLIANCES: Appliance[] = [
  { id: "light-living", kind: "light", label: "Living-room light", position: [-2.2, H.slab + H.floor - 0.05, -0.6] },
  { id: "tv", kind: "tv", label: "TV", position: [-4.38, H.slab + 1.25, -0.8], rotationY: Math.PI / 2 },
  { id: "ac-living", kind: "ac", label: "Living-room AC", position: [-4.36, H.slab + 2.3, -0.8], rotationY: Math.PI / 2 },
  { id: "fridge", kind: "fridge", label: "Refrigerator", position: [3.7, H.slab, -2.45] },
  { id: "rice-cooker", kind: "rice-cooker", label: "Rice cooker", position: [2.2, H.slab + 0.92, -2.6] },
  { id: "light-kitchen", kind: "light", label: "Kitchen light", position: [2.4, H.slab + H.floor - 0.05, -0.6] },
  { id: "washer", kind: "washer", label: "Washing machine", position: [1.2, H.slab, -2.55] },
  { id: "light-bedroom", kind: "light", label: "Bedroom light", position: [-2.2, UP + H.floor - 0.05, -0.6] },
  { id: "ac-bedroom", kind: "ac", label: "Bedroom AC", position: [-4.36, UP + 2.25, -1.4], rotationY: Math.PI / 2 },
  { id: "fan", kind: "fan", label: "Fan", position: [1.6, UP, -1.6] },
  { id: "laptop", kind: "laptop", label: "Laptop", position: [3.2, UP + 0.78, -2.5] },
  { id: "light-study", kind: "light", label: "Study light", position: [2.4, UP + H.floor - 0.05, -0.6] },
];

const DEFAULT_BACKUP = ["fridge", "light-living", "fan"];

const EQUIP = {
  inverter: [5.4, H.slab + 1.6, H.z0 + 0.2] as Vec3,
  battery: [6.35, H.slab, H.z0 + 0.3] as Vec3,
  db: [7.4, H.slab + 1.55, H.z0 + 0.17] as Vec3,
  backup: [7.4, H.slab + 0.95, H.z0 + 0.16] as Vec3,
  meter: [9.3, 1.3, 2.6] as Vec3,
  pole: [10.8, 0, 4.6] as Vec3,
};

export const CUTAWAY_ANCHORS: Record<string, Vec3> = {
  houseCenter: [1.6, 2.6, 0],
  roofArray: [0, ROOF + 0.6, -0.8],
  livingRoom: [-2.2, 1.0, -0.6],
  kitchen: [2.4, 1.0, -1.2],
  bedroom: [-2.2, UP + 1.0, -1.0],
  garageEquipment: [6.4, 1.4, -2.6],
  inverter: EQUIP.inverter,
  battery: [EQUIP.battery[0], 0.6, EQUIP.battery[2]],
  distributionBoard: EQUIP.db,
  meter: EQUIP.meter,
  utilityPole: [EQUIP.pole[0], 6.5, EQUIP.pole[2]],
  presenterSpot: [6.0, 0, -0.6],
  frontYard: [2.0, 0, 4.6],
  ...Object.fromEntries(CUTAWAY_APPLIANCES.map((a) => [a.id, a.position])),
};

// ---------------------------------------------------------------- cable routes
const z = H.z0 + 0.12; // along the inside of the back wall
const ceilG = H.slab + H.floor - 0.15;
/** Route from a board to an appliance along the back wall / ceiling. */
function loadRoute(from: Vec3, a: Appliance): Vec3[] {
  const upper = a.position[1] > UP - 0.1;
  const run = upper ? UP + H.floor - 0.15 : ceilG;
  const dropZ = a.kind === "light" ? a.position[2] : z;
  return [
    [from[0], from[1] + 0.2, z],
    [from[0], upper ? ceilG : run, z],
    ...(upper ? ([[4.3, ceilG, z], [4.3, run, z]] as Vec3[]) : []),
    [a.position[0], run, z],
    [a.position[0], run, dropZ],
    [a.position[0], a.kind === "light" ? a.position[1] + 0.02 : a.position[1] + 0.3, a.kind === "light" ? a.position[2] : a.position[2] + 0.05],
  ];
}

export function cutawayCables(options: Record<string, unknown>): Record<string, Vec3[]> {
  const hybrid = options.system === "hybrid";
  const battery = hybrid && options.battery === true;
  const backupSet = new Set((options.backupLoads as string[] | undefined) ?? DEFAULT_BACKUP);
  const inv = EQUIP.inverter;
  const db = EQUIP.db;
  const routes: Record<string, Vec3[]> = {
    "pv-to-inverter": [
      [2.2, ROOF + 0.5, -0.6],
      [4.4, ROOF + 0.15, -1.6],
      [4.65, ROOF - 0.2, z],
      [4.65, H.slab + H.floor + 0.05, z],
      [inv[0] - 0.12, H.slab + H.floor - 0.1, z + 0.05],
      [inv[0] - 0.12, inv[1] + 0.32, z + 0.05],
    ],
    "inverter-to-house": [
      [inv[0] + 0.12, inv[1] - 0.32, z + 0.05],
      [inv[0] + 0.12, H.slab + 0.8, z + 0.05],
      [db[0] - 0.15, H.slab + 0.8, z + 0.05],
      [db[0] - 0.15, db[1] - 0.2, z + 0.05],
    ],
    "grid-to-house": [
      [EQUIP.pole[0], 7.0, EQUIP.pole[2]],
      [9.9, 3.6, 3.6],
      [EQUIP.meter[0], 1.75, EQUIP.meter[2] - 0.05],
      [EQUIP.meter[0], 0.4, EQUIP.meter[2] - 0.05],
      [8.6, 0.1, 0.5],
      [G.x1 - 0.1, H.slab + 2.4, z + 0.3],
      [db[0] + 0.1, H.slab + 2.4, z + 0.05],
      [db[0] + 0.1, db[1] + 0.2, z + 0.05],
    ],
  };
  routes["inverter-to-grid"] = [...routes["grid-to-house"]!].reverse();
  if (hybrid) {
    routes["inverter-to-backup"] = [
      [inv[0] + 0.2, inv[1] - 0.32, z + 0.05],
      [inv[0] + 0.2, H.slab + 0.62, z + 0.05],
      [EQUIP.backup[0] - 0.1, H.slab + 0.62, z + 0.05],
      [EQUIP.backup[0] - 0.1, EQUIP.backup[1] - 0.1, z + 0.05],
    ];
    if (battery) {
      routes["inverter-to-battery"] = [
        [inv[0], inv[1] - 0.32, z + 0.05],
        [inv[0], H.slab + 1.05, z + 0.05],
        [EQUIP.battery[0], H.slab + 1.05, z + 0.08],
      ];
      routes["battery-to-inverter"] = [...routes["inverter-to-battery"]!].reverse();
    }
  }
  // household consumption (white): normal circuits from the DB; backup loads from the backup board during outages
  for (const a of CUTAWAY_APPLIANCES) {
    routes[`load:house:${a.id}`] = loadRoute(db, a);
    if (hybrid && backupSet.has(a.id)) routes[`load:backup:${a.id}`] = loadRoute(EQUIP.backup, a);
  }
  return routes;
}

/** Is an appliance powered under this energy state? */
export function appliancePowered(a: Pick<Appliance, "id">, energy: { housePower: number; backupPower: number }, options: Record<string, unknown>): number {
  const backupSet = new Set((options.backupLoads as string[] | undefined) ?? DEFAULT_BACKUP);
  const onBackup = options.system === "hybrid" && backupSet.has(a.id);
  return Math.max(energy.housePower, onBackup ? energy.backupPower : 0);
}

// ---------------------------------------------------------------- props
const M = ({ color, ei = 0, emissive, roughness = 0.85 }: { color: string; ei?: number; emissive?: string; roughness?: number }) => (
  <meshStandardMaterial color={color} roughness={roughness} flatShading emissive={emissive ?? "#000000"} emissiveIntensity={ei} />
);
function Box({ size, position, color, rotation }: { size: [number, number, number]; position: Vec3; color: string; rotation?: Vec3 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <M color={color} />
    </mesh>
  );
}

function ApplianceModel({ a, on, frame, backup, night = 0 }: { a: Appliance; on: number; frame: number; backup: boolean; night?: number }) {
  const glow = on;
  const badge = backup ? (
    // small green "backup circuit" tag (educational marker)
    <mesh position={[0, a.kind === "light" ? -0.25 : 0.05, 0.35]}>
      <circleGeometry args={[0.05, 10]} />
      <meshBasicMaterial color={EQUIPMENT_INDICATOR_COLORS.inverterAC} toneMapped={false} />
    </mesh>
  ) : null;
  let body: React.ReactNode = null;
  switch (a.kind) {
    case "light":
      body = (
        <group>
          <mesh>
            <cylinderGeometry args={[0.22, 0.26, 0.06, 12]} />
            <meshStandardMaterial color="#FFF1D6" emissive="#FFD08A" emissiveIntensity={glow * 2.6} toneMapped={false} />
          </mesh>
          {glow > 0.02 && <pointLight position={[0, -0.3, 0]} color="#FFC98A" intensity={glow * (4 + 14 * night)} distance={4.2 + 3 * night} decay={1.5} />}
        </group>
      );
      break;
    case "ac":
      body = (
        <group>
          <RoundedBox args={[0.9, 0.28, 0.2]} radius={0.05} smoothness={2} castShadow>
            <M color="#F5F6F7" roughness={0.5} />
          </RoundedBox>
          <mesh position={[0.33, 0.05, 0.102]}>
            <circleGeometry args={[0.012, 8]} />
            <meshBasicMaterial color={glow > 0.5 ? EQUIPMENT_INDICATOR_COLORS.appliance : "#3A3F48"} toneMapped={false} />
          </mesh>
          {glow > 0.05 &&
            [0, 1, 2].map((i) => {
              const t = ((frame / 30) * 0.6 + i / 3) % 1;
              return (
                <mesh key={i} position={[(i - 1) * 0.22, -0.2 - t * 0.45, 0.16 + t * 0.3]} rotation={[0.9, 0, 0]}>
                  <planeGeometry args={[0.16, 0.02]} />
                  <meshBasicMaterial color="#DDF2FF" transparent opacity={glow * 0.5 * (1 - t)} depthWrite={false} />
                </mesh>
              );
            })}
        </group>
      );
      break;
    case "tv":
      body = (
        <group>
          <Box size={[1.3, 0.75, 0.05]} position={[0, 0, 0]} color="#16181D" />
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[1.22, 0.68]} />
            <meshStandardMaterial color={glow > 0.05 ? "#3D6FA8" : "#0D0F13"} emissive="#7FB0E8" emissiveIntensity={glow * 0.9} />
          </mesh>
        </group>
      );
      break;
    case "fridge":
      body = (
        <group>
          <RoundedBox args={[0.75, 1.8, 0.7]} radius={0.05} smoothness={2} position={[0, 0.9, 0]} castShadow receiveShadow>
            <M color="#E9ECEF" roughness={0.45} />
          </RoundedBox>
          <Box size={[0.73, 0.02, 0.02]} position={[0, 1.2, 0.36]} color="#B9BFC6" />
          <mesh position={[0.2, 1.5, 0.357]}>
            <planeGeometry args={[0.12, 0.05]} />
            <meshBasicMaterial color={glow > 0.5 ? "#7FD7FF" : "#2F3640"} toneMapped={false} />
          </mesh>
        </group>
      );
      break;
    case "fan":
      body = (
        <group>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.18, 0.2, 0.04, 10]} />
            <M color="#E8EAED" />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1, 6]} />
            <M color="#C9CDD3" />
          </mesh>
          <group position={[0, 1.05, 0.05]} rotation={[0, 0, glow > 0.05 ? (frame * 0.9) % (Math.PI * 2) : 0.3]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} position={[0, 0, 0]}>
                <boxGeometry args={[0.06, 0.34, 0.01]} />
                <meshStandardMaterial color="#9CC7E8" transparent opacity={glow > 0.05 ? 0.55 : 0.9} />
              </mesh>
            ))}
          </group>
          <mesh position={[0, 1.05, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.36, 0.01, 4, 20]} />
            <M color="#C9CDD3" />
          </mesh>
        </group>
      );
      break;
    case "rice-cooker":
      body = (
        <group>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.15, 0.24, 12]} />
            <M color="#F2F2EF" />
          </mesh>
          <mesh position={[0, 0.1, 0.155]}>
            <circleGeometry args={[0.015, 8]} />
            <meshBasicMaterial color={glow > 0.5 ? "#FF9F43" : "#3A3F48"} toneMapped={false} />
          </mesh>
        </group>
      );
      break;
    case "washer":
      body = (
        <group>
          <RoundedBox args={[0.6, 0.85, 0.6]} radius={0.04} smoothness={2} position={[0, 0.43, 0]} castShadow>
            <M color="#F1F2F4" />
          </RoundedBox>
          <mesh position={[0, 0.45, 0.305]}>
            <circleGeometry args={[0.18, 16]} />
            <meshStandardMaterial color="#5C7FA8" emissive="#7FB0E8" emissiveIntensity={glow * 0.3} />
          </mesh>
        </group>
      );
      break;
    case "laptop":
      body = (
        <group>
          <Box size={[0.36, 0.02, 0.25]} position={[0, 0, 0]} color="#3A3F48" />
          <mesh position={[0, 0.12, -0.12]} rotation={[-0.25, 0, 0]}>
            <boxGeometry args={[0.36, 0.24, 0.01]} />
            <meshStandardMaterial color="#1D2533" emissive="#7FB0E8" emissiveIntensity={glow * 0.7} />
          </mesh>
        </group>
      );
      break;
  }
  return (
    <group position={a.position} rotation={[0, a.rotationY ?? 0, 0]}>
      {body}
      {badge}
    </group>
  );
}

/** Red warning marker (grid outage). Red is reserved for faults/warnings. */
function OutageMarker({ position, frame }: { position: Vec3; frame: number }) {
  const pulse = 0.75 + 0.25 * Math.sin(frame * 0.25);
  return (
    <group position={position} scale={pulse}>
      <mesh>
        <torusGeometry args={[0.38, 0.06, 6, 24]} />
        <meshBasicMaterial color={EQUIPMENT_INDICATOR_COLORS.fault} toneMapped={false} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} rotation={[0, 0, (s * Math.PI) / 4]}>
          <boxGeometry args={[0.6, 0.09, 0.05]} />
          <meshBasicMaterial color={EQUIPMENT_INDICATOR_COLORS.fault} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Clouds({ frame, cover }: { frame: number; cover: number }) {
  return (
    <group>
      {[0, 1, 2].map((i) => {
        const x = -14 + (((frame * 0.03 + i * 9 + rand(91, i) * 4) % 30) + 30) % 30;
        return (
          <group key={i} position={[x, 13 + rand(92, i) * 2, -6 - i * 3]}>
            {[0, 1, 2, 3].map((k) => (
              <mesh key={k} position={[k * 1.1 - 1.6, rand(93, i * 4 + k) * 0.6, 0]} scale={[1.4, 0.8, 1]}>
                <icosahedronGeometry args={[1 + rand(94, i * 4 + k) * 0.6, 1]} />
                <meshStandardMaterial color="#F4F6FA" roughness={1} flatShading transparent opacity={0.85 * cover} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

export interface CutawayProps {
  frame: number;
  energy: EnergyState;
  housePower: number;
  backupPower: number;
  pvGeneration: number;
  options: Record<string, unknown>;
  /** Environment state: per-appliance switch (0/1, keyed by appliance id, default 1), dbDoor (0–1), clouds (0–1). */
  state: Record<string, number>;
  /** 0–1: how dark it is outside (lighting.interiorGlow); powered room lights carry the scene at night. */
  night?: number;
}

export function CutawayHouse({ frame, energy, housePower, backupPower, pvGeneration, options, state, night = 0 }: CutawayProps) {
  const hybrid = options.system === "hybrid";
  const battery = hybrid && options.battery === true;
  const backupSet = new Set((options.backupLoads as string[] | undefined) ?? DEFAULT_BACKUP);
  const f = energy.flows;
  const invOut = Math.min(1, (f["inverter-to-house"].kw + f["inverter-to-backup"].kw + f["inverter-to-grid"].kw) / 5);
  const W = H.x1 - H.x0;
  const D = H.z1 - H.z0;
  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[40, 24]} />
        <meshStandardMaterial color="#5E9447" roughness={1} flatShading />
      </mesh>
      <Box size={[22, 0.03, 3]} position={[2, 0.015, 7.2]} color="#545A66" />
      <Box size={[W + G.x1 - G.x0 + 0.6, H.slab, D + 0.6]} position={[(H.x0 + G.x1) / 2, H.slab / 2, 0]} color="#CFCBC3" />

      {/* floors */}
      {[H.slab + 0.005, UP + 0.005].map((y, i) => (
        <mesh key={y} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
          <planeGeometry args={[W, D]} />
          <M color={i ? C.floor2 : C.floor} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(G.x0 + G.x1) / 2, H.slab + 0.005, 0]} receiveShadow>
        <planeGeometry args={[G.x1 - G.x0, D]} />
        <M color={C.garageFloor} />
      </mesh>
      {/* upper slab with cut edge */}
      <Box size={[W, H.slab, D]} position={[0, UP - H.slab / 2, 0]} color={C.wall} />
      <Box size={[W, H.slab, 0.04]} position={[0, UP - H.slab / 2, H.z1 + 0.02]} color={C.cut} />
      {/* back + left walls (front and right are cut away) */}
      <Box size={[W + G.x1 - G.x0, H.floor, 0.18]} position={[(H.x0 + G.x1) / 2, H.slab + H.floor / 2, H.z0]} color={C.wallIn} />
      <Box size={[W, H.floor, 0.18]} position={[0, UP + H.floor / 2, H.z0]} color={C.wallIn} />
      <Box size={[0.18, H.floor * 2 + H.slab, D]} position={[H.x0, H.slab + H.floor + H.slab / 2, 0]} color={C.wall} />
      {/* partitions with door gaps */}
      <Box size={[0.12, H.floor, D * 0.55]} position={[0.5, H.slab + H.floor / 2, H.z0 + D * 0.275]} color={C.wall} />
      <Box size={[0.12, H.floor, D * 0.55]} position={[0.5, UP + H.floor / 2, H.z0 + D * 0.275]} color={C.wall} />
      <Box size={[0.14, H.floor, D]} position={[H.x1, H.slab + H.floor / 2, 0]} color={C.wall} />
      {/* section cut accents on wall tops */}
      <Box size={[0.2, 0.04, D]} position={[H.x0, ROOF + 0.02, 0]} color={C.cut} />
      {/* roof slab + PV array (tilted on racks) */}
      <Box size={[W + 0.4, 0.2, D + 0.4]} position={[0, ROOF + 0.1, 0]} color={C.roof} />
      {[-1.2, 0.6].map((zz, r) => (
        <group key={r} position={[0, ROOF + 0.55 + (r ? 0 : 0.12), zz]}>
          {Array.from({ length: 6 }, (_, c) => (
            <SolarPanel key={c} position={[(c - 2.5) * 1.1, 0, 0]} rotation={[0.3, 0, 0]} generation={pvGeneration} />
          ))}
        </group>
      ))}
      {/* garage: roof cut away so the service equipment stays visible; a thin beam marks the roofline */}
      <Box size={[G.x1 - G.x0, 0.12, 0.16]} position={[(G.x0 + G.x1) / 2, H.slab + H.floor + 0.06, H.z0 + 0.08]} color={C.cut} />

      {/* furniture (simple) */}
      <RoundedBox args={[2.1, 0.45, 0.85]} radius={0.08} smoothness={2} position={[-2.2, H.slab + 0.3, -2.3]} castShadow>
        <M color={C.sofa} />
      </RoundedBox>
      <RoundedBox args={[2.1, 0.5, 0.22]} radius={0.08} smoothness={2} position={[-2.2, H.slab + 0.7, -2.65]} castShadow>
        <M color={C.sofa} />
      </RoundedBox>
      <Box size={[1.0, 0.06, 0.55]} position={[-2.2, H.slab + 0.42, -1.2]} color={C.wood} />
      <Box size={[0.5, 0.5, 2.0]} position={[-4.15, H.slab + 0.25, -0.8]} color="#B5835A" />
      <Box size={[2.6, 0.9, 0.6]} position={[2.2, H.slab + 0.45, -2.6]} color="#D8CFC2" />
      <Box size={[2.6, 0.05, 0.62]} position={[2.2, H.slab + 0.92, -2.6]} color="#8C8A86" />
      <Box size={[1.8, 0.45, 2.0]} position={[-2.6, UP + 0.25, -1.7]} color="#E6E1EA" />
      <Box size={[1.8, 0.15, 0.6]} position={[-2.6, UP + 0.55, -2.55]} color="#F4F1F6" />
      <Box size={[1.4, 0.75, 0.6]} position={[3.2, UP + 0.38, -2.55]} color={C.wood} />

      {/* appliances, powered from the electrical scenario */}
      {CUTAWAY_APPLIANCES.map((a) => (
        <ApplianceModel key={a.id} a={a} frame={frame} on={appliancePowered(a, { housePower, backupPower }, options) * (state[a.id] ?? 1)} backup={hybrid && backupSet.has(a.id)} night={night} />
      ))}

      {/* garage service area */}
      <WallInverter position={EQUIP.inverter} variant={hybrid ? "hybrid" : "on-grid"} mode={energy.inverterMode} output={invOut} frame={frame} />
      {battery && <BatteryStack position={EQUIP.battery} modules={3} stateOfCharge={0.7} charging={f["inverter-to-battery"].active} discharging={f["battery-to-inverter"].active} />}
      <DistributionBoard position={EQUIP.db} doorOpen={state.dbDoor ?? 0.9} powered={housePower > 0.5 || backupPower > 0.5} />
      {hybrid && (
        <group position={EQUIP.backup}>
          <RoundedBox args={[0.3, 0.24, 0.1]} radius={0.012} smoothness={1} castShadow>
            <M color="#E9EBEE" />
          </RoundedBox>
          <mesh position={[0, 0.07, 0.052]}>
            <planeGeometry args={[0.22, 0.04]} />
            <meshBasicMaterial color={backupPower > 0.5 ? EQUIPMENT_INDICATOR_COLORS.inverterAC : "#4A505C"} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* meter pillar, pole, outage marker */}
      <Box size={[0.45, 1.6, 0.45]} position={[EQUIP.meter[0], 0.8, EQUIP.meter[2] - 0.25]} color="#D9D5CC" />
      <UtilityMeter position={EQUIP.meter} importing={f["grid-to-house"].active} exporting={f["inverter-to-grid"].active} powered={energy.gridConnected} />
      <group position={EQUIP.pole}>
        <mesh position={[0, 3.6, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 7.2, 6]} />
          <M color="#A3A7AD" />
        </mesh>
        <Box size={[1.6, 0.12, 0.12]} position={[0, 6.9, 0]} color="#6F737A" />
      </group>
      {!energy.gridConnected && <OutageMarker position={[EQUIP.pole[0], 7.9, EQUIP.pole[2]]} frame={frame} />}

      {/* landscaping */}
      <Palm position={[-6.4, 0, 1.8]} seed={5} height={5} />
      <CanopyTree position={[-7, 0, -5]} seed={3} height={6} spread={2.8} />
      <CanopyTree position={[9.5, 0, -5]} seed={7} height={5.5} spread={2.5} />
      <Shrub position={[-5.6, 0, 3.6]} seed={31} scale={1.2} />
      <Shrub position={[3.8, 0, 3.9]} seed={32} />
      {(state.clouds ?? 0) > 0.01 && <Clouds frame={frame} cover={state.clouds ?? 0} />}
    </group>
  );
}
