#!/usr/bin/env node
/**
 * Phase 4 dialogue test (data only): two scenes, Thai dialogue, music bed with
 * ducking, ambience, SFX, subtitles, lip sync. Renders with free mock voices
 * until real voices are generated with the owner's approval.
 *   node scripts/review/build-phase4-dialogue-test.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const episode = {
  schemaVersion: 1,
  id: "phase4-dialogue-test",
  title: "Phase 4 · Dialogue, subtitles, music and SFX test",
  topic: "Audio pipeline test. Mock voices until ElevenLabs voices are approved. kW values are illustrative scenario values.",
  language: "th",
  aspectRatio: "9:16",
  fps: 30,
  cast: [
    { id: "sunny", characterId: "sunny" },
    { id: "ton", characterId: "homeowner_male_01" },
  ],
  audio: [{ id: "bed", kind: "music", asset: "music-bright-bed", from: 0, volume: 0.32, fadeInFrames: 20, fadeOutFrames: 40, duckUnderDialogue: true }],
  audioMix: { dialogueVolume: 1, duckTo: 0.25, duckRampFrames: 8 },
  subtitles: { enabled: true, maxCharsPerLine: 26, maxLines: 2, speakerNames: false },
  scenes: [
    {
      id: "living-room",
      title: "Ton asks about the solar power",
      durationInFrames: 300,
      environment: { id: "living-room", states: [{ frame: 0, values: { tv: 0, ac: 1 }, transitionFrames: 0 }] },
      lighting: { preset: "midday-sun" },
      camera: {
        shots: [
          { from: 0, preset: "two-character", subject: { castId: "ton" }, subject2: { castId: "sunny" }, params: { side: 1 } },
          { from: 95, onLine: "sunny-01", preset: "close-up", subject: { castId: "sunny" }, params: { azimuth: 0.15, relative: true, distance: 2.1 } },
          { from: 190, onLine: "ton-react", preset: "close-up", subject: { castId: "ton" }, params: { azimuth: 0.15, relative: true } },
          { from: 250, onLine: "sunny-02", preset: "medium-character", subject: { castId: "sunny" }, params: { azimuth: 0.2, relative: true } },
        ],
      },
      characters: [
        {
          castId: "ton",
          keyframes: [{ frame: 0, position: [-1.1, 0, -1.35], rotationY: 0.5 }],
          clips: [{ clip: "sit", from: 0, durationInFrames: 300, blendFrames: 1, params: { seatHeight: 0.56 } }],
          expression: [
            { frame: 0, expression: "curious" },
            { frame: 0, onLine: "ton-react", expression: "happy" },
            { frame: 0, onLine: "ton-02", expression: "curious" },
          ],
          lookAt: [{ frame: 0, target: { castId: "sunny" } }],
        },
        {
          castId: "sunny",
          keyframes: [{ frame: 0, position: [0.65, 0, -0.2], rotationY: -0.5 }],
          clips: [
            { clip: "wave", from: 0, onLine: "sunny-01", durationInFrames: 40, params: { hand: "left" } },
            { clip: "explain", from: 0, onLine: "sunny-02", durationInFrames: 50 },
          ],
          expression: [{ frame: 0, expression: "happy" }],
          lookAt: [{ frame: 0, target: { castId: "ton" } }],
        },
      ],
      dialogue: [
        { id: "ton-01", castId: "ton", text: "เอ๊ะ ซันนี่ แดดแรงขนาดนี้ บ้านเราใช้ไฟจากโซลาร์อยู่ใช่ไหมเนี่ย", speak: "[curious] เอ๊ะ... ซันนี่ แดดแรงขนาดนี้ บ้านเราใช้ไฟจากโซลาร์อยู่ใช่ไหมเนี่ย", from: 12 },
        { id: "sunny-01", castId: "sunny", text: "ใช่เลยครับ! แผงโซลาร์บนหลังคา ผลิตไฟได้ประมาณ 3 kW ครับ", speak: "[excited] ใช่เลยครับ! แผงโซลาร์บนหลังคา ผลิตไฟได้ประมาณสามกิโลวัตต์ครับ", from: 100 },
        { id: "ton-react", castId: "ton", text: "อ๋อ งั้นระบบออนกริดบ้านเรา ก็ใช้ไฟจากแดดอยู่นี่เอง", speak: "[warmly] อ๋อ... งั้นระบบออนกริดบ้านเรา ก็ใช้ไฟจากแดดอยู่นี่เอง", from: 190 },
        { id: "ton-02", castId: "ton", text: "แล้วจะรู้ได้ยังไงว่าไฟมาจากไหนบ้าง", speak: "[curious] แล้ว... จะรู้ได้ยังไงล่ะ ว่าไฟมาจากไหนบ้าง", from: 260 },
        { id: "sunny-02", castId: "sunny", text: "เดี๋ยวผมพาไปดูเลยครับ!", speak: "[cheerful] เดี๋ยวผมพาไปดูเลยครับ!", from: 330 },
      ],
      audio: [{ id: "room", kind: "ambience", asset: "amb-room-tone", from: 0, volume: 0.18, fadeInFrames: 10, fadeOutFrames: 10 }],
    },
    {
      id: "cutaway",
      title: "Sunny explains the colours",
      durationInFrames: 210,
      transitionIn: { type: "dip-to-navy", durationInFrames: 16 },
      environment: { id: "energy-cutaway-house", options: { system: "on-grid" } },
      lighting: { preset: "midday-sun" },
      camera: { keyframes: [{ frame: 0, position: [21.44, 24.49, 45.29], target: [2.5, 1, 0.5], fov: 30 }] },
      electrical: [{ frame: 0, scenario: { inverterType: "grid-tied", gridStatus: "connected", solarIrradiance: 0.6, pvRatedKw: 5, inverterRatedKw: 5, householdLoadKw: 3 }, transitionFrames: 0 }],
      energyFlow: { labels: true, legend: false, pathScale: 1.8 },
      dialogue: [
        { id: "narrator-01", text: "มาดูกันว่าไฟฟ้าในบ้านมาจากไหน", from: 10 },
        { id: "sunny-03", castId: "sunny", text: "เห็นเส้นสีเหลืองไหมครับ นี่แหละพลังงานแสงอาทิตย์จากแผงโซลาร์", speak: "[excited] เห็นเส้นสีเหลืองไหมครับ? นี่แหละ พลังงานแสงอาทิตย์จากแผงโซลาร์", from: 15 },
        { id: "sunny-04", castId: "sunny", text: "ส่วนเส้นสีฟ้าอมเขียว คือไฟฟ้าจากอินเวอร์เตอร์ที่ส่งเข้าบ้านครับ", speak: "[cheerful] ส่วนเส้นสีฟ้าอมเขียว คือไฟฟ้าจากอินเวอร์เตอร์ ที่ส่งเข้าบ้านครับ", from: 100 },
        { id: "ton-03", castId: "ton", text: "อ๋อ เข้าใจแล้ว ดูง่ายกว่าที่คิดอีกนะ", speak: "[warmly] อ๋อ... เข้าใจแล้ว ดูง่ายกว่าที่คิดอีกนะเนี่ย", from: 200 },
      ],
      audio: [
        { id: "whoosh", kind: "sfx", asset: "sfx-whoosh-soft", from: 0, volume: 0.45, duckUnderDialogue: false },
        { id: "pop", kind: "sfx", asset: "sfx-pop", from: 14, volume: 0.4, duckUnderDialogue: false },
      ],
    },
  ],
  branding: { showLogo: false },
  approval: { status: "draft", history: [] },
};

const out = path.join(root, "src/episodes/phase4-dialogue-test.episode.json");
fs.writeFileSync(out, JSON.stringify(episode, null, 2) + "\n");
console.log("wrote", path.relative(root, out));
