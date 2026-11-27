/**
 * Solar and electrical equipment (Phase 1 subset): PV panel/array, inverter,
 * meter, battery. Simplified educational models — not installation guidance.
 */
import { ENERGY_COLORS, SCENE_COLORS } from "../../config/palette";
import { Matte, Glow } from "../core/materials";
import type { InverterMode } from "../energy-flow/scenario";

export interface EquipmentBaseProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  visible?: boolean;
  scale?: number;
}

/** Single PV module, ~1.7 × 1.1 m. `generation` 0–1 adds a subtle sheen. */
export function SolarPanel({ generation = 0, ...p }: EquipmentBaseProps & { generation?: number }) {
  const cols = 3;
  const rows = 5;
  const w = 1.0;
  const h = 1.6;
  return (
    <group position={p.position} rotation={p.rotation} visible={p.visible ?? true} scale={p.scale ?? 1}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w + 0.06, 0.05, h + 0.06]} />
        <Matte color={SCENE_COLORS.panelFrame} roughness={0.5} />
      </mesh>
      {Array.from({ length: cols * rows }, (_, i) => {
        const cx = (i % cols) - (cols - 1) / 2;
        const cz = Math.floor(i / cols) - (rows - 1) / 2;
        return (
          <mesh key={i} position={[cx * (w / cols), 0.03, cz * (h / rows)]} receiveShadow>
            <boxGeometry args={[w / cols - 0.025, 0.012, h / rows - 0.025]} />
            <meshStandardMaterial
              color={SCENE_COLORS.panelCell}
              roughness={0.35}
              metalness={0.2}
              emissive={ENERGY_COLORS.solar}
              emissiveIntensity={generation * 0.12}
              flatShading
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function SolarArray({ rows, cols, spacing = 0.06, generation = 0, ...p }: EquipmentBaseProps & { rows: number; cols: number; spacing?: number; generation?: number }) {
  return (
    <group position={p.position} rotation={p.rotation} visible={p.visible ?? true} scale={p.scale ?? 1}>
      {/* mounting rails */}
      {[-0.5, 0.5].map((r) => (
        <mesh key={r} position={[0, -0.05, r * (rows * 1.66 - 0.6)]} castShadow>
          <boxGeometry args={[cols * (1.06 + spacing) + 0.2, 0.04, 0.05]} />
          <Matte color="#8D96A3" roughness={0.5} />
        </mesh>
      ))}
      {Array.from({ length: rows * cols }, (_, i) => {
        const c = (i % cols) - (cols - 1) / 2;
        const r = Math.floor(i / cols) - (rows - 1) / 2;
        return <SolarPanel key={i} position={[c * (1.06 + spacing), 0, r * (1.66 + spacing)]} generation={generation} />;
      })}
    </group>
  );
}

const MODE_COLOR: Record<InverterMode, string> = {
  off: "#3A3F4A",
  standby: "#E0B341",
  "grid-tied": ENERGY_COLORS.battery,
  backup: ENERGY_COLORS.battery,
  fault: ENERGY_COLORS.fault,
};

/** Wall-mounted inverter with status LED and display bars showing output. */
export function Inverter({ mode = "off", output = 0, variant = "grid-tied", frame = 0, ...p }: EquipmentBaseProps & { mode?: InverterMode; output?: number; variant?: "grid-tied" | "hybrid"; frame?: number }) {
  const led = MODE_COLOR[mode];
  const blink = mode === "fault" ? (Math.floor(frame / 8) % 2 === 0 ? 1 : 0.2) : 1;
  return (
    <group position={p.position} rotation={p.rotation} visible={p.visible ?? true} scale={p.scale ?? 1}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.75, 0.22]} />
        <Matte color="#E9ECF1" roughness={0.6} />
      </mesh>
      {/* heat-sink fins */}
      {[-0.2, -0.1, 0, 0.1, 0.2].map((x) => (
        <mesh key={x} position={[x, 0, -0.13]} castShadow>
          <boxGeometry args={[0.03, 0.7, 0.05]} />
          <Matte color="#B9C0CB" />
        </mesh>
      ))}
      {/* front panel */}
      <mesh position={[0, 0.12, 0.115]}>
        <boxGeometry args={[0.42, 0.24, 0.01]} />
        <Matte color={variant === "hybrid" ? "#1F3A66" : "#2C3442"} />
      </mesh>
      {/* output bars */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[-0.14 + i * 0.07, 0.08, 0.122]}>
          <boxGeometry args={[0.045, 0.03 + i * 0.025, 0.004]} />
          <Glow color={output > i / 5 ? ENERGY_COLORS.solar : "#3A4252"} />
        </mesh>
      ))}
      <mesh position={[0.16, 0.2, 0.122]}>
        <circleGeometry args={[0.022, 8]} />
        <Glow color={led} opacity={blink} />
      </mesh>
      {/* cable gland block */}
      <mesh position={[0, -0.41, 0]} castShadow>
        <boxGeometry args={[0.4, 0.07, 0.15]} />
        <Matte color="#9AA3AF" />
      </mesh>
    </group>
  );
}

export function ElectricMeter({ active = true, importing = false, ...p }: EquipmentBaseProps & { active?: boolean; importing?: boolean }) {
  return (
    <group position={p.position} rotation={p.rotation} visible={p.visible ?? true} scale={p.scale ?? 1}>
      <mesh castShadow>
        <boxGeometry args={[0.36, 0.5, 0.18]} />
        <Matte color="#9AA6B5" />
      </mesh>
      <mesh position={[0, 0.06, 0.092]}>
        <boxGeometry args={[0.26, 0.24, 0.01]} />
        <Matte color="#D8E1EA" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.1, 0.1]}>
        <boxGeometry args={[0.16, 0.05, 0.004]} />
        <Glow color={active ? "#9FE8C2" : "#2F3A3A"} />
      </mesh>
      <mesh position={[0.08, -0.03, 0.1]}>
        <circleGeometry args={[0.015, 6]} />
        <Glow color={importing ? ENERGY_COLORS.grid : "#2F3A44"} />
      </mesh>
    </group>
  );
}

export function BatteryStorage({ stateOfCharge = 0.8, charging = false, discharging = false, ...p }: EquipmentBaseProps & { stateOfCharge?: number; charging?: boolean; discharging?: boolean }) {
  const lit = Math.round(stateOfCharge * 5);
  const active = charging || discharging;
  return (
    <group position={p.position} rotation={p.rotation} visible={p.visible ?? true} scale={p.scale ?? 1}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.1, 0.25]} />
        <Matte color="#F1F3F6" roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 0.65 + i * 0.07, 0.127]}>
          <boxGeometry args={[0.18, 0.04, 0.004]} />
          <Glow color={i < lit ? (active ? ENERGY_COLORS.battery : "#7FBF9A") : "#3A4252"} />
        </mesh>
      ))}
    </group>
  );
}
