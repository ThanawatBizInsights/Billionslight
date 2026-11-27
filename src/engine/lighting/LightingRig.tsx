import { useMemo } from "react";
import * as THREE from "three";
import type { LightingPreset } from "./presets";

/** Gradient sky dome built with vertex colours (no custom shader needed). */
function SkyDome({ preset }: { preset: LightingPreset }) {
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(120, 24, 16);
    const top = new THREE.Color(preset.sky.top);
    const hor = new THREE.Color(preset.sky.horizon);
    const bot = new THREE.Color(preset.sky.bottom);
    const pos = g.attributes.position!;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const h = pos.getY(i) / 120; // -1..1
      if (h >= 0) c.copy(hor).lerp(top, Math.pow(h, 0.6));
      else c.copy(hor).lerp(bot, Math.min(1, -h * 3));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [preset]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

export function LightingRig({
  preset,
  shadowMapSize,
  sunIntensityScale = 1,
  shadowExtent = 16,
  skyVisible = true,
}: {
  preset: LightingPreset;
  shadowMapSize: number;
  sunIntensityScale?: number;
  /** Half-size of the sun's shadow frustum (smaller = crisper shadows for interiors). */
  shadowExtent?: number;
  skyVisible?: boolean;
}) {
  const sunDir = new THREE.Vector3(...preset.sun.position).normalize();
  // keep the shadow camera tight around the set: place the sun along its direction at a fixed distance
  const sunPos = sunDir.clone().multiplyScalar(Math.max(20, shadowExtent * 2.5)).toArray() as [number, number, number];
  return (
    <>
      {skyVisible && <SkyDome preset={preset} />}
      <fog attach="fog" args={[preset.fog.color, preset.fog.near, preset.fog.far]} />
      <ambientLight color={preset.ambient.color} intensity={preset.ambient.intensity} />
      <hemisphereLight args={[preset.hemisphere.sky, preset.hemisphere.ground, preset.hemisphere.intensity]} />
      <directionalLight
        color={preset.sun.color}
        intensity={preset.sun.intensity * sunIntensityScale}
        position={sunPos}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={Math.max(20, shadowExtent * 2.5) * 2}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
      <directionalLight color={preset.fill.color} intensity={preset.fill.intensity} position={preset.fill.position} />
      {preset.sun.visibleDisc && (
        <mesh position={sunDir.clone().multiplyScalar(100).toArray()}>
          <circleGeometry args={[5, 20]} />
          <meshBasicMaterial color="#FFE6B0" fog={false} toneMapped={false} />
        </mesh>
      )}
    </>
  );
}
