/**
 * Environment registry. Scenes reference environments by ID; each entry
 * provides the 3D component, named anchors and cable routes for energy flows.
 * Adding an environment = adding an entry here. No episode code changes.
 */
import type { ReactNode } from "react";
import type { Vec3 } from "../../schemas/episode";
import type { EnergyVisual } from "../energy-flow/timeline";
import type { LightingPreset } from "../lighting/presets";
import { HOUSE_ANCHORS, HOUSE_CABLES, ModernThaiHouse } from "./ModernThaiHouse";
import { deriveEnergyState } from "../energy-flow/scenario";

export interface EnvironmentRenderProps {
  frame: number;
  fps: number;
  lighting: LightingPreset;
  energy: EnergyVisual | null;
  options: Record<string, unknown>;
}

export interface EnvironmentDefinition {
  id: string;
  label: string;
  anchors: Record<string, Vec3>;
  /** Cable route per flow ID (or helper routes such as "meter-to-house"). */
  cables: Record<string, Vec3[]>;
  /** Default camera focus. */
  focus: Vec3;
  render: (p: EnvironmentRenderProps) => ReactNode;
}

const IDLE_STATE = deriveEnergyState({
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

export const ENVIRONMENTS: Record<string, EnvironmentDefinition> = {
  "modern-thai-house": {
    id: "modern-thai-house",
    label: "Modern Thai house",
    anchors: HOUSE_ANCHORS,
    cables: HOUSE_CABLES,
    focus: [0.5, 3, 1],
    render: ({ frame, lighting, energy, options }) => (
      <ModernThaiHouse
        frame={frame}
        interiorGlow={lighting.interiorGlow * (energy?.housePower ?? 1)}
        energy={energy?.state ?? IDLE_STATE}
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
