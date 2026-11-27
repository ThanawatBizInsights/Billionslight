/**
 * Renders any CharacterDefinition by dispatching on its body plan, and
 * scales the body plan so the character matches its approved height.
 */
import type { ReactNode } from "react";
import { Humanoid } from "./Humanoid";
import type { Pose } from "./rig";
import { SquirrelMascot } from "./SquirrelMascot";
import { StylizedHuman } from "./StylizedHuman";
import type { Attachments } from "./parts";
import type { BodyPlan, CharacterDefinition } from "./types";

/**
 * Height of each body plan as modelled (metres, including headwear/hair), at
 * scale 1. Measured from the side-view scale render; keep in sync when the
 * geometry changes (tests/characters.test.ts guards the ratio).
 */
export const NATURAL_HEIGHT: Record<BodyPlan, number> = {
  "squirrel-mascot": 1.194,
  "stylized-human": 1.795,
  "basic-human": 1.75,
};

export const modelScale = (def: CharacterDefinition) => (def.bodyPlan === "basic-human" ? 1 : def.heightM / NATURAL_HEIGHT[def.bodyPlan]);

/** World-space eye height for look-at and eye contact. */
export const eyeHeightWorld = (def: CharacterDefinition) => def.body.eyeHeight * modelScale(def);

export function CharacterModel({
  def,
  pose,
  blink,
  look = [0, 0],
  position = [0, 0, 0],
  rotationY = 0,
  attachments,
  children,
}: {
  def: CharacterDefinition;
  pose: Pose;
  blink: number;
  look?: [number, number];
  position?: [number, number, number];
  rotationY?: number;
  attachments?: Attachments;
  children?: ReactNode;
}) {
  const s = modelScale(def);
  let body: ReactNode;
  if (def.bodyPlan === "squirrel-mascot") body = <SquirrelMascot def={def} pose={pose} blink={blink} look={look} attachments={attachments} />;
  else if (def.bodyPlan === "stylized-human") body = <StylizedHuman def={def} pose={pose} blink={blink} look={look} attachments={attachments} />;
  else body = <Humanoid def={def} pose={pose} blink={blink} look={look} />;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group scale={s}>{body}</group>
      {children}
    </group>
  );
}
