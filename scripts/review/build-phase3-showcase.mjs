#!/usr/bin/env node
/**
 * Writes the silent Phase 3 engine showcase episode (data only — no engine
 * logic): src/episodes/phase3-engine-showcase.episode.json
 *   node scripts/review/build-phase3-showcase.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PI = Math.PI;

const scenario = (o = {}) => ({
  inverterType: "grid-tied",
  gridStatus: "connected",
  solarIrradiance: 0.85,
  pvRatedKw: 5,
  inverterRatedKw: 5,
  householdLoadKw: 2.4,
  backupLoadKw: 0.8,
  exportPermitted: false,
  ...o,
});
const hybridBackup = (o = {}) =>
  scenario({
    inverterType: "hybrid",
    battery: { present: true, capacityKwh: 10, stateOfCharge: 0.7, maxPowerKw: 5 },
    backup: { backupOutputConfigured: true, gridIsolationDevice: true, loadsOnBackupCircuit: true },
    ...o,
  });

const presenters = (sunnyClips = [], tonPos = [2.6, 0.15, 1.0]) => [
  { castId: "sunny", keyframes: [{ frame: 0, position: [-1.0, 0.15, 1.6], rotationY: 0.5 }], clips: sunnyClips, expression: [{ frame: 0, expression: "happy" }] },
  { castId: "ton", keyframes: [{ frame: 0, position: tonPos, rotationY: -0.4 }], lookAt: [{ frame: 0, target: { castId: "sunny" } }] },
];

const scenes = [
  {
    id: "cutaway-normal",
    title: "Cutaway · normal day (grid-tied)",
    durationInFrames: 150,
    environment: { id: "energy-cutaway-house", options: { system: "on-grid" } },
    lighting: { preset: "midday-sun" },
    camera: {
      shots: [
        { from: 0, preset: "isometric-house", subject: [2.6, 2.2, 0], params: { distance: 50, height: 32, fov: 30 } },
        { from: 80, preset: "rooftop-aerial", subject: "roofArray", params: { distance: 9, height: 5 } },
      ],
    },
    characters: presenters([{ clip: "wave", from: 10, durationInFrames: 50, params: { hand: "left" } }]),
    electrical: [{ frame: 0, scenario: scenario(), transitionFrames: 0 }],
    overlays: [{ id: "t1", kind: "title", text: "Phase 3 · ทดสอบเอนจินแอนิเมชัน", from: 0, durationInFrames: 70, anchor: [0.5, 0.12] }],
  },
  {
    id: "cutaway-on-grid-outage",
    title: "Cutaway · grid outage, on-grid inverter shuts down",
    durationInFrames: 165,
    transitionIn: { type: "fade", durationInFrames: 15 },
    environment: { id: "energy-cutaway-house", options: { system: "on-grid" } },
    lighting: { preset: "midday-sun" },
    camera: {
      shots: [
        { from: 0, preset: "interior-cutaway", subject: [2.6, 2.6, 0], params: { distance: 34, height: 9, azimuth: 0.25 } },
        { from: 60, preset: "equipment-close-up", subject: "utilityPole", params: { distance: 7, height: -1.5, azimuth: 0.3 } },
        { from: 95, preset: "slow-dolly-in", subject: "livingRoom", params: { distance: 7, height: 1.2, azimuth: 0.15 } },
        { from: 130, preset: "equipment-close-up", subject: "inverter", params: { distance: 2.6, height: 0.1, azimuth: 0.1 } },
      ],
    },
    characters: presenters(),
    electrical: [
      { frame: 0, scenario: scenario(), transitionFrames: 0 },
      { frame: 45, scenario: scenario({ gridStatus: "outage" }), transitionFrames: 6 },
    ],
    overlays: [{ id: "l2", kind: "label", text: "ระบบออนกริด · ไฟดับ", from: 50, durationInFrames: 110, anchor: [0.5, 0.12] }],
  },
  {
    id: "cutaway-hybrid-backup",
    title: "Cutaway · hybrid + battery, backup circuit during outage, clouds",
    durationInFrames: 180,
    transitionIn: { type: "dip-to-navy", durationInFrames: 20 },
    environment: {
      id: "energy-cutaway-house",
      options: { system: "hybrid", battery: true, backupLoads: ["fridge", "light-living", "fan"] },
      states: [{ frame: 0, values: { clouds: 1 }, transitionFrames: 0 }],
    },
    lighting: { preset: "midday-sun" },
    camera: {
      shots: [
        { from: 0, preset: "interior-cutaway", subject: [2.6, 2.6, 0], params: { distance: 34, height: 9, azimuth: 0.25 } },
        { from: 60, preset: "slow-dolly-in", subject: [3.4, 1.2, -2.2], params: { distance: 6, height: 0.8, azimuth: -0.3 } },
        { from: 120, preset: "equipment-close-up", subject: [6.0, 1.2, -2.6], params: { distance: 3.4, height: 0.3, azimuth: 0.2 } },
      ],
    },
    characters: presenters([], [1.2, 0.15, 1.4]),
    electrical: [
      { frame: 0, scenario: hybridBackup({ solarIrradiance: 0.45 }), transitionFrames: 0 },
      { frame: 40, scenario: hybridBackup({ solarIrradiance: 0.45, gridStatus: "outage" }), transitionFrames: 8 },
    ],
    overlays: [{ id: "l3", kind: "label", text: "ระบบไฮบริด + แบตเตอรี่ · วงจรสำรอง", from: 10, durationInFrames: 165, anchor: [0.5, 0.12] }],
  },
  {
    id: "living-room-walk-switch",
    title: "Living room · walk, switch the light on, reactions",
    durationInFrames: 240,
    transitionIn: { type: "dip-to-navy", durationInFrames: 20 },
    environment: { id: "living-room", states: [{ frame: 0, values: { lights: 0 }, transitionFrames: 0 }, { frame: 127, values: { lights: 1 }, transitionFrames: 4 }] },
    lighting: { preset: "evening" },
    camera: {
      shots: [
        { from: 0, preset: "two-character", subject: { castId: "sunny" }, subject2: { castId: "ton" }, params: { side: 1 } },
        { from: 60, preset: "tracking", subject: { castId: "ton" }, params: { azimuth: -1.2, distance: 2.9 } },
        { from: 165, preset: "close-up", subject: { castId: "ton" }, params: { azimuth: -0.5, relative: true } },
        { from: 200, preset: "medium-character", subject: { castId: "sunny" }, params: { azimuth: 0.2, relative: true } },
      ],
    },
    characters: [
      {
        castId: "ton",
        faceMovement: true,
        keyframes: [
          { frame: 0, position: [0.2, 0, 0.9], rotationY: -0.6 },
          { frame: 20, position: [0.2, 0, 0.9] },
          { frame: 115, position: [1.75, 0, -1.9], rotationY: 2.6 },
          { frame: 160, rotationY: 2.6 },
          { frame: 178, rotationY: 0.2 },
        ],
        clips: [
          { clip: "operate-switch", from: 112, durationInFrames: 48, params: { target: "lightSwitch", pressAt: 15 } },
          { clip: "nod", from: 180, durationInFrames: 22, blendFrames: 6 },
        ],
        expression: [{ frame: 0, expression: "curious" }, { frame: 130, expression: "happy" }],
        lookAt: [{ frame: 100, target: "lightSwitch" }, { frame: 172, target: { castId: "sunny" } }],
      },
      {
        castId: "sunny",
        faceMovement: true,
        keyframes: [
          { frame: 0, position: [-1.3, 0, 0.3], rotationY: 0.6 },
          { frame: 135, position: [-1.3, 0, 0.3] },
          { frame: 200, position: [0.6, 0, -0.5], rotationY: 0.7 },
        ],
        clips: [
          { clip: "scratch-head", from: 25, durationInFrames: 60, params: { hand: "right" } },
          { clip: "wave", from: 205, durationInFrames: 35, params: { hand: "left" } },
        ],
        expression: [{ frame: 0, expression: "thinking" }, { frame: 130, expression: "happy" }],
        lookAt: [{ frame: 0, target: { castId: "ton" } }],
      },
    ],
  },
  {
    id: "garage-check-equipment",
    title: "Garage · walk to the hybrid inverter, inspect, outage → backup",
    durationInFrames: 210,
    transitionIn: { type: "fade", durationInFrames: 15 },
    environment: { id: "garage-service-area", options: { system: "hybrid", battery: true } },
    lighting: { preset: "midday-sun" },
    camera: {
      shots: [
        { from: 0, preset: "tracking", subject: { castId: "sunny" }, params: { azimuth: 0.5, distance: 3.4 } },
        { from: 100, preset: "equipment-close-up", subject: "inverter", params: { distance: 1.6 } },
        { from: 150, preset: "orbit-around-equipment", subject: "battery", params: { distance: 2.6, height: 0.8, azimuth: 0.55, orbit: 0.6 } },
      ],
    },
    characters: [
      {
        castId: "sunny",
        faceMovement: true,
        keyframes: [
          { frame: 0, position: [1.8, 0, 0.8], rotationY: -1.0 },
          { frame: 95, position: [-1.0, 0, -2.25], rotationY: PI },
        ],
        clips: [{ clip: "check-equipment", from: 98, durationInFrames: 100, params: { target: "inverter" } }],
        expression: [{ frame: 0, expression: "happy" }, { frame: 100, expression: "thinking" }],
        lookAt: [{ frame: 60, target: "inverter" }, { frame: 160, target: "battery" }],
      },
      {
        castId: "ton",
        keyframes: [{ frame: 0, position: [1.6, 0, -0.6], rotationY: -0.9 }],
        clips: [{ clip: "shade-eyes", from: 20, durationInFrames: 50 }],
        lookAt: [{ frame: 0, target: { castId: "sunny" } }],
      },
    ],
    electrical: [
      { frame: 0, scenario: hybridBackup(), transitionFrames: 0 },
      { frame: 150, scenario: hybridBackup({ gridStatus: "outage" }), transitionFrames: 6 },
    ],
  },
];

const episode = {
  schemaVersion: 1,
  id: "phase3-engine-showcase",
  title: "Phase 3 · Animation engine showcase (silent)",
  topic: "Engine test: locomotion, interactions, subject-aware cameras, transitions, equipment states and derived energy flows. Simplified educational model.",
  language: "th",
  aspectRatio: "9:16",
  fps: 30,
  cast: [
    { id: "sunny", characterId: "sunny" },
    { id: "ton", characterId: "homeowner_male_01" },
  ],
  scenes,
  branding: { showLogo: false },
  approval: { status: "visual-review", history: [] },
};

const out = path.join(root, "src/episodes/phase3-engine-showcase.episode.json");
fs.writeFileSync(out, JSON.stringify(episode, null, 2) + "\n");
console.log("wrote", path.relative(root, out));
