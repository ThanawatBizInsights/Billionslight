/**
 * Review studio: a seamless cyclorama for character identity sheets, scale
 * comparisons, expression and pose previews. Optional height ruler.
 */
import { useMemo } from "react";
import * as THREE from "three";

export function ReviewStudio({
  ruler = false,
  seats = [],
  floorColor = "#E8E4EA",
  wallColor = "#DCD7E2",
}: {
  ruler?: boolean;
  /** Simple seat blocks [x, z, height] for sitting-pose previews. */
  seats?: [number, number, number][];
  floorColor?: string;
  wallColor?: string;
}) {
  // floor that sweeps up into the back wall (cyclorama), built from a lathe-free extrusion
  const cyc = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, 12);
    shape.lineTo(0.02, 12);
    shape.lineTo(0.02, 0);
    shape.closePath();
    const pts: THREE.Vector3[] = [];
    const r = 2.5;
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * (Math.PI / 2);
      pts.push(new THREE.Vector3(0, r - Math.cos(a) * r, -6 - Math.sin(a) * r));
    }
    // curved strip
    const g = new THREE.BufferGeometry();
    const w = 30;
    const verts: number[] = [];
    const idx: number[] = [];
    const all = [new THREE.Vector3(0, 0, 14), ...pts, new THREE.Vector3(0, 14, -6 - r)];
    all.forEach((p) => {
      verts.push(-w / 2, p.y, p.z, w / 2, p.y, p.z);
    });
    for (let i = 0; i < all.length - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={cyc} receiveShadow>
        <meshStandardMaterial color={floorColor} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 7, -9]}>
        <planeGeometry args={[40, 14]} />
        <meshStandardMaterial color={wallColor} roughness={1} />
      </mesh>
      {ruler && <HeightRuler />}
      {seats.map(([x, z, h], i) => (
        <mesh key={i} position={[x, h / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[0.5, h, 0.45]} />
          <meshStandardMaterial color="#B8A28C" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** Metric ruler at x = -1.4 m: ticks every 10 cm, labels every 50 cm as bars. */
function HeightRuler() {
  const ticks = [];
  for (let cm = 0; cm <= 180; cm += 10) {
    const major = cm % 50 === 0;
    ticks.push(
      <mesh key={cm} position={[0.05, cm / 100, 0]}>
        <boxGeometry args={[major ? 0.16 : 0.08, major ? 0.012 : 0.006, 0.01]} />
        <meshBasicMaterial color={major ? "#0F2747" : "#6B7280"} />
      </mesh>,
    );
  }
  return (
    <group position={[-1.15, 0, 0]}>
      {/* approved heights: Sunny 1.35 m (yellow), Ton 1.70 m (navy) */}
      {[
        [1.35, "#FBBF24"],
        [1.7, "#0F2747"],
      ].map(([h, col]) => (
        <mesh key={h as number} position={[1.25, h as number, -0.4]}>
          <boxGeometry args={[2.6, 0.006, 0.004]} />
          <meshBasicMaterial color={col as string} />
        </mesh>
      ))}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.02, 1.8, 0.01]} />
        <meshBasicMaterial color="#0F2747" />
      </mesh>
      {ticks}
    </group>
  );
}
