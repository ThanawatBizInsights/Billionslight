import { Scene } from "../../src/schemas/episode";

/** Minimal valid scene for schema tests. */
export const EpisodeScene = (o: Record<string, unknown> = {}) =>
  Scene.parse({ id: "s", durationInFrames: 30, environment: { id: "living-room" }, lighting: { preset: "evening" }, camera: {}, ...o });
