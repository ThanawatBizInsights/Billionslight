/**
 * Text the voice should SAY (subtitles keep the written form). Units and
 * symbols are expanded to natural Thai so TTS never spells "k-W".
 * Only safe, mechanical substitutions — no wording changes.
 */
const RULES: [RegExp, string][] = [
  [/(\d)\s*kWh\b/gi, "$1 กิโลวัตต์ชั่วโมง"],
  [/\bkWh\b/gi, "กิโลวัตต์ชั่วโมง"],
  [/(\d)\s*kW\b/gi, "$1 กิโลวัตต์"],
  [/\bkW\b/gi, "กิโลวัตต์"],
  [/(\d)\s*W\b/g, "$1 วัตต์"],
  [/(\d)\s*V\b/g, "$1 โวลต์"],
  [/(\d)\s*A\b/g, "$1 แอมป์"],
  [/(\d)\s*%/g, "$1 เปอร์เซ็นต์"],
  [/\bPV\b/g, "พีวี"],
  [/\bEV\b/g, "อีวี"],
  [/\bAC\b/g, "เอซี"],
  [/\bDC\b/g, "ดีซี"],
];

export function normalizeForTts(text: string): string {
  let s = text;
  for (const [re, rep] of RULES) s = s.replace(re, rep);
  return s.replace(/\s{2,}/g, " ").trim();
}

/** Estimated speech duration (ms) for mock audio — Thai ≈ 5.5 syllables/s at speed 1. */
export function estimateSpeechMs(spoken: string, speed = 1): number {
  const words = [...new Intl.Segmenter("th", { granularity: "word" }).segment(spoken)].filter((s) => s.isWordLike).length;
  const graphemes = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(spoken)].filter((g) => /\S/u.test(g.segment)).length;
  const syllables = Math.max(words * 1.5, graphemes / 2.6);
  const pauses = (spoken.match(/[,.!?…]/g) ?? []).length;
  return Math.round((350 + (syllables / 5.5) * 1000 + pauses * 220) / speed);
}
