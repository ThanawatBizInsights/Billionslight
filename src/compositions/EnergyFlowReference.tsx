/**
 * Energy-flow visual standard — reference sheet (review composition, 1080×1920).
 * Every row is rendered by the production EnergyFlowPath with the shared
 * tokens, so the sheet shows exactly what episodes will use.
 */
import { OrthographicCamera } from "@react-three/drei";
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { ENERGY_FLOW_COLORS, ENERGY_FLOW_LABELS_TH, type EnergyFlowCategory, type EnergyFlowLabelKey } from "../config/energy-flow";
import { EnergyFlowPath } from "../engine/energy-flow/EnergyFlowPath";
import { ensureFonts, THAI_FONT_STACK } from "../engine/subtitles/fonts";

interface Row {
  category: EnergyFlowCategory;
  kw: number;
  direction: 1 | -1;
  label?: EnergyFlowLabelKey;
  title: string;
  warning?: boolean;
  light?: boolean;
}

const ROWS: Row[] = [
  { category: "solarDC", kw: 3, direction: 1, label: "solar", title: "Solar DC · PV → inverter" },
  { category: "utilityGridAC", kw: 2, direction: 1, label: "gridImport", title: "Grid AC · import (grid → house)" },
  { category: "utilityGridAC", kw: 2, direction: -1, label: "gridExport", title: "Grid AC · permitted export (house → grid)" },
  { category: "batteryDC", kw: 3, direction: 1, label: "batteryCharging", title: "Battery DC · charging (inverter → battery)" },
  { category: "batteryDC", kw: 3, direction: -1, label: "batteryDischarging", title: "Battery DC · discharging (battery → inverter)" },
  { category: "inverterAC", kw: 3, direction: 1, label: "inverterOutput", title: "Inverter AC output · inverter → board" },
  { category: "householdLoad", kw: 2, direction: 1, label: "householdUse", title: "Household loads · white with dark outline", light: true },
  { category: "inactive", kw: 0, direction: 1, label: "shutdown", title: "Inactive / isolated / disconnected · no motion" },
  { category: "fault", kw: 0, direction: 1, title: "Fault / warning · red, pulsing, no flow", warning: true },
];
const DENSITY = [0, 1, 3, 5];

const PX = 100; // pixels per world unit (orthographic)
const TOP = 240;
const ROW_H = 120;
const DEN_TOP = TOP + ROWS.length * ROW_H + 40;
const DEN_H = 84;

const yWorld = (px: number, height: number) => (height / 2 - px) / PX;

export function EnergyFlowReference() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    ensureFonts().then(() => continueRender(handle), () => continueRender(handle));
  }, [handle]);
  const u = width / 1080;
  const x0 = -width / 2 / PX + 0.6;
  const x1 = width / 2 / PX - 0.6;
  const pathY = (i: number) => yWorld((TOP + i * ROW_H + 82) * u, height);
  const denY = (i: number) => yWorld((DEN_TOP + 60 + i * DEN_H + 22) * u, height);
  const line = (y: number, from = x0, to = x1): [number, number, number][] => [
    [from, y, 0],
    [(from + to) / 2, y, 0],
    [to, y, 0],
  ];
  const text = { fontFamily: THAI_FONT_STACK, color: "#F8FAFC" } as const;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F2747" }}>
      {ROWS.map((r, i) =>
        r.light ? <div key={`bg${i}`} style={{ position: "absolute", left: 30 * u, right: 30 * u, top: (TOP + i * ROW_H + 4) * u, height: (ROW_H - 10) * u, background: "#E8EDF3", borderRadius: 18 * u }} /> : null,
      )}
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} dpr={1} gl={{ antialias: true }}>
          <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={PX * u} near={0.1} far={100} />
          <ambientLight intensity={1.2} />
          <directionalLight position={[2, 4, 8]} intensity={1.4} />
          {ROWS.map((r, i) => (
            <EnergyFlowPath key={i} points={line(pathY(i))} frame={frame} fps={fps} kw={r.kw} direction={r.direction} category={r.category === "fault" ? "inactive" : r.category} warning={r.warning} pathScale={1.6} seed={i + 3} />
          ))}
          {DENSITY.map((kw, i) => (
            <EnergyFlowPath key={`d${i}`} points={line(denY(i), x0 + 2.2, x1)} frame={frame} fps={fps} kw={kw} direction={1} category="solarDC" pathScale={1.6} seed={40 + i} />
          ))}
        </ThreeCanvas>
      </AbsoluteFill>
      <div style={{ ...text, position: "absolute", left: 60 * u, top: 70 * u, fontSize: 52 * u, fontWeight: 800 }}>Billionslight · Energy-flow standard</div>
      <div style={{ ...text, position: "absolute", left: 60 * u, top: 145 * u, fontSize: 25 * u, opacity: 0.85, maxWidth: 960 * u }}>
        Educational visualisation colours — not conductor identification colours. Speed is constant; particle density shows power (kW); arrows show direction.
      </div>
      {ROWS.map((r, i) => {
        const c = ENERGY_FLOW_COLORS[r.warning ? "fault" : r.category];
        return (
          <div key={`t${i}`} style={{ ...text, position: "absolute", left: 60 * u, top: (TOP + i * ROW_H + 14) * u, display: "flex", gap: 16 * u, alignItems: "baseline", color: r.light ? "#0F172A" : "#F8FAFC" }}>
            <span style={{ fontSize: 26 * u, fontWeight: 800, color: r.light ? "#0F172A" : c, fontVariantNumeric: "tabular-nums" }}>{c}</span>
            <span style={{ fontSize: 26 * u, fontWeight: 700 }}>{r.label ? ENERGY_FLOW_LABELS_TH[r.label] : "⚠ คำเตือน"}</span>
            <span style={{ fontSize: 21 * u, opacity: 0.8 }}>
              {r.title}
              {r.kw > 0 ? ` · ${r.kw} kW` : ""}
            </span>
          </div>
        );
      })}
      <div style={{ ...text, position: "absolute", left: 60 * u, top: DEN_TOP * u, fontSize: 30 * u, fontWeight: 800 }}>Particle density = power (reference 5 kW)</div>
      {DENSITY.map((kw, i) => (
        <div key={`dl${i}`} style={{ ...text, position: "absolute", left: 60 * u, top: (DEN_TOP + 60 + i * DEN_H) * u, fontSize: 30 * u, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {kw} kW
        </div>
      ))}
      <div style={{ ...text, position: "absolute", left: 60 * u, bottom: 46 * u, fontSize: 21 * u, opacity: 0.75 }}>
        On-grid and hybrid are configurations, not energy sources — they have no colour of their own.
      </div>
    </AbsoluteFill>
  );
}
