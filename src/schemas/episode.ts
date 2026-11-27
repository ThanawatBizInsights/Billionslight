/**
 * Billionslight episode schema (v1).
 *
 * An episode is pure data. The engine reads it and selects reusable assets by
 * ID; nothing episode-specific is hard-coded in the engine. Every field the
 * renderer needs is validated here before rendering starts.
 */
import { z } from "zod";

// ---------------------------------------------------------------- primitives
export const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof Vec3>;

/** Asset identifiers are kebab-case, e.g. "modern-thai-house". */
export const AssetId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "asset IDs must be kebab-case");

export const EasingName = z.enum(["linear", "easeIn", "easeOut", "easeInOut", "easeInOutCubic", "hold"]);
export type EasingName = z.infer<typeof EasingName>;

/** Frames are always relative to the start of the scene that owns the track. */
const Frame = z.number().int().nonnegative();

// ------------------------------------------------------------------- formats
export const AspectRatio = z.enum(["9:16", "16:9", "4:5", "1:1"]);
export type AspectRatio = z.infer<typeof AspectRatio>;

export const ApprovalStatus = z.enum([
  "draft",
  "script-review",
  "technical-review",
  "visual-review",
  "approved",
  "rendered",
  "published",
]);

// ---------------------------------------------------------------- references
export const TechnicalReference = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** URL, standard number, manufacturer document, or internal engineering note. */
  source: z.string().min(1),
  notes: z.string().optional(),
});

export const TechnicalClaim = z.object({
  id: z.string().min(1),
  /** The claim as spoken/shown to the audience (Thai). */
  text: z.string().min(1),
  /** English paraphrase for technical reviewers. */
  meaning: z.string().optional(),
  referenceIds: z.array(z.string()).default([]),
  status: z.enum(["unverified", "needs-human-review", "verified", "rejected"]).default("unverified"),
  reviewer: z.string().optional(),
});

// ---------------------------------------------------------------- characters
export const CharacterCast = z.object({
  /** Character instance ID used inside this episode, e.g. "sunny". */
  id: z.string().min(1),
  /** Reusable character definition from the library. */
  characterId: AssetId,
  voiceKey: z.string().optional(),
});

export const CharacterKeyframe = z.object({
  frame: Frame,
  position: Vec3.optional(),
  /** Yaw in radians. */
  rotationY: z.number().optional(),
  easing: EasingName.default("easeInOut"),
});

export const AnimationClipRef = z.object({
  clip: AssetId, // e.g. "idle-breathing", "wave", "point"
  from: Frame,
  durationInFrames: z.number().int().positive(),
  /** Blend-in / blend-out length in frames. */
  blendFrames: z.number().int().nonnegative().default(8),
  weight: z.number().min(0).max(1).default(1),
  params: z.record(z.string(), z.unknown()).default({}),
});

export const CharacterTrack = z.object({
  castId: z.string(),
  keyframes: z.array(CharacterKeyframe).min(1),
  clips: z.array(AnimationClipRef).default([]),
  expression: z
    .array(z.object({ frame: Frame, expression: AssetId, easing: EasingName.default("easeInOut") }))
    .default([]),
  /** Look-at target: a world position, an environment anchor name, or another cast member's head. */
  lookAt: z
    .array(z.object({ frame: Frame, target: z.union([Vec3, z.string(), z.object({ castId: z.string() })]) }))
    .default([]),
});

// ------------------------------------------------------------------- cameras
export const CameraKeyframe = z.object({
  frame: Frame,
  position: Vec3,
  target: Vec3,
  fov: z.number().min(10).max(90).optional(),
  easing: EasingName.default("easeInOutCubic"),
});

export const CameraTrack = z.object({
  /** Library preset to start from (optional). Keyframes override it. */
  preset: AssetId.optional(),
  keyframes: z.array(CameraKeyframe).default([]),
});

// --------------------------------------------------------- electrical states
export const GridStatus = z.enum(["connected", "outage"]);
export const InverterType = z.enum(["none", "grid-tied", "hybrid"]);

/** Input description of the electrical system. Flows are DERIVED from this. */
export const ElectricalScenario = z.object({
  inverterType: InverterType,
  gridStatus: GridStatus,
  /** 0 = night/heavy cloud, 1 = strong clear-sky irradiance on the array. */
  solarIrradiance: z.number().min(0).max(1),
  /** PV array rated (peak) power in kW. Illustrative unless referenced. */
  pvRatedKw: z.number().nonnegative().default(5),
  /** Inverter continuous AC output limit in kW (power, not energy). */
  inverterRatedKw: z.number().nonnegative().default(5),
  /** Household demand right now, in kW. */
  householdLoadKw: z.number().nonnegative().default(2),
  /** Demand of loads wired to the backup (essential-load) circuit, in kW. */
  backupLoadKw: z.number().nonnegative().default(0.8),
  battery: z
    .object({
      present: z.boolean().default(false),
      /** Usable capacity in kWh (energy, not power). */
      capacityKwh: z.number().nonnegative().default(10),
      /** State of charge 0–1. */
      stateOfCharge: z.number().min(0).max(1).default(0.8),
      /** Max charge/discharge power in kW. */
      maxPowerKw: z.number().nonnegative().default(5),
    })
    .default({ present: false, capacityKwh: 10, stateOfCharge: 0.8, maxPowerKw: 5 }),
  /**
   * Backup operation requires compatible equipment, a configured backup
   * (EPS) output, automatic isolation from the grid and supported loads.
   * All three must be true for the engine to show backup power.
   */
  backup: z
    .object({
      backupOutputConfigured: z.boolean().default(false),
      gridIsolationDevice: z.boolean().default(false),
      loadsOnBackupCircuit: z.boolean().default(false),
    })
    .default({ backupOutputConfigured: false, gridIsolationDevice: false, loadsOnBackupCircuit: false }),
  /** Whether export is permitted/configured for this example. */
  exportPermitted: z.boolean().default(false),
  inverterFault: z.boolean().default(false),
});
export type ElectricalScenario = z.infer<typeof ElectricalScenario>;

export const ElectricalStateKeyframe = z.object({
  frame: Frame,
  scenario: ElectricalScenario,
  /** Frames over which visual intensity cross-fades to the new state. */
  transitionFrames: z.number().int().nonnegative().default(10),
});

// ----------------------------------------------------------------- dialogue
export const DialogueLine = z.object({
  id: z.string().min(1),
  castId: z.string().optional(), // undefined = narrator
  text: z.string().min(1),
  /** Start frame relative to the scene. */
  from: Frame,
  /** Filled after TTS / import from real audio duration. */
  durationInFrames: z.number().int().positive().optional(),
  audio: z
    .object({
      source: z.enum(["elevenlabs", "imported", "mock"]),
      file: z.string().optional(),
      cacheKey: z.string().optional(),
    })
    .optional(),
  delivery: z
    .object({ speed: z.number().min(0.7).max(1.2).default(1), style: z.string().optional() })
    .optional(),
});

export const AudioCue = z.object({
  id: z.string(),
  kind: z.enum(["music", "sfx", "ambience"]),
  file: z.string(),
  from: Frame,
  durationInFrames: z.number().int().positive().optional(),
  volume: z.number().min(0).max(1).default(0.6),
  fadeInFrames: z.number().int().nonnegative().default(0),
  fadeOutFrames: z.number().int().nonnegative().default(0),
  duckUnderDialogue: z.boolean().default(true),
});

export const OverlayItem = z.object({
  id: z.string(),
  kind: z.enum(["label", "title", "legend", "logo", "number", "cta", "arrow"]),
  text: z.string().optional(),
  from: Frame,
  durationInFrames: z.number().int().positive(),
  /** Normalised safe-area position 0–1. */
  anchor: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).default([0.5, 0.15]),
  style: AssetId.optional(),
});

// -------------------------------------------------------------------- scenes
export const Scene = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  durationInFrames: z.number().int().positive(),
  /** Minimum duration; real speech timing may extend a scene, never shrink speech. */
  environment: z.object({
    id: AssetId,
    variant: z.string().optional(),
    options: z.record(z.string(), z.unknown()).default({}),
  }),
  lighting: z.object({ preset: AssetId, overrides: z.record(z.string(), z.unknown()).default({}) }),
  camera: CameraTrack,
  characters: z.array(CharacterTrack).default([]),
  electrical: z.array(ElectricalStateKeyframe).default([]),
  dialogue: z.array(DialogueLine).default([]),
  audio: z.array(AudioCue).default([]),
  overlays: z.array(OverlayItem).default([]),
  transitionIn: z
    .object({ type: z.enum(["cut", "fade", "dip-to-navy"]), durationInFrames: z.number().int().nonnegative() })
    .default({ type: "cut", durationInFrames: 0 }),
  claimIds: z.array(z.string()).default([]),
});
export type Scene = z.infer<typeof Scene>;

// ------------------------------------------------------------------- episode
export const Episode = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    topic: z.string().optional(),
    language: z.string().default("th"),
    aspectRatio: AspectRatio.default("9:16"),
    fps: z.number().int().min(24).max(60).default(30),
    cast: z.array(CharacterCast).default([]),
    scenes: z.array(Scene).min(1),
    branding: z
      .object({
        showLogo: z.boolean().default(true),
        closingText: z.string().optional(),
      })
      .default({ showLogo: true }),
    technicalClaims: z.array(TechnicalClaim).default([]),
    references: z.array(TechnicalReference).default([]),
    approval: z
      .object({
        status: ApprovalStatus.default("draft"),
        history: z
          .array(z.object({ status: ApprovalStatus, by: z.string(), at: z.string(), note: z.string().optional() }))
          .default([]),
      })
      .default({ status: "draft", history: [] }),
  })
  .superRefine((ep, ctx) => {
    const castIds = new Set(ep.cast.map((c) => c.id));
    const claimIds = new Set(ep.technicalClaims.map((c) => c.id));
    const refIds = new Set(ep.references.map((r) => r.id));
    ep.scenes.forEach((scene, si) => {
      scene.characters.forEach((t, ti) => {
        if (!castIds.has(t.castId))
          ctx.addIssue({ code: "custom", path: ["scenes", si, "characters", ti, "castId"], message: `unknown cast "${t.castId}"` });
      });
      scene.dialogue.forEach((d, di) => {
        if (d.castId && !castIds.has(d.castId))
          ctx.addIssue({ code: "custom", path: ["scenes", si, "dialogue", di, "castId"], message: `unknown cast "${d.castId}"` });
      });
      scene.claimIds.forEach((id, ci) => {
        if (!claimIds.has(id))
          ctx.addIssue({ code: "custom", path: ["scenes", si, "claimIds", ci], message: `unknown claim "${id}"` });
      });
    });
    ep.technicalClaims.forEach((c, ci) =>
      c.referenceIds.forEach((r) => {
        if (!refIds.has(r))
          ctx.addIssue({ code: "custom", path: ["technicalClaims", ci], message: `unknown reference "${r}"` });
      }),
    );
    const sceneIds = ep.scenes.map((s) => s.id);
    if (new Set(sceneIds).size !== sceneIds.length)
      ctx.addIssue({ code: "custom", path: ["scenes"], message: "scene IDs must be unique" });
  });

export type Episode = z.infer<typeof Episode>;
export type EpisodeInput = z.input<typeof Episode>;

export const parseEpisode = (data: unknown): Episode => Episode.parse(data);

/** Total duration = sum of scene durations (scenes are sequential). */
export const episodeDurationInFrames = (ep: Pick<Episode, "scenes">): number =>
  ep.scenes.reduce((sum, s) => sum + s.durationInFrames, 0);

/** Scene start frames in the episode timeline. */
export const sceneStartFrames = (ep: Pick<Episode, "scenes">): number[] => {
  let t = 0;
  return ep.scenes.map((s) => {
    const start = t;
    t += s.durationInFrames;
    return start;
  });
};
