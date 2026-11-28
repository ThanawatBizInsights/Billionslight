/**
 * ElevenLabs text-to-speech client (Node only). PAID — every call spends
 * credits. Callers must pass the guard in prepare.ts first:
 *   ELEVENLABS_API_KEY set + ELEVENLABS_ALLOW_PAID_CALLS=true + --confirm-paid
 *   + character budget, and the owner's approval for the run.
 * Uses /with-timestamps (character alignment → subtitles + lip sync) and raw
 * PCM 24 kHz (available on all plans) wrapped into WAV locally.
 * The API key is only sent in the request header; it is never logged.
 */
export const ELEVENLABS_ENDPOINT = "https://api.elevenlabs.io";
export const ELEVENLABS_SAMPLE_RATE = 24000;

export interface TtsRequest {
  voiceId: string;
  modelId: string;
  text: string;
  languageCode?: string;
  stability?: number;
  similarity?: number;
  style?: number;
  speed?: number;
}

export interface TtsResult {
  pcm: Buffer;
  sampleRate: number;
  alignment: { chars: string[]; startMs: number[]; endMs: number[] } | null;
  requestId?: string;
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string>; arrayBuffer?(): Promise<ArrayBuffer>; headers?: { get(name: string): string | null } }>;

export function buildTtsRequest(req: TtsRequest, timestamps = true): { url: string; body: Record<string, unknown> } {
  const url = `${ELEVENLABS_ENDPOINT}/v1/text-to-speech/${encodeURIComponent(req.voiceId)}${timestamps ? "/with-timestamps" : ""}?output_format=pcm_${ELEVENLABS_SAMPLE_RATE}`;
  const body: Record<string, unknown> = {
    text: req.text,
    model_id: req.modelId,
    voice_settings: {
      stability: req.stability ?? 0.5,
      similarity_boost: req.similarity ?? 0.75,
      style: req.style ?? 0,
      use_speaker_boost: true,
      speed: req.speed ?? 1,
    },
  };
  if (req.languageCode) body.language_code = req.languageCode;
  return { url, body };
}

/** Models that do not take `speed` / `use_speaker_boost` (they pace with the text itself). */
const NO_SPEED_SETTINGS = /^eleven_v[34]/;

export async function synthesize(req: TtsRequest, apiKey: string, fetchImpl: FetchLike = fetch as unknown as FetchLike): Promise<TtsResult> {
  if (!apiKey) throw new Error("ElevenLabs API key missing");
  const headers = { "xi-api-key": apiKey, "content-type": "application/json", accept: "application/json" };
  const call = async (timestamps: boolean) => {
    const { url, body } = buildTtsRequest(req, timestamps);
    if (NO_SPEED_SETTINGS.test(req.modelId)) {
      const vs = body.voice_settings as Record<string, unknown>;
      delete vs.speed;
      delete vs.use_speaker_boost;
    }
    return fetchImpl(url, { method: "POST", headers, body: JSON.stringify(body) });
  };
  let res = await call(true);
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    // some models have no character timestamps: fall back to plain speech (subtitles then time by length)
    if ((res.status === 400 || res.status === 422) && /timestamp|not supported|unsupported/i.test(detail)) {
      res = await call(false);
      if (!res.ok) throw new Error(`ElevenLabs request failed (HTTP ${res.status}): ${(await res.text().catch(() => "")).slice(0, 300)}`);
      const buf = Buffer.from(await res.arrayBuffer!());
      return { pcm: buf, sampleRate: ELEVENLABS_SAMPLE_RATE, alignment: null, requestId: res.headers?.get("request-id") ?? undefined };
    }
    throw new Error(`ElevenLabs request failed (HTTP ${res.status}): ${detail}`);
  }
  const data = (await res.json()) as {
    audio_base64?: string;
    alignment?: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] } | null;
  };
  if (!data.audio_base64) throw new Error("ElevenLabs response contained no audio");
  const a = data.alignment;
  return {
    pcm: Buffer.from(data.audio_base64, "base64"),
    sampleRate: ELEVENLABS_SAMPLE_RATE,
    alignment: a ? { chars: a.characters, startMs: a.character_start_times_seconds.map((s) => Math.round(s * 1000)), endMs: a.character_end_times_seconds.map((s) => Math.round(s * 1000)) } : null,
    requestId: res.headers?.get("request-id") ?? undefined,
  };
}
