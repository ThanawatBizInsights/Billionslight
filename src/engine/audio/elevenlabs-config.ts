/**
 * ElevenLabs configuration guard (Phase 1 stub — no network code yet).
 *
 * Paid API calls require BOTH a key and an explicit opt-in flag. Without them
 * the audio pipeline must use cached, imported or mock audio. Keys are only
 * read from the environment and are never logged or written to disk.
 */
export type AudioMode = "elevenlabs" | "cache-or-mock";

export interface ElevenLabsConfig {
  mode: AudioMode;
  modelId: string;
  voices: Record<string, string | undefined>;
  reasons: string[];
}

export function resolveElevenLabsConfig(env: Record<string, string | undefined>): ElevenLabsConfig {
  const reasons: string[] = [];
  const key = env.ELEVENLABS_API_KEY?.trim();
  const allow = env.ELEVENLABS_ALLOW_PAID_CALLS === "true";
  if (!key) reasons.push("ELEVENLABS_API_KEY is not set");
  if (!allow) reasons.push("ELEVENLABS_ALLOW_PAID_CALLS is not 'true'");
  const voices = {
    sunny: env.ELEVENLABS_VOICE_SUNNY || undefined,
    homeowner: env.ELEVENLABS_VOICE_HOMEOWNER || undefined,
    technician: env.ELEVENLABS_VOICE_TECHNICIAN || undefined,
    narrator: env.ELEVENLABS_VOICE_NARRATOR || undefined,
  };
  return {
    mode: key && allow ? "elevenlabs" : "cache-or-mock",
    modelId: env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
    voices,
    reasons,
  };
}

/** Throws a clear error when a specific voice is needed but not configured. */
export function requireVoice(cfg: ElevenLabsConfig, voiceKey: string): string {
  const id = cfg.voices[voiceKey];
  if (!id) throw new Error(`No ElevenLabs voice ID configured for "${voiceKey}" (set ELEVENLABS_VOICE_${voiceKey.toUpperCase()})`);
  return id;
}
