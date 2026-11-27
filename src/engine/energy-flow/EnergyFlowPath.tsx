/**
 * Billionslight energy path — APPROVED style (owner, 2026-11-27, "Variant B"):
 * a thin coloured line carrying ONE travelling pulse of light with a short
 * bright leading edge (facing the destination) and a long fading tail.
 *
 * - Procedural gradient shader on the existing tube geometry (uv.x = arc
 *   length), so straight and curved cables work the same.
 * - Pulse position is a pure function of the Remotion frame + fps (pulse.ts).
 * - Pulse speed/length/brightness and line thickness never depend on power.
 * - Inactive: static grey line, no pulse, no glow.
 * - Warning: stopped (grey) line + a red pulsing indicator on the connection.
 * - White household-load lines keep a dark outline for bright scenes.
 * Two draw calls per active connection (line + soft glow); no post-processing.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { ENERGY_FLOW_COLORS, ENERGY_FLOW_OUTLINE, ENERGY_FLOW_PULSE, type EnergyFlowCategory } from "../../config/energy-flow";
import type { Vec3 } from "../../schemas/episode";
import { clampTravelSeconds, pulseFraction, pulseHead } from "./pulse";

export interface EnergyFlowPathProps {
  points: Vec3[];
  frame: number;
  fps: number;
  /** Shown in labels only — never affects the animation. */
  kw: number;
  /** +1 = power moves along the points, -1 = against them. */
  direction: 1 | -1;
  category: EnergyFlowCategory;
  warning?: boolean;
  visible?: boolean;
  /** Uniform thickness multiplier for wide shots (constant along the line). */
  pathScale?: number;
  /** Source → destination travel time (s), clamped to the approved 0.8–1.5 s. */
  travelSeconds?: number;
}

const P = ENERGY_FLOW_PULSE;
const [S0, S1, S2, S3, S4, S5] = P.profile;

const VERT = /* glsl */ `
  uniform float uDir;
  varying float vS;
  void main() {
    vS = uDir > 0.0 ? uv.x : 1.0 - uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Approved profile from the trailing end (x=0) to the leading end (x=1).
const PROFILE = /* glsl */ `
  float seg(float x, float x0, float y0, float x1, float y1) { return mix(y0, y1, clamp((x - x0) / (x1 - x0), 0.0, 1.0)); }
  float profile(float x) {
    if (x <= 0.0 || x >= 1.0) return 0.0;
    if (x < ${S1[0].toFixed(3)}) return seg(x, ${S0[0].toFixed(3)}, ${S0[1].toFixed(3)}, ${S1[0].toFixed(3)}, ${S1[1].toFixed(3)});
    if (x < ${S2[0].toFixed(3)}) return seg(x, ${S1[0].toFixed(3)}, ${S1[1].toFixed(3)}, ${S2[0].toFixed(3)}, ${S2[1].toFixed(3)});
    if (x < ${S3[0].toFixed(3)}) return seg(x, ${S2[0].toFixed(3)}, ${S2[1].toFixed(3)}, ${S3[0].toFixed(3)}, ${S3[1].toFixed(3)});
    if (x < ${S4[0].toFixed(3)}) return seg(x, ${S3[0].toFixed(3)}, ${S3[1].toFixed(3)}, ${S4[0].toFixed(3)}, ${S4[1].toFixed(3)});
    float k = clamp((x - ${S4[0].toFixed(3)}) / (${S5[0].toFixed(3)} - ${S4[0].toFixed(3)}), 0.0, 1.0);
    return mix(${S4[1].toFixed(3)}, ${S5[1].toFixed(3)}, k * k * (3.0 - 2.0 * k));
  }
`;

const FRAG_LINE = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLead;
  uniform float uHead;
  uniform float uPulse;
  uniform float uBase;
  uniform float uActive;
  varying float vS;
  ${PROFILE}
  void main() {
    if (uActive < 0.5) {
      gl_FragColor = vec4(uColor, 1.0);
      #include <colorspace_fragment>
      return;
    }
    float behind = uHead - vS;
    float x = 1.0 - behind / uPulse;
    float p = profile(x);
    // base line at the approved 25–35 % intensity, rising to 100 % in the pulse
    float intensity = mix(uBase, 1.0, p);
    vec3 c = mix(uColor, uLead, smoothstep(0.6, 0.92, x) * p);
    gl_FragColor = vec4(c * (0.5 + 0.5 * intensity) + c * 0.35 * p, 1.0);
    #include <colorspace_fragment>
  }
`;

const FRAG_GLOW = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLead;
  uniform float uHead;
  uniform float uPulse;
  uniform float uBase;
  uniform float uGlow;
  varying float vS;
  ${PROFILE}
  void main() {
    float behind = uHead - vS;
    float x = 1.0 - behind / uPulse;
    float p = profile(x);
    float a = uGlow * (p + uBase * 0.12);
    gl_FragColor = vec4(mix(uColor, uLead, p * 0.5), a);
    #include <colorspace_fragment>
  }
`;

const lighter = (hex: string, k: number) => new THREE.Color(hex).lerp(new THREE.Color("#FFFFFF"), k);

export function EnergyFlowPath({ points, frame, fps, direction, category, warning = false, visible = true, pathScale = 1, travelSeconds }: EnergyFlowPathProps) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.05), [points]);
  const length = useMemo(() => curve.getLength(), [curve]);
  const segs = Math.max(16, Math.round(length * 24));
  const r = P.cableRadius * pathScale;
  const tube = useMemo(() => new THREE.TubeGeometry(curve, segs, r, 8, false), [curve, segs, r]);
  const glowTube = useMemo(() => new THREE.TubeGeometry(curve, segs, r * 2.6, 8, false), [curve, segs, r]);
  const outlineTube = useMemo(() => new THREE.TubeGeometry(curve, segs, r * 1.7, 8, false), [curve, segs, r]);

  const active = category !== "inactive" && !warning;
  const colorHex = active ? ENERGY_FLOW_COLORS[category] : ENERGY_FLOW_COLORS.inactive;
  const pulse = pulseFraction(length);
  const head = pulseHead(frame, fps, pulse, clampTravelSeconds(travelSeconds));

  const lineMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG_LINE,
        uniforms: { uColor: { value: new THREE.Color() }, uLead: { value: new THREE.Color() }, uHead: { value: 0 }, uPulse: { value: 0.35 }, uBase: { value: P.baseIntensity }, uActive: { value: 1 }, uDir: { value: 1 } },
        toneMapped: false,
      }),
    [],
  );
  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG_GLOW,
        uniforms: { uColor: { value: new THREE.Color() }, uLead: { value: new THREE.Color() }, uHead: { value: 0 }, uPulse: { value: 0.35 }, uBase: { value: P.baseIntensity }, uGlow: { value: P.glowPeak }, uDir: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  // deterministic per-frame uniforms (no independent clocks)
  for (const m of [lineMat, glowMat]) {
    m.uniforms.uColor!.value.set(colorHex);
    m.uniforms.uLead!.value.copy(lighter(colorHex, P.leadingTint));
    m.uniforms.uHead!.value = head;
    m.uniforms.uPulse!.value = pulse;
    m.uniforms.uDir!.value = direction;
  }
  lineMat.uniforms.uActive!.value = active ? 1 : 0;

  if (!visible) return null;
  const white = category === "householdLoad" && active;
  // warning indicator: red ring around the stopped connection, slow pulse
  const mid = curve.getPointAt(0.5);
  const tan = curve.getTangentAt(0.5);
  const ringQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
  const beat = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2 * 0.8);
  return (
    <group>
      {white && (
        <mesh geometry={outlineTube}>
          <meshBasicMaterial color={ENERGY_FLOW_OUTLINE} side={THREE.BackSide} />
        </mesh>
      )}
      <mesh geometry={tube} material={lineMat} />
      {active && <mesh geometry={glowTube} material={glowMat} />}
      {warning && (
        <group position={mid} quaternion={ringQ} scale={pathScale * (1 + 0.15 * beat)}>
          <mesh>
            <torusGeometry args={[0.14, 0.03, 8, 24]} />
            <meshBasicMaterial color={ENERGY_FLOW_COLORS.fault} toneMapped={false} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.14, 0.08, 8, 24]} />
            <meshBasicMaterial color={ENERGY_FLOW_COLORS.fault} transparent opacity={0.12 + 0.2 * beat} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}
