#!/usr/bin/env node
/**
 * Generates the Phase 2 character review episodes (pure data, rendered by the
 * normal engine) and the still-render plan.
 *
 *   node scripts/review/build-review-episodes.mjs
 *   node scripts/render-stills.mjs renders/phase-2-review/stills-plan.json
 *   python3 scripts/review/contact_sheet.py        # optional: tiled sheets (Pillow)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "src/episodes/review");
fs.mkdirSync(outDir, { recursive: true });

const CHARS = {
  sunny: { id: "sunny", name: "SUNNY", th: "ซันนี่", eyeY: 0.92, height: 1.35 },
  ton: { id: "homeowner_male_01", name: "TON", th: "ต้น", eyeY: 1.55, height: 1.7 },
};

const base = (id, title, aspectRatio, durationInFrames, cast, scene) => ({
  schemaVersion: 1,
  id,
  title,
  aspectRatio,
  fps: 30,
  cast,
  scenes: [
    {
      id: "review",
      durationInFrames,
      environment: { id: "review-studio", options: { atmosphere: false, ...(scene.envOptions ?? {}) } },
      lighting: { preset: "review-studio" },
      camera: scene.camera,
      characters: scene.characters,
      overlays: scene.overlays ?? [],
    },
  ],
  branding: { showLogo: false },
});
const tag = (id, text, anchor, from = 0, durationInFrames = 9999) => ({ id, kind: "label", style: "tag", text, from, durationInFrames, anchor });

const episodes = {};
const stills = [];

// ---------------------------------------------------------------- turnarounds
for (const [key, c] of Object.entries(CHARS)) {
  const rots = [0, 0.62, Math.PI / 2, Math.PI];
  const labels = ["FRONT", "3/4", "SIDE", "BACK"];
  const spacing = key === "sunny" ? 1.2 : 1.05;
  const xs = rots.map((_, i) => (i - 1.5) * spacing);
  const dist = key === "sunny" ? 11 : 13.5;
  const fov = 20;
  const halfW = dist * Math.tan(((fov / 2) * Math.PI) / 180) * (16 / 9);
  episodes[`turnaround-${key}`] = base(`review-turnaround-${key}`, `${c.name} turnaround`, "16:9", 30, rots.map((_, i) => ({ id: `v${i}`, characterId: c.id })), {
    camera: { keyframes: [{ frame: 0, position: [0, c.height * 0.55, dist], target: [0, c.height * 0.5, 0], fov }] },
    characters: rots.map((r, i) => ({ castId: `v${i}`, keyframes: [{ frame: 0, position: [xs[i], 0, 0], rotationY: r }], expression: [{ frame: 0, expression: "happy" }] })),
    overlays: [tag("t", `${c.name} (${c.th}) · IDENTITY SHEET · PROTOTYPE FOR APPROVAL`, [0.5, 0]), ...labels.map((l, i) => tag(`l${i}`, l, [0.5 + (xs[i] / (2 * halfW)) * 1.08, 0.97]))],
  });
  stills.push({ episode: `src/episodes/review/turnaround-${key}.json`, frame: 15, out: `01-characters/${key}-turnaround.png`, quality: "final" });
}

// ------------------------------------------------------------------- scale
episodes["scale-reference"] = base(
  "review-scale",
  "Character scale reference",
  "16:9",
  30,
  [
    { id: "sunny", characterId: "sunny" },
    { id: "ton", characterId: "homeowner_male_01" },
    { id: "sunny_side", characterId: "sunny" },
    { id: "ton_side", characterId: "homeowner_male_01" },
  ],
  {
    envOptions: { ruler: true },
    camera: { keyframes: [{ frame: 0, position: [0.9, 0.88, 30], target: [0.9, 0.88, 0], fov: 4.6 }] },
    characters: [
      ["sunny", -0.35, 0],
      ["ton", 0.45, 0],
      ["sunny_side", 1.4, Math.PI / 2],
      ["ton_side", 2.3, Math.PI / 2],
    ].map(([castId, x, r]) => ({ castId, keyframes: [{ frame: 0, position: [x, 0, 0], rotationY: r }], expression: [{ frame: 0, expression: "happy" }] })),
    overlays: [tag("t", "SCALE REFERENCE · SUNNY 1.35 m (yellow line) · TON (ต้น) 1.70 m (navy line) · RULER 10 cm", [0.5, 0])],
  },
);
stills.push({ episode: "src/episodes/review/scale-reference.json", frame: 15, out: "01-characters/scale-comparison.png", quality: "final" });

// ------------------------------------------------------------- expressions
const EXPR = {
  sunny: ["neutral", "happy", "talk", "surprised", "thinking", "confused", "laughing", "wink", "concerned", "curious"],
  ton: ["neutral", "happy", "talk", "surprised", "thinking", "confused", "laughing", "concerned", "listening", "curious"],
};
for (const [key, c] of Object.entries(CHARS)) {
  const list = EXPR[key];
  const seg = 20;
  episodes[`expressions-${key}`] = base(`review-expressions-${key}`, `${c.name} expressions`, "1:1", list.length * seg, [{ id: "a", characterId: c.id }], {
    camera: { keyframes: [{ frame: 0, position: [0, c.eyeY + 0.02, key === "sunny" ? 2.4 : 2.1], target: [0, c.eyeY - 0.08, 0], fov: 22 }] },
    characters: [
      {
        castId: "a",
        keyframes: [{ frame: 0, position: [0, 0, 0], rotationY: 0.18 }],
        expression: list.map((e, i) => ({ frame: i * seg, expression: e })),
        clips: list.flatMap((e, i) => (e === "talk" ? [{ clip: "talk", from: i * seg, durationInFrames: seg, blendFrames: 2 }] : [])),
      },
    ],
  });
  list.forEach((e, i) => stills.push({ episode: `src/episodes/review/expressions-${key}.json`, frame: i * seg + (e === "talk" ? 12 : 16), out: `02-expressions/${key}/${String(i + 1).padStart(2, "0")}-${e}.png`, quality: "preview", label: e }));
}

// -------------------------------------------------------------------- poses
const POSES = {
  sunny: [
    ["idle", "happy", [], []],
    ["talk + explain", "talk", [["talk"], ["explain"]], []],
    ["point", "happy", [["point", { yaw: -0.9, pitch: 0.35 }]], []],
    ["think", "thinking", [["think"]], []],
    ["wave", "happy", [["wave"]], []],
    ["hold tablet", "talk", [["hold-tablet"]], [["tablet", "wristR"]]],
    ["present solar panel", "happy", [["present-prop"]], [["demo-solar-panel", "wristR"]]],
    ["thumbs up", "wink", [["thumbs-up"]], []],
    ["surprised", "surprised", [["surprised"]], []],
    ["shrug", "confused", [["shrug"]], []],
    ["look upward", "curious", [["look-upward"]], []],
    ["laugh", "laughing", [["laugh"]], []],
  ],
  ton: [
    ["idle", "neutral", [], []],
    ["talk", "talk", [["talk"], ["open-hands"]], []],
    ["listen", "listening", [["listen"]], []],
    ["think", "thinking", [["think"]], []],
    ["point", "curious", [["point", { yaw: 0.9, pitch: 0.2, hand: "left" }]], []],
    ["surprised", "surprised", [["surprised"]], []],
    ["confused shrug", "confused", [["shrug"]], []],
    ["laugh", "laughing", [["laugh"]], []],
    ["wave", "happy", [["wave"]], []],
    ["lean in", "curious", [["lean-in"]], []],
    ["nod", "happy", [["nod"]], []],
    ["coffee", "happy", [["present-prop"]], [["coffee-mug", "wristR"]]],
  ],
};
for (const [key, c] of Object.entries(CHARS)) {
  const list = POSES[key];
  const seg = 30;
  const clips = [];
  const props = [];
  list.forEach(([, , cl, pr], i) => {
    for (const [clip, params] of cl) clips.push({ clip, from: i * seg, durationInFrames: seg, blendFrames: 6, params: params ?? {} });
    for (const [prop, joint] of pr) props.push({ prop, joint, from: i * seg, durationInFrames: seg });
  });
  episodes[`poses-${key}`] = base(`review-poses-${key}`, `${c.name} poses`, "1:1", list.length * seg, [{ id: "a", characterId: c.id }], {
    camera: { keyframes: [{ frame: 0, position: [0, c.height * 0.55, c.height * 3.3], target: [0, c.height * 0.5, 0], fov: 26 }] },
    characters: [{ castId: "a", keyframes: [{ frame: 0, position: [0, 0, 0], rotationY: 0.3 }], expression: list.map(([, e], i) => ({ frame: i * seg, expression: e })), clips, props }],
  });
  list.forEach(([name], i) => stills.push({ episode: `src/episodes/review/poses-${key}.json`, frame: i * seg + 20, out: `03-poses/${key}/${String(i + 1).padStart(2, "0")}-${name.replace(/[^a-z0-9]+/g, "-")}.png`, quality: "preview", label: name }));
}

// sitting (separate episode: needs a seat in the studio)
episodes["sit-both"] = base(
  "review-sit",
  "Sitting pose",
  "16:9",
  30,
  [
    { id: "s", characterId: "sunny" },
    { id: "t", characterId: "homeowner_male_01" },
  ],
  {
    envOptions: { seats: [[-0.7, -0.12, 0.34], [0.7, -0.12, 0.45]] },
    camera: { keyframes: [{ frame: 0, position: [0.6, 1.0, 5.2], target: [0, 0.7, 0], fov: 30 }] },
    characters: [
      { castId: "s", keyframes: [{ frame: 0, position: [-0.7, 0, 0], rotationY: 0.25 }], expression: [{ frame: 0, expression: "happy" }], clips: [{ clip: "sit", from: 0, durationInFrames: 30, blendFrames: 1, params: { seatHeight: 0.34 } }], lookAt: [{ frame: 0, target: { castId: "t" } }] },
      { castId: "t", keyframes: [{ frame: 0, position: [0.7, 0, 0], rotationY: -0.25 }], expression: [{ frame: 0, expression: "listening" }], clips: [{ clip: "sit", from: 0, durationInFrames: 30, blendFrames: 1, params: { seatHeight: 0.45 } }], lookAt: [{ frame: 0, target: { castId: "s" } }] },
    ],
    overlays: [tag("t", "SITTING · EYE CONTACT (look-at) · SEATS 0.34 m / 0.45 m", [0.5, 0])],
  },
);
stills.push({ episode: "src/episodes/review/sit-both.json", frame: 15, out: "03-poses/sitting-eye-contact.png", quality: "final" });

// ------------------------------------------------------------- environments
const envEp = (id, title, envId, options, preset, camera, extra = {}) => ({
  schemaVersion: 1,
  id,
  title,
  aspectRatio: "16:9",
  fps: 30,
  cast: extra.cast ?? [],
  scenes: [
    {
      id: "env",
      durationInFrames: 30,
      environment: { id: envId, options, states: extra.states ?? [] },
      lighting: { preset },
      camera: { keyframes: [{ frame: 0, ...camera }] },
      characters: extra.characters ?? [],
      electrical: extra.electrical ?? [],
      overlays: [tag("t", title.toUpperCase(), [0.5, 0])],
    },
  ],
  branding: { showLogo: false },
});
const HOUSE_CAM = { position: [9.5, 5.2, 21.5], target: [1.2, 3.6, 0], fov: 34 };
for (const [preset, label, states] of [
  ["midday-sun", "day", []],
  ["golden-hour", "golden hour", []],
  ["night", "night", []],
  ["power-outage", "blackout", [{ frame: 0, values: { power: 0 }, transitionFrames: 0 }]],
]) {
  const key = `env-house-${label.replace(/ /g, "-")}`;
  episodes[key] = envEp(`review-${key}`, `ENV01 Modern Thai solar house · ${label}`, "modern-thai-house", {}, preset, HOUSE_CAM, { states });
  stills.push({ episode: `src/episodes/review/${key}.json`, frame: 15, out: `04-environments/house-${label.replace(/ /g, "-")}.png`, quality: "final" });
}
const LIVING_CAM = { position: [2.1, 1.6, 4.9], target: [-0.4, 1.0, -1.0], fov: 48 };
for (const [preset, label, states] of [
  ["midday-sun", "day", []],
  ["evening", "evening (lights on)", [{ frame: 0, values: { tv: 1, ac: 1 }, transitionFrames: 0 }]],
  ["power-outage", "blackout", [{ frame: 0, values: { power: 0 }, transitionFrames: 0 }]],
]) {
  const slug = label.split(" ")[0];
  const key = `env-living-${slug}`;
  episodes[key] = envEp(`review-${key}`, `ENV02 Living room · ${label}`, "living-room", {}, preset, LIVING_CAM, { states });
  stills.push({ episode: `src/episodes/review/${key}.json`, frame: 15, out: `04-environments/living-room-${slug}.png`, quality: "final" });
}
const GARAGE_CAM = { position: [1.1, 1.55, 1.6], target: [-0.15, 1.3, -2.8], fov: 46 };
const gridOk = (irr, extra = {}) => ({ inverterType: "grid-tied", gridStatus: "connected", solarIrradiance: irr, householdLoadKw: 2.2, ...extra });
episodes["env-garage-on-grid"] = envEp("review-env-garage-on-grid", "ENV03 Garage service area · on-grid system · daytime solar + grid", "garage-service-area", { system: "on-grid" }, "midday-sun", GARAGE_CAM, {
  electrical: [{ frame: 0, transitionFrames: 0, scenario: gridOk(0.3) }],
});
episodes["env-garage-hybrid"] = envEp("review-env-garage-hybrid", "ENV03 Garage service area · hybrid + battery + EV charger · outage, backup loads only", "garage-service-area", { system: "hybrid", battery: true, evCharger: true, car: true }, "evening", { position: [2.4, 1.75, 4.6], target: [-0.1, 1.15, -2.5], fov: 48 }, {
  electrical: [
    {
      frame: 0,
      transitionFrames: 0,
      scenario: {
        inverterType: "hybrid",
        gridStatus: "outage",
        solarIrradiance: 0,
        householdLoadKw: 2.5,
        backupLoadKw: 0.6,
        battery: { present: true, stateOfCharge: 0.7 },
        backup: { backupOutputConfigured: true, gridIsolationDevice: true, loadsOnBackupCircuit: true },
      },
    },
  ],
});
stills.push({ episode: "src/episodes/review/env-garage-on-grid.json", frame: 15, out: "04-environments/garage-on-grid-day.png", quality: "final" });
stills.push({ episode: "src/episodes/review/env-garage-hybrid.json", frame: 15, out: "04-environments/garage-hybrid-backup-evening.png", quality: "final" });

for (const [name, ep] of Object.entries(episodes)) fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(ep, null, 1) + "\n");
const plan = { outDir: "renders/phase-2-review", jobs: stills };
fs.mkdirSync(path.join(root, "renders/phase-2-review"), { recursive: true });
fs.writeFileSync(path.join(root, "renders/phase-2-review/stills-plan.json"), JSON.stringify(plan, null, 1) + "\n");
console.log(`${Object.keys(episodes).length} review episodes, ${stills.length} stills planned`);
