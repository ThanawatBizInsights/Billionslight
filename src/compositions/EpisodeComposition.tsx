/**
 * Generic episode composition: renders ANY validated episode. Scenes play in
 * sequence; each scene gets its own 3D canvas + overlay layer.
 */
import { AbsoluteFill, Sequence, type CalculateMetadataFunction } from "remotion";
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { Episode, episodeDurationInFrames, sceneStartFrames, type EpisodeInput } from "../schemas/episode";
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
          <AbsoluteFill>
            <SceneView scene={scene} episode={episode} quality={q} />
          </AbsoluteFill>
          <SceneOverlays scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
