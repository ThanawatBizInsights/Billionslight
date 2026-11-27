/**
 * Character library.
 *
 * IMPORTANT: "temp-engineer" is a TEMPORARY placeholder used only for the
 * Phase 1 foundation test. It is NOT Sunny. Sunny will be built from the
 * official character sheet (public/assets/characters/sunny/) and requires
 * visual approval before use in episodes.
 */
import type { CharacterDefinition } from "./types";

export const TEMP_ENGINEER: CharacterDefinition = {
  id: "temp-engineer",
  displayName: "Temporary engineer (placeholder)",
  status: "temporary",
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
  scale: 1,
  headScale: 1.25,
  build: { shoulderWidth: 0.24, torsoWidth: 0.42, torsoDepth: 0.26 },
  accessories: ["hard-hat", "id-badge"],
  seed: 101,
};

export const CHARACTER_LIBRARY: Record<string, CharacterDefinition> = {
  [TEMP_ENGINEER.id]: TEMP_ENGINEER,
};

export function getCharacter(id: string): CharacterDefinition {
  const c = CHARACTER_LIBRARY[id];
  if (!c) throw new Error(`Character "${id}" is not in the library`);
  return c;
}
