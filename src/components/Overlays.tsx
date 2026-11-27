/**
 * 2D overlay layer: titles, labels, legend, subtitles. Positioned inside the
 * social-media safe area; sizes scale with the render resolution.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ENERGY_COLORS, SCENE_COLORS, type EnergyColorKey } from "../config/palette";
import { SAFE_AREA_9_16 } from "../config/formats";
import type { Scene } from "../schemas/episode";
import { THAI_FONT_STACK } from "../engine/subtitles/fonts";

export const LEGEND_LABELS_TH: Record<EnergyColorKey, string> = {
  solar: "ไฟจากโซลาร์เซลล์",
  grid: "ไฟจากการไฟฟ้า",
  battery: "พลังงานจากแบตเตอรี่",
  load: "การใช้ไฟในบ้าน",
  inactive: "ไม่มีการจ่ายไฟ",
  fault: "ความผิดปกติ / คำเตือน",
};

type Overlay = Scene["overlays"][number];

function useUnit() {
  const { height, width } = useVideoConfig();
  return Math.min(height / 1920, width / 1080);
}

function fadeFor(frame: number, o: Overlay) {
  const local = frame - o.from;
  const inT = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outT = interpolate(local, [o.durationInFrames - 10, o.durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { opacity: Math.min(inT, outT), rise: (1 - inT) * 24 };
}

function Positioned({ o, children }: { o: Overlay; children: React.ReactNode }) {
  const { width, height } = useVideoConfig();
  const sa = SAFE_AREA_9_16;
  const left = (sa.left + (1 - sa.left - sa.right) * o.anchor[0]) * width;
  const top = (sa.top + (1 - sa.top - sa.bottom) * o.anchor[1]) * height;
  return (
    <div style={{ position: "absolute", left, top, transform: "translate(-50%, -50%)", width: "max-content", maxWidth: width * (1 - sa.left - sa.right) }}>{children}</div>
  );
}

function Title({ text, u }: { text: string; u: number }) {
  return (
    <div
      style={{
        fontFamily: THAI_FONT_STACK,
        fontWeight: 800,
        fontSize: 76 * u,
        lineHeight: 1.45,
        color: "#FFFFFF",
        textAlign: "center",
        textShadow: `0 ${4 * u}px ${18 * u}px rgba(14,26,51,0.75)`,
        whiteSpace: "pre-line",
      }}
    >
      {text}
    </div>
  );
}

function Label({ text, u, color }: { text: string; u: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16 * u,
        padding: `${14 * u}px ${30 * u}px`,
        borderRadius: 999,
        background: "rgba(14,26,51,0.78)",
        border: `${3 * u}px solid ${color}`,
        fontFamily: THAI_FONT_STACK,
        fontWeight: 700,
        fontSize: 44 * u,
        lineHeight: 1.5,
        color: "#FFFFFF",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 22 * u, height: 22 * u, borderRadius: 99, background: color, boxShadow: `0 0 ${16 * u}px ${color}` }} />
      {text}
    </div>
  );
}

function Legend({ keys, u }: { keys: EnergyColorKey[]; u: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10 * u,
        padding: `${20 * u}px ${28 * u}px`,
        borderRadius: 24 * u,
        background: "rgba(14,26,51,0.72)",
        fontFamily: THAI_FONT_STACK,
        fontWeight: 400,
        fontSize: 32 * u,
        lineHeight: 1.5,
        color: "#E8EDF8",
      }}
    >
      {keys.map((k) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 16 * u, whiteSpace: "nowrap" }}>
          <span style={{ width: 40 * u, height: 8 * u, borderRadius: 99, background: ENERGY_COLORS[k], boxShadow: `0 0 ${10 * u}px ${ENERGY_COLORS[k]}` }} />
          {LEGEND_LABELS_TH[k]}
        </div>
      ))}
    </div>
  );
}

function Tag({ text, u }: { text: string; u: number }) {
  return (
    <div style={{ fontFamily: THAI_FONT_STACK, fontWeight: 700, fontSize: 26 * u, letterSpacing: 2 * u, color: SCENE_COLORS.sunGold, background: "rgba(14,26,51,0.6)", padding: `${8 * u}px ${18 * u}px`, borderRadius: 10 * u, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
}

export function SceneOverlays({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const u = useUnit();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {scene.overlays
        .filter((o) => frame >= o.from && frame <= o.from + o.durationInFrames)
        .map((o) => {
          const { opacity, rise } = fadeFor(frame, o);
          let el: React.ReactNode = null;
          if (o.kind === "title") el = <Title text={o.text ?? ""} u={u} />;
          else if (o.kind === "label" && o.style === "tag") el = <Tag text={o.text ?? ""} u={u} />;
          else if (o.kind === "label") {
            const key = (o.style?.replace("energy-", "") ?? "solar") as EnergyColorKey;
            el = <Label text={o.text ?? ""} u={u} color={ENERGY_COLORS[key] ?? ENERGY_COLORS.solar} />;
          } else if (o.kind === "legend") {
            const keys = (o.text ?? "solar,grid,battery,load").split(",").map((s) => s.trim()) as EnergyColorKey[];
            el = <Legend keys={keys.filter((k) => k in ENERGY_COLORS)} u={u} />;
          } else el = <Tag text={o.text ?? ""} u={u} />;
          return (
            <div key={o.id} style={{ opacity, transform: `translateY(${rise * u}px)` }}>
              <Positioned o={o}>{el}</Positioned>
            </div>
          );
        })}
    </AbsoluteFill>
  );
}
