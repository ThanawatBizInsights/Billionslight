/**
 * Environment registry. Scenes reference environments by ID; each entry
 * provides the 3D component, named anchors, cable routes for energy flows,
 * and default values for its animatable state (power, lights, tv …).
 * Adding an environment = adding an entry here. No episode code changes.
 */
import type { ReactNode } from "react";
import * as THREE from "three";
import type { Vec3 } from "../../schemas/episode";
import type { EnergyVisual } from "../energy-flow/timeline";
import { presetDaylight, type LightingPreset } from "../lighting/presets";
import { deriveEnergyState, type EnergyState } from "../energy-flow/scenario";
import { HOUSE_ANCHORS, HOUSE_CABLES, ModernThaiHouse } from "./ModernThaiHouse";
import { ModernSolarHouse, SOLAR_HOUSE_ANCHORS, SOLAR_HOUSE_CABLES } from "./ModernSolarHouse";
import { LIVING_ROOM_ANCHORS, LivingRoom } from "./LivingRoom";
import { GARAGE_ANCHORS, GarageServiceArea, garageCables } from "./GarageServiceArea";
import { ReviewStudio } from "./ReviewStudio";

export interface EnvironmentRenderProps {
  frame: number;
  fps: number;
  lighting: LightingPreset;
  energy: EnergyVisual | null;
  options: Record<string, unknown>;
  /** Sampled environment state (0–1 values), defaults merged with the scene's state track. */
  state: Record<string, number>;
}

export interface EnvironmentDefinition {
  id: string;
  label: string;
  anchors: Record<string, Vec3>;
  /** Cable route per flow ID (static, or computed from scene options). */
  cables: Record<string, Vec3[]> | ((options: Record<string, unknown>) => Record<string, Vec3[]>);
  /** Default camera focus. */
  focus: Vec3;
  /** Sun shadow frustum half-size (interiors use small values for crisp shadows). */
  shadowExtent?: number;
  /** Render the sky dome (false for closed interiors / studio backdrops). */
  skyVisible?: boolean;
  /** Atmosphere particle volume. */
  atmosphere?: { center: Vec3; size: Vec3; count: number };
  /** Adjust the global lighting for this set (e.g. interiors: warm floor bounce, no outdoor fog). */
  adjustLighting?: (preset: LightingPreset) => LightingPreset;
  /** Default state values given the lighting and electrical state. */
  defaultState?: (lighting: LightingPreset, energy: EnergyVisual | null) => Record<string, number>;
  render: (p: EnvironmentRenderProps) => ReactNode;
}

export const IDLE_ENERGY_STATE: EnergyState = deriveEnergyState({
  inverterType: "grid-tied",
  gridStatus: "connected",
  solarIrradiance: 0,
  pvRatedKw: 5,
  inverterRatedKw: 5,
  householdLoadKw: 0,
  backupLoadKw: 0,
  battery: { present: false, capacityKwh: 0, stateOfCharge: 0, maxPowerKw: 0 },
  backup: { backupOutputConfigured: false, gridIsolationDevice: false, loadsOnBackupCircuit: false },
  exportPermitted: false,
  inverterFault: false,
});

/** Interiors: bounce light comes from wood floors/cream walls, not grass; no outdoor haze. */
const interiorLighting = (p: LightingPreset): LightingPreset => ({
  ...p,
  hemisphere: { ...p.hemisphere, sky: "#" + new THREE.Color(p.hemisphere.sky).lerp(new THREE.Color("#FFF4E4"), 0.55 * presetDaylight(p)).getHexString(), ground: "#B89A7A", intensity: p.hemisphere.intensity * 0.95 },
  ambient: { ...p.ambient, color: presetDaylight(p) > 0.3 ? "#FFF3E6" : p.ambient.color, intensity: p.ambient.intensity * (0.8 + 0.35 * presetDaylight(p)) },
  fog: { ...p.fog, near: 40, far: 200 },
});

/** Lights default to on when the preset is dark enough to need them. */
const lightsFor = (l: LightingPreset) => (l.interiorGlow > 0.3 ? 1 : 0);

export const ENVIRONMENTS: Record<string, EnvironmentDefinition> = {
  "review-studio": {
    id: "review-studio",
    label: "Review studio (identity sheets)",
    anchors: { center: [0, 1, 0] },
    cables: {},
    focus: [0, 0.9, 0],
    shadowExtent: 4,
    skyVisible: false,
    render: ({ options }) => (
      <ReviewStudio
        ruler={options.ruler === true}
        seats={(options.seats as [number, number, number][] | undefined) ?? []}
        {...(options.backdrop === "navy" ? { floorColor: "#1B2C4F", wallColor: "#0F2747" } : {})}
      />
    ),
  },
  "modern-thai-house": {
    id: "modern-thai-house",
    label: "ENV01 Modern Thai solar house",
    anchors: SOLAR_HOUSE_ANCHORS,
    cables: SOLAR_HOUSE_CABLES,
    focus: [0.5, 3.2, 0],
    shadowExtent: 15,
    atmosphere: { center: [1, 3, 5], size: [20, 7, 12], count: 70 },
    defaultState: (l, e) => ({ power: e?.housePower ?? 1, lights: lightsFor(l), gardenLights: lightsFor(l) }),
    render: ({ frame, lighting, energy, state }) => (
      <ModernSolarHouse
        frame={frame}
        interiorGlow={Math.max(lighting.interiorGlow * state.lights!, 0) * state.power!}
        energy={energy?.state ?? IDLE_ENERGY_STATE}
        pvGeneration={energy?.pvGeneration ?? 0}
        gardenLights={state.gardenLights! * state.power!}
      />
    ),
  },
  "living-room": {
    id: "living-room",
    label: "ENV02 Living room",
    anchors: LIVING_ROOM_ANCHORS,
    cables: {},
    focus: [-0.3, 1.0, -0.6],
    shadowExtent: 5,
    skyVisible: false,
    atmosphere: { center: [-0.3, 1.4, 0], size: [5, 2.4, 4], count: 30 },
    adjustLighting: interiorLighting,
    defaultState: (l, e) => ({ power: e?.housePower ?? 1, lights: lightsFor(l), tv: 0, ac: 0, daylight: presetDaylight(l) }),
    render: ({ frame, state }) => <LivingRoom frame={frame} state={{ power: state.power!, lights: state.lights!, tv: state.tv!, ac: state.ac!, daylight: state.daylight! }} />,
  },
  "garage-service-area": {
    id: "garage-service-area",
    label: "ENV03 Garage & electrical service area",
    anchors: GARAGE_ANCHORS,
    cables: (o) => garageCables(o.system === "hybrid", o.system === "hybrid" && o.battery === true),
    focus: [0, 1.3, -2.4],
    shadowExtent: 5,
    skyVisible: false,
    atmosphere: { center: [0, 1.5, 0], size: [5, 2.4, 5], count: 25 },
    adjustLighting: interiorLighting,
    defaultState: (l, e) => ({ power: e ? Math.max(e.housePower, e.backupPower) : 1, lights: 1, daylight: presetDaylight(l) }),
    render: ({ frame, energy, options, state }) => (
      <GarageServiceArea frame={frame} energy={energy?.state ?? IDLE_ENERGY_STATE} options={options} lights={state.lights! * state.power!} />
    ),
  },
  "gable-house-prototype": {
    id: "gable-house-prototype",
    label: "Phase 1 gable-roof house (superseded prototype, kept for the Phase 1 test)",
    anchors: HOUSE_ANCHORS,
    cables: HOUSE_CABLES,
    focus: [0.5, 3, 1],
    defaultState: (_l, e) => ({ power: e?.housePower ?? 1, lights: 1 }),
    render: ({ frame, lighting, energy, options, state }) => (
      <ModernThaiHouse
        frame={frame}
        interiorGlow={lighting.interiorGlow * state.power!}
        energy={energy?.state ?? IDLE_ENERGY_STATE}
        pvGeneration={energy?.pvGeneration ?? 0}
        showBattery={options.showBattery === true}
        inverterVariant={options.inverterVariant === "hybrid" ? "hybrid" : "grid-tied"}
      />
    ),
  },
};

export function getEnvironment(id: string): EnvironmentDefinition {
  const e = ENVIRONMENTS[id];
  if (!e) throw new Error(`Environment "${id}" not found`);
  return e;
}

export const environmentCables = (env: EnvironmentDefinition, options: Record<string, unknown>) =>
  typeof env.cables === "function" ? env.cables(options) : env.cables;
