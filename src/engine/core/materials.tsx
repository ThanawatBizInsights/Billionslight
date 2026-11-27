/**
 * Low-poly material helpers. Matte, flat-shaded surfaces are the core of the
 * Billionslight look: faceted geometry + soft light, no glossy reflections.
 */
import type { ReactNode } from "react";

export const Matte = ({ color, roughness = 0.9, emissive, emissiveIntensity = 0, opacity }: {
  color: string;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
}) => (
  <meshStandardMaterial
    color={color}
    roughness={roughness}
    metalness={0}
    flatShading
    emissive={emissive ?? "#000000"}
    emissiveIntensity={emissiveIntensity}
    transparent={opacity !== undefined && opacity < 1}
    opacity={opacity ?? 1}
  />
);

/** Unlit glowing material for LEDs, energy particles and cable glow. */
export const Glow = ({ color, opacity = 1 }: { color: string; opacity?: number }) => (
  <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} toneMapped={false} />
);

/** A box with shadows enabled and a matte material. */
export const Block = ({
  size,
  position,
  rotation,
  color,
  children,
  castShadow = true,
  receiveShadow = true,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  children?: ReactNode;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) => (
  <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}>
    <boxGeometry args={size} />
    {children ?? <Matte color={color} />}
  </mesh>
);
