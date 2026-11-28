# Phase 4 — audio, dialogue sync, Thai subtitles, music & SFX

## Overview

```
episode.json (dialogue text, cues)
   │  scripts/audio/prepare-episode-audio.ts  (Node; render.mjs runs it automatically)
   ▼
for each line: imported file → voice cache → [paid ElevenLabs, approved runs only] → mock voice
   │  duration, loudness envelope (100 Hz), character alignment
   ▼
timed episode (lines placed on real audio, scenes grown to fit) + <episode>.th.srt
   │  Remotion (render.mjs --audio=mock|cache|none)
   ▼
dialogue <Audio>, music/ambience/SFX with ducking, lip sync, Thai subtitles → MP4 (H.264/AAC) + .th.srt
```

## Paid-call safety (ElevenLabs)

A paid generation happens only when **all** of these hold:

1. `ELEVENLABS_API_KEY` is set (in `.env`, git-ignored — never committed or printed);
2. `ELEVENLABS_ALLOW_PAID_CALLS=true`;
3. the run is started explicitly with `--audio=elevenlabs --confirm-paid`;
4. the characters to bill in this run fit `--max-characters` (default 2,500);
5. every needed voice has an ID (`ELEVENLABS_VOICE_SUNNY`, `…_HOMEOWNER`, `…_NARRATOR`, `…_TECHNICIAN`);
6. **and the owner has approved the run** (project rule).

The budget check runs before any call. Renders (`scripts/render.mjs`) can
never make paid calls: they accept only `--audio=mock|cache|none`.

Always dry-run first:

```bash
npx tsx scripts/audio/prepare-episode-audio.ts src/episodes/<id>.episode.json --audio=elevenlabs --dry-run
```

It prints every line, its voice, whether it is cached, and the total
characters that would be billed. Then, with approval:

```bash
npx tsx scripts/audio/prepare-episode-audio.ts src/episodes/<id>.episode.json --audio=elevenlabs --confirm-paid --max-characters=3000
```

Billing (owner's plan, checked 2026-11-28): Creator tier, 144,577 credits per
month; the multilingual v2 model uses about 1 credit per character. Usage
inside the monthly allowance costs nothing extra; overage only applies if
usage-based billing is enabled in the ElevenLabs account.

## Voice cast (owner-approved recast, 2026-11-28)

Model `eleven_v4` with `language_code: "th"` (confirmed available on the
project key; with-timestamps supported).

| Voice key | Character | ElevenLabs voice | Direction |
|---|---|---|---|
| `sunny` | Sunny (boy mascot) | Pat – Warm Thai Storyteller (`6x3qYeG3xkaxgXoc66dE`) | cheerful, sweet, clear; audible smile; excited when it clicks |
| `homeowner` | Ton (ต้น) | Suwapoj – ไทย Podcast (`vSL3G4iIBh54RFkRCXHj`) | warm, grounded, conversational; puzzled → assured |
| `narrator` | Narrator | owner's cloned voice "Thanawat" (ID only in `.env`) | — |

Chosen from a v4 screening (8 voices) and a two-pair audition on v4 and v3
(`renders/phase-4-review/casting/`). Pair 1 on v4 had the widest natural
contrast (Sunny lifts to ~245 Hz when excited, Ton stays ~155 Hz) and the most
expressive delivery; v3 was flatter. The approved audition takes were reused
for the matching script lines (no regeneration).

## Running in a cloud session

The Billionslight cloud environment holds the ElevenLabs key as a network
credential for `api.elevenlabs.io` (header `xi-api-key`), injected by the
session proxy — no key exists in files or variables. Set the variable to a
placeholder for the command: `ELEVENLABS_API_KEY=proxy-injected`. The prepare
script enables Node's proxy support (`NODE_USE_ENV_PROXY=1`) automatically.
The key is scoped: it can generate speech but not read voice metadata (fine
for the pipeline).

## Voice cache

- `public/assets/audio/cache/<key>.wav` + `<key>.json` (git-ignored; stays on
  the machine that generated it — copy the folder to move it).
- Key = SHA-256 of provider, model, voice key, spoken text (NFC) and voice
  settings. The same line is never generated twice.
- Regenerate a single line only on request: `--regenerate=<lineId>`.
- Every paid generation is appended to `cache/ledger.jsonl` (time, episode,
  line, characters, request ID — no secrets).
- Mock mode uses cached ElevenLabs voices when they exist (free re-renders).

Request: `POST /v1/text-to-speech/{voice}/with-timestamps?output_format=pcm_24000`
(character alignment for subtitles and lip sync; raw PCM wrapped to WAV
locally, available on all plans). Model: `ELEVENLABS_MODEL_ID`
(default `eleven_multilingual_v2`).

## Dialogue lines

```json
{ "id": "sunny-01", "castId": "sunny", "text": "ผลิตไฟได้ประมาณ 3 kW", "from": 100,
  "speak": "(optional spoken override)", "subtitle": true, "lipSync": true,
  "delivery": { "speed": 1, "stability": 0.5, "similarity": 0.75, "styleExaggeration": 0 } }
```

- `text` is what the audience reads. The voice says `speak`, or `text` with
  unit normalisation (kW → กิโลวัตต์, kWh → กิโลวัตต์ชั่วโมง, % → เปอร์เซ็นต์, PV/AC/DC/EV).
- Voice: cast `voiceKey`, else the character's default (`sunny`, `homeowner`,
  `technician`), narrator lines (no `castId`) use `narrator`.
- Imported audio: `"audio": { "source": "imported", "file": "assets/audio/imported/x.wav" }` (16-bit WAV).
- Timing: a line starts at `from`, or later if the previous line is still
  speaking (+6 frames). Speech is never shortened or overlapped; scenes grow
  (never shrink) to fit the last line + 12 frames.
- Camera shots can follow speech: `"onLine": "<lineId>"` starts the shot when
  that line starts.

## Lip sync

The speaking character gets the `talk` clip's subtle head motion (unless the
author placed one) and the mouth follows the voice's loudness envelope;
rounded Thai vowels (โ อ ุ ู ั ว) round the lips when an alignment exists.

## Thai subtitles

- Line breaks only at word boundaries (`Intl.Segmenter('th')`), with a glossary
  that keeps loanwords and spoken compounds together (โซลาร์เซลล์, อินเวอร์เตอร์,
  แบตเตอรี่, กิโลวัตต์, ยังไง …).
- Balanced lines (no orphan words), strongly preferring the spaces Thai uses
  between phrases. Width is measured in visual characters (combining vowels and
  tone marks take no space). Defaults: 26 per line, 2 lines.
- Long lines become several timed captions (by alignment when the spoken and
  written text match, otherwise by length). Inside the 9:16 safe area, above
  the energy legend when one is shown.
- The same timeline is exported as `<episode>.th.srt` next to every render.

## Music, ambience, SFX

Cues (`kind`: music / ambience / sfx) use a sound-library `asset` or a
`file`; scene cues are scene-local, `episode.audio` cues are episode-wide
(beds across scenes). `duckUnderDialogue` cues dip to `audioMix.duckTo`
(default 0.25 ≈ −12 dB) with 8-frame ramps whenever anyone speaks.

Sound library (`src/engine/audio/library.ts`): all **original**, synthesised
deterministically by `scripts/audio/synth-library.ts` (generated on demand):
`music-bright-bed` (32 s loop), `amb-room-tone`, `sfx-switch-click`,
`sfx-power-down`, `sfx-power-up`, `sfx-whoosh-soft`, `sfx-pop`. Only original
or properly licensed audio may be added.

## Commands

```bash
npx tsx scripts/audio/synth-library.ts                 # build the sound library
npx tsx scripts/audio/prepare-episode-audio.ts <episode> --audio=mock
node scripts/render.mjs Episode --episode=<episode> --quality=preview --audio=mock
node scripts/render.mjs Episode --episode=<episode> --quality=final --audio=cache   # real voices only
```


## Audit 2026-11-28 — "the voice is not Thai conversation"

Lines audited: `ton-01`, `sunny-01` of phase4-dialogue-test.

| Stage | Result |
|---|---|
| A raw ElevenLabs | **source of the problem** — `eleven_multilingual_v2`, no `language_code`, digits sent as "3 กิโลวัตต์" |
| B dialogue-only render (Remotion, no music/SFX) | identical to A (correlation 1.0000, same level, same pitch 82/110 Hz, 0 ms offset) |
| C full mix | 0.99 correlation with A (music under speech); no speed or pitch change |

Fixes in the pipeline:
- numbers are spoken as Thai words joined to their unit ("สามกิโลวัตต์"); captions keep "3 kW";
- `ELEVENLABS_LANGUAGE_CODE` (default `th`) is sent as `language_code`;
- model and language are part of the cache key (old and new takes never mix);
- `eleven_v3`/`v4` requests omit `speed`/`use_speaker_boost` (not supported there);
- if a model has no timestamp endpoint, plain speech is used and captions time by length.

Regenerated with `eleven_v3` + `language_code: th` (106 characters; API accepted
both, alignment returned). Clips: `renders/phase-4-review/audio-audit/*-A2-*.wav`.
The default model stays as configured in `.env` until the owner confirms the
new takes by ear.
