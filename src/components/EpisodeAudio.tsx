/**
 * Episode sound: dialogue lines, scene cues and episode-wide beds.
 * Music/ambience marked duckUnderDialogue dip to audioMix.duckTo whenever
 * anyone speaks (smooth ramps), so background audio never competes with speech.
 * All gains are pure functions of the frame.
 */
import { Audio, Sequence, staticFile } from "remotion";
import type { Episode, Scene } from "../schemas/episode";
import { cueFade, duckGain, type DialogueInterval } from "../engine/audio/timing";
import { getSound } from "../engine/audio/library";

type Cue = Scene["audio"][number];

function cueSource(c: Cue, fps: number): { src: string; loop: boolean; naturalFrames: number | null } {
  if (c.asset) {
    const s = getSound(c.asset);
    return { src: staticFile(s.file), loop: c.loop ?? s.loop, naturalFrames: Math.ceil((s.durationMs / 1000) * fps) };
  }
  return { src: staticFile(c.file!), loop: c.loop ?? false, naturalFrames: null };
}

function CueAudio({ cue, fps, available, globalOffset, intervals, mix }: { cue: Cue; fps: number; available: number; globalOffset: number; intervals: DialogueInterval[]; mix: Episode["audioMix"] }) {
  const { src, loop, naturalFrames } = cueSource(cue, fps);
  const duration = Math.max(1, Math.min(available - cue.from, cue.durationInFrames ?? (loop ? available - cue.from : (naturalFrames ?? available - cue.from))));
  if (duration <= 0) return null;
  return (
    <Sequence from={cue.from} durationInFrames={duration} name={`audio:${cue.id}`} layout="none">
      <Audio
        src={src}
        loop={loop}
        volume={(f) => {
          const fade = cueFade(f, duration, cue.fadeInFrames, cue.fadeOutFrames);
          const duck = cue.duckUnderDialogue ? duckGain(globalOffset + cue.from + f, intervals, mix.duckTo, mix.duckRampFrames) : 1;
          return cue.volume * fade * duck;
        }}
      />
    </Sequence>
  );
}

/** Dialogue + scene cues (inside a scene's Sequence; frames are scene-local). */
export function SceneAudio({ scene, episode, sceneStart, intervals }: { scene: Scene; episode: Episode; sceneStart: number; intervals: DialogueInterval[] }) {
  return (
    <>
      {scene.dialogue.map((d) =>
        d.audio?.file && d.durationInFrames ? (
          <Sequence key={d.id} from={d.from} durationInFrames={d.durationInFrames} name={`voice:${d.id}`} layout="none">
            <Audio src={staticFile(d.audio.file)} volume={episode.audioMix.dialogueVolume * 10 ** ((d.audio.gainDb ?? 0) / 20)} />
          </Sequence>
        ) : null,
      )}
      {scene.audio.map((c) => (
        <CueAudio key={c.id} cue={c} fps={episode.fps} available={scene.durationInFrames} globalOffset={sceneStart} intervals={intervals} mix={episode.audioMix} />
      ))}
    </>
  );
}

/** Episode-wide beds (global frames). */
export function EpisodeBeds({ episode, total, intervals }: { episode: Episode; total: number; intervals: DialogueInterval[] }) {
  return (
    <>
      {episode.audio.map((c) => (
        <CueAudio key={c.id} cue={c} fps={episode.fps} available={total} globalOffset={0} intervals={intervals} mix={episode.audioMix} />
      ))}
    </>
  );
}
