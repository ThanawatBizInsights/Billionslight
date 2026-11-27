import { Composition } from "remotion";
import { EpisodeComposition, calculateEpisodeMetadata, type EpisodeCompositionProps } from "./compositions/EpisodeComposition";
import foundationTest from "./episodes/foundation-test.episode.json";
import type { EpisodeInput } from "./schemas/episode";
import { EnergyFlowReference } from "./compositions/EnergyFlowReference";

/**
 * Compositions registered here are thin wrappers: an episode JSON + quality.
 * Rendering any episode only needs its data — see scripts/render.mjs.
 */
export const RemotionRoot = () => (
  <>
    <Composition
      id="FoundationTest"
      component={EpisodeComposition}
      calculateMetadata={calculateEpisodeMetadata}
      defaultProps={{ episode: foundationTest as unknown as EpisodeInput, quality: "preview" } satisfies EpisodeCompositionProps}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="Episode"
      component={EpisodeComposition}
      calculateMetadata={calculateEpisodeMetadata}
      defaultProps={{ episode: foundationTest as unknown as EpisodeInput, quality: "preview" } satisfies EpisodeCompositionProps}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
    />
    {/* Review tool: energy-flow visual standard reference sheet */}
    <Composition id="EnergyFlowReference" component={EnergyFlowReference} durationInFrames={150} fps={30} width={1080} height={1920} />
  </>
);
