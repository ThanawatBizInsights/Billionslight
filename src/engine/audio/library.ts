/**
 * Sound library registry. Every entry is ORIGINAL audio generated
 * deterministically by scripts/audio/synth-library.ts (no third-party
 * samples), so it is free to use in published videos. Files are generated on
 * demand (git-ignored) by the audio pipeline.
 */
export interface SoundAsset {
  id: string;
  kind: "music" | "sfx" | "ambience";
  /** Path under public/. */
  file: string;
  durationMs: number;
  loop: boolean;
  defaultVolume: number;
  license: string;
  description: string;
}

const ORIGINAL = "Original — procedurally synthesised for Billionslight (scripts/audio/synth-library.ts)";
const dir = "assets/audio/library";

export const SOUND_LIBRARY: Record<string, SoundAsset> = {
  "music-bright-bed": { id: "music-bright-bed", kind: "music", file: `${dir}/music-bright-bed.wav`, durationMs: 32000, loop: true, defaultVolume: 0.35, license: ORIGINAL, description: "Warm, light educational bed: soft pad chords + gentle plucked arpeggio, 105 BPM, seamless 32 s loop." },
  "amb-room-tone": { id: "amb-room-tone", kind: "ambience", file: `${dir}/amb-room-tone.wav`, durationMs: 7500, loop: true, defaultVolume: 0.25, license: ORIGINAL, description: "Very soft interior room tone (filtered noise), seamless loop." },
  "sfx-switch-click": { id: "sfx-switch-click", kind: "sfx", file: `${dir}/sfx-switch-click.wav`, durationMs: 250, loop: false, defaultVolume: 0.7, license: ORIGINAL, description: "Wall light-switch click." },
  "sfx-power-down": { id: "sfx-power-down", kind: "sfx", file: `${dir}/sfx-power-down.wav`, durationMs: 1200, loop: false, defaultVolume: 0.6, license: ORIGINAL, description: "Appliances winding down when the power goes out." },
  "sfx-power-up": { id: "sfx-power-up", kind: "sfx", file: `${dir}/sfx-power-up.wav`, durationMs: 900, loop: false, defaultVolume: 0.55, license: ORIGINAL, description: "Soft rising tone when backup power comes on." },
  "sfx-whoosh-soft": { id: "sfx-whoosh-soft", kind: "sfx", file: `${dir}/sfx-whoosh-soft.wav`, durationMs: 700, loop: false, defaultVolume: 0.45, license: ORIGINAL, description: "Soft transition whoosh." },
  "sfx-pop": { id: "sfx-pop", kind: "sfx", file: `${dir}/sfx-pop.wav`, durationMs: 200, loop: false, defaultVolume: 0.5, license: ORIGINAL, description: "Gentle UI pop for labels and titles." },
};

export function getSound(id: string): SoundAsset {
  const s = SOUND_LIBRARY[id];
  if (!s) throw new Error(`Sound "${id}" not found in the sound library`);
  return s;
}
