/**
 * Lighting presets (data). The LightingRig renders any preset; scenes pick by ID.
 * Phase 1 ships the daytime/golden set plus night/outage for state contrast.
 */
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
}

export const LIGHTING_PRESETS: Record<string, LightingPreset> = {
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
  },
};

export function getLightingPreset(id: string): LightingPreset {
  const p = LIGHTING_PRESETS[id];
  if (!p) throw new Error(`Lighting preset "${id}" not found`);
  return p;
}
