/**
 * Hand-held props. Props are separate reusable assets attached to a joint for
 * a time range by episode data — never modelled into a character's hands.
 * Coordinates are in the attaching joint's space (wrist: hand hangs along -Y).
 */
import { RoundedBox } from "@react-three/drei";
import type { ReactNode } from "react";
import { ENERGY_FLOW_COLORS } from "../../config/energy-flow";

export interface PropProps {
  /** 0–1 extra state: screen brightness, panel glint … */
  state?: number;
}

export function Tablet({ state = 1 }: PropProps) {
  return (
    <group>
      <RoundedBox args={[0.24, 0.17, 0.014]} radius={0.012} smoothness={1} castShadow>
        <meshStandardMaterial color="#2B2F3A" roughness={0.5} flatShading />
      </RoundedBox>
      <mesh position={[0, 0, 0.0075]}>
        <planeGeometry args={[0.215, 0.145]} />
        <meshStandardMaterial color="#1D3B6E" emissive="#7FB8FF" emissiveIntensity={0.35 * state} roughness={0.3} />
      </mesh>
      {/* screen glow lights the holder's face (useful in blackout scenes) */}
      {state > 0.05 && <pointLight position={[0, 0, 0.25]} color="#9CC7FF" intensity={state * 0.8} distance={1.2} decay={2} />}
      {/* simple energy diagram on screen: sun → inverter → house */}
      {[-0.07, 0, 0.07].map((x, i) => (
        <mesh key={x} position={[x, 0.005, 0.0085]}>
          <planeGeometry args={[0.035, 0.035]} />
          <meshBasicMaterial color={[ENERGY_FLOW_COLORS.solarDC, "#E8ECF4", ENERGY_FLOW_COLORS.householdLoad][i]} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, -0.04, 0.0085]}>
        <planeGeometry args={[0.15, 0.008]} />
        <meshBasicMaterial color={ENERGY_FLOW_COLORS.solarDC} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Small demonstration PV module (as Sunny holds in the hero art). */
export function DemoSolarPanel({ state = 0.5 }: PropProps) {
  const cols = 4;
  const rows = 3;
  return (
    <group>
      <RoundedBox args={[0.3, 0.22, 0.018]} radius={0.01} smoothness={1} castShadow>
        <meshStandardMaterial color="#D9DEE6" roughness={0.5} flatShading />
      </RoundedBox>
      {Array.from({ length: cols * rows }, (_, i) => (
        <mesh key={i} position={[((i % cols) - (cols - 1) / 2) * 0.066, (Math.floor(i / cols) - (rows - 1) / 2) * 0.062, 0.01]}>
          <planeGeometry args={[0.06, 0.056]} />
          <meshStandardMaterial color="#27428F" roughness={0.35} metalness={0.15} emissive={ENERGY_FLOW_COLORS.solarDC} emissiveIntensity={state * 0.15} />
        </mesh>
      ))}
    </group>
  );
}

export function CoffeeMug() {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.036, 0.09, 10]} />
        <meshStandardMaterial color="#2E3440" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0.045, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.022, 0.007, 4, 8]} />
        <meshStandardMaterial color="#2E3440" roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

export const PROPS: Record<string, (p: PropProps) => ReactNode> = {
  tablet: (p) => <Tablet {...p} />,
  "demo-solar-panel": (p) => <DemoSolarPanel {...p} />,
  "coffee-mug": () => <CoffeeMug />,
};

/** Default grip transforms (in wrist space) so props sit naturally in a hand. */
export const PROP_GRIPS: Record<string, { position: [number, number, number]; rotation: [number, number, number] }> = {
  tablet: { position: [0, -0.09, 0.06], rotation: [-1.2, 0, 0] },
  "demo-solar-panel": { position: [0, -0.1, 0.07], rotation: [-1.1, 0, 0] },
  "coffee-mug": { position: [0, -0.07, 0.04], rotation: [0, 0, 0] },
};
