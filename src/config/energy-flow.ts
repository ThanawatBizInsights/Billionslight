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
 * Motion & density scale. Speed is CONSTANT (electricity does not "go faster"
 * with more load); particle density encodes power. Density is linear in kW
 * against a per-scene reference so values are comparable within a scene.
 */
export const ENERGY_FLOW_MOTION = {
  /** Metres per second — same for every path and every power level. */
  speed: 0.9,
  /** Particles per metre at the reference power (scene.energyFlow.referenceKw). */
  densityAtReference: 5,
  /** Default reference power (kW) for a comparison scene. */
  referenceKw: 5,
  /** Distance between moving arrowheads (m). */
  arrowSpacing: 1.6,
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
