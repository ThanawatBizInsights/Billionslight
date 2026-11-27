/**
 * Visual identity tokens.
 *
 * Energy colours are EDUCATIONAL VISUALISATION CONVENTIONS ONLY. They are not
 * electrical wiring colour codes and must never be presented as such.
 *
 * Official Billionslight brand colours are NOT defined here yet: they must be
 * taken from the official logo files once supplied (public/assets/branding).
 */
export const ENERGY_COLORS = {
  solar: "#FFC53D", // golden yellow — solar generation
  grid: "#4DA3FF", // blue — utility grid electricity
  battery: "#3DDC84", // green — battery energy
  load: "#F5F7FF", // white — active household consumption
  inactive: "#6B7280", // grey — inactive connection
  fault: "#FF4D4F", // red — faults / warnings only
} as const;
export type EnergyColorKey = keyof typeof ENERGY_COLORS;

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
