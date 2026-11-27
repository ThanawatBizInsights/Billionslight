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

// ------------------------------------------------------- standard (links)
import { deriveFlowLinks, householdSupply, type FlowLink, type LinkId } from "./links";

export interface FlowLinkSample {
  links: Record<LinkId, FlowLink>;
  household: { kw: number; circuit: "house" | "backup" | "none" };
  state: EnergyState;
  scenario: ElectricalScenario;
}

/**
 * Links at a frame. kW cross-fades over the keyframe's transition; if a link
 * reverses direction (import ↔ export, charge ↔ discharge) the old flow fades
 * out before the new one fades in, so particles never slide "through zero".
 */
export function sampleFlowLinks(keys: ElectricalKey[], frame: number): FlowLinkSample | null {
  if (keys.length === 0) return null;
  const sorted = [...keys].sort((a, b) => a.frame - b.frame);
  let idx = 0;
  for (let i = 0; i < sorted.length; i++) if (sorted[i]!.frame <= frame) idx = i;
  const cur = sorted[idx]!;
  const curState = deriveEnergyState(cur.scenario);
  const curLinks = deriveFlowLinks(curState, cur.scenario);
  const curHouse = householdSupply(curState, cur.scenario);
  const out: FlowLinkSample = { links: curLinks, household: curHouse, state: curState, scenario: cur.scenario };
  if (idx === 0 || cur.transitionFrames === 0) return out;
  const t = progress(frame, cur.frame, cur.frame + cur.transitionFrames, "easeInOut");
  if (t >= 1) return out;
  const prev = sorted[idx - 1]!;
  const prevState = deriveEnergyState(prev.scenario);
  const prevLinks = deriveFlowLinks(prevState, prev.scenario);
  const links = {} as Record<LinkId, FlowLink>;
  for (const id of Object.keys(curLinks) as LinkId[]) {
    const a = prevLinks[id];
    const b = curLinks[id];
    if (a.active && b.active && a.direction !== b.direction) {
      links[id] = t < 0.5 ? { ...a, kw: a.kw * (1 - 2 * t) } : { ...b, kw: b.kw * (2 * t - 1) };
    } else if (!b.active && a.active) {
      links[id] = { ...a, kw: a.kw * (1 - t), warning: b.warning, label: b.label };
    } else {
      links[id] = { ...b, kw: lerp(a.active ? a.kw : 0, b.kw, t) };
    }
  }
  const prevHouse = householdSupply(prevState, prev.scenario);
  const household = curHouse.circuit === prevHouse.circuit ? { ...curHouse, kw: lerp(prevHouse.kw, curHouse.kw, t) } : t < 0.5 ? { ...prevHouse, kw: prevHouse.kw * (1 - 2 * t) } : { ...curHouse, kw: curHouse.kw * (2 * t - 1) };
  return { ...out, links, household };
}
