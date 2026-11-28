/**
 * Asset manifest schema.
 *
 * The manifest (src/assets/asset-manifest.json) is the single register of
 * every reusable asset: what it is, which reference defines it, how it is
 * built, its approval state, scale, materials and animation capabilities.
 *
 * Reference files are recorded by LOCAL path + title only. The GitHub repo is
 * public, so Drive file IDs / share links must never be committed.
 */
import { z } from "zod";

export const AssetCategory = z.enum([
  "character",
  "environment",
  "equipment",
  "appliance",
  "prop",
  "lighting-preset",
  "camera-preset",
  "animation-clip",
  "expression",
  "branding",
  "visual-language",
  "audio",
]);

/**
 * Lifecycle. Only `approved` assets may be used in episodes intended for
 * publication. Approval is recorded by the owner, never set by Claude.
 */
export const ApprovalState = z.enum([
  "missing-reference", // nothing supplied yet
  "reference-supplied", // reference exists; no 3D work yet
  "needs-owner-decision", // references conflict or are incomplete
  "awaiting-low-poly-adaptation", // owner said an approved low-poly adaptation will follow
  "in-progress", // being built
  "awaiting-visual-approval", // prototype rendered, waiting for owner sign-off
  "approved", // owner approved — locked (see CLAUDE.md)
  "temporary", // placeholder, must not ship
  "reserved", // ID reserved for a future asset; not built or usable yet
  "deferred", // explicitly not approved for the current phase
  "superseded", // replaced by another asset
  "reference-only", // material used for research only, never rendered
]);

export const ModelType = z.enum([
  "procedural-humanoid-rig", // shared 17-joint rig (src/engine/characters)
  "procedural-creature-rig", // shared rig + extra chains (ears, tail)
  "procedural-environment",
  "procedural-mesh",
  "gltf-import", // future: GLB built from the reference
  "data-preset", // lighting / camera / clip definitions
  "2d-overlay", // logo, legend, captions
  "procedural-audio", // synthesised original music / SFX
  "none",
]);

const Hex = z.string().regex(/^#[0-9A-F]{6}$/, "upper-case #RRGGBB");

export const ReferenceRef = z.object({
  /** Path relative to public/assets/references/drive (git-ignored local copy). */
  file: z.string(),
  /** Panel / section on the sheet, e.g. "§01 turnaround". */
  section: z.string().optional(),
  note: z.string().optional(),
});

export const PaletteEntry = z.object({
  hex: Hex,
  /** How the value was obtained. Only `official` may be treated as exact. */
  source: z.enum(["official", "owner-approved", "sheet-swatch", "sampled", "estimated", "prototype"]),
  note: z.string().optional(),
});

export const ManifestAsset = z.object({
  id: z.string().regex(/^[a-z0-9]+([-_][a-z0-9]+)*$/),
  name: z.string(),
  nameTh: z.string().optional(),
  category: AssetCategory,
  status: ApprovalState,
  modelType: ModelType,
  /** Development phase that delivers it. */
  phase: z.number().int().min(1).max(7),
  references: z.array(ReferenceRef).default([]),
  scale: z
    .object({
      /** World units are metres. */
      heightM: z.number().positive().optional(),
      footprintM: z.tuple([z.number().positive(), z.number().positive()]).optional(),
      basis: z.enum(["official", "owner-approved", "derived-from-reference", "proposed", "real-world-typical", "measured-render"]),
      note: z.string().optional(),
    })
    .optional(),
  palette: z.record(z.string(), PaletteEntry).default({}),
  animationCapabilities: z.array(z.string()).default([]),
  /** Engine code implementing it, if any. */
  implementation: z.string().nullable().default(null),
  /** Open questions / problems blocking approval. */
  issues: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type ManifestAsset = z.infer<typeof ManifestAsset>;

export const AssetManifest = z
  .object({
    schemaVersion: z.literal(1),
    updated: z.string(),
    referenceRoot: z.literal("public/assets/references/drive"),
    assets: z.array(ManifestAsset),
  })
  .superRefine((m, ctx) => {
    const ids = m.assets.map((a) => a.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) ctx.addIssue({ code: "custom", path: ["assets"], message: `duplicate ids: ${dup.join(", ")}` });
    m.assets.forEach((a, i) => {
      if (a.status === "approved" && a.issues.length)
        ctx.addIssue({ code: "custom", path: ["assets", i], message: `${a.id}: approved assets cannot have open issues` });
      if (a.status === "missing-reference" && a.references.length)
        ctx.addIssue({ code: "custom", path: ["assets", i], message: `${a.id}: has references but status is missing-reference` });
      // Guard: no Drive IDs / links in a public repo
      const blob = JSON.stringify(a);
      // Drive IDs: 25+ chars of mixed upper/lower case and digits (file names here are kebab/lower-case).
      const looksLikeDriveId = (blob.match(/[A-Za-z0-9_-]{25,}/g) ?? []).some((t) => /[A-Z]/.test(t) && /[a-z]/.test(t) && /[0-9]/.test(t));
      if (/drive\.google\.com|docs\.google\.com/.test(blob) || looksLikeDriveId)
        ctx.addIssue({ code: "custom", path: ["assets", i], message: `${a.id}: looks like a Drive link/ID — not allowed in the public repo` });
    });
  });
export type AssetManifest = z.infer<typeof AssetManifest>;
