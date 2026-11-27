/**
 * 2D labels + legend for the energy-flow standard. Labels are pinned to 3D
 * points projected with the scene camera (pure maths, same camera as the
 * render), drawn as HTML so Thai text uses the bundled Noto Sans Thai.
 * Text, icons and the pulse swatch accompany every colour (colour-vision accessibility).
 */
import { useVideoConfig } from "remotion";
import * as THREE from "three";
import { ENERGY_FLOW_COLORS, ENERGY_FLOW_LABELS_TH, ENERGY_FLOW_LEGEND_TH, ENERGY_FLOW_OUTLINE, type EnergyFlowCategory, type EnergyFlowLabelKey } from "../../config/energy-flow";
import { SAFE_AREA_9_16 } from "../../config/formats";
import { THAI_FONT_STACK } from "../subtitles/fonts";
import type { CameraShot } from "../cameras/CameraRig";
import type { Vec3 } from "../../schemas/episode";

export interface FlowLabelItem {
  id: string;
  at: Vec3;
  label: EnergyFlowLabelKey;
  category: EnergyFlowCategory;
  kw?: number;
  warning?: boolean;
  /** Optional 3D point the label refers to (a thin leader line is drawn to it). */
  pointAt?: Vec3;
}

export function projectToScreen(shot: CameraShot, aspect: number, p: Vec3): { x: number; y: number; visible: boolean } {
  const cam = new THREE.PerspectiveCamera(shot.fov, aspect, 0.1, 400);
  cam.position.set(...shot.position);
  cam.lookAt(new THREE.Vector3(...shot.target));
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(cam);
  return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, visible: v.z < 1 && v.z > -1 };
}

const fmtKw = (kw: number) => `${kw.toFixed(1)} kW`;

function safeArea(width: number, height: number) {
  return height > width * 1.2 ? SAFE_AREA_9_16 : { top: 0.06, bottom: 0.06, left: 0.04, right: 0.04 };
}

export function FlowLabels({ items, shot }: { items: FlowLabelItem[]; shot: CameraShot }) {
  const { width, height } = useVideoConfig();
  const u = Math.min(height / 1920, width / 1080);
  const sa = safeArea(width, height);
  // project, then push overlapping labels apart vertically (deterministic order)
  const placed = items
    .map((it) => ({ it, ...projectToScreen(shot, width / height, it.at), target: it.pointAt ? projectToScreen(shot, width / height, it.pointAt) : null }))
    .filter((p) => p.visible && p.x > -0.05 && p.x < 1.05 && p.y > -0.05 && p.y < 1.05)
    .sort((a, b) => a.y - b.y || a.it.id.localeCompare(b.it.id));
  const gap = (64 * u) / height;
  for (let i = 1; i < placed.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = placed[j]!;
      const b = placed[i]!;
      if (Math.abs(a.x - b.x) < 0.38 && b.y - a.y < gap) b.y = a.y + gap;
    }
  }
  const clampX = (x: number) => Math.min(Math.max(x, sa.left + 0.12), 1 - sa.right - 0.12) * width;
  const clampY = (y: number) => Math.min(Math.max(y, sa.top + 0.03), 1 - sa.bottom - 0.03) * height;
  return (
    <>
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {placed.map(({ it, x, y, target }) =>
          target && target.visible ? (
            <g key={it.id}>
              <line x1={clampX(x)} y1={clampY(y)} x2={target.x * width} y2={target.y * height} stroke="rgba(15,23,42,0.85)" strokeWidth={5 * u} />
              <line x1={clampX(x)} y1={clampY(y)} x2={target.x * width} y2={target.y * height} stroke={ENERGY_FLOW_COLORS[it.warning ? "fault" : it.category]} strokeWidth={2.2 * u} />
              <circle cx={target.x * width} cy={target.y * height} r={6 * u} fill={ENERGY_FLOW_COLORS[it.warning ? "fault" : it.category]} stroke="rgba(15,23,42,0.9)" strokeWidth={2 * u} />
            </g>
          ) : null,
        )}
      </svg>
      {placed.map(({ it, x, y }) => {
        const color = ENERGY_FLOW_COLORS[it.warning ? "fault" : it.category];
        const left = clampX(x);
        const top = clampY(y);
        const icon = it.warning ? "⚠" : it.label === "shutdown" ? "⏻" : null;
        return (
          <div
            key={it.id}
            style={{
              position: "absolute",
              left,
              top,
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              padding: `${8 * u}px ${16 * u}px`,
              borderRadius: 999,
              background: "rgba(15,23,42,0.82)",
              border: `${3 * u}px solid ${color}`,
              fontFamily: THAI_FONT_STACK,
              fontSize: 27 * u,
              fontWeight: 700,
              color: "#F1F5F9",
              whiteSpace: "nowrap",
              boxShadow: `0 ${3 * u}px ${12 * u}px rgba(0,0,0,0.35)`,
            }}
          >
            {icon ? <span style={{ color, fontSize: 26 * u }}>{icon}</span> : <PulseSwatch color={color} u={u} width={34} />}
            <span>{ENERGY_FLOW_LABELS_TH[it.label]}</span>
            {it.kw !== undefined && <span style={{ color, fontVariantNumeric: "tabular-nums" }}>{fmtKw(it.kw)}</span>}
          </div>
        );
      })}
    </>
  );
}

/** Colour legend: line swatch + arrow + Thai meaning. Inactive and fault are always listed. */
export function FlowLegend({ categories }: { categories: EnergyFlowCategory[] }) {
  const { width, height } = useVideoConfig();
  const u = Math.min(height / 1920, width / 1080);
  const sa = safeArea(width, height);
  return (
    <div
      style={{
        position: "absolute",
        left: sa.left * width,
        bottom: sa.bottom * height,
        width: (1 - sa.left - sa.right) * width,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: `${8 * u}px ${18 * u}px`,
        padding: `${16 * u}px ${20 * u}px`,
        borderRadius: 22 * u,
        background: "rgba(15,23,42,0.78)",
        fontFamily: THAI_FONT_STACK,
        fontSize: 22 * u,
        color: "#F1F5F9",
      }}
    >
      {categories.map((c) => (
        <div key={c} style={{ display: "flex", alignItems: "center", gap: 10 * u, whiteSpace: "nowrap" }}>
          {c === "inactive" || c === "fault" ? (
            <span style={{ width: 64 * u, height: 6 * u, borderRadius: 99, background: ENERGY_FLOW_COLORS[c === "fault" ? "inactive" : c], flex: "none", position: "relative" }}>
              {c === "fault" && <span style={{ position: "absolute", left: 22 * u, top: -9 * u, width: 18 * u, height: 18 * u, borderRadius: 99, border: `${4 * u}px solid ${ENERGY_FLOW_COLORS.fault}`, boxSizing: "border-box" }} />}
            </span>
          ) : (
            <PulseSwatch color={ENERGY_FLOW_COLORS[c]} u={u} width={64} outline={c === "householdLoad"} />
          )}
          <span>{ENERGY_FLOW_LEGEND_TH[c]}</span>
        </div>
      ))}
    </div>
  );
}

/** 2D swatch of the approved style: thin line with a fading tail and a bright leading edge (left → right). */
export function PulseSwatch({ color, u, width, outline = false }: { color: string; u: number; width: number; outline?: boolean }) {
  return (
    <span
      style={{
        width: width * u,
        height: 6 * u,
        borderRadius: 99,
        flex: "none",
        background: `linear-gradient(90deg, ${color}55 0%, ${color}66 25%, ${color}99 50%, ${color}cc 75%, #FFFFFF 90%, ${color}55 100%)`,
        boxShadow: `0 0 ${6 * u}px ${color}88${outline ? `, 0 0 0 ${2 * u}px ${ENERGY_FLOW_OUTLINE}` : ""}`,
      }}
    />
  );
}
