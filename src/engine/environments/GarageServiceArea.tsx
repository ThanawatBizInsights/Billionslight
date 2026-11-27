/**
 * ENV03 — Garage & electrical service area (Phase 2 default storytelling
 * location for equipment; after board 05 "ENV03"/"ENV05" and board 04 §07).
 *
 * Configurable (scene environment options):
 *   system:    "on-grid" | "hybrid"        (default "on-grid")
 *   battery:   boolean  (only shown for hybrid; default false)
 *   evCharger: boolean  (default false)
 *   car:       boolean  (default false)
 * The garage is a storytelling location, not an installation recommendation:
 * real placement follows manufacturer requirements, standards, ventilation,
 * clearances and professional installation guidance.
 *
 * Equipment wall is the back wall (z = −3.0). Front (+Z) is the open garage door.
 */
import { RoundedBox } from "@react-three/drei";
import { BatteryStack, DistributionBoard, ElectricCar, EVCharger, LightSwitch, WallInverter, WallSocket } from "../equipment/Electrical";
import type { EnergyState } from "../energy-flow/scenario";
import type { Vec3 } from "../../schemas/episode";

const G = { x0: -3.2, x1: 3.2, z0: -3.0, z1: 3.4, h: 3.0 };
const WALL_Z = G.z0 + 0.08;

export const GARAGE_LAYOUT = {
  inverter: [-1.35, 1.55, WALL_Z + 0.09] as Vec3,
  battery: [-0.35, 0, WALL_Z + 0.16] as Vec3,
  distributionBoard: [0.95, 1.5, WALL_Z + 0.07] as Vec3,
  backupBoard: [0.95, 0.95, WALL_Z + 0.06] as Vec3,
  evCharger: [2.35, 1.2, WALL_Z + 0.07] as Vec3,
  gridEntry: [G.x1 - 0.1, 2.6, -1.8] as Vec3,
};

export const GARAGE_ANCHORS: Record<string, Vec3> = {
  inverter: GARAGE_LAYOUT.inverter,
  battery: [GARAGE_LAYOUT.battery[0], 0.6, GARAGE_LAYOUT.battery[2]],
  distributionBoard: GARAGE_LAYOUT.distributionBoard,
  evCharger: GARAGE_LAYOUT.evCharger,
  presenterSpot: [0.3, 0, -1.4],
  guestSpot: [1.6, 0, -0.6],
  equipmentWallCenter: [0, 1.4, G.z0],
};

/** Cable routes along the equipment wall (energy-flow particles follow these). */
export function garageCables(hybrid: boolean, battery: boolean): Record<string, Vec3[]> {
  const inv = GARAGE_LAYOUT.inverter;
  const db = GARAGE_LAYOUT.distributionBoard;
  const z = WALL_Z + 0.16;
  const routes: Record<string, Vec3[]> = {
    // DC from the roof array drops through a ceiling conduit
    "pv-to-inverter": [
      [inv[0] - 0.12, G.h - 0.05, z],
      [inv[0] - 0.12, inv[1] + 0.55, z],
      [inv[0] - 0.12, inv[1] + 0.32, z],
    ],
    // inverter AC output → distribution board (household circuits)
    "inverter-to-house": [
      [inv[0] + 0.12, inv[1] - 0.36, z],
      [inv[0] + 0.12, 0.75, z],
      [db[0] - 0.15, 0.75, z],
      [db[0] - 0.15, db[1] - 0.22, z],
    ],
    // utility supply enters high on the side wall → distribution board
    "grid-to-house": [
      [G.x1 - 0.1, 2.6, -1.8],
      [G.x1 - 0.2, 2.6, z],
      [db[0] + 0.1, 2.6, z],
      [db[0] + 0.1, db[1] + 0.22, z],
    ],
  };
  routes["inverter-to-grid"] = [...routes["grid-to-house"]!].reverse();
  if (hybrid) {
    routes["inverter-to-backup"] = [
      [inv[0] + 0.2, inv[1] - 0.36, z],
      [inv[0] + 0.2, 0.62, z],
      [GARAGE_LAYOUT.backupBoard[0] - 0.12, 0.62, z],
      [GARAGE_LAYOUT.backupBoard[0] - 0.12, GARAGE_LAYOUT.backupBoard[1] - 0.12, z],
    ];
    if (battery) {
      const b = GARAGE_LAYOUT.battery;
      routes["inverter-to-battery"] = [
        [inv[0], inv[1] - 0.36, z],
        [inv[0], 1.05, z],
        [b[0], 1.05, z],
      ];
      routes["battery-to-inverter"] = [...routes["inverter-to-battery"]!].reverse();
    }
  }
  return routes;
}

const M = ({ color, roughness = 0.9 }: { color: string; roughness?: number }) => <meshStandardMaterial color={color} roughness={roughness} flatShading />;
function Box({ size, position, color, roughness }: { size: [number, number, number]; position: Vec3; color: string; roughness?: number }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <M color={color} roughness={roughness} />
    </mesh>
  );
}

/** Grey conduit run between points (decorative; energy paths draw on top). */
function Conduit({ points }: { points: Vec3[] }) {
  return (
    <group>
      {points.slice(1).map((p, i) => {
        const a = points[i]!;
        const len = Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]);
        const vertical = Math.abs(p[1] - a[1]) > Math.abs(p[0] - a[0]);
        return (
          <mesh key={i} position={[(a[0] + p[0]) / 2, (a[1] + p[1]) / 2, (a[2] + p[2]) / 2 - 0.03]} rotation={vertical ? [0, 0, 0] : [0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, len, 6]} />
            <M color="#9BA2AC" roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

export interface GarageProps {
  energy: EnergyState;
  options: Record<string, unknown>;
  lights: number;
  frame: number;
}

export function GarageServiceArea({ energy, options, lights, frame }: GarageProps) {
  const hybrid = options.system === "hybrid";
  const battery = hybrid && options.battery === true;
  const ev = options.evCharger === true;
  const car = options.car === true;
  const f = energy.flows;
  const invOut = Math.min(1, (f["inverter-to-house"].kw + f["inverter-to-backup"].kw + f["inverter-to-grid"].kw) / 5);
  const cables = garageCables(hybrid, battery);
  return (
    <group>
      {/* floor (sealed concrete), walls, ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (G.z0 + G.z1) / 2 + 2]} receiveShadow>
        <planeGeometry args={[G.x1 - G.x0 + 6, G.z1 - G.z0 + 8]} />
        <M color="#A9ADB3" roughness={0.7} />
      </mesh>
      <Box size={[G.x1 - G.x0, G.h, 0.16]} position={[0, G.h / 2, G.z0]} color="#E7E4DD" />
      <Box size={[0.16, G.h, G.z1 - G.z0]} position={[G.x0, G.h / 2, (G.z0 + G.z1) / 2]} color="#E1DDD5" />
      <Box size={[0.16, G.h, G.z1 - G.z0]} position={[G.x1, G.h / 2, (G.z0 + G.z1) / 2]} color="#E1DDD5" />
      <Box size={[G.x1 - G.x0, 0.12, G.z1 - G.z0]} position={[0, G.h + 0.06, (G.z0 + G.z1) / 2]} color="#F1EEE8" />
      {/* equipment zone: painted floor area + light-grey wall panel behind equipment */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, G.z0 + 0.7]}>
        <planeGeometry args={[4.6, 1.2]} />
        <M color="#8F959D" />
      </mesh>
      <Box size={[4.6, 2.3, 0.02]} position={[0.1, 1.35, WALL_Z - 0.02]} color="#F4F3F0" />
      {/* garage door (rolled up) */}
      <Box size={[G.x1 - G.x0, 0.45, 0.4]} position={[0, G.h - 0.22, G.z1 - 0.1]} color="#B9BDC4" />

      {/* conduits (decorative) */}
      {Object.entries(cables)
        .filter(([k]) => !k.startsWith("battery-to") && k !== "inverter-to-grid")
        .map(([k, pts]) => (
          <Conduit key={k} points={pts} />
        ))}
      {/* cable tray along the top of the equipment wall */}
      <Box size={[4.6, 0.06, 0.25]} position={[0.1, 2.6, WALL_Z + 0.14]} color="#B3B9C2" />

      {/* equipment */}
      <WallInverter position={GARAGE_LAYOUT.inverter} variant={hybrid ? "hybrid" : "on-grid"} mode={energy.inverterMode} output={invOut} frame={frame} />
      {battery && (
        <BatteryStack position={GARAGE_LAYOUT.battery} modules={3} charging={f["inverter-to-battery"].active} discharging={f["battery-to-inverter"].active} stateOfCharge={0.75} />
      )}
      <DistributionBoard position={GARAGE_LAYOUT.distributionBoard} doorOpen={0.85} powered={energy.houseLoadsPowered || energy.backupLoadsPowered} />
      {hybrid && (
        <group position={GARAGE_LAYOUT.backupBoard}>
          <RoundedBox args={[0.3, 0.24, 0.1]} radius={0.012} smoothness={1} castShadow>
            <M color="#E9EBEE" />
          </RoundedBox>
          <mesh position={[0, 0.07, 0.052]}>
            <planeGeometry args={[0.22, 0.04]} />
            <meshBasicMaterial color={energy.backupLoadsPowered ? "#3DDC84" : "#4A505C"} toneMapped={false} />
          </mesh>
        </group>
      )}
      {ev && <EVCharger position={GARAGE_LAYOUT.evCharger} frame={frame} charging={false} />}
      {car && <ElectricCar position={[0.6, 0, 1.4]} rotation={[0, Math.PI, 0]} />}
      <LightSwitch position={[G.x0 + 0.09, 1.2, 1.8]} rotation={[0, Math.PI / 2, 0]} on={lights > 0.5} />
      <WallSocket position={[2.0, 0.35, WALL_Z + 0.02]} />

      {/* shelving on the left wall */}
      <group position={[G.x0 + 0.3, 0, 0.6]}>
        {[0.5, 1.1, 1.7].map((y) => (
          <Box key={y} size={[0.4, 0.04, 1.6]} position={[0, y, 0]} color="#8C6A4E" />
        ))}
        {[-0.75, 0.75].map((z) => (
          <Box key={z} size={[0.04, 1.8, 0.04]} position={[0.18, 0.9, z]} color="#5B5F66" />
        ))}
        {[
          [0.55, -0.4, "#D9A441"],
          [0.55, 0.3, "#6B8FB5"],
          [1.15, -0.1, "#C2C6CC"],
          [1.75, 0.4, "#9C6B4A"],
        ].map(([y, z, c], i) => (
          <Box key={i} size={[0.3, 0.26, 0.36]} position={[0, (y as number) + 0.15, z as number]} color={c as string} />
        ))}
      </group>

      {/* LED batten lights */}
      {[-1.2, 1.2].map((x) => (
        <group key={x} position={[x, G.h - 0.03, 0]}>
          <mesh>
            <boxGeometry args={[0.12, 0.04, 2.2]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFF6E5" emissiveIntensity={lights * 2.5} toneMapped={false} />
          </mesh>
          {lights > 0.02 && <pointLight position={[0, -0.25, 0]} color="#FFF3E0" intensity={lights * 6} distance={6} decay={1.6} />}
        </group>
      ))}
      {/* safety note plate (generic) */}
      <Box size={[0.3, 0.2, 0.01]} position={[-2.3, 1.55, WALL_Z + 0.01]} color="#FBBF24" />
    </group>
  );
}
