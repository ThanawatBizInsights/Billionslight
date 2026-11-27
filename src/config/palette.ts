/**
 * Visual identity tokens.
 *
 * Official Billionslight brand colours are NOT defined here yet: they must be
 * taken from the official logo files once supplied (public/assets/branding).
 */
// Energy-flow and equipment-indicator colours live in src/config/energy-flow.ts
// (ENERGY_FLOW_COLORS, EQUIPMENT_INDICATOR_COLORS). The Phase 1–3 energy
// palette was retired after the owner approved the migration (2026-11-27).

export const SCENE_COLORS = {
  navyDeep: "#0E1A33",
  navy: "#16264A",
  mutedBlue: "#3A5486",
  dusk: "#6E7FB0",
  warmPractical: "#FFB867",
  sunGold: "#FFD27A",
  grass: "#5E9E5A",
  grassDark: "#3F7A47",
  concrete: "#C9CCD3",
  wallWarm: "#EDE6DA",
  wallAccent: "#8C6A4F",
  roofDark: "#3B4252",
  glass: "#9CC9E8",
  panelCell: "#1E3A6E",
  panelFrame: "#B8C0CC",
} as const;
