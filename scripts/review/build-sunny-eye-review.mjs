#!/usr/bin/env node
/**
 * Sunny eye redesign — review pack generator (episodes + still plan).
 *
 *   node scripts/review/build-sunny-eye-review.mjs
 *   node scripts/render-stills.mjs renders/phase-2/sunny-eye-review/stills-plan.json
 *   python3 scripts/review/contact_sheet.py renders/phase-2/sunny-eye-review/stills-plan.json
 *   node scripts/render.mjs Episode --episode=src/episodes/review/sunny-eye/blink-gaze-test.json --quality=final \
 *        --out=renders/phase-2/sunny-eye-review/06-blink-gaze-test.mp4
 *
 * Sunny only. Same head, body, camera and lighting for every variant.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const epDir = path.join(root, "src/episodes/review/sunny-eye");
const outDir = "renders/phase-2/sunny-eye-review";
fs.mkdirSync(epDir, { recursive: true });
fs.mkdirSync(path.join(root, outDir), { recursive: true });

const VARIANTS = ["A", "B", "C"];
const NAMES = { A: "A · Original Sunny-inspired", B: "B · Cinematic low-poly", C: "C · Extra cute", v1: "v1 · previous prototype (not approved)" };
const EYE_Y = 0.98; // world height of Sunny's eyes / face centre (1.35 m character)
const tag = (text, anchor = [0.5, 0]) => ({ id: "t", kind: "label", style: "tag", text, from: 0, durationInFrames: 9999, anchor });

const episode = (id, title, aspectRatio, durationInFrames, cast, scene) => ({
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
      lighting: { preset: scene.lighting ?? "review-studio" },
      camera: { keyframes: scene.camera },
      characters: scene.characters,
      overlays: scene.overlays ?? [],
    },
  ],
  branding: { showLogo: false },
});

const episodes = {};
const stills = [];
const closeCam = [{ frame: 0, position: [0, EYE_Y + 0.02, 2.3], target: [0, EYE_Y - 0.02, 0], fov: 20 }];

for (const v of [...VARIANTS, "v1"]) {
  // ---------- views (front / three-quarter / side), neutral expression
  for (const [view, rot] of [
    ["front", 0],
    ["three-quarter", 0.62],
    ["side", Math.PI / 2],
  ]) {
    if (v === "v1" && view !== "front") continue;
    const key = `close-${v}-${view}`;
    episodes[key] = episode(`sunny-eye-${key.toLowerCase()}`, `Sunny ${NAMES[v]} ${view}`, "1:1", 30, [{ id: "s", characterId: "sunny", variant: v }], {
      camera: closeCam,
      characters: [{ castId: "s", keyframes: [{ frame: 0, position: [0, 0, 0], rotationY: rot }], expression: [{ frame: 0, expression: "neutral" }] }],
      overlays: [tag(`${NAMES[v]} · ${view.toUpperCase()} · NEUTRAL`)],
    });
    const folder = view === "front" ? "01-front-closeups" : "02-views";
    stills.push({ episode: `src/episodes/review/sunny-eye/${key}.json`, frame: 15, out: `${folder}/${v}-${view}.png`, quality: "final", label: `${NAMES[v]} · ${view}` });
  }
  if (v === "v1") continue;

  // ---------- full body (front, three-quarter)
  for (const [view, rot] of [
    ["front", 0],
    ["three-quarter", 0.62],
  ]) {
    const key = `body-${v}-${view}`;
    episodes[key] = episode(`sunny-eye-${key.toLowerCase()}`, `Sunny ${v} body ${view}`, "1:1", 30, [{ id: "s", characterId: "sunny", variant: v }], {
      camera: [{ frame: 0, position: [0, 0.78, 4.6], target: [0, 0.7, 0], fov: 24 }],
      characters: [{ castId: "s", keyframes: [{ frame: 0, position: [0, 0, 0], rotationY: rot }], expression: [{ frame: 0, expression: "happy" }] }],
      overlays: [tag(`${NAMES[v]} · FULL BODY · ${view.toUpperCase()}`)],
    });
    stills.push({ episode: `src/episodes/review/sunny-eye/${key}.json`, frame: 15, out: `03-full-body/${v}-${view}.png`, quality: "final", label: `${NAMES[v]} · ${view}` });
  }

  // ---------- expression controls
  const EXPR = [
    ["neutral", "neutral", []],
    ["happy", "happy", []],
    ["talking", "talk", [["talk"]]],
    ["listening", "listening", [["listen"]]],
    ["thinking", "thinking", []],
    ["surprised", "surprised", []],
    ["concerned", "concerned", []],
    ["laughing", "laughing", []],
    ["blinking", "happy", [["blink", 8]]],
    ["looking left", "look-left", []],
    ["looking right", "look-right", []],
    ["looking up", "look-up", []],
    ["looking down", "look-down", []],
  ];
  const seg = 24;
  const key = `expressions-${v}`;
  episodes[key] = episode(`sunny-eye-${key.toLowerCase()}`, `Sunny ${v} expressions`, "1:1", EXPR.length * seg, [{ id: "s", characterId: "sunny", variant: v }], {
    camera: closeCam,
    characters: [
      {
        castId: "s",
        keyframes: [{ frame: 0, position: [0, 0, 0], rotationY: 0.15 }],
        expression: EXPR.map(([, e], i) => ({ frame: i * seg, expression: e })),
        clips: EXPR.flatMap(([, , cl], i) => cl.map(([clip, at]) => ({ clip, from: i * seg + (at ?? 0), durationInFrames: clip === "blink" ? 7 : seg, blendFrames: clip === "blink" ? 1 : 3 }))),
      },
    ],
  });
  EXPR.forEach(([name, , cl], i) => {
    const isBlink = cl.some(([c]) => c === "blink");
    stills.push({
      episode: `src/episodes/review/sunny-eye/${key}.json`,
      frame: i * seg + (isBlink ? 10 : name === "talking" ? 14 : 18),
      out: `04-expressions/${v}/${String(i + 1).padStart(2, "0")}-${name.replace(/ /g, "-")}.png`,
      quality: "preview",
      label: name,
    });
  });

  // ---------- cinematic close-up (warm amber key, soft navy shadows), vertical
  const ck = `cinematic-${v}`;
  episodes[ck] = episode(`sunny-eye-${ck.toLowerCase()}`, `Sunny ${v} cinematic`, "9:16", 30, [{ id: "s", characterId: "sunny", variant: v }], {
    envOptions: { backdrop: "navy" },
    lighting: "portrait-warm",
    camera: [{ frame: 0, position: [0.55, EYE_Y + 0.05, 1.9], target: [0.02, EYE_Y - 0.08, 0], fov: 30 }],
    characters: [{ castId: "s", keyframes: [{ frame: 0, position: [0, 0, 0], rotationY: 0.32 }], expression: [{ frame: 0, expression: "happy" }], lookAt: [{ frame: 0, target: [0.55, EYE_Y + 0.05, 1.9] }] }],
  });
  stills.push({ episode: `src/episodes/review/sunny-eye/${ck}.json`, frame: 15, out: `05-cinematic/${v}-cinematic.png`, quality: "final", label: NAMES[v] });
}

// ---------- 5-second blink & gaze test: A, B, C side by side
const CAM = [0, EYE_Y, 6.2];
episodes["blink-gaze-test"] = episode("sunny-eye-blink-gaze-test", "Sunny eye variants · 5 s blink and gaze test", "16:9", 150, VARIANTS.map((v) => ({ id: `s${v}`, characterId: "sunny", variant: v })), {
  camera: [{ frame: 0, position: CAM, target: [0, EYE_Y - 0.05, 0], fov: 14 }],
  characters: VARIANTS.map((v, i) => ({
    castId: `s${v}`,
    keyframes: [{ frame: 0, position: [(i - 1) * 0.85, 0, 0], rotationY: 0 }],
    // eyes move, head stays steady: gaze presets + deliberate blinks + laugh
    expression: [
      { frame: 0, expression: "happy" },
      { frame: 22, expression: "look-left" },
      { frame: 44, expression: "look-right" },
      { frame: 66, expression: "look-up" },
      { frame: 88, expression: "look-down" },
      { frame: 106, expression: "happy" },
      { frame: 114, expression: "laughing" },
      { frame: 136, expression: "happy" },
    ],
    clips: [16, 58, 100].map((f) => ({ clip: "blink", from: f, durationInFrames: 7, blendFrames: 1 })),
  })),
  overlays: [
    tag("SUNNY EYE REVIEW · A (left) · B (centre) · C (right) · BLINK + GAZE (left → right → up → down) + LAUGH"),
  ],
});

for (const [name, ep] of Object.entries(episodes)) fs.writeFileSync(path.join(epDir, `${name}.json`), JSON.stringify(ep, null, 1) + "\n");
fs.writeFileSync(path.join(root, outDir, "stills-plan.json"), JSON.stringify({ outDir, sheetTitle: "SUNNY EYE REVIEW", jobs: stills }, null, 1) + "\n");
console.log(`${Object.keys(episodes).length} episodes, ${stills.length} stills planned → ${outDir}`);
