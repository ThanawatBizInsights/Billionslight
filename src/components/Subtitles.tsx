/**
 * Thai subtitles: word-boundary line breaks, max 2 lines, inside the 9:16
 * safe area, above the energy legend when one is shown. Same caption timeline
 * as the .srt export (sceneCaptions).
 */
import { useCurrentFrame, useVideoConfig } from "remotion";
import { SAFE_AREA_9_16 } from "../config/formats";
import type { Episode, Scene } from "../schemas/episode";
import { sceneCaptions } from "../engine/subtitles/captions";
import { THAI_FONT_STACK } from "../engine/subtitles/fonts";

export function Subtitles({ scene, episode }: { scene: Scene; episode: Episode }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const caps = sceneCaptions(scene, episode.fps, episode.subtitles);
  const cap = caps.find((c) => frame >= c.from && frame < c.to);
  if (!cap) return null;
  const u = Math.min(height / 1920, width / 1080);
  const vertical = height > width * 1.2;
  const sa = vertical ? SAFE_AREA_9_16 : { top: 0.06, bottom: 0.08, left: 0.06, right: 0.06 };
  // leave room for the energy legend panel (bottom of the safe area) when it is shown
  const legendLift = scene.energyFlow.legend && scene.electrical.length ? 230 * u : 0;
  const fadeIn = Math.min(1, (frame - cap.from) / 3);
  const speaker = cap.castId ? episode.cast.find((c) => c.id === cap.castId) : undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: sa.left * width,
        right: sa.right * width,
        bottom: sa.bottom * height + legendLift,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6 * u,
        opacity: fadeIn,
      }}
    >
      {episode.subtitles.speakerNames && speaker && (
        <div style={{ fontFamily: THAI_FONT_STACK, fontWeight: 700, fontSize: 28 * u, color: "#FBBF24", textShadow: `0 ${2 * u}px ${6 * u}px rgba(0,0,0,0.6)` }}>{speaker.id}</div>
      )}
      {cap.lines.map((l, i) => (
        <div
          key={i}
          style={{
            fontFamily: THAI_FONT_STACK,
            fontWeight: 700,
            fontSize: 50 * u,
            lineHeight: 1.5,
            color: "#FFFFFF",
            background: "rgba(15,23,42,0.72)",
            padding: `${2 * u}px ${20 * u}px`,
            borderRadius: 14 * u,
            whiteSpace: "nowrap",
          }}
        >
          {l}
        </div>
      ))}
    </div>
  );
}
