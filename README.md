# Billionslight Animation Studio

Local-first, programmable low-poly 3D animation engine that turns Thai
educational scripts about solar energy and electricity into vertical videos
(Reels / TikTok / Shorts). Built on Remotion + React Three Fiber; episodes are
validated JSON, every frame is deterministic.

> **Status: Phase 1 (technical foundation) complete — awaiting approval.**
> See `docs/phase-1-report.md`. Project rules: `CLAUDE.md`.

## Requirements

- Node.js ≥ 20 (tested on 22), npm
- macOS (Intel) or Linux. FFmpeg/ffprobe recommended (`brew install ffmpeg`) —
  ffprobe is used to verify renders. Remotion bundles its own FFmpeg.
- No Blender, no GPU requirement, no paid services required.

## Quick start

```bash
npm install
cp .env.example .env
npm run doctor
npm test && npm run typecheck
npm run render:test:draft     # 360×640 in seconds
npm run render:test           # 1080×1920 final
npm run studio                # interactive preview (Remotion Studio)
```

Outputs go to `renders/<episode>/`; metrics are appended to
`renders/render-log.jsonl`. A render is only reported as successful after
ffprobe verifies codec (H.264 + AAC), resolution, fps and frame count.

### Render settings (env)

| Var | Default | Notes |
|---|---|---|
| `RENDER_GL` | `angle` on macOS, `swangle` on Linux | `swangle` = software GL for machines without a GPU |
| `RENDER_CONCURRENCY` | cores−1, max 3 | lower to 2 if the Mac gets hot / memory-bound |
| `BROWSER_EXECUTABLE` | (auto-download) | path to Chrome Headless Shell if download is blocked |

## Making an episode

1. Copy `src/episodes/foundation-test.episode.json`.
2. Edit scenes: environment ID, lighting preset, camera keyframes/preset,
   characters (cast + clips + lookAt), electrical scenario keyframes, overlays.
3. `node scripts/render.mjs Episode --episode=src/episodes/<file>.json --quality=draft`

Schema: `src/schemas/episode.ts`. Asset libraries: see `CLAUDE.md`.

## Docs

- `docs/architecture.md` — architecture, decisions, pinned versions
- `docs/electrical-accuracy.md` — encoded electrical rules, validation stage
- `docs/phase-1-report.md` — Phase 1 results, metrics, roadmap, limitations
