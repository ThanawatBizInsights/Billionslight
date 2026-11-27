/**
 * Modular electrical equipment (Phase 2 style, boards 02/06): rounded matte
 * housings, small dark displays, status LEDs. Every component is placeable
 * anywhere (garage, exterior service wall, equipment room, demo studio) and
 * driven by state props — never by its own clock.
 *
 * Simplified educational models: generic shapes, no vendor branding, not
 * installation or wiring guidance.
 */
import { RoundedBox } from "@react-three/drei";
import type { ReactNode } from "react";
import { ENERGY_COLORS } from "../../config/palette";
import type { InverterMode } from "../energy-flow/scenario";

type V3 = [number, number, number];
export interface PlaceProps {
  position?: V3;
  rotation?: V3;
  scale?: number;
  visible?: boolean;
}
const Place = ({ position, rotation, scale, visible = true, children }: PlaceProps & { children: ReactNode }) => (
  <group position={position} rotation={rotation} scale={scale} visible={visible}>
    {children}
  </group>
);

const Matte = ({ color, roughness = 0.75 }: { color: string; roughness?: number }) => <meshStandardMaterial color={color} roughness={roughness} metalness={0.05} flatShading />;
const Lit = ({ color, intensity = 1 }: { color: string; intensity?: number }) => (
  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} roughness={0.4} toneMapped={false} />
);

const LED_COLOR: Record<InverterMode, string> = {
  off: "#39404C",
  standby: "#E0B341",
  "grid-tied": ENERGY_COLORS.battery,
  backup: ENERGY_COLORS.battery,
  fault: ENERGY_COLORS.fault,
};

/** Wall-mounted inverter. variant decides the face detail; output 0–1 lights the bars. */
export function WallInverter({ variant = "on-grid", mode = "grid-tied", output = 0, frame = 0, ...p }: PlaceProps & { variant?: "on-grid" | "hybrid"; mode?: InverterMode; output?: number; frame?: number }) {
  const h = variant === "hybrid" ? 0.62 : 0.52;
  const w = variant === "hybrid" ? 0.46 : 0.4;
  const led = LED_COLOR[mode];
  const blink = mode === "fault" ? (Math.floor(frame / 8) % 2 === 0 ? 1.4 : 0.15) : 1;
  return (
    <Place {...p}>
      {/* wall bracket */}
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[w * 0.8, h * 0.9, 0.02]} />
        <Matte color="#8E96A3" />
      </mesh>
      <RoundedBox args={[w, h, 0.17]} radius={0.035} smoothness={2} castShadow receiveShadow>
        <Matte color="#F1F2F4" roughness={0.6} />
      </RoundedBox>
      {/* display */}
      <RoundedBox args={[w * 0.48, 0.07, 0.01]} radius={0.01} smoothness={1} position={[0, h * 0.12, 0.087]}>
        <meshStandardMaterial color="#1B2230" roughness={0.3} emissive="#3A7BD5" emissiveIntensity={mode === "off" ? 0 : 0.25} />
      </RoundedBox>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-w * 0.15 + i * w * 0.1, h * 0.12, 0.094]}>
          <planeGeometry args={[w * 0.06, 0.03]} />
          <meshBasicMaterial color={output > i / 4 + 0.01 ? ENERGY_COLORS.solar : "#2C3444"} toneMapped={false} />
        </mesh>
      ))}
      {/* status LED */}
      <mesh position={[w * 0.32, h * 0.12, 0.09]}>
        <circleGeometry args={[0.012, 10]} />
        <meshBasicMaterial color={led} transparent opacity={blink > 1 ? 1 : blink} toneMapped={false} />
      </mesh>
      {variant === "hybrid" && (
        <mesh position={[0, -h * 0.18, 0.088]}>
          <planeGeometry args={[w * 0.6, 0.006]} />
          <meshBasicMaterial color={ENERGY_COLORS.battery} toneMapped={false} />
        </mesh>
      )}
      {/* cable glands */}
      {[-0.12, -0.04, 0.04, 0.12].map((x) => (
        <mesh key={x} position={[x * (w / 0.4), -h / 2 - 0.02, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.04, 6]} />
          <Matte color="#2D3138" />
        </mesh>
      ))}
    </Place>
  );
}

/** Floor-standing stacked battery modules with state-of-charge bars. */
export function BatteryStack({ modules = 3, stateOfCharge = 0.8, charging = false, discharging = false, ...p }: PlaceProps & { modules?: number; stateOfCharge?: number; charging?: boolean; discharging?: boolean }) {
  const mh = 0.3;
  const lit = Math.round(stateOfCharge * 5);
  const active = charging || discharging;
  return (
    <Place {...p}>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[0.6, 0.06, 0.28]} />
        <Matte color="#5A6272" />
      </mesh>
      {Array.from({ length: modules }, (_, i) => (
        <RoundedBox key={i} args={[0.58, mh - 0.012, 0.26]} radius={0.025} smoothness={2} position={[0, 0.06 + mh / 2 + i * mh, 0]} castShadow receiveShadow>
          <Matte color={i === modules - 1 ? "#F1F2F4" : "#E6E8EC"} roughness={0.6} />
        </RoundedBox>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0.2, 0.06 + modules * mh - 0.12 + i * 0.018, 0.131]}>
          <planeGeometry args={[0.07, 0.01]} />
          <meshBasicMaterial color={i < lit ? (active ? ENERGY_COLORS.battery : "#7FBF9A") : "#3A4252"} toneMapped={false} />
        </mesh>
      ))}
    </Place>
  );
}

/** Distribution board (consumer unit) with a row of breakers; door optionally open. */
export function DistributionBoard({ breakers = 8, tripped = [] as number[], doorOpen = 1, powered = true, ...p }: PlaceProps & { breakers?: number; tripped?: number[]; doorOpen?: number; powered?: boolean }) {
  const w = 0.5;
  const h = 0.4;
  return (
    <Place {...p}>
      <RoundedBox args={[w, h, 0.12]} radius={0.015} smoothness={1} castShadow receiveShadow>
        <Matte color="#ECEDEF" />
      </RoundedBox>
      <mesh position={[0, 0.02, 0.061]}>
        <planeGeometry args={[w - 0.06, 0.14]} />
        <Matte color="#C9CDD3" />
      </mesh>
      {Array.from({ length: breakers }, (_, i) => {
        const x = -w / 2 + 0.06 + i * ((w - 0.12) / (breakers - 1));
        const off = tripped.includes(i) || !powered;
        return (
          <group key={i} position={[x, 0.02, 0.065]}>
            <mesh>
              <boxGeometry args={[0.04, 0.11, 0.03]} />
              <Matte color={i === 0 ? "#3B4A66" : "#F4F4F4"} />
            </mesh>
            <mesh position={[0, off ? -0.02 : 0.02, 0.018]}>
              <boxGeometry args={[0.016, 0.03, 0.012]} />
              <Matte color={tripped.includes(i) ? ENERGY_COLORS.fault : "#2A2F3A"} />
            </mesh>
          </group>
        );
      })}
      {/* door hinged on the left */}
      <group position={[-w / 2, 0, 0.065]} rotation={[0, -doorOpen * 1.9, 0]}>
        <mesh position={[w / 2, 0, 0.005]} castShadow>
          <boxGeometry args={[w, h, 0.012]} />
          <meshStandardMaterial color="#F4F5F7" roughness={0.5} transparent opacity={0.92} flatShading />
        </mesh>
      </group>
    </Place>
  );
}

/** EV wallbox charger with ring LED and holstered cable. */
export function EVCharger({ charging = false, frame = 0, ...p }: PlaceProps & { charging?: boolean; frame?: number }) {
  const pulse = charging ? 0.6 + 0.4 * Math.sin(frame * 0.15) : 0.25;
  return (
    <Place {...p}>
      <RoundedBox args={[0.26, 0.38, 0.12]} radius={0.04} smoothness={2} castShadow>
        <Matte color="#F4F5F7" roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.24, 0.01]} radius={0.03} smoothness={1} position={[0, 0.02, 0.062]}>
        <meshStandardMaterial color="#242A36" roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.05, 0.069]}>
        <torusGeometry args={[0.04, 0.006, 6, 20]} />
        <meshBasicMaterial color={charging ? ENERGY_COLORS.battery : "#4DA3FF"} transparent opacity={pulse} toneMapped={false} />
      </mesh>
      {/* holster + coiled cable */}
      <mesh position={[0.17, -0.05, 0.02]}>
        <boxGeometry args={[0.05, 0.12, 0.06]} />
        <Matte color="#2D3138" />
      </mesh>
      <mesh position={[0.17, -0.3, 0.06]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.1, 0.012, 5, 14]} />
        <Matte color="#20242C" />
      </mesh>
    </Place>
  );
}

/** Utility electricity meter in a small weatherproof cabinet (for a boundary wall / pillar). */
export function UtilityMeter({ importing = false, exporting = false, powered = true, ...p }: PlaceProps & { importing?: boolean; exporting?: boolean; powered?: boolean }) {
  return (
    <Place {...p}>
      <RoundedBox args={[0.34, 0.46, 0.18]} radius={0.02} smoothness={1} castShadow>
        <Matte color="#9AA6B5" />
      </RoundedBox>
      <mesh position={[0, 0.04, 0.092]}>
        <planeGeometry args={[0.24, 0.26]} />
        <meshStandardMaterial color="#DDE5EE" roughness={0.2} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, 0.08, 0.094]}>
        <planeGeometry args={[0.14, 0.045]} />
        <meshBasicMaterial color={powered ? "#9FE8C2" : "#2F3A3A"} toneMapped={false} />
      </mesh>
      <mesh position={[0.07, -0.02, 0.095]}>
        <circleGeometry args={[0.012, 8]} />
        <meshBasicMaterial color={importing ? ENERGY_COLORS.grid : exporting ? ENERGY_COLORS.solar : "#2F3A44"} toneMapped={false} />
      </mesh>
    </Place>
  );
}

/** Simple low-poly electric hatchback (generic, unbranded). */
export function ElectricCar({ color = "#F2F3F5", chargingPortGlow = 0, ...p }: PlaceProps & { color?: string; chargingPortGlow?: number }) {
  return (
    <Place {...p}>
      <RoundedBox args={[1.8, 0.55, 4.1]} radius={0.18} smoothness={2} position={[0, 0.5, 0]} castShadow receiveShadow>
        <Matte color={color} roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[1.55, 0.5, 2.1]} radius={0.2} smoothness={2} position={[0, 0.95, -0.25]} castShadow>
        <meshStandardMaterial color="#2A3446" roughness={0.25} metalness={0.2} flatShading />
      </RoundedBox>
      {[
        [-0.82, 1.35],
        [0.82, 1.35],
        [-0.82, -1.35],
        [0.82, -1.35],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x!, 0.33, z!]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 12]} />
          <Matte color="#1E2128" />
        </mesh>
      ))}
      {/* headlights / tail lights */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.62, 2.06]}>
          <boxGeometry args={[0.35, 0.06, 0.02]} />
          <meshBasicMaterial color="#EAF3FF" />
        </mesh>
      ))}
      <mesh position={[0, 0.66, -2.06]}>
        <boxGeometry args={[1.4, 0.05, 0.02]} />
        <meshBasicMaterial color="#C0392B" />
      </mesh>
      {/* charging port (left front fender) */}
      <mesh position={[-0.91, 0.72, 1.25]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[0.05, 10]} />
        <meshBasicMaterial color={chargingPortGlow > 0 ? ENERGY_COLORS.battery : "#3A3F48"} transparent opacity={0.4 + chargingPortGlow * 0.6} toneMapped={false} />
      </mesh>
    </Place>
  );
}

/** Wall socket plate (single or double). */
export function WallSocket({ double = true, ...p }: PlaceProps & { double?: boolean }) {
  return (
    <Place {...p}>
      <RoundedBox args={[double ? 0.15 : 0.085, 0.085, 0.012]} radius={0.008} smoothness={1}>
        <Matte color="#F3F3F1" roughness={0.5} />
      </RoundedBox>
      {(double ? [-0.035, 0.035] : [0]).map((x) => (
        <group key={x} position={[x, 0, 0.007]}>
          {[-0.009, 0.009].map((dx) => (
            <mesh key={dx} position={[dx, 0.005, 0]}>
              <boxGeometry args={[0.005, 0.012, 0.002]} />
              <meshBasicMaterial color="#5A5F66" />
            </mesh>
          ))}
        </group>
      ))}
    </Place>
  );
}

/** Light switch plate; `on` flips the rocker. */
export function LightSwitch({ on = true, ...p }: PlaceProps & { on?: boolean }) {
  return (
    <Place {...p}>
      <RoundedBox args={[0.085, 0.085, 0.012]} radius={0.008} smoothness={1}>
        <Matte color="#F3F3F1" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0, 0.01]} rotation={[on ? -0.18 : 0.18, 0, 0]}>
        <boxGeometry args={[0.035, 0.05, 0.01]} />
        <Matte color="#E2E2DE" />
      </mesh>
    </Place>
  );
}

/** Lit-material helper exported for environments. */
export { Lit };
