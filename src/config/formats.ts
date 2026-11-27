/** Output formats and render-quality presets. */
import type { AspectRatio } from "../schemas/episode";

export const FORMATS: Record<AspectRatio, { width: number; height: number; label: string }> = {
  "9:16": { width: 1080, height: 1920, label: "Vertical (Reels / TikTok / Shorts)" },
  "16:9": { width: 1920, height: 1080, label: "Landscape (YouTube)" },
  "4:5": { width: 1080, height: 1350, label: "Portrait (Feed)" },
  "1:1": { width: 1080, height: 1080, label: "Square" },
};

export type QualityName = "draft" | "preview" | "final";

export interface QualityPreset {
  /** Multiplier applied to the format's full resolution. */
  scale: number;
  shadowMapSize: number;
  /** Canvas device-pixel-ratio-like supersampling for the WebGL canvas. */
  antialias: boolean;
  particleMultiplier: number;
  jpegQuality: number;
  crf: number;
}

/** draft 360×640, preview 540×960, final 1080×1920 for 9:16. */
export const QUALITY: Record<QualityName, QualityPreset> = {
  draft: { scale: 1 / 3, shadowMapSize: 512, antialias: false, particleMultiplier: 0.5, jpegQuality: 70, crf: 28 },
  preview: { scale: 0.5, shadowMapSize: 1024, antialias: true, particleMultiplier: 0.75, jpegQuality: 80, crf: 23 },
  final: { scale: 1, shadowMapSize: 2048, antialias: true, particleMultiplier: 1, jpegQuality: 92, crf: 18 },
};

export const FPS = 30;

/**
 * Social-media safe area (fraction of frame) for 9:16. Keeps text clear of
 * platform UI (captions, buttons, profile strip).
 */
export const SAFE_AREA_9_16 = { top: 0.12, bottom: 0.2, left: 0.06, right: 0.12 };
