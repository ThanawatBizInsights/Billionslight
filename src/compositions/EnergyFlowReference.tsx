/**
 * Energy-flow standard — reference sheet and cable-length test (review
 * compositions, 1080×1920). Every line is drawn by the production
 * EnergyFlowPath with the shared tokens, so the sheet shows exactly what
 * episodes use. (The boards' sun/arc header mark is not the official logo and
 * is deliberately not drawn here.)
 */
import { OrthographicCamera } from "@react-three/drei";
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { ENERGY_FLOW_COLORS, ENERGY_FLOW_LABELS_TH, type EnergyFlowCategory, type EnergyFlowLabelKey } from "../config/energy-flow";
import { EnergyFlowPath } from "../engine/energy-flow/EnergyFlowPath";
import { clampTravelSeconds, pulseFraction, pulseHead } from "../engine/energy-flow/pulse";
import { ensureFonts, THAI_FONT_STACK } from "../engine/subtitles/fonts";
import type { Vec3 } from "../schemas/episode";

const PX = 100; // pixels per world unit (orthographic, at 1080 wide)
const NAVY = "#0F2747";
const text = { fontFamily: THAI_FONT_STACK, color: "#F1F5F9" } as const;

function useFontsReady() {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    ensureFonts().then(() => continueRender(handle), () => continueRender(handle));
  }, [handle]);
}

/** Screen px → world (orthographic camera centred on the frame). */
const toWorld = (x: number, y: number, w: number, h: number, u: number): Vec3 => [(x - w / 2) / (PX * u), (h / 2 - y) / (PX * u), 0];

function Canvas({ children }: { children: React.ReactNode }) {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} dpr={1} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={PX * (width / 1080)} near={0.1} far={100} />
        <ambientLight intensity={1.2} />
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
}

interface Row {
  category: EnergyFlowCategory;
  direction: 1 | -1;
  label: EnergyFlowLabelKey | null;
  title: string;
  warning?: boolean;
}

const ROWS: Row[] = [
  { category: "solarDC", direction: 1, label: "solar", title: "Solar DC · PV → inverter · 3 kW" },
  { category: "utilityGridAC", direction: 1, label: "gridImport", title: "Grid AC · import (grid → house) · 2 kW" },
  { category: "utilityGridAC", direction: -1, label: "gridExport", title: "Grid AC · permitted export (house → grid) · 2 kW" },
  { category: "batteryDC", direction: 1, label: "batteryCharging", title: "Battery DC · charging (inverter → battery) · 3 kW" },
  { category: "batteryDC", direction: -1, label: "batteryDischarging", title: "Battery DC · discharging (battery → inverter) · 3 kW" },
  { category: "inverterAC", direction: 1, label: "inverterOutput", title: "Inverter AC output · inverter → board · 3 kW" },
  { category: "householdLoad", direction: 1, label: "householdUse", title: "Household loads · board → appliances · 2 kW" },
  { category: "inactive", direction: 1, label: "shutdown", title: "Inactive / isolated / disconnected · static, no pulse" },
  { category: "inactive", direction: 1, label: null, title: "Fault / warning · red indicator, stopped line", warning: true },
];

export function EnergyFlowReference() {
  useFontsReady();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const u = width / 1080;
  const TOP = 250;
  const ROW_H = 118;
  const LX0 = 640;
  const LX1 = 1040;
  const rowY = (i: number) => TOP + i * ROW_H + 58;
  // explainer line
  const EX_Y = 1530;
  const EX0 = 60;
  const EX1 = 1020;
  const exLen = (EX1 - EX0) / PX;
  const exPulse = pulseFraction(exLen);
  const exHead = pulseHead(frame, fps, exPulse, clampTravelSeconds());
  const headX = EX0 + Math.min(1, exHead) * (EX1 - EX0);
  const tailX = EX0 + Math.max(0, Math.min(1, exHead - exPulse * 0.75)) * (EX1 - EX0);
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <Canvas>
        {ROWS.map((r, i) => (
          <EnergyFlowPath key={i} points={[toWorld(LX0, rowY(i), width, height, u), toWorld((LX0 + LX1) / 2, rowY(i), width, height, u), toWorld(LX1, rowY(i), width, height, u)]} frame={frame} fps={fps} kw={0} direction={r.direction} category={r.category} warning={r.warning} pathScale={1.5} />
        ))}
        <EnergyFlowPath points={[toWorld(EX0, EX_Y, width, height, u), toWorld((EX0 + EX1) / 2, EX_Y, width, height, u), toWorld(EX1, EX_Y, width, height, u)]} frame={frame} fps={fps} kw={0} direction={1} category="solarDC" pathScale={2.2} />
      </Canvas>
      <div style={{ ...text, position: "absolute", left: 60 * u, top: 64 * u, fontSize: 50 * u, fontWeight: 800 }}>
        Billionslight · Energy-flow Standard <span style={{ color: ENERGY_FLOW_COLORS.solarDC }}>(V3)</span>
      </div>
      <div style={{ ...text, position: "absolute", left: 60 * u, top: 138 * u, fontSize: 23 * u, opacity: 0.85, maxWidth: 970 * u, lineHeight: 1.45 }}>
        Educational visualisation colours — not conductor identification colours. One coloured line per connection with one moving light: bright leading edge, fading tail. The leading edge faces the destination.
      </div>
      {ROWS.map((r, i) => {
        const c = ENERGY_FLOW_COLORS[r.warning ? "fault" : r.category];
        return (
          <div key={i} style={{ position: "absolute", left: 50 * u, top: (TOP + i * ROW_H + 14) * u, display: "flex", gap: 18 * u, alignItems: "center" }}>
            <span style={{ ...text, width: 132 * u, textAlign: "center", padding: `${8 * u}px 0`, borderRadius: 10 * u, background: c, color: r.category === "householdLoad" || r.category === "solarDC" ? "#0F172A" : "#FFFFFF", fontSize: 22 * u, fontWeight: 800 }}>{c}</span>
            <span style={{ display: "flex", flexDirection: "column", width: 430 * u }}>
              <span style={{ ...text, fontSize: 27 * u, fontWeight: 800, lineHeight: 1.35 }}>{r.label ? ENERGY_FLOW_LABELS_TH[r.label] : "⚠ คำเตือน"}</span>
              <span style={{ ...text, fontSize: 18 * u, opacity: 0.8, lineHeight: 1.35 }}>{r.title}</span>
            </span>
          </div>
        );
      })}
      <div style={{ ...text, position: "absolute", left: 60 * u, top: 1370 * u, fontSize: 32 * u, fontWeight: 800, color: ENERGY_FLOW_COLORS.solarDC }}>Moving light style (approved)</div>
      <div style={{ ...text, position: "absolute", left: 60 * u, top: 1420 * u, fontSize: 21 * u, opacity: 0.85, maxWidth: 960 * u }}>
        1 pulse per connection · 35 % of the cable · 1.2 s source → destination · constant thickness · never tied to kW
      </div>
      {exHead > 0.08 && exHead < 1.02 && (
        <>
          <div style={{ ...text, position: "absolute", left: headX * u, top: (EX_Y + 30) * u, transform: "translateX(-50%)", fontSize: 21 * u, whiteSpace: "nowrap" }}>▲ bright leading edge</div>
          {exHead - exPulse * 0.75 > 0.02 && <div style={{ ...text, position: "absolute", left: tailX * u, top: (EX_Y - 58) * u, transform: "translateX(-50%)", fontSize: 21 * u, opacity: 0.8, whiteSpace: "nowrap" }}>fading tail ▼</div>}
        </>
      )}
      <div style={{ ...text, position: "absolute", left: 60 * u, top: 1650 * u, fontSize: 21 * u, opacity: 0.8, maxWidth: 960 * u, lineHeight: 1.55 }}>
        • On-grid and hybrid are configurations, not energy sources — they have no colour of their own.
        <br />• kW values are shown in labels only; pulse speed, length and brightness are the same at every power level.
        <br />• Inactive = static grey (no pulse). Fault = red indicator on the affected equipment or connection.
      </div>
    </AbsoluteFill>
  );
}

/** Short, medium and long (curved) connections with the same pulse rules. */
export function EnergyFlowCableTest() {
  useFontsReady();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const u = width / 1080;
  const w = (x: number, y: number) => toWorld(x, y, width, height, u);
  const cables: { title: string; pts: Vec3[]; category: EnergyFlowCategory; dir: 1 | -1 }[] = [
    { title: "Short · 1.2 m (pulse adapted)", pts: [w(80, 420), w(140, 420), w(200, 420)], category: "inverterAC", dir: 1 },
    { title: "Medium · ~5 m, angled bends", pts: [w(80, 760), w(260, 640), w(480, 860), w(620, 700)], category: "batteryDC", dir: -1 },
    { title: "Long · ~14 m, rounded corners", pts: [w(80, 1120), w(900, 1120), w(1000, 1220), w(1000, 1420), w(300, 1420), w(220, 1560), w(940, 1560)], category: "utilityGridAC", dir: 1 },
  ];
  const ys = [340, 580, 1040];
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <Canvas>
        {cables.map((c, i) => (
          <EnergyFlowPath key={i} points={c.pts} frame={frame} fps={fps} kw={0} direction={c.dir} category={c.category} pathScale={2} />
        ))}
      </Canvas>
      <div style={{ ...text, position: "absolute", left: 60 * u, top: 70 * u, fontSize: 46 * u, fontWeight: 800 }}>Cable length test (V3)</div>
      <div style={{ ...text, position: "absolute", left: 60 * u, top: 140 * u, fontSize: 23 * u, opacity: 0.85, maxWidth: 960 * u, lineHeight: 1.45 }}>
        Same rules on every connection: one pulse, 1.2 s from source to destination, linear, seamless loop. The battery line runs in reverse (discharging) — the bright edge still faces the destination.
      </div>
      {cables.map((c, i) => (
        <div key={i} style={{ ...text, position: "absolute", left: 60 * u, top: ys[i]! * u, fontSize: 26 * u, fontWeight: 700 }}>
          {c.title}
        </div>
      ))}
    </AbsoluteFill>
  );
}
