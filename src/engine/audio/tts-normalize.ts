/**
 * Text the voice should SAY (subtitles keep the written form). Units and
 * symbols are expanded to natural Thai so TTS never spells "k-W".
 * Only safe, mechanical substitutions — no wording changes.
 */
const DIGIT = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const PLACE = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

/** Spoken Thai for a non-negative integer (to the millions), e.g. 21 → ยี่สิบเอ็ด. */
export function thaiInteger(n: number): string {
  if (n === 0) return DIGIT[0]!;
  if (n >= 1_000_000) {
    const rest = n % 1_000_000;
    return thaiInteger(Math.floor(n / 1_000_000)) + "ล้าน" + (rest ? thaiInteger(rest) : "");
  }
  const digits = String(n).split("").map(Number);
  let out = "";
  digits.forEach((d, i) => {
    const place = digits.length - 1 - i;
    if (d === 0) return;
    if (place === 1 && d === 1) out += "สิบ";
    else if (place === 1 && d === 2) out += "ยี่สิบ";
    else if (place === 0 && d === 1 && digits.length > 1) out += "เอ็ด";
    else out += DIGIT[d]! + PLACE[place]!;
  });
  return out;
}

/** Spoken Thai for a number written with digits ("3", "2.5", "1,200"). */
export function thaiNumber(text: string): string {
  const clean = text.replace(/,/g, "");
  const [int, frac] = clean.split(".");
  const head = thaiInteger(Number(int));
  return frac ? `${head}จุด${frac.split("").map((d) => DIGIT[Number(d)]).join("")}` : head;
}

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
  // numbers are spoken as Thai words, joined to the unit that follows ("สามกิโลวัตต์")
  // (a written space between a Thai word and a number is not a spoken pause)
  s = s.replace(/([\u0E00-\u0E7F])? ?(\d[\d,]*(?:\.\d+)?)/g, (_m, pre: string | undefined, num: string) => (pre ?? "") + thaiNumber(num));
  s = s.replace(/(ศูนย์|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|เอ็ด|ร้อย|พัน|หมื่น|แสน|ล้าน) (กิโลวัตต์|วัตต์|โวลต์|แอมป์|เปอร์เซ็นต์)/g, "$1$2");
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
