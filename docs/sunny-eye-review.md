# Sunny — eye and facial geometry redesign (review, 2026-11-27)

Status: **variant B ("Cinematic low-poly") APPROVED by the owner (2026-11-27)**
and set as Sunny's default face (`SUNNY.defaultVariant = "B"`). A, C and v1
remain in the code for comparison only. Sunny
only; Ton, environments, equipment and the core renderer are unchanged.
The previous face (`v1`) is untouched and remains the default until a variant
is approved, so nothing has been overwritten irreversibly.

## 1. Why the v1 eyes looked intimidating
Inspected in `src/engine/characters/parts.tsx` (`CartoonEye`) and
`SquirrelMascot.tsx`:

| Finding | Effect |
|---|---|
| A full white sclera ellipsoid with a smaller flat iris in front, so white showed all round the iris | "Staring" / startled look |
| The eyeball sat on top of a faceted orange surface (no socket), and the flattened sphere protruded | Eyes looked stuck on, bug-eyed in profile |
| Iris, pupil and catchlights were flat discs floating in front of the eyeball | No curvature; disconnected from the face |
| Unlit (`MeshBasicMaterial`) eye parts | Sticker-like; ignored the scene lighting |
| Catchlights mirrored per eye | The two eyes had different light directions |
| Upper lid hidden behind the eye when open; no lid line | Lidless, wide-open look |
| Harsh faceted triangles around the eyes; no cream around them | Eyes "attached to a flat orange surface" |
| Brows small, mostly under the brim, default angle slightly inward-down | Faint frown |

## 2. New face (variants A/B/C) — `src/engine/characters/sunny/`

### Head (`headGeometry.ts`)
- One ellipsoid head (same size as v1: 0.316 × 0.232 × 0.281 m semi-axes),
  icosahedron detail 4 for A/C (5,120 tris) and detail 3 for B (1,280 tris).
- **Selective smoothing**: per-triangle blend of smooth and faceted normals;
  the face is smooth and the sides and back keep subtle facets (tested).
- **Displacement**: soft cheek bulges, a muzzle bulge, shallow eye sockets.
- **Continuous cream facial region** via vertex colours: lower face (cheeks,
  muzzle, chin) joined to soft patches around both eyes, blending into
  golden-orange fur, with a fur stripe kept between the eyes.

### SunnyEye (`SunnyEye.tsx`) — 8 layers in one scaled eye space
1. **Eyeball**: smooth ellipsoid, 32×24 segments (B: 20×14), `flatShading` off;
   width 1.0 : height 1.2, shallow depth (0.6) so it does not bulge.
2. **Sclera**, 3. **iris** and 4. **pupil**: one procedural texture
   (`eyeTexture.ts`) painted in the eyeball's own UV space by projecting each
   texel onto the eye's front plane, so they **follow the curvature**. There are
   no floating discs and no z-fighting.
   Iris: dark top `#5E3A7D` → base `#8050A1`, lilac lower crescent `#B68AC8`
   (as in the reference SVG), soft limbal ring. Pupil `#302039`, large.
5. **Primary** and 6. **secondary catchlight**: thin spherical patches on the
   eyeball surface (radius +0.6%), upper-left and lower-right in the **same
   direction on both eyes**. They stay fixed to the light while the eye moves.
7. **Upper eyelid**: smooth cream shell with a soft brown (`#59382D`) lid line
   along its rim, giving a gentle arch.
8. **Lower eyelid**: smooth cream shell blending into the cheek; rises with
   smiles. Optional thin brown rim behind the eyeball (A, C).
- Eyes are **partially embedded**: the centre sits 40% of the eye depth behind
  the head surface, in a shallow socket.
- Material: `MeshStandardMaterial`, metalness 0, roughness 0.30–0.38
  (restrained gloss) plus faint self-illumination from the eye texture (0.22) so
  the purple stays readable under the hard-hat brim.

### Brows, nose, mouth, blush (`SunnyFace.tsx`)
Soft curved brown brows `#945527` (relaxed arch; never sharply inward-down),
smooth brown nose `#8D4928`, existing mouth component, soft blush
`#F29A89`. The hard hat is lifted 15 mm for the new face so the brows show;
its shape and its relationship to the ears are unchanged.

## 3. Expression controls (deterministic, Remotion-safe)
All driven by the existing `FaceState` (expression track + clips + look-at), so
every animation interface still works:

| Control | How |
|---|---|
| Blinking | eyelids rotate closed (`blink` clip + automatic blinks); the eyeball is never squashed |
| Neutral / happy / talking / listening / thinking / surprised / concerned | expression presets (brows, lids, mouth) |
| Smiling | lower lids and cheeks rise (`squint`, `smile`) |
| Laughing | lids close and a soft brown ∩ arc forms the "happy closed eye" |
| Surprised | upper lids open further, without exposing a white ring |
| Looking left / right / up / down | new presets `look-left`, `look-right`, `look-up`, `look-down`; both eyeballs rotate to the same angle |
| Eye contact in scenes | existing look-at turns the head and leads with the eyes |

## 4. Variants
| | A · Original Sunny-inspired | B · Cinematic low-poly | C · Extra cute |
|---|---|---|---|
| Head smoothing / detail | full / 5,120 tris | 55% (soft polygonal) / 1,280 tris | full / 5,120 tris |
| Eye width, iris, pupil | 0.078 m · 0.84 · 0.60 | 0.076 m · 0.88 · 0.56 | 0.083 m · 0.88 · 0.64 |
| Eye segments | 32×24 | 20×14 | 32×24 |
| Rim / gloss | thin rim · 0.32 | no rim · 0.38 | thin rim · 0.30 |
| Lids / cheeks | gentle | standard | relaxed upper lids, softer cheeks, resting smile, stronger blush |

Body proportions, height (1.35 m), uniform, tail, ears and hard hat are
identical across variants.

## 5. Review pack — `renders/phase-2/sunny-eye-review/`
| File | Content |
|---|---|
| `01-front-closeups-sheet.png` | front close-up A, B, C + v1 for comparison (neutral) |
| `02-views-sheet.png` | three-quarter and side close-ups for each variant |
| `03-full-body-sheet.png` | full body front and three-quarter for each variant |
| `04-expressions/{A,B,C}-sheet.png` | 13 controls per variant (neutral, happy, talking, listening, thinking, surprised, concerned, laughing, blinking, looking left/right/up/down) |
| `05-cinematic-sheet.png` | vertical cinematic close-up, warm amber key + soft navy shadows |
| `06-blink-gaze-test.mp4` | 5 s, A/B/C side by side: blinks, gaze left → right → up → down, laugh |

## 6. Performance impact (cloud container, software GL)
| | v1 | A / C | B |
|---|---|---|---|
| Head + face triangles (approx.) | ~2.5k | ~12k (head 5.1k + eyes/lids ~6.5k) | ~5k |
| Front close-up still (final) | 1.8 s | 2.3–2.4 s | 2.3 s |
| Iris texture | – | 512×256 RGBA, generated once and cached | same |

5-second test at 1920×1080 (three Sunnys): 64 s, 0.43 s/frame, peak 2.7 GB.
The extra face cost is modest. B is the cheapest option if render time matters
on the Intel MacBook.

## 7. Approval
Variant B approved 2026-11-27 → `SUNNY.defaultVariant = "B"`. The Phase 2
review pack and the living-room test were re-rendered with face B.
