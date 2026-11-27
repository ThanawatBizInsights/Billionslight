/**
 * Generic episode composition: renders ANY validated episode. Scenes play in
 * sequence; each scene gets its own 3D canvas + overlay layer.
 */
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, type CalculateMetadataFunction } from "remotion";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { Episode, episodeDurationInFrames, sceneOverlap, sceneStartFrames, type EpisodeInput } from "../schemas/episode";
import { FORMATS, QUALITY, type QualityName } from "../config/formats";
import { SceneView } from "../engine/scene/SceneView";
import { SceneOverlays } from "../components/Overlays";
import { ensureFonts } from "../engine/subtitles/fonts";
import { SCENE_COLORS } from "../config/palette";

export type EpisodeCompositionProps = {
  episode: EpisodeInput;
  quality: QualityName;
};

export const calculateEpisodeMetadata: CalculateMetadataFunction<EpisodeCompositionProps> = ({ props }) => {
  const ep = Episode.parse(props.episode); // validation gate: invalid episodes never render
  const fmt = FORMATS[ep.aspectRatio];
  const scale = QUALITY[props.quality].scale;
  // H.264 needs even dimensions
  const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2);
  return { durationInFrames: episodeDurationInFrames(ep), fps: ep.fps, width: even(fmt.width), height: even(fmt.height) };
};

/**
 * Scene transition wrapper (local frame inside the scene's Sequence):
 *  - fade: incoming scene fades in over the overlap (crossfade)
 *  - dip-to-navy: fade in from navy at the start / fade out to navy at the end
 */
function TransitionLayer({ duration, fadeIn, dipIn, dipOut, children }: { duration: number; fadeIn: number; dipIn: number; dipOut: number; children: ReactNode }) {
  const f = useCurrentFrame();
  const clampOpts = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
  const opacity = fadeIn > 0 ? interpolate(f, [0, fadeIn], [0, 1], clampOpts) : 1;
  const navyIn = dipIn > 0 ? interpolate(f, [0, dipIn], [1, 0], clampOpts) : 0;
  const navyOut = dipOut > 0 ? interpolate(f, [duration - dipOut, duration], [0, 1], clampOpts) : 0;
  const navy = Math.max(navyIn, navyOut);
  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
      {navy > 0 && <AbsoluteFill style={{ backgroundColor: SCENE_COLORS.navyDeep, opacity: navy }} />}
    </AbsoluteFill>
  );
}

export function EpisodeComposition({ episode: input, quality }: EpisodeCompositionProps) {
  const [handle] = useState(() => delayRender("Loading Thai fonts"));
  useEffect(() => {
    ensureFonts().then(() => continueRender(handle), (err) => {
      console.error(err);
      continueRender(handle);
    });
  }, [handle]);

  const episode = Episode.parse(input);
  const starts = sceneStartFrames(episode);
  const q = QUALITY[quality];

  return (
    <AbsoluteFill style={{ backgroundColor: SCENE_COLORS.navyDeep }}>
      {episode.scenes.map((scene, i) => (
        <Sequence key={scene.id} from={starts[i]} durationInFrames={scene.durationInFrames} name={scene.title ?? scene.id}>
          <TransitionLayer
            duration={scene.durationInFrames}
            fadeIn={sceneOverlap(episode, i)}
            dipIn={scene.transitionIn.type === "dip-to-navy" && i > 0 ? Math.ceil(scene.transitionIn.durationInFrames / 2) : 0}
            dipOut={episode.scenes[i + 1]?.transitionIn.type === "dip-to-navy" ? Math.floor(episode.scenes[i + 1]!.transitionIn.durationInFrames / 2) : 0}
          >
            <AbsoluteFill>
              <SceneView scene={scene} episode={episode} quality={q} />
            </AbsoluteFill>
            <SceneOverlays scene={scene} />
          </TransitionLayer>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
