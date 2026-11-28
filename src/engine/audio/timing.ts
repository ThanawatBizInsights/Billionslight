/**
 * Dialogue timing from REAL audio durations (pure).
 *
 * - A line starts at its authored `from`, or later if the previous line in the
 *   scene is still speaking (+ gap). Speech is never shortened or overlapped.
 * - A scene is extended (never shrunk) so the last line plus a tail fits.
 * - Episode-global dialogue intervals drive music ducking and subtitles.
 */
import { episodeDurationInFrames, sceneStartFrames, type Episode, type Scene } from "../../schemas/episode";

export const DIALOGUE_GAP_FRAMES = 6;
export const DIALOGUE_TAIL_FRAMES = 12;

export const msToFrames = (ms: number, fps: number) => Math.max(1, Math.ceil((ms / 1000) * fps));

/** Place a scene's lines (sorted by `from`) using their audio durations. */
export function layoutSceneDialogue(scene: Scene, fps: number, gap = DIALOGUE_GAP_FRAMES): Scene["dialogue"] {
  const sorted = [...scene.dialogue].sort((a, b) => a.from - b.from);
  let free = 0;
  return sorted.map((d) => {
    const dur = d.audio?.durationMs ? msToFrames(d.audio.durationMs, fps) : d.durationInFrames;
    const from = Math.max(d.from, free);
    if (dur) free = from + dur + gap;
    return { ...d, from, durationInFrames: dur };
  });
}

/** Apply audio timing to every scene; scenes grow to fit speech. */
export function applyDialogueTiming(ep: Episode, tail = DIALOGUE_TAIL_FRAMES): Episode {
  const scenes = ep.scenes.map((s) => {
    const dialogue = layoutSceneDialogue(s, ep.fps);
    const end = dialogue.reduce((m, d) => Math.max(m, d.from + (d.durationInFrames ?? 0)), 0);
    return { ...s, dialogue, durationInFrames: Math.max(s.durationInFrames, end > 0 ? end + tail : 0) };
  });
  return { ...ep, scenes };
}

export interface DialogueInterval {
  sceneId: string;
  lineId: string;
  castId?: string;
  start: number;
  end: number;
}

/** Episode-global frame intervals where someone speaks. */
export function dialogueIntervals(ep: Pick<Episode, "scenes">): DialogueInterval[] {
  const starts = sceneStartFrames(ep);
  return ep.scenes.flatMap((s, i) =>
    s.dialogue.filter((d) => d.durationInFrames).map((d) => ({ sceneId: s.id, lineId: d.id, castId: d.castId, start: starts[i]! + d.from, end: starts[i]! + d.from + d.durationInFrames! })),
  );
}

/** Gain for a ducked cue at a global frame: 1 when nobody speaks, `duckTo` under speech, smooth ramps. */
export function duckGain(frame: number, intervals: DialogueInterval[], duckTo: number, ramp: number): number {
  let g = 1;
  for (const iv of intervals) {
    let k = 0;
    if (frame >= iv.start && frame <= iv.end) k = 1;
    else if (ramp > 0 && frame >= iv.start - ramp && frame < iv.start) k = (frame - (iv.start - ramp)) / ramp;
    else if (ramp > 0 && frame > iv.end && frame <= iv.end + ramp) k = 1 - (frame - iv.end) / ramp;
    g = Math.min(g, 1 - (1 - duckTo) * k);
  }
  return g;
}

/** Fade-in / fade-out envelope for a cue (local frame). */
export function cueFade(local: number, duration: number, fadeIn: number, fadeOut: number): number {
  const a = fadeIn > 0 ? Math.min(1, Math.max(0, local / fadeIn)) : 1;
  const b = fadeOut > 0 ? Math.min(1, Math.max(0, (duration - local) / fadeOut)) : 1;
  return Math.min(a, b);
}

export { episodeDurationInFrames };
