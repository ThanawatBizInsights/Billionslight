/**
 * Facial expression presets (data). Episodes select them by ID on a
 * character's `expression` track; the engine blends between them. Clips such
 * as `talk` then layer mouth movement on top.
 */
import { NEUTRAL_FACE, type FaceState } from "./rig";

const f = (o: Partial<FaceState>): FaceState => ({ ...NEUTRAL_FACE, ...o });

export const EXPRESSIONS: Record<string, FaceState> = {
  neutral: f({}),
  happy: f({ smile: 0.85, browRaise: 0.25, squint: 0.2 }),
  talk: f({ smile: 0.45, browRaise: 0.15 }),
  surprised: f({ smile: 0, mouthOpen: 0.75, mouthRound: 1, browRaise: 1, eyelids: [-0.15, -0.15] }),
  thinking: f({ smile: 0.05, browRaise: -0.1, browTilt: 0.5, gaze: [0.25, 0.3], mouthRound: 0.4 }),
  confused: f({ smile: -0.25, browTilt: -0.9, browRaise: 0.2, mouthRound: 0.3, mouthOpen: 0.1 }),
  laughing: f({ smile: 1, mouthOpen: 0.8, squint: 1, eyelids: [0.85, 0.85], browRaise: 0.4 }),
  wink: f({ smile: 0.9, eyelids: [0, 0.95], squint: 0.4, browTilt: 0.3 }),
  concerned: f({ smile: -0.45, browRaise: 0.35, browTilt: 0, mouthOpen: 0.05 }),
  listening: f({ smile: 0.35, browRaise: 0.1 }),
  curious: f({ smile: 0.3, browRaise: 0.55, browTilt: 0.35, gaze: [0.1, 0.05] }),
  // gaze presets (character-local: + yaw = character's left)
  "look-left": f({ smile: 0.25, gaze: [0.38, 0] }),
  "look-right": f({ smile: 0.25, gaze: [-0.38, 0] }),
  "look-up": f({ smile: 0.2, browRaise: 0.3, gaze: [0, 0.3] }),
  "look-down": f({ smile: 0.15, browRaise: -0.05, gaze: [0, -0.3], eyelids: [0.25, 0.25] }),
  "eyes-closed": f({ smile: 0.3, eyelids: [1, 1] }),
};

export const EXPRESSION_IDS = Object.keys(EXPRESSIONS);

export function getExpression(id: string): FaceState {
  const e = EXPRESSIONS[id];
  if (!e) throw new Error(`Unknown expression "${id}"`);
  return e;
}
