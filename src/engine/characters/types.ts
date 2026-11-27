/** Data-only description of a reusable character. */
export interface CharacterDefinition {
  id: string;
  displayName: string;
  /** Prototype geometry pending approval. Approved designs are locked (see CLAUDE.md). */
  status: "temporary" | "prototype" | "approved";
  colors: {
    skin: string;
    hair: string;
    shirt: string;
    shirtAccent: string;
    pants: string;
    shoes: string;
    eyes: string;
    mouth: string;
  };
  /** Overall scale (1 = ~1.65 m adult). */
  scale: number;
  /** Head radius relative to default 0.2 (stylised large heads). */
  headScale: number;
  build: { shoulderWidth: number; torsoWidth: number; torsoDepth: number };
  accessories: Array<"hard-hat" | "safety-glasses" | "tool-belt" | "tablet" | "id-badge">;
  /** Seed so idle motion of different characters is not in sync. */
  seed: number;
}
