/**
 * Character library (data). Characters are selected by ID from episodes.
 *
 * - `sunny` and `homeowner_male_01` (Ton) are Phase 2 PROTOTYPES awaiting
 *   visual approval. Their identities follow the approved design decisions
 *   (docs/design-decisions-phase-2.md) and must not be redesigned.
 * - `homeowner_female_01` (May) is RESERVED: listed so IDs stay stable, but
 *   not built or usable until approved.
 * - `temp-engineer` is the Phase 1 placeholder; kept only for the Phase 1 test.
 */
import type { CharacterDefinition } from "./types";

export const SUNNY: CharacterDefinition = {
  id: "sunny",
  displayName: "Sunny",
  displayNameTh: "ซันนี่",
  status: "prototype",
  bodyPlan: "squirrel-mascot",
  heightM: 1.35,
  // body plan measurements at scale 1 (scaled to heightM by CharacterModel)
  body: { hipHeight: 0.27, thigh: 0.11, shin: 0.1, shoulderAboveHip: 0.27, shoulderHalfWidth: 0.2, upperArm: 0.11, forearm: 0.1, eyeHeight: 0.81 },
  colors: {
    fur: "#E8913A",
    furLight: "#F4AA55",
    cream: "#FDE6CD",
    innerEar: "#F4B6A8",
    nose: "#7A4127",
    iris: "#7A4BA8",
    pupil: "#2A1638",
    brow: "#B96A2C",
    blush: "#F59A8A",
    mouthLine: "#6B3324",
    mouthInner: "#7A2630",
    tongue: "#F08A8A",
    helmet: "#F6F4F2",
    helmetRidge: "#ECE9E6",
    uniform: "#1F2A4A",
    uniformPanel: "#2F7DE1",
    trim: "#E0A93B",
    badge: "#FBBF24",
    boot: "#1A2238",
    sole: "#3A4466",
  },
  seed: 7,
  defaultExpression: "happy",
  role: "Billionslight solar & electrical guide. Friendly technical expert; explains through demonstrations and everyday examples.",
};

export const TON: CharacterDefinition = {
  id: "homeowner_male_01",
  displayName: "Ton",
  displayNameTh: "ต้น",
  status: "prototype",
  bodyPlan: "stylized-human",
  heightM: 1.7,
  body: { hipHeight: 0.76, thigh: 0.38, shin: 0.33, shoulderAboveHip: 0.42, shoulderHalfWidth: 0.24, upperArm: 0.26, forearm: 0.24, eyeHeight: 1.48 },
  colors: {
    skin: "#E9B48A",
    skinShade: "#DDA37A",
    hair: "#3B2A24",
    hairStyle: "geometric-tousled",
    shirt: "#EFE6D6",
    collar: "#E4D8C4",
    button: "#BFB29C",
    sleeve: "short",
    trousers: "#1F2D52",
    belt: "#3A2E26",
    shoes: "#F4F4F2",
    sole: "#C9CCD2",
    eyes: "#241A18",
    mouthLine: "#5A2E26",
    mouthInner: "#6E2A2E",
    tongue: "#E88A88",
  },
  seed: 31,
  defaultExpression: "listening",
  role: "Main homeowner. Curious, friendly, occasionally humorous; asks practical questions about solar, bills, appliances and savings. Represents the audience.",
};

/** Phase 1 placeholder — not a production character. */
export const TEMP_ENGINEER: CharacterDefinition = {
  id: "temp-engineer",
  displayName: "Temporary engineer (placeholder)",
  status: "temporary",
  bodyPlan: "basic-human",
  heightM: 1.75,
  body: { hipHeight: 0.9, thigh: 0.42, shin: 0.4, shoulderAboveHip: 0.56, shoulderHalfWidth: 0.24, upperArm: 0.3, forearm: 0.27, eyeHeight: 1.6 },
  colors: {
    skin: "#E2B48C",
    hair: "#2B2320",
    shirt: "#1F3A66",
    shirtAccent: "#FFC53D",
    pants: "#3B4252",
    shoes: "#22262E",
    eyes: "#1A1A22",
    mouth: "#6B2E2E",
  },
  seed: 101,
  defaultExpression: "happy",
};

export const CHARACTER_LIBRARY: Record<string, CharacterDefinition> = {
  [SUNNY.id]: SUNNY,
  [TON.id]: TON,
  [TEMP_ENGINEER.id]: TEMP_ENGINEER,
};

/** IDs reserved for future characters (not usable until built and approved). */
export const RESERVED_CHARACTER_IDS = ["homeowner_female_01"] as const;

export function getCharacter(id: string): CharacterDefinition {
  const c = CHARACTER_LIBRARY[id];
  if (!c) {
    if ((RESERVED_CHARACTER_IDS as readonly string[]).includes(id)) throw new Error(`Character "${id}" is reserved and not yet available`);
    throw new Error(`Character "${id}" is not in the library`);
  }
  return c;
}
