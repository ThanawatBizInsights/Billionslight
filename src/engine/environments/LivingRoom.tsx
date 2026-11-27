/**
 * ENV02 — Living room (Phase 2), after board 02 §07, board 04 §09 and board 05
 * "ENV02". Cream walls, natural wood, warm practical lights, tropical garden
 * through a large window. The front (+Z) is open for the camera (cutaway).
 *
 * Driven by state (0–1 numbers, from the scene's environment state track or
 * the electrical scenario):
 *   power   — household circuits energised (lights/TV/AC can run)
 *   lights  — ceiling + lamp switched on
 *   tv      — TV screen on
 *   ac      — air conditioner running
 *   daylight— how bright the window/garden view is (0 night … 1 day)
 * Room: x −3.2…3.2, z −2.6…2.4, ceiling 2.8 m. Units metres.
 */
import { EQUIPMENT_INDICATOR_COLORS } from "../../config/energy-flow";
import { RoundedBox } from "@react-three/drei";
import { rand } from "../animation/core";
import { LightSwitch, WallSocket } from "../equipment/Electrical";
import { PottedPlant, Palm, Shrub } from "./nature";
import type { Vec3 } from "../../schemas/episode";

const ROOM = { x0: -3.2, x1: 3.2, z0: -2.6, z1: 2.4, h: 2.8 };
const C = {
  wall: "#EFE6D8",
  wallShade: "#E5DACA",
  accentWall: "#C9B79F",
  floor: "#B88A62",
  floorAlt: "#AD7F58",
  skirting: "#F6F1E8",
  wood: "#8C5E3C",
  woodLight: "#B5835A",
  sofa: "#D9CFC4",
  sofaShade: "#CBBFB2",
  cushion: "#E3A93C",
  cushion2: "#5C7FA8",
  rug: "#C9C0B4",
  metal: "#2F3238",
};

export const LIVING_ROOM_ANCHORS: Record<string, Vec3> = {
  sofaSeatLeft: [-1.25, 0, -0.95],
  sofaSeatCenter: [-0.55, 0, -0.95],
  sofaSeatRight: [0.15, 0, -0.95],
  standBesideTable: [1.45, 0, 0.55],
  coffeeTable: [-0.5, 0.45, 0.25],
  tv: [3.05, 1.3, -0.3],
  airConditioner: [3.05, 2.35, -0.3],
  floorLamp: [1.1, 1.6, -2.15],
  window: [-1.6, 1.5, ROOM.z0],
  lightSwitch: [2.2, 1.2, ROOM.z0 + 0.01],
  socket: [2.6, 0.3, ROOM.z0 + 0.01],
};

const M = ({ color, roughness = 0.88, emissive, ei = 0 }: { color: string; roughness?: number; emissive?: string; ei?: number }) => (
  <meshStandardMaterial color={color} roughness={roughness} flatShading emissive={emissive ?? "#000000"} emissiveIntensity={ei} />
);

function Box({ size, position, color, rotation, roughness }: { size: [number, number, number]; position: Vec3; color: string; rotation?: Vec3; roughness?: number }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <M color={color} roughness={roughness} />
    </mesh>
  );
}

function Sofa({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <RoundedBox args={[2.3, 0.42, 0.95]} radius={0.08} smoothness={2} position={[0, 0.25, 0]} castShadow receiveShadow>
        <M color={C.sofaShade} />
      </RoundedBox>
      {[-0.72, 0, 0.72].map((x) => (
        <RoundedBox key={x} args={[0.7, 0.16, 0.78]} radius={0.06} smoothness={2} position={[x, 0.5, 0.06]} castShadow receiveShadow>
          <M color={C.sofa} />
        </RoundedBox>
      ))}
      <RoundedBox args={[2.3, 0.55, 0.24]} radius={0.08} smoothness={2} position={[0, 0.72, -0.36]} castShadow receiveShadow>
        <M color={C.sofa} />
      </RoundedBox>
      {[-1.12, 1.12].map((x) => (
        <RoundedBox key={x} args={[0.2, 0.62, 0.95]} radius={0.07} smoothness={2} position={[x, 0.42, 0]} castShadow receiveShadow>
          <M color={C.sofaShade} />
        </RoundedBox>
      ))}
      {/* cushions */}
      <RoundedBox args={[0.42, 0.4, 0.14]} radius={0.07} smoothness={2} position={[-0.8, 0.78, -0.2]} rotation={[-0.25, 0.15, 0.1]} castShadow>
        <M color={C.cushion} />
      </RoundedBox>
      <RoundedBox args={[0.4, 0.38, 0.14]} radius={0.07} smoothness={2} position={[0.82, 0.77, -0.2]} rotation={[-0.25, -0.2, -0.08]} castShadow>
        <M color={C.cushion2} />
      </RoundedBox>
      {/* short wooden legs */}
      {[
        [-1.05, -0.38],
        [1.05, -0.38],
        [-1.05, 0.38],
        [1.05, 0.38],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} size={[0.06, 0.06, 0.06]} position={[x!, 0.03, z!]} color={C.wood} />
      ))}
    </group>
  );
}

/** Wall-mounted split air conditioner; `running` 0–1 shows LED + louvre + soft air streaks. */
function AirConditioner({ position, rotationY, running, frame }: { position: Vec3; rotationY: number; running: number; frame: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.95, 0.3, 0.22]} radius={0.06} smoothness={2} castShadow>
        <M color="#F5F6F7" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, -0.1, 0.1]} rotation={[0.5 * running + 0.1, 0, 0]}>
        <boxGeometry args={[0.8, 0.03, 0.06]} />
        <M color="#E1E4E8" />
      </mesh>
      <mesh position={[0.36, 0.06, 0.112]}>
        <circleGeometry args={[0.01, 8]} />
        <meshBasicMaterial color={running > 0.5 ? EQUIPMENT_INDICATOR_COLORS.appliance : "#3A3F48"} toneMapped={false} />
      </mesh>
      {running > 0.05 &&
        [0, 1, 2].map((i) => {
          const t = ((frame / 30) * 0.6 + i / 3) % 1;
          return (
            <mesh key={i} position={[(i - 1) * 0.25, -0.2 - t * 0.5, 0.18 + t * 0.35]} rotation={[0.9, 0, 0]}>
              <planeGeometry args={[0.18, 0.02]} />
              <meshBasicMaterial color="#DDF2FF" transparent opacity={running * 0.45 * (1 - t)} depthWrite={false} />
            </mesh>
          );
        })}
    </group>
  );
}

function Television({ position, rotationY, on, frame }: { position: Vec3; rotationY: number; on: number; frame: number }) {
  // gentle, deterministic colour drift on screen when on
  const hue = 0.55 + 0.05 * Math.sin(frame * 0.05);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.45, 0.84, 0.05]} radius={0.015} smoothness={1} castShadow>
        <M color="#16181D" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[1.38, 0.77]} />
        <meshStandardMaterial color={on > 0.05 ? `hsl(${hue * 360}, 45%, 45%)` : "#0D0F13"} emissive={`hsl(${hue * 360}, 60%, 55%)`} emissiveIntensity={on * 0.9} roughness={0.2} />
      </mesh>
      {on > 0.05 && <pointLight position={[0, 0, 0.6]} color="#9CC7FF" intensity={on * 1.2} distance={3.5} decay={2} />}
    </group>
  );
}

function FloorLamp({ position, on }: { position: Vec3; on: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.04, 10]} />
        <M color={C.metal} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 1.5, 6]} />
        <M color={C.metal} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 0.32, 10, 1, true]} />
        <meshStandardMaterial color="#F3E7D2" emissive="#FFC27A" emissiveIntensity={0.2 + on * 1.6} side={2} roughness={0.9} flatShading />
      </mesh>
      {on > 0.02 && <pointLight position={[0, 1.45, 0]} color="#FFB867" intensity={on * 5} distance={5} decay={1.8} />}
    </group>
  );
}

function CeilingLight({ position, on }: { position: Vec3; on: number }) {
  return (
    <group position={position}>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.6, 4]} />
        <M color={C.metal} />
      </mesh>
      <mesh position={[0, -0.65, 0]} castShadow>
        <coneGeometry args={[0.26, 0.2, 10, 1, true]} />
        <meshStandardMaterial color="#2E3138" roughness={0.6} side={2} flatShading />
      </mesh>
      <mesh position={[0, -0.72, 0]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#FFF1D6" emissive="#FFD08A" emissiveIntensity={on * 3} toneMapped={false} />
      </mesh>
      {on > 0.02 && <pointLight position={[0, -0.85, 0]} color="#FFC98A" intensity={on * 7} distance={6.5} decay={1.6} />}
    </group>
  );
}

/** Garden view beyond the window (tinted by daylight). */
function GardenView({ daylight }: { daylight: number }) {
  const sky = daylight > 0.5 ? "#BFE0F5" : daylight > 0.15 ? "#3A5486" : "#121C36";
  return (
    <group position={[-1.6, 0, ROOM.z0 - 2.2]}>
      <mesh position={[0, 2.5, -2.5]}>
        <planeGeometry args={[12, 7]} />
        <meshBasicMaterial color={sky} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color={daylight > 0.3 ? "#5E9447" : "#1F3324"} roughness={1} />
      </mesh>
      <Palm position={[-1.6, 0, -1.2]} seed={41} height={3.4} />
      <Palm position={[1.9, 0, -2.0]} seed={42} height={4.2} />
      <Shrub position={[0.2, 0, -0.6]} seed={43} scale={1.4} />
      <Shrub position={[-2.8, 0, -0.4]} seed={44} scale={1.1} />
    </group>
  );
}

export interface LivingRoomState {
  power: number;
  lights: number;
  tv: number;
  ac: number;
  daylight: number;
}

export function LivingRoom({ state, frame }: { state: LivingRoomState; frame: number }) {
  const on = (v: number) => v * state.power;
  const lights = on(state.lights);
  const planks = 14;
  return (
    <group>
      {/* floor planks */}
      {Array.from({ length: planks }, (_, i) => (
        <mesh key={i} position={[ROOM.x0 + (i + 0.5) * ((ROOM.x1 - ROOM.x0) / planks), 0, (ROOM.z0 + ROOM.z1) / 2 + 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[(ROOM.x1 - ROOM.x0) / planks - 0.006, ROOM.z1 - ROOM.z0 + 2]} />
          <M color={i % 3 === 0 ? C.floorAlt : C.floor} roughness={0.75} />
        </mesh>
      ))}
      {/* walls: back (with window opening), left, right; ceiling */}
      <Box size={[1.4, ROOM.h, 0.15]} position={[-2.5, ROOM.h / 2, ROOM.z0]} color={C.wall} />
      <Box size={[2.6, 0.55, 0.15]} position={[-1.5, 0.275, ROOM.z0]} color={C.wall} />
      <Box size={[2.6, 0.35, 0.15]} position={[-1.5, ROOM.h - 0.175, ROOM.z0]} color={C.wall} />
      <Box size={[3.4, ROOM.h, 0.15]} position={[1.5, ROOM.h / 2, ROOM.z0]} color={C.wallShade} />
      {/* timber accent slats on the back wall right half */}
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} size={[0.07, ROOM.h - 0.5, 0.04]} position={[0.2 + i * 0.12, ROOM.h / 2 + 0.05, ROOM.z0 + 0.09]} color={i % 2 ? C.woodLight : C.wood} />
      ))}
      <Box size={[0.15, ROOM.h, ROOM.z1 - ROOM.z0]} position={[ROOM.x0, ROOM.h / 2, (ROOM.z0 + ROOM.z1) / 2]} color={C.wall} />
      <Box size={[0.15, ROOM.h, ROOM.z1 - ROOM.z0]} position={[ROOM.x1, ROOM.h / 2, (ROOM.z0 + ROOM.z1) / 2]} color={C.wall} />
      <Box size={[ROOM.x1 - ROOM.x0, 0.12, ROOM.z1 - ROOM.z0]} position={[0, ROOM.h + 0.06, (ROOM.z0 + ROOM.z1) / 2]} color="#F6F1E8" />
      <Box size={[ROOM.x1 - ROOM.x0, 0.08, 0.03]} position={[0, 0.04, ROOM.z0 + 0.09]} color={C.skirting} />

      {/* window: frame, mullions, sill, curtains */}
      <group position={[-1.5, 0, ROOM.z0]}>
        {[-1.3, 0, 1.3].map((x) => (
          <Box key={x} size={[0.06, ROOM.h - 0.9, 0.1]} position={[x, 0.55 + (ROOM.h - 0.9) / 2, 0]} color="#2B2C30" />
        ))}
        <Box size={[2.66, 0.06, 0.1]} position={[0, 0.55, 0]} color="#2B2C30" />
        <Box size={[2.66, 0.06, 0.1]} position={[0, ROOM.h - 0.35, 0]} color="#2B2C30" />
        <mesh position={[0, 1.5, 0]}>
          <planeGeometry args={[2.6, ROOM.h - 0.9]} />
          <meshStandardMaterial color="#A9CBE6" transparent opacity={0.12} roughness={0.05} />
        </mesh>
        {[-1.55, 1.55].map((x) => (
          <mesh key={x} position={[x, 1.42, 0.14]} castShadow>
            <boxGeometry args={[0.4, ROOM.h - 0.25, 0.08]} />
            <M color="#E8DCC8" />
          </mesh>
        ))}
      </group>
      <GardenView daylight={state.daylight} />

      {/* TV wall (right): console, TV, AC */}
      <Box size={[0.42, 0.45, 2.2]} position={[ROOM.x1 - 0.3, 0.225, -0.3]} color={C.woodLight} />
      <Box size={[0.44, 0.04, 2.22]} position={[ROOM.x1 - 0.3, 0.47, -0.3]} color={C.wood} />
      <Television position={[ROOM.x1 - 0.1, 1.3, -0.3]} rotationY={-Math.PI / 2} on={on(state.tv)} frame={frame} />
      <AirConditioner position={[ROOM.x1 - 0.13, 2.35, -0.3]} rotationY={-Math.PI / 2} running={on(state.ac)} frame={frame} />
      <PottedPlant position={[ROOM.x1 - 0.4, 0.49, 0.6]} seed={11} height={0.5} />
      <WallSocket position={[ROOM.x1 - 0.08, 0.32, 0.7]} rotation={[0, -Math.PI / 2, 0]} />

      {/* seating */}
      <Sofa position={[-0.55, 0, -1.6]} />
      <RoundedBox args={[1.2, 0.08, 0.65]} radius={0.03} smoothness={1} position={[-0.5, 0.42, 0.25]} castShadow receiveShadow>
        <M color={C.woodLight} />
      </RoundedBox>
      {[
        [-1.0, 0.0],
        [0.0, 0.0],
        [-1.0, 0.5],
        [0.0, 0.5],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} size={[0.06, 0.38, 0.06]} position={[x!, 0.19, z!]} color={C.wood} />
      ))}
      {/* coffee table props: mugs + book */}
      <mesh position={[-0.75, 0.5, 0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.036, 0.09, 8]} />
        <M color="#F2F2EF" />
      </mesh>
      <Box size={[0.28, 0.04, 0.2]} position={[-0.25, 0.48, 0.15]} rotation={[0, 0.3, 0]} color="#3B5B8C" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, 0.005, -0.2]} receiveShadow>
        <planeGeometry args={[3.2, 2.4]} />
        <M color={C.rug} roughness={1} />
      </mesh>
      <FloorLamp position={[1.1, 0, -2.15]} on={lights} />
      <Box size={[0.42, 0.5, 0.42]} position={[1.1, 0.25, -1.55]} color={C.woodLight} />
      <PottedPlant position={[-2.6, 0, -2.1]} seed={13} height={1.1} />
      <PottedPlant position={[2.4, 0, -2.1]} seed={12} height={1.4} />
      {Array.from({ length: 3 }, (_, i) => (
        <Box key={i} size={[0.5, 0.36, 0.03]} position={[0.9 + i * 0.62, 1.75 + rand(77, i) * 0.12, ROOM.z0 + 0.13]} color={["#C9A26B", "#7E9BB8", "#B87A5A"][i]!} />
      ))}

      {/* ceiling lights */}
      <CeilingLight position={[-0.5, ROOM.h, -0.4]} on={lights} />
      {[1.6, -2.2].map((x) => (
        <group key={x} position={[x, ROOM.h - 0.01, 0.6]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.07, 10]} />
            <meshStandardMaterial color="#FFF1D6" emissive="#FFD08A" emissiveIntensity={lights * 3} toneMapped={false} side={2} />
          </mesh>
          {lights > 0.02 && <pointLight position={[0, -0.25, 0]} color="#FFD3A0" intensity={lights * 3.5} distance={4} decay={1.6} />}
        </group>
      ))}
      <LightSwitch position={[2.2, 1.2, ROOM.z0 + 0.085]} on={state.lights > 0.5} />
      <WallSocket position={[2.6, 0.3, ROOM.z0 + 0.085]} />
    </group>
  );
}
