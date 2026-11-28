/**
 * Lip sync from the line's loudness envelope (pure, frame-based).
 * Mouth opening follows speech energy; rounded vowels (โ อ ุ ู ั ว) round the lips.
 */
import type { Scene } from "../../schemas/episode";

const ROUND = /[โอุูวั]/u;

export interface Mouth {
  open: number;
  round: number;
}

/** Mouth at a scene-local frame for one line, or null if the line is not speaking. */
export function mouthForLine(line: Scene["dialogue"][number], frame: number, fps: number): Mouth | null {
  const dur = line.durationInFrames;
  if (!dur || frame < line.from || frame >= line.from + dur) return null;
  const ms = ((frame - line.from) / fps) * 1000;
  const a = line.audio;
  let open = 0;
  if (a?.envelope && a.envelopeHz) {
    // average the envelope over the frame (avoids aliasing at 30 fps)
    const per = a.envelopeHz / fps;
    const i0 = Math.floor((ms / 1000) * a.envelopeHz);
    let sum = 0;
    let n = 0;
    for (let i = i0; i < i0 + Math.max(1, Math.round(per)); i++) {
      if (i < a.envelope.length) {
        sum += a.envelope[i]!;
        n++;
      }
    }
    open = n ? sum / n : 0;
  } else {
    // no envelope: gentle syllable rhythm so the character still reads as speaking
    open = 0.35 + 0.35 * Math.max(0, Math.sin((ms / 1000) * Math.PI * 2 * 4.2));
  }
  let round = 0;
  if (a?.alignment) {
    const k = a.alignment.startMs.findIndex((s, i) => ms >= s && ms < (a.alignment!.endMs[i] ?? s));
    if (k >= 0 && ROUND.test(a.alignment.chars[k] ?? "")) round = 0.6;
  }
  // ease the jaw closed over the last 4 frames
  const tail = Math.min(1, (line.from + dur - frame) / 4);
  return { open: Math.min(1, open * 1.15) * tail, round: round * open };
}

/** Active mouth for a cast member at a scene-local frame (first speaking line wins). */
export function mouthForCast(scene: Scene, castId: string, frame: number, fps: number): Mouth | null {
  for (const d of scene.dialogue) {
    if (d.castId !== castId || !d.lipSync) continue;
    const m = mouthForLine(d, frame, fps);
    if (m) return m;
  }
  return null;
}
