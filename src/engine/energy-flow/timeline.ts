/**
 * Electrical state over time. Each keyframe holds a full scenario; the state
 * is derived (deriveEnergyState) and visual intensities cross-fade between
 * consecutive states. The DISCRETE state switches at the keyframe frame so
 * equipment logic (e.g. anti-islanding shutdown) is never "half applied".
 */
import type { ElectricalScenario } from "../../schemas/episode";
import { lerp, progress } from "../animation/core";
import { deriveEnergyState, type EnergyState, type FlowId } from "./scenario";

export interface ElectricalKey {
  frame: number;
  scenario: ElectricalScenario;
  transitionFrames: number;
}

export interface EnergyVisual {
  state: EnergyState;
  /** 0–1 visual intensity per flow. */
  intensity: Record<FlowId, number>;
  /** 0–1: house circuits powered (drives interior lights, appliance LEDs). */
  housePower: number;
  backupPower: number;
  /** 0–1 PV generation relative to rating (panel sheen, sun glints). */
  pvGeneration: number;
}

const REFERENCE_KW = 5;

function visualOf(state: EnergyState, s: ElectricalScenario): Omit<EnergyVisual, "state"> {
  const intensity = {} as Record<FlowId, number>;
  for (const f of Object.values(state.flows)) {
    intensity[f.id] = f.active ? 0.35 + 0.65 * Math.min(1, f.kw / REFERENCE_KW) : 0;
  }
  return {
    intensity,
    housePower: state.houseLoadsPowered ? 1 : 0,
    backupPower: state.backupLoadsPowered ? 1 : 0,
    pvGeneration: s.pvRatedKw > 0 ? state.pvUsedKw / s.pvRatedKw : 0,
  };
}

export function sampleElectrical(keys: ElectricalKey[], frame: number): EnergyVisual | null {
  if (keys.length === 0) return null;
  const sorted = [...keys].sort((a, b) => a.frame - b.frame);
  let idx = 0;
  for (let i = 0; i < sorted.length; i++) if (sorted[i]!.frame <= frame) idx = i;
  const cur = sorted[idx]!;
  const curState = deriveEnergyState(cur.scenario);
  const curVis = visualOf(curState, cur.scenario);
  if (idx === 0 || cur.transitionFrames === 0) return { state: curState, ...curVis };
  const prev = sorted[idx - 1]!;
  const prevVis = visualOf(deriveEnergyState(prev.scenario), prev.scenario);
  const t = progress(frame, cur.frame, cur.frame + cur.transitionFrames, "easeInOut");
  const intensity = {} as Record<FlowId, number>;
  for (const id of Object.keys(curVis.intensity) as FlowId[]) intensity[id] = lerp(prevVis.intensity[id], curVis.intensity[id], t);
  return {
    state: curState,
    intensity,
    housePower: lerp(prevVis.housePower, curVis.housePower, t),
    backupPower: lerp(prevVis.backupPower, curVis.backupPower, t),
    pvGeneration: lerp(prevVis.pvGeneration, curVis.pvGeneration, t),
  };
}
