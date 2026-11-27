/**
 * Lighting presets (data). The LightingRig renders any preset; scenes pick by ID.
 * Phase 1 ships the daytime/golden set plus night/outage for state contrast.
 */
import * as THREE from "three";
import type { Vec3 } from "../../schemas/episode";

export interface LightingPreset {
  id: string;
  label: string;
  sky: { top: string; horizon: string; bottom: string };
  fog: { color: string; near: number; far: number };
  ambient: { color: string; intensity: number };
  hemisphere: { sky: string; ground: string; intensity: number };
  sun: { color: string; intensity: number; position: Vec3; visibleDisc: boolean };
  /** Cool rim / fill light from the opposite side. */
  fill: { color: string; intensity: number; position: Vec3 };
  /** Interior windows emissive strength (0 = lights off). */
  interiorGlow: number;
  /** Max solar irradiance plausible under this preset (guides scenario authors). */
  typicalIrradiance: number;
  exposure: number;
  /** Brightness of views through windows (0 night … 1 full day). Defaults from the sun. */
  daylight?: number;
}


const mixColor = (a: string, b: string, t: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
const mixV = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [mixN(a[0], b[0], t), mixN(a[1], b[1], t), mixN(a[2], b[2], t)];

export const presetDaylight = (p: LightingPreset) => p.daylight ?? (p.sun.intensity >= 1.5 && p.interiorGlow < 0.5 ? 1 : p.interiorGlow > 0.8 ? 0.15 : 0.5);

/** Linear blend of two lighting presets (colours, intensities, positions). */
export function blendPresets(a: LightingPreset, b: LightingPreset, t: number): LightingPreset {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    id: `${a.id}->${b.id}`,
    label: `${a.label} → ${b.label}`,
    sky: { top: mixColor(a.sky.top, b.sky.top, t), horizon: mixColor(a.sky.horizon, b.sky.horizon, t), bottom: mixColor(a.sky.bottom, b.sky.bottom, t) },
    fog: { color: mixColor(a.fog.color, b.fog.color, t), near: mixN(a.fog.near, b.fog.near, t), far: mixN(a.fog.far, b.fog.far, t) },
    ambient: { color: mixColor(a.ambient.color, b.ambient.color, t), intensity: mixN(a.ambient.intensity, b.ambient.intensity, t) },
    hemisphere: { sky: mixColor(a.hemisphere.sky, b.hemisphere.sky, t), ground: mixColor(a.hemisphere.ground, b.hemisphere.ground, t), intensity: mixN(a.hemisphere.intensity, b.hemisphere.intensity, t) },
    sun: { color: mixColor(a.sun.color, b.sun.color, t), intensity: mixN(a.sun.intensity, b.sun.intensity, t), position: mixV(a.sun.position, b.sun.position, t), visibleDisc: t < 0.5 ? a.sun.visibleDisc : b.sun.visibleDisc },
    fill: { color: mixColor(a.fill.color, b.fill.color, t), intensity: mixN(a.fill.intensity, b.fill.intensity, t), position: mixV(a.fill.position, b.fill.position, t) },
    interiorGlow: mixN(a.interiorGlow, b.interiorGlow, t),
    typicalIrradiance: mixN(a.typicalIrradiance, b.typicalIrradiance, t),
    exposure: mixN(a.exposure, b.exposure, t),
    daylight: mixN(presetDaylight(a), presetDaylight(b), t),
  };
}

export const LIGHTING_PRESETS: Record<string, LightingPreset> = {
  "review-studio": {
    id: "review-studio",
    label: "Review studio (soft key + fill)",
    sky: { top: "#DCD7E2", horizon: "#E8E4EA", bottom: "#E8E4EA" },
    fog: { color: "#E3DFE7", near: 30, far: 200 },
    ambient: { color: "#FFFFFF", intensity: 0.55 },
    hemisphere: { sky: "#F4F1FF", ground: "#B9AFA6", intensity: 0.7 },
    sun: { color: "#FFF4E6", intensity: 2.1, position: [-4, 7, 6], visibleDisc: false },
    fill: { color: "#C9D8FF", intensity: 0.7, position: [5, 3, 4] },
    interiorGlow: 0,
    typicalIrradiance: 0,
    exposure: 1,
  },
  "portrait-warm": {
    id: "portrait-warm",
    label: "Cinematic portrait (warm amber key, soft navy shadows)",
    sky: { top: "#0F2747", horizon: "#1B3563", bottom: "#0F2747" },
    fog: { color: "#0F2747", near: 40, far: 200 },
    ambient: { color: "#6F86C8", intensity: 0.28 },
    hemisphere: { sky: "#3A5486", ground: "#2A1E1A", intensity: 0.45 },
    sun: { color: "#FFB867", intensity: 2.6, position: [-5, 5, 6], visibleDisc: false },
    fill: { color: "#5B74C8", intensity: 0.9, position: [6, 2, 2] },
    interiorGlow: 0.6,
    typicalIrradiance: 0,
    exposure: 1.05,
    daylight: 0.1,
  },
  "bright-morning": {
    id: "bright-morning",
    label: "Bright morning",
    sky: { top: "#5D8FD6", horizon: "#CFE3F5", bottom: "#E9EEF2" },
    fog: { color: "#C8DAEC", near: 30, far: 90 },
    ambient: { color: "#FFFFFF", intensity: 0.35 },
    hemisphere: { sky: "#BFD9FF", ground: "#6D8A5A", intensity: 0.7 },
    sun: { color: "#FFF1D6", intensity: 2.4, position: [-14, 16, 12], visibleDisc: false },
    fill: { color: "#9FC2FF", intensity: 0.35, position: [12, 6, -8] },
    interiorGlow: 0,
    typicalIrradiance: 0.6,
    exposure: 1,
  },
  "midday-sun": {
    id: "midday-sun",
    label: "Midday sunlight",
    sky: { top: "#3F7FD9", horizon: "#BFE0FA", bottom: "#E4ECF2" },
    fog: { color: "#BBD6EE", near: 35, far: 100 },
    ambient: { color: "#FFFFFF", intensity: 0.4 },
    hemisphere: { sky: "#CFE4FF", ground: "#6B8F55", intensity: 0.75 },
    sun: { color: "#FFF7E8", intensity: 2.8, position: [-6, 24, 8], visibleDisc: false },
    fill: { color: "#A9C8FF", intensity: 0.3, position: [10, 8, -10] },
    interiorGlow: 0,
    typicalIrradiance: 1,
    exposure: 1,
  },
  "golden-hour": {
    id: "golden-hour",
    label: "Golden hour",
    sky: { top: "#1E3366", horizon: "#F6B36B", bottom: "#FBD6A0" },
    fog: { color: "#E7A978", near: 22, far: 75 },
    ambient: { color: "#FFE2C2", intensity: 0.28 },
    hemisphere: { sky: "#8EA7E0", ground: "#6A5A3E", intensity: 0.55 },
    sun: { color: "#FFC27A", intensity: 3.0, position: [-18, 8, 10], visibleDisc: true },
    fill: { color: "#6E86D6", intensity: 0.55, position: [14, 6, -6] },
    interiorGlow: 0.55,
    typicalIrradiance: 0.55,
    exposure: 1,
  },
  evening: {
    id: "evening",
    label: "Evening",
    sky: { top: "#0E1A33", horizon: "#3A5486", bottom: "#6E7FB0" },
    fog: { color: "#2A3B66", near: 18, far: 60 },
    ambient: { color: "#9FB2E6", intensity: 0.22 },
    hemisphere: { sky: "#5B74B8", ground: "#1C2238", intensity: 0.45 },
    sun: { color: "#9DB4FF", intensity: 0.6, position: [12, 14, -8], visibleDisc: false },
    fill: { color: "#FFB867", intensity: 0.25, position: [-8, 3, 10] },
    interiorGlow: 1,
    typicalIrradiance: 0,
    exposure: 1.1,
  },
  night: {
    id: "night",
    label: "Night (lights on)",
    sky: { top: "#0A1530", horizon: "#22355F", bottom: "#2A3B66" },
    fog: { color: "#1A2848", near: 18, far: 60 },
    ambient: { color: "#8EA2D8", intensity: 0.18 },
    hemisphere: { sky: "#4A63A6", ground: "#141A2C", intensity: 0.38 },
    sun: { color: "#A9BCF5", intensity: 0.55, position: [10, 16, -6], visibleDisc: false },
    fill: { color: "#FFB867", intensity: 0.2, position: [-8, 3, 10] },
    interiorGlow: 1,
    typicalIrradiance: 0,
    exposure: 1.1,
    daylight: 0,
  },
  "power-outage": {
    id: "power-outage",
    label: "Power outage (night)",
    sky: { top: "#08101F", horizon: "#1A2747", bottom: "#24335A" },
    fog: { color: "#121C33", near: 15, far: 50 },
    ambient: { color: "#7F92C8", intensity: 0.14 },
    hemisphere: { sky: "#3B4F86", ground: "#10141F", intensity: 0.3 },
    sun: { color: "#8FA6E8", intensity: 0.35, position: [12, 14, -8], visibleDisc: false },
    fill: { color: "#5A6FA8", intensity: 0.15, position: [-8, 3, 10] },
    interiorGlow: 0,
    typicalIrradiance: 0,
    exposure: 1.15,
    daylight: 0.03,
  },
};

export function getLightingPreset(id: string): LightingPreset {
  const p = LIGHTING_PRESETS[id];
  if (!p) throw new Error(`Lighting preset "${id}" not found`);
  return p;
}
