/** Data-only description of a reusable character. */

export type BodyPlan = "squirrel-mascot" | "stylized-human" | "basic-human";

/** Skeleton measurements in metres, used by renderers and by clips (e.g. sit). */
export interface BodyDims {
  /** Hip joint height above the floor when standing. */
  hipHeight: number;
  thigh: number;
  shin: number;
  /** Shoulder joint height above the hip joint. */
  shoulderAboveHip: number;
  shoulderHalfWidth: number;
  upperArm: number;
  forearm: number;
  /** Eye height above the floor (look-at, eye-contact, camera framing). */
  eyeHeight: number;
}

export interface CharacterDefinition {
  id: string;
  displayName: string;
  displayNameTh?: string;
  /** temporary = pipeline placeholder; prototype = awaiting visual approval; approved = locked. */
  status: "temporary" | "prototype" | "approved";
  bodyPlan: BodyPlan;
  /** Total height including headwear, metres. */
  heightM: number;
  body: BodyDims;
  /** Named material colours; keys depend on the body plan. */
  colors: Record<string, string>;
  /** Seed so idle motion of different characters is not in sync. */
  seed: number;
  /** Default design variant (e.g. Sunny's face); episodes can override per cast member. */
  defaultVariant?: string;
  /** Default expression when no expression track is given. */
  defaultExpression: string;
  /** Free text: personality / role, for writers and the studio UI. */
  role?: string;
}
