# Phase 2 report — Visual prototype

Date: 2026-11-27 · Status: **re-rendered with the approved Sunny face (variant B); full pack awaiting owner VISUAL APPROVAL**
Approved inputs: `docs/design-decisions-phase-2.md` · References: Drive
boards 01–06 and "Three Squirrels" (local copies, git-ignored).

## Review pack (`renders/phase-2-review/`)

Renders are git-ignored because the repository is public and the characters
are Billionslight IP. Recreate them with the commands at the end.

| # | Deliverable | File(s) |
|---|---|---|
| 1–2 | Sunny and Ton procedural 3D characters | `src/engine/characters/` |
| 3 | Front, ¾, side, rear renders | `01-characters/sunny-turnaround.png`, `ton-turnaround.png` |
| 4 | Side-by-side scale comparison (ruler, 1.35 m / 1.70 m guide lines) | `01-characters/scale-comparison.png` |
| 5 | Facial expression previews (10 each) | `02-expressions/sunny-sheet.png`, `ton-sheet.png` (+ single frames) |
| 6 | Basic pose previews (12 each) + sitting/eye contact | `03-poses/sunny-sheet.png`, `ton-sheet.png`, `sitting-eye-contact.png` |
| 7 | Modern Thai solar house exterior | `04-environments/house-{day,golden-hour,night,blackout}.png` |
| 8 | Living room | `04-environments/living-room-{day,evening,blackout}.png` |
| 9 | Garage & electrical equipment area | `04-environments/garage-on-grid-day.png`, `garage-hybrid-backup-evening.png` |
| 10 | Basic solar & electrical equipment | in 7 and 9 (PV array, on-grid/hybrid inverter, battery stack, distribution board, backup board, EV charger, EV, utility meter, sockets, switch) |
| 11 | Day / evening / blackout lighting | in 7 and 8 |
| 12 | 10-second living-room conversation (vertical, silent) | `05-conversation-test/living-room-conversation-{draft,preview,final}.mp4` |

### The 10-second test (`src/episodes/phase2-living-room-test.episode.json`)
| Time | Shot | Action |
|---|---|---|
| 0–3.0 s | Wide two-shot, slow dolly-in | Sunny waves; Ton (seated) waves back and greets him |
| 3.0–6.0 s | Over Ton's shoulder | Sunny explains (talk + open-hand gestures); Ton listens and nods |
| 6.0–8.0 s | Close-up on Ton | Ton thinks; at 6.7 s the household power cuts out (lights, AC off; lighting blends evening → power outage); Ton is surprised and looks up |
| 8.0–10 s | Medium on Sunny | Sunny stays calm, checks his tablet (screen glow), smiles and winks |

Covers: eye contact (look-at with eyes leading the head), head and arm
gestures, expression changes, three or more camera angles with frame-exact cuts, a
lighting change, warm cinematic lighting and frame-based animation. Silent; no
ElevenLabs credits used. No technical claim is made in the test.

## Rendering performance

10-second test (300 frames). All three outputs were verified by ffprobe: H.264
yuv420p + AAC, 30 fps, 300 frames, 10.0 s.

| Quality | Resolution | Render time | s / frame | Real-time factor | Peak RAM | File |
|---|---|---|---|---|---|---|
| draft | 360×640 | 36.4 s | 0.12 | 0.27× | 1.9 GB | 0.8 MB |
| preview | 540×960 | 68.4 s | 0.23 | 0.15× | 2.0 GB | 1.5 MB |
| final | 1080×1920 | 190.0 s | 0.63 | 0.05× | 2.6 GB | 5.3 MB |

Re-rendered 2026-11-27 with Sunny face variant B (approved). Face B adds about 15–20% render time versus the v1 face. Review stills: 1.5–2.6 s each (57 stills).

Measured in the cloud container (4 vCPU Intel Xeon 2.1 GHz, no GPU, software
GL `swangle`, concurrency 3). On the Intel MacBook with GPU (`angle`), expect
similar or better; measure with the commands below. For a 30-second episode
at final quality, estimate about 3× the 10-second figure.

## How the approved decisions were applied
- **Sunny** keeps the sheet identity: golden-orange fur, cream cheeks/muzzle/chin,
  large purple eyes with two highlights, pink inner ears, small brown nose,
  pure-white ridged hard hat seated between the ears, navy coverall with
  bright-blue shoulder panels and collar, yellow piping/zip/cuffs, sun emblem,
  navy safety boots, and a large curved five-segment soft-faceted tail. Head is
  about half of his height, as on the sheet. Eyelids close fully (blink, wink,
  laugh). Ears flick and the tail sways subtly.
- **Ton** follows board 01: rounded-cube head, faceted dark-brown hair,
  dot eyes, cream short-sleeved shirt with collar and buttons, navy trousers,
  belt, white shoes. Stylized adult proportions (head about 1/5 of height) so he
  reads as an adult next to furniture.
- **Heights** verified against a ruler: Sunny 1.35 m, Ton 1.70 m (79%).
- **Props** (tablet, demo solar panel, coffee mug) are separate assets
  attached per time range.
- **Equipment** lives in the garage service area by default, with on-grid
  and hybrid as separate configurations; battery and EV charger are optional.
  The utility meter sits on a separate boundary-wall pillar outside. No vendor
  branding.
- **Palette**: board 01 deep navy / solar yellow for art direction; daytime
  scenes use natural architectural colours; interiors are cream and wood.

## Known limitations / items for your review
1. **No walk cycle yet.** The test avoids walking; walking, sit-down and
   stand-up transitions are Phase 3.
2. **Lip sync is procedural** (mouth driven by noise), not by audio; Phase 4.
3. **Hands are mitten paws (Sunny) or blocks (Ton)**, with no fingers. Pointing
   and thumbs-up read through arm pose, not finger shapes. Say if finger
   detail is wanted.
4. **Sunny's eyes** were redesigned (`docs/sunny-eye-review.md`); variant B
   is approved and used throughout this pack.
5. **Faces and hard hat brim:** in some low-angle shots the brim covers the
   brows; brows are kept small.
6. **Shadows** come from a single sun shadow map; interior lamps do not cast
   shadows (performance on Intel MacBooks).
7. **Garage**: clean and sparse by design ("organized, well-lit"); more
   props can be added after approval.
8. **Logo** not shown: no placement was needed in Phase 2. The rules are
   recorded in CLAUDE.md; a tagline-free version is still to be supplied.
9. **Ton's head size** is a deliberate compromise between the chibi sheet
   (head ≈ 40%) and "stylized adult proportions". Tell us if you want it larger.

## Recreate the review pack
```bash
node scripts/review/build-review-episodes.mjs
node scripts/render-stills.mjs renders/phase-2-review/stills-plan.json
python3 scripts/review/contact_sheet.py
node scripts/render.mjs Episode --episode=src/episodes/phase2-living-room-test.episode.json --quality=final --out=renders/phase-2-review/05-conversation-test/living-room-conversation-final.mp4
```
