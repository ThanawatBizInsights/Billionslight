/**
 * Caption timeline (pure). The SAME function feeds the on-screen subtitles and
 * the .srt export, so both always match.
 */
import { sceneStartFrames, type Episode, type Scene } from "../../schemas/episode";
import { timeCaptions } from "./thai";

export interface Caption {
  lineId: string;
  castId?: string;
  lines: string[];
  /** Scene-local frames [from, to). */
  from: number;
  to: number;
}

type SubSettings = Episode["subtitles"];

export function sceneCaptions(scene: Scene, fps: number, s: SubSettings): Caption[] {
  if (!s.enabled) return [];
  const out: Caption[] = [];
  for (const d of scene.dialogue) {
    if (!d.subtitle || !d.durationInFrames) continue;
    const durMs = (d.durationInFrames / fps) * 1000;
    // alignment describes the SPOKEN text; timeCaptions only uses it if it matches the displayed text
    for (const c of timeCaptions(d.text, durMs, s.maxCharsPerLine, s.maxLines, d.audio?.alignment)) {
      const from = d.from + Math.round((c.startMs / 1000) * fps);
      const to = d.from + Math.round((c.endMs / 1000) * fps);
      if (to > from) out.push({ lineId: d.id, castId: d.castId, lines: c.lines, from, to });
    }
  }
  return out.sort((a, b) => a.from - b.from);
}

const ts = (frame: number, fps: number) => {
  const ms = Math.max(0, Math.round((frame / fps) * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
};

/** SubRip (.srt) for the whole episode (global times; crossfade overlaps respected). */
export function episodeSrt(ep: Episode): string {
  const starts = sceneStartFrames(ep);
  const cues = ep.scenes.flatMap((s, i) => sceneCaptions(s, ep.fps, ep.subtitles).map((c) => ({ ...c, from: c.from + starts[i]!, to: c.to + starts[i]! })));
  return cues.map((c, i) => `${i + 1}\n${ts(c.from, ep.fps)} --> ${ts(c.to, ep.fps)}\n${c.lines.join("\n")}\n`).join("\n");
}
