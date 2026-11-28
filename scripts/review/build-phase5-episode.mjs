#!/usr/bin/env node
/**
 * Phase 5 demo episode (data only): "ไฟดับตอนแดดแรง โซลาร์ยังจ่ายไฟให้บ้านไหม?"
 *   node scripts/review/build-phase5-episode.mjs
 * → src/episodes/phase5-blackout-sunny-day.episode.json
 *
 * Story: Ton's power cuts out at midday and he assumes the rooftop solar keeps
 * the house running. Sunny shows why an on-grid system stops (anti-islanding,
 * line-worker safety), what a hybrid system with battery + configured backup
 * circuit can do, its limits, and that a qualified installer should assess it.
 * Every technical statement is a claim with references, status
 * needs-human-review until a human technical reviewer verifies it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ------------------------------------------------------------ electrical scenarios
const base = { pvRatedKw: 5, inverterRatedKw: 5, householdLoadKw: 2.5, backupLoadKw: 0.8, exportPermitted: false };
const onGridNormal = { ...base, inverterType: "grid-tied", gridStatus: "connected", solarIrradiance: 0.9 };
const onGridOutage = { ...onGridNormal, gridStatus: "outage" };
const hybridBackup = {
  ...base,
  inverterType: "hybrid",
  gridStatus: "outage",
  solarIrradiance: 0.9,
  battery: { present: true, capacityKwh: 10, stateOfCharge: 0.7, maxPowerKw: 5 },
  backup: { backupOutputConfigured: true, gridIsolationDevice: true, loadsOnBackupCircuit: true },
};
const hybridOpts = { system: "hybrid", battery: true, backupLoads: ["fridge", "light-living", "fan"] };
const CUTAWAY_CAM = { frame: 0, position: [21.44, 24.49, 45.29], target: [2.5, 1, 0.5], fov: 30 };

// ------------------------------------------------------------ claims & references
const references = [
  { id: "r-iec-62116", title: "IEC 62116:2014 — Utility-interconnected photovoltaic inverters: test procedure of islanding prevention measures", source: "IEC 62116:2014" },
  { id: "r-ieee-1547", title: "IEEE 1547-2018 — Interconnection and interoperability of distributed energy resources with electric power systems", source: "IEEE Std 1547-2018" },
  { id: "r-hybrid-manual", title: "Hybrid inverter installation manual — backup (EPS) output, grid isolation and backup load limits", source: "Manufacturer documentation — technical reviewer to name the specific product(s) used by Billionslight", notes: "Placeholder until a reviewer selects the product documentation." },
  { id: "r-bl-policy", title: "Billionslight electrical-accuracy and safety policy", source: "docs/electrical-accuracy.md (internal)" },
];
const claim = (id, text, meaning, referenceIds) => ({ id, text, meaning, referenceIds, status: "needs-human-review" });
const technicalClaims = [
  claim("c-ongrid-stops", "ระบบออนกริด พอไฟจากการไฟฟ้าดับ อินเวอร์เตอร์จะหยุดจ่ายไฟ", "A grid-tied (on-grid) PV inverter stops supplying power when the utility grid fails (anti-islanding), even in strong sun.", ["r-iec-62116", "r-ieee-1547"]),
  claim("c-lineworker-safety", "เพื่อไม่ให้ไฟย้อนกลับเข้าสายไฟฟ้าตอนที่ช่างกำลังซ่อม", "Anti-islanding prevents the PV system from energising the utility lines during an outage, protecting utility workers.", ["r-ieee-1547", "r-iec-62116"]),
  claim("c-hybrid-backup-needs", "ต้องเป็นระบบไฮบริดที่มีแบตเตอรี่ และตั้งค่าวงจรไฟสำรองไว้", "Supplying power during an outage needs equipment with a configured backup output (e.g. a hybrid inverter with battery) and a backup circuit.", ["r-hybrid-manual", "r-bl-policy"]),
  claim("c-backup-isolation", "ระบบจะแยกตัวออกจากสายการไฟฟ้า แล้วจ่ายไฟเฉพาะวงจรสำรอง", "During backup operation the system isolates from the grid and supplies only the loads on the backup circuit.", ["r-hybrid-manual", "r-ieee-1547"]),
  claim("c-backup-limits", "ไฟสำรองจ่ายได้ตามกำลังของอินเวอร์เตอร์และแบตเตอรี่", "Backup supply is limited by the inverter's and battery's power ratings.", ["r-hybrid-manual"]),
  claim("c-qualified-installer", "ให้ช่างผู้เชี่ยวชาญช่วยประเมินและติดตั้ง", "Electrical work and system choice should be assessed and installed by qualified professionals, never DIY.", ["r-bl-policy"]),
];

// ------------------------------------------------------------ scenes
const scenes = [
  {
    id: "hook",
    title: "Hook — the question",
    durationInFrames: 150,
    environment: { id: "modern-thai-house" },
    lighting: { preset: "midday-sun" },
    camera: { shots: [{ from: 0, preset: "establishing-wide", subject: "frontDoor", params: { distance: 24, height: 7 } }] },
    electrical: [{ frame: 0, scenario: onGridNormal, transitionFrames: 0 }],
    energyFlow: { pathScale: 1.6 },
    dialogue: [{ id: "narr-01", text: "ไฟดับตอนแดดแรงแบบนี้ โซลาร์บนหลังคายังจ่ายไฟให้บ้านได้ไหม?", speak: "ไฟดับตอนแดดแรงแบบนี้... โซลาร์บนหลังคา ยังจ่ายไฟให้บ้านได้ไหม?", from: 20 }],
    overlays: [{ id: "title", kind: "title", text: "ไฟดับตอนแดดแรง\nโซลาร์ยังจ่ายไฟให้บ้านไหม?", from: 0, durationInFrames: 150, anchor: [0.5, 0.06], style: "compact" }],
    audio: [{ id: "pop", kind: "sfx", asset: "sfx-pop", from: 2, volume: 0.35, duckUnderDialogue: false }],
  },
  {
    id: "blackout",
    title: "Living room — the power goes out",
    durationInFrames: 330,
    transitionIn: { type: "fade", durationInFrames: 12 },
    environment: {
      id: "living-room",
      states: [
        { frame: 0, values: { tv: 1, ac: 1 }, transitionFrames: 0 },
        { frame: 24, values: { power: 0 }, transitionFrames: 3 },
      ],
    },
    lighting: { preset: "midday-sun" },
    camera: {
      shots: [
        { from: 0, preset: "medium-character", subject: { castId: "ton" }, params: { azimuth: 0.35, relative: true } },
        { from: 40, onLine: "ton-01", preset: "close-up", subject: { castId: "ton" }, params: { azimuth: 0.2, relative: true } },
        { from: 200, onLine: "sunny-01", preset: "two-character", subject: { castId: "ton" }, subject2: { castId: "sunny" }, params: { side: 1 } },
        { from: 280, onLine: "ton-02", preset: "close-up", subject: { castId: "ton" }, params: { azimuth: 0.2, relative: true } },
        { from: 320, onLine: "sunny-02", preset: "close-up", subject: { castId: "sunny" }, params: { azimuth: 0.15, relative: true, distance: 2.1 } },
      ],
    },
    characters: [
      {
        castId: "ton",
        keyframes: [{ frame: 0, position: [-1.1, 0, -1.35], rotationY: 0.5 }],
        clips: [
          { clip: "sit", from: 0, durationInFrames: 330, blendFrames: 1, params: { seatHeight: 0.56 } },
          { clip: "surprised", from: 26, durationInFrames: 36, blendFrames: 4 },
          { clip: "scratch-head", from: 0, onLine: "ton-02", durationInFrames: 50, params: { hand: "right" } },
        ],
        expression: [
          { frame: 0, expression: "happy" },
          { frame: 26, expression: "surprised" },
          { frame: 0, onLine: "ton-01", offset: 30, expression: "curious" },
          { frame: 0, onLine: "ton-02", expression: "thinking" },
        ],
        lookAt: [{ frame: 0, target: "tv" }, { frame: 40, target: [-0.2, 2.6, -0.4] }, { frame: 150, target: { castId: "sunny" } }],
      },
      {
        castId: "sunny",
        faceMovement: true,
        keyframes: [
          { frame: 0, position: [2.7, 0, 1.7], rotationY: -2.2 },
          { frame: 120, position: [2.7, 0, 1.7] },
          { frame: 200, position: [0.65, 0, -0.2], rotationY: -0.5 },
        ],
        clips: [
          { clip: "explain", from: 0, onLine: "sunny-01", offset: 8, durationInFrames: 60 },
          { clip: "wave", from: 0, onLine: "sunny-02", durationInFrames: 36, params: { hand: "left" } },
        ],
        expression: [{ frame: 0, expression: "happy" }],
        lookAt: [{ frame: 0, target: { castId: "ton" } }],
      },
    ],
    dialogue: [
      { id: "ton-01", castId: "ton", text: "อ้าว ไฟดับ! แต่แดดแรงขนาดนี้ โซลาร์บนหลังคาก็น่าจะยังจ่ายไฟได้นี่นา", speak: "[surprised] อ้าว ไฟดับ! [curious] แต่แดดแรงขนาดนี้... โซลาร์บนหลังคา ก็น่าจะยังจ่ายไฟได้นี่นา", from: 40 },
      { id: "sunny-01", castId: "sunny", text: "ไม่ได้ครับพี่ต้น บ้านเราเป็นระบบออนกริด พอไฟจากการไฟฟ้าดับ อินเวอร์เตอร์จะหยุดจ่ายไฟทันทีครับ", speak: "[warmly] ไม่ได้ครับพี่ต้น บ้านเราเป็นระบบออนกริด... พอไฟจากการไฟฟ้าดับ อินเวอร์เตอร์จะหยุดจ่ายไฟทันทีครับ", from: 200 },
      { id: "ton-02", castId: "ton", text: "อ้าว แล้วทำไมล่ะ แดดก็ยังมีอยู่นะ", speak: "[puzzled] อ้าว... แล้วทำไมล่ะ แดดก็ยังมีอยู่นะ", from: 280 },
      { id: "sunny-02", castId: "sunny", text: "เดี๋ยวผมให้ดูครับ!", speak: "[cheerful] เดี๋ยวผมให้ดูครับ!", from: 320 },
    ],
    audio: [
      { id: "room", kind: "ambience", asset: "amb-room-tone", from: 0, volume: 0.16, fadeInFrames: 8, fadeOutFrames: 8 },
      { id: "cut", kind: "sfx", asset: "sfx-power-down", from: 24, volume: 0.55, duckUnderDialogue: false },
    ],
    claimIds: ["c-ongrid-stops"],
  },
  {
    id: "why-ongrid-stops",
    title: "Cutaway — on-grid inverter stops (anti-islanding)",
    durationInFrames: 300,
    transitionIn: { type: "dip-to-navy", durationInFrames: 16 },
    environment: { id: "energy-cutaway-house", options: { system: "on-grid" } },
    lighting: { preset: "midday-sun" },
    camera: { keyframes: [CUTAWAY_CAM] },
    electrical: [{ frame: 0, scenario: onGridOutage, transitionFrames: 0 }],
    energyFlow: { labels: true, pathScale: 1.8 },
    dialogue: [
      { id: "sunny-03", castId: "sunny", text: "ดูนี่ครับ แดดยังส่องแผงอยู่ แต่ทุกเส้นหยุดหมด เพราะอินเวอร์เตอร์หยุดจ่ายไฟ", speak: "[curious] ดูนี่ครับ... แดดยังส่องแผงอยู่ แต่ทุกเส้นหยุดหมดเลย เพราะอินเวอร์เตอร์หยุดจ่ายไฟครับ", from: 14 },
      { id: "sunny-04", castId: "sunny", text: "ระบบออกแบบมาแบบนี้ เพื่อไม่ให้ไฟย้อนกลับเข้าสายไฟฟ้า ตอนที่ช่างกำลังซ่อมอยู่ครับ", speak: "[warmly] ระบบออกแบบมาแบบนี้ เพื่อไม่ให้ไฟย้อนกลับเข้าสายไฟฟ้า... ตอนที่ช่างกำลังซ่อมอยู่ครับ", from: 120 },
      { id: "ton-03", castId: "ton", text: "อ๋อ เพื่อความปลอดภัยของช่างนี่เอง", speak: "[warmly] อ๋อ... เพื่อความปลอดภัยของช่างนี่เอง", from: 240 },
    ],
    audio: [{ id: "whoosh", kind: "sfx", asset: "sfx-whoosh-soft", from: 0, volume: 0.4, duckUnderDialogue: false }],
    claimIds: ["c-ongrid-stops", "c-lineworker-safety"],
  },
  {
    id: "hybrid-backup",
    title: "Cutaway — hybrid + battery with a backup circuit",
    durationInFrames: 330,
    transitionIn: { type: "fade", durationInFrames: 14 },
    environment: { id: "energy-cutaway-house", options: hybridOpts },
    lighting: { preset: "midday-sun" },
    camera: { keyframes: [CUTAWAY_CAM] },
    electrical: [{ frame: 0, scenario: hybridBackup, transitionFrames: 0 }],
    energyFlow: { labels: true, pathScale: 1.8 },
    dialogue: [
      { id: "ton-04", castId: "ton", text: "แล้วถ้าอยากมีไฟใช้ตอนไฟดับล่ะ ทำได้ไหม", speak: "[curious] แล้วถ้าอยากมีไฟใช้ตอนไฟดับล่ะ... ทำได้ไหม?", from: 10 },
      { id: "sunny-05", castId: "sunny", text: "ทำได้ครับ! ถ้าเป็นระบบไฮบริดที่มีแบตเตอรี่ และตั้งค่าวงจรไฟสำรองไว้", speak: "[excited] ทำได้ครับ! ถ้าเป็นระบบไฮบริดที่มีแบตเตอรี่... และตั้งค่าวงจรไฟสำรองไว้ครับ", from: 90 },
      { id: "sunny-06", castId: "sunny", text: "ระบบจะแยกตัวออกจากสายการไฟฟ้า แล้วจ่ายไฟเฉพาะวงจรสำรอง อย่างตู้เย็น ไฟ และพัดลมครับ", speak: "[cheerful] ระบบจะแยกตัวออกจากสายการไฟฟ้า แล้วจ่ายไฟเฉพาะวงจรสำรอง อย่างตู้เย็น ไฟ และพัดลมครับ", from: 190 },
    ],
    audio: [{ id: "up", kind: "sfx", asset: "sfx-power-up", from: 4, volume: 0.45, duckUnderDialogue: false }],
    claimIds: ["c-hybrid-backup-needs", "c-backup-isolation"],
  },
  {
    id: "garage-advice",
    title: "Garage — limits and a qualified installer",
    durationInFrames: 300,
    transitionIn: { type: "dip-to-navy", durationInFrames: 14 },
    environment: { id: "garage-service-area", options: { system: "hybrid", battery: true } },
    lighting: { preset: "midday-sun" },
    camera: {
      shots: [
        { from: 0, preset: "medium-character", subject: { castId: "sunny" }, params: { azimuth: 0.25, relative: true } },
        { from: 100, onLine: "sunny-08", preset: "two-character", subject: { castId: "sunny" }, subject2: { castId: "ton" }, params: { side: 1 } },
        { from: 220, onLine: "ton-05", preset: "close-up", subject: { castId: "ton" }, params: { azimuth: 0.2, relative: true } },
      ],
    },
    characters: [
      {
        castId: "sunny",
        keyframes: [{ frame: 0, position: [0.3, 0, -1.4], rotationY: 0.45 }],
        clips: [
          { clip: "point", from: 0, onLine: "sunny-07", durationInFrames: 50, params: { target: "inverter" } },
          { clip: "explain", from: 0, onLine: "sunny-08", durationInFrames: 60 },
        ],
        expression: [{ frame: 0, expression: "happy" }],
        lookAt: [{ frame: 0, target: { castId: "ton" } }],
      },
      {
        castId: "ton",
        keyframes: [{ frame: 0, position: [1.6, 0, -0.6], rotationY: -0.9 }],
        clips: [{ clip: "nod", from: 0, onLine: "ton-05", durationInFrames: 24, blendFrames: 6 }],
        expression: [{ frame: 0, expression: "curious" }, { frame: 0, onLine: "ton-05", expression: "happy" }],
        lookAt: [{ frame: 0, target: { castId: "sunny" } }],
      },
    ],
    electrical: [{ frame: 0, scenario: hybridBackup, transitionFrames: 0 }],
    dialogue: [
      { id: "sunny-07", castId: "sunny", text: "แต่ไฟสำรองจ่ายได้ตามกำลังของอินเวอร์เตอร์และแบตเตอรี่นะครับ", speak: "[warmly] แต่ไฟสำรอง จ่ายได้ตามกำลังของอินเวอร์เตอร์และแบตเตอรี่นะครับ", from: 12 },
      { id: "sunny-08", castId: "sunny", text: "จะเลือกระบบแบบไหน ให้ช่างผู้เชี่ยวชาญช่วยประเมินและติดตั้งดีที่สุดครับ", speak: "[cheerful] จะเลือกระบบแบบไหน... ให้ช่างผู้เชี่ยวชาญช่วยประเมินและติดตั้ง ดีที่สุดครับ", from: 110 },
      { id: "ton-05", castId: "ton", text: "เข้าใจแล้ว ขอบคุณนะซันนี่!", speak: "[warmly] เข้าใจแล้ว... ขอบคุณนะซันนี่!", from: 220 },
    ],
    claimIds: ["c-backup-limits", "c-qualified-installer"],
  },
  {
    id: "closing",
    title: "Closing — summary + official logo",
    durationInFrames: 180,
    transitionIn: { type: "fade", durationInFrames: 14 },
    environment: { id: "modern-thai-house" },
    lighting: { preset: "golden-hour" },
    camera: { shots: [{ from: 0, preset: "slow-dolly-out", subject: "frontDoor", params: { distance: 14, height: 3 } }] },
    dialogue: [
      { id: "narr-02", text: "ไฟดับตอนแดดแรง โซลาร์จะจ่ายไฟได้หรือไม่ ขึ้นอยู่กับระบบที่บ้านคุณติดตั้ง", speak: "ไฟดับตอนแดดแรง... โซลาร์จะจ่ายไฟได้หรือไม่ ขึ้นอยู่กับระบบที่บ้านคุณติดตั้งครับ", from: 8 },
    ],
    overlays: [{ id: "logo", kind: "logo", style: "stacked", from: 20, durationInFrames: 160, anchor: [0.5, 0.42] }],
    audio: [{ id: "pop2", kind: "sfx", asset: "sfx-pop", from: 20, volume: 0.35, duckUnderDialogue: false }],
    claimIds: ["c-ongrid-stops", "c-hybrid-backup-needs"],
  },
];

const episode = {
  schemaVersion: 1,
  id: "phase5-blackout-sunny-day",
  title: "ไฟดับตอนแดดแรง โซลาร์ยังจ่ายไฟให้บ้านไหม?",
  topic: "Why an on-grid solar system stops during a blackout even in strong sun (anti-islanding), what a hybrid system with battery and a configured backup circuit can do, its limits, and why a qualified installer should assess it. Simplified educational model; illustrative kW values; not installation or wiring instructions.",
  language: "th",
  aspectRatio: "9:16",
  fps: 30,
  cast: [
    { id: "sunny", characterId: "sunny" },
    { id: "ton", characterId: "homeowner_male_01" },
  ],
  audio: [{ id: "bed", kind: "music", asset: "music-bright-bed", from: 0, volume: 0.3, fadeInFrames: 20, fadeOutFrames: 45, duckUnderDialogue: true }],
  audioMix: { dialogueVolume: 1, duckTo: 0.25, duckRampFrames: 8 },
  subtitles: { enabled: true, maxCharsPerLine: 26, maxLines: 2, speakerNames: false },
  scenes,
  branding: { showLogo: true },
  technicalClaims,
  references,
  approval: { status: "draft", history: [] },
};

const out = path.join(root, "src/episodes/phase5-blackout-sunny-day.episode.json");
fs.writeFileSync(out, JSON.stringify(episode, null, 2) + "\n");
console.log("wrote", path.relative(root, out));
