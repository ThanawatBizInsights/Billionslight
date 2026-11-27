/**
 * Billionslight energy-flow visual standard (owner-specified, 2026-11-27).
 *
 * EDUCATIONAL VISUALISATION COLOURS — NOT electrical conductor identification
 * colours. Every energy path, label and legend imports these tokens; nothing
 * else may hard-code a flow colour.
 *
 * On-grid and hybrid are system CONFIGURATIONS, not energy sources: they never
 * get their own colour.
 */
export const ENERGY_FLOW_COLORS = {
  solarDC: "#FBBF24",
  utilityGridAC: "#3B82F6",
  batteryDC: "#22C55E",
  inverterAC: "#22D3EE",
  householdLoad: "#F8FAFC",
  inactive: "#64748B",
  fault: "#EF4444",
} as const;

export type EnergyFlowCategory = keyof typeof ENERGY_FLOW_COLORS;

/** What each colour means (shown on the reference sheet / docs). */
export const ENERGY_FLOW_MEANINGS: Record<EnergyFlowCategory, string> = {
  solarDC: "Solar DC generation from the photovoltaic panels",
  utilityGridAC: "Utility grid AC — import or export (direction shows which)",
  batteryDC: "Battery charging or discharging (direction shows which)",
  inverterAC: "Converted AC output from the inverter",
  householdLoad: "Electricity supplied to household loads after distribution",
  inactive: "Inactive, isolated or disconnected connection",
  fault: "Abnormal conditions and warning indicators only",
};

/** Dark outline used behind white household-load paths so they read in bright scenes. */
export const ENERGY_FLOW_OUTLINE = "#1E293B";

/** Reusable Thai educational labels. */
export const ENERGY_FLOW_LABELS_TH = {
  solar: "พลังงานแสงอาทิตย์",
  gridImport: "ไฟฟ้าจากการไฟฟ้า",
  batteryCharging: "กำลังชาร์จแบตเตอรี่",
  batteryDischarging: "กำลังจ่ายไฟจากแบตเตอรี่",
  inverterOutput: "ไฟฟ้าจากอินเวอร์เตอร์",
  householdUse: "การใช้ไฟฟ้าภายในบ้าน",
  gridExport: "ส่งไฟฟ้ากลับเข้าระบบ",
  shutdown: "หยุดจ่ายไฟ",
  backupSystem: "ระบบไฟสำรอง",
} as const;
export type EnergyFlowLabelKey = keyof typeof ENERGY_FLOW_LABELS_TH;

/**
 * APPROVED animation style (owner, 2026-11-27 — "Variant B"): one thin
 * coloured line per connection carrying ONE travelling pulse of light with a
 * short bright leading edge and a long fading tail. The leading edge always
 * faces the destination. No arrowheads, no particles, no density.
 *
 * Pulse speed, length, brightness and line thickness NEVER depend on power;
 * kW is shown separately (labels). The effect shows the direction of energy
 * transfer, not the movement or speed of electrons.
 */
export const ENERGY_FLOW_PULSE = {
  /** Pulse length as a fraction of the connection length. */
  lengthFraction: 0.35,
  /** Short connections: the pulse is at least this long (m) but never more than maxFraction of the cable. */
  minLengthM: 0.55,
  maxFraction: 0.6,
  /** Seconds for the leading edge to travel from source to destination (approved range 0.8–1.5). */
  travelSeconds: 1.2,
  travelSecondsRange: [0.8, 1.5] as const,
  /** Line brightness when no pulse is passing (approved 25–35 %). */
  baseIntensity: 0.3,
  peakIntensity: 1,
  /**
   * Intensity profile from the trailing end (0) to the leading end (1):
   * 0 % → 0, 25 % → 0.15, 50 % → 0.40, 75 % → 0.75, 90 % → 1.0, 100 % → 0 (smooth, rapid fade).
   */
  profile: [
    [0, 0],
    [0.25, 0.15],
    [0.5, 0.4],
    [0.75, 0.75],
    [0.9, 1],
    [1, 0],
  ] as const,
  /** How far the leading edge blends toward a lighter tint of its own colour (keeps colour identity). */
  leadingTint: 0.45,
  /** Soft, restrained glow around the line (alpha at peak). No full-scene bloom. */
  glowPeak: 0.4,
  /** Constant cable radius (m); `energyFlow.pathScale` thickens it uniformly for wide shots. */
  cableRadius: 0.03,
} as const;

/** Short Thai legend entries per colour category. */
export const ENERGY_FLOW_LEGEND_TH: Record<EnergyFlowCategory, string> = {
  solarDC: "พลังงานแสงอาทิตย์ (DC)",
  utilityGridAC: "ไฟฟ้าจากการไฟฟ้า (AC)",
  batteryDC: "แบตเตอรี่ ชาร์จ / จ่ายไฟ (DC)",
  inverterAC: "ไฟฟ้าจากอินเวอร์เตอร์ (AC)",
  householdLoad: "การใช้ไฟฟ้าภายในบ้าน",
  inactive: "ไม่มีการจ่ายไฟ / ตัดการเชื่อมต่อ",
  fault: "ความผิดปกติ / คำเตือน",
};

/**
 * Equipment indicator LEDs and displays (approved migration, 2026-11-27): they
 * use the same semantic tokens as the energy flows so a light on a device
 * means the same thing as the line beside it.
 */
export const EQUIPMENT_INDICATOR_COLORS = {
  /** PV generation (panel sheen, solar readouts). */
  solar: ENERGY_FLOW_COLORS.solarDC,
  /** Grid import or export activity (meter). */
  grid: ENERGY_FLOW_COLORS.utilityGridAC,
  /** Battery charge level / charging / discharging. */
  battery: ENERGY_FLOW_COLORS.batteryDC,
  /** Inverter running and its AC output level; backup-circuit supply. */
  inverterAC: ENERGY_FLOW_COLORS.inverterAC,
  /** An appliance receiving household power. */
  appliance: ENERGY_FLOW_COLORS.householdLoad,
  /** Idle / not connected. */
  idle: ENERGY_FLOW_COLORS.inactive,
  /** Faults and warnings only. */
  fault: ENERGY_FLOW_COLORS.fault,
} as const;
