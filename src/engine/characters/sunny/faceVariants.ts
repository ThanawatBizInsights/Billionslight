/**
 * Sunny face design variants (eye review, 2026-11-27).
 *
 *  v1 — Phase 2 prototype face (kept unchanged for comparison; not approved)
 *  A  — Original Sunny-inspired: large purple irises, large pupils, rounded
 *       cream facial contours, gentle expressive eyelids, thin brown rim.
 *  B  — Cinematic low-poly: simpler eye geometry, soft polygonal contours,
 *       moderate gloss, minimal sclera.
 *  C  — Extra cute: larger irises and pupils, softer cheeks, relaxed upper
 *       lids, gentle resting smile.
 *
 * All variants share the head, body, proportions, camera and lighting; only
 * the values below differ. Units: metres in head space unless noted.
 */
export interface SunnyFaceVariant {
  id: "A" | "B" | "C";
  label: string;
  // --- head surface
  /** 0 = fully faceted, 1 = fully smooth normals on the front of the face. */
  faceSmoothing: number;
  /** Icosahedron subdivision for the head (3 = 1280 tris, 4 = 5120). */
  headDetail: number;
  cheekBulge: number;
  muzzleBulge: number;
  socketDepth: number;
  // --- eyes (normalised to eye width where noted)
  eyeRadius: number; // half eye width, metres
  eyeHeightRatio: number; // eye height / width
  eyeDepth: number; // forward flattening of the eyeball (1 = sphere)
  eyeSegments: [number, number];
  irisWidth: number; // fraction of eye width
  pupilWidth: number; // fraction of eye width
  catchlightPrimary: number; // diameter, fraction of eye width
  catchlightSecondary: number;
  /** Thin brown rim around the eye (0 = none). Fraction of eye width. */
  rimWidth: number;
  /** Upper lid resting angle (radians; more negative = more open). */
  upperLidOpen: number;
  lowerLidOpen: number;
  eyeRoughness: number;
  eyeSpacing: number; // x offset of each eye centre, metres
  eyeY: number;
  // --- expression bias
  restingSmile: number;
  blush: number;
}

export const SUNNY_FACE_VARIANTS: Record<SunnyFaceVariant["id"], SunnyFaceVariant> = {
  A: {
    id: "A",
    label: "Original Sunny-inspired",
    faceSmoothing: 1,
    headDetail: 4,
    cheekBulge: 0.022,
    muzzleBulge: 0.016,
    socketDepth: 0.012,
    eyeRadius: 0.078,
    eyeHeightRatio: 1.2,
    eyeDepth: 0.6,
    eyeSegments: [32, 24],
    irisWidth: 0.84,
    pupilWidth: 0.6,
    catchlightPrimary: 0.24,
    catchlightSecondary: 0.1,
    rimWidth: 0.025,
    upperLidOpen: -0.98,
    lowerLidOpen: 1.12,
    eyeRoughness: 0.32,
    eyeSpacing: 0.112,
    eyeY: -0.004,
    restingSmile: 0,
    blush: 0.45,
  },
  B: {
    id: "B",
    label: "Cinematic low-poly",
    faceSmoothing: 0.55,
    headDetail: 3,
    cheekBulge: 0.018,
    muzzleBulge: 0.014,
    socketDepth: 0.01,
    eyeRadius: 0.076,
    eyeHeightRatio: 1.18,
    eyeDepth: 0.6,
    eyeSegments: [20, 14],
    irisWidth: 0.88,
    pupilWidth: 0.56,
    catchlightPrimary: 0.22,
    catchlightSecondary: 0.09,
    rimWidth: 0,
    upperLidOpen: -0.95,
    lowerLidOpen: 1.1,
    eyeRoughness: 0.38,
    eyeSpacing: 0.112,
    eyeY: -0.004,
    restingSmile: 0,
    blush: 0.35,
  },
  C: {
    id: "C",
    label: "Extra cute",
    faceSmoothing: 1,
    headDetail: 4,
    cheekBulge: 0.03,
    muzzleBulge: 0.016,
    socketDepth: 0.012,
    eyeRadius: 0.083,
    eyeHeightRatio: 1.22,
    eyeDepth: 0.6,
    eyeSegments: [32, 24],
    irisWidth: 0.88,
    pupilWidth: 0.64,
    catchlightPrimary: 0.24,
    catchlightSecondary: 0.1,
    rimWidth: 0.02,
    upperLidOpen: -0.85,
    lowerLidOpen: 1.05,
    eyeRoughness: 0.3,
    eyeSpacing: 0.115,
    eyeY: -0.008,
    restingSmile: 0.2,
    blush: 0.6,
  },
};

export type SunnyFaceVariantId = "v1" | SunnyFaceVariant["id"];
export const isNewFace = (v: string | undefined): v is SunnyFaceVariant["id"] => v === "A" || v === "B" || v === "C";

/** Eye colour palette (owner brief, 2026-11-27). */
export const SUNNY_EYE_COLORS = {
  sclera: "#FFF4E8",
  irisBase: "#8050A1",
  irisDark: "#5E3A7D",
  irisHighlight: "#B68AC8",
  limbal: "#4A2B62",
  pupil: "#302039",
  upperLid: "#59382D",
  lowerLidLine: "#D9A88E",
  catchlight: "#FFFFFF",
  brow: "#945527",
  nose: "#8D4928",
  blush: "#F29A89",
};
