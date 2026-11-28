/**
 * Thai subtitle text tools (pure; runs in the browser renderer and in Node).
 *
 * Thai is written without spaces between words, so lines may only break at
 * word boundaries (Intl.Segmenter, ICU dictionary). Loanwords the dictionary
 * splits (โซ|ลาร์) are re-joined from a glossary. Line length is measured in
 * VISUAL characters: above/below vowels and tone marks take no width.
 */

/** Words that must never be split across lines (ICU may segment them). */
export const THAI_GLOSSARY = [
  "โซลาร์เซลล์",
  "โซลาร์",
  "อินเวอร์เตอร์",
  "แบตเตอรี่",
  "กิโลวัตต์ชั่วโมง",
  "กิโลวัตต์",
  "ไฮบริด",
  "ออนกริด",
  "ออฟกริด",
  "มิเตอร์",
  "เบรกเกอร์",
  "แอร์",
  "ซันนี่",
  // spoken compounds that read badly when split
  "ยังไง",
  "อย่างไร",
  "ทำไม",
  "ไม่ได้",
  "ได้ไหม",
  "หรือเปล่า",
  "เท่าไหร่",
];

const COMBINING = /[ัิ-ฺ็-๎]/u;

export function visualLength(s: string): number {
  let n = 0;
  for (const ch of s) if (!COMBINING.test(ch)) n++;
  return n;
}

let segmenter: Intl.Segmenter | null = null;
function seg() {
  if (!segmenter) segmenter = new Intl.Segmenter("th", { granularity: "word" });
  return segmenter;
}

/** Word segments (spaces and punctuation kept as their own segments). Glossary words re-joined. */
export function segmentThai(text: string): string[] {
  const raw = [...seg().segment(text)].map((x) => x.segment);
  const out: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    let joined = false;
    for (const g of THAI_GLOSSARY) {
      let acc = "";
      let j = i;
      while (j < raw.length && acc.length < g.length) acc += raw[j++];
      if (acc === g) {
        out.push(acc);
        i = j - 1;
        joined = true;
        break;
      }
    }
    if (!joined) out.push(raw[i]!);
  }
  return out;
}

const isSpace = (s: string) => /^\s+$/u.test(s);
const isClosingPunct = (s: string) => /^[!?.,:;)\]”’…ๆฯ]+$/u.test(s);

/** Break text into atoms (words with trailing punctuation attached), remembering spaces. */
function atoms(text: string): { text: string; spaceBefore: boolean }[] {
  const out: { text: string; spaceBefore: boolean }[] = [];
  let space = false;
  for (const w of segmentThai(text.trim())) {
    if (isSpace(w)) {
      space = true;
      continue;
    }
    if (isClosingPunct(w) && out.length && !space) out[out.length - 1]!.text += w;
    else out.push({ text: w, spaceBefore: space });
    space = false;
  }
  return out;
}

function splitLongAtom(a: string, maxChars: number): string[] {
  const parts: string[] = [];
  let cur = "";
  for (const g of [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(a)].map((x) => x.segment)) {
    if (cur && visualLength(cur + g) > maxChars) {
      parts.push(cur);
      cur = "";
    }
    cur += g;
  }
  if (cur) parts.push(cur);
  return parts;
}

const join = (xs: { text: string; spaceBefore: boolean }[]) => xs.map((x, i) => (i > 0 && x.spaceBefore ? " " : "") + x.text).join("");

/**
 * Word wrap at word boundaries with BALANCED lines: the fewest lines that fit
 * `maxChars`, then the split that keeps line lengths even and prefers the
 * spaces Thai uses between phrases (no orphan words).
 */
export function wrapThai(text: string, maxChars: number): string[] {
  const raw = atoms(text);
  const as: { text: string; spaceBefore: boolean }[] = [];
  for (const a of raw) {
    if (visualLength(a.text) <= maxChars) as.push(a);
    else splitLongAtom(a.text, maxChars).forEach((p, i) => as.push({ text: p, spaceBefore: i === 0 ? a.spaceBefore : false }));
  }
  if (as.length === 0) return [];
  const n = as.length;
  const len = (i: number, j: number) => visualLength(join(as.slice(i, j)));
  // minimal line count (greedy)
  let lines = 1;
  for (let i = 0, start = 0; i < n; i++) if (len(start, i + 1) > maxChars) {
    lines++;
    start = i;
  }
  // DP over break positions for exactly `lines` lines
  const target = len(0, n) / lines;
  const INF = 1e12;
  const cost: number[][] = Array.from({ length: lines + 1 }, () => Array(n + 1).fill(INF));
  const back: number[][] = Array.from({ length: lines + 1 }, () => Array(n + 1).fill(-1));
  cost[0]![0] = 0;
  for (let k = 1; k <= lines; k++) {
    for (let j = 1; j <= n; j++) {
      for (let i = k - 1; i < j; i++) {
        if (cost[k - 1]![i]! >= INF) continue;
        const l = len(i, j);
        if (l > maxChars) continue;
        const breakBonus = j < n && as[j]!.spaceBefore ? -40 : 0;
        const c = cost[k - 1]![i]! + (l - target) ** 2 + breakBonus;
        if (c < cost[k]![j]!) {
          cost[k]![j] = c;
          back[k]![j] = i;
        }
      }
    }
  }
  const out: string[] = [];
  let j = n;
  for (let k = lines; k > 0; k--) {
    const i = back[k]![j]!;
    if (i < 0) return [join(as)]; // should not happen
    out.unshift(join(as.slice(i, j)));
    j = i;
  }
  return out;
}

export interface CaptionChunk {
  lines: string[];
  /** Index range in the source text (for alignment-based timing). */
  start: number;
  end: number;
}

/**
 * Split a line into on-screen caption chunks of at most `maxLines` lines.
 * Prefers breaking chunks after sentence-like punctuation or spaces.
 */
export function chunkCaptions(text: string, maxChars: number, maxLines: number): CaptionChunk[] {
  const lines = wrapThai(text, maxChars);
  const chunks: CaptionChunk[] = [];
  let cursor = 0;
  for (let i = 0; i < lines.length; i += maxLines) {
    const group = lines.slice(i, i + maxLines);
    // locate the group's span in the original text (lines are trimmed substrings in order)
    let start = -1;
    let end = cursor;
    for (const l of group) {
      const at = text.indexOf(l, end);
      if (at < 0) continue;
      if (start < 0) start = at;
      end = at + l.length;
    }
    if (start < 0) start = cursor;
    chunks.push({ lines: group, start, end });
    cursor = end;
  }
  return chunks;
}

export interface TimedCaption {
  lines: string[];
  startMs: number;
  endMs: number;
}

/**
 * Time caption chunks inside a spoken line. With an alignment (character
 * timings of the displayed text) chunk boundaries follow speech; otherwise
 * time is shared by visual length. Chunks are contiguous and cover the line.
 */
export function timeCaptions(text: string, durationMs: number, maxChars: number, maxLines: number, alignment?: { chars: string[]; startMs: number[]; endMs: number[] }): TimedCaption[] {
  const chunks = chunkCaptions(text, maxChars, maxLines);
  if (chunks.length === 0) return [];
  const aligned = alignment && alignment.chars.join("") === text ? alignment : undefined;
  const total = chunks.reduce((n, c) => n + visualLength(c.lines.join("")), 0) || 1;
  let acc = 0;
  return chunks.map((c, i) => {
    let startMs: number;
    let endMs: number;
    if (aligned) {
      startMs = i === 0 ? 0 : aligned.startMs[Math.min(c.start, aligned.startMs.length - 1)]!;
      endMs = i === chunks.length - 1 ? durationMs : aligned.startMs[Math.min(chunks[i + 1]!.start, aligned.startMs.length - 1)]!;
    } else {
      startMs = (acc / total) * durationMs;
      acc += visualLength(c.lines.join(""));
      endMs = i === chunks.length - 1 ? durationMs : (acc / total) * durationMs;
    }
    return { lines: c.lines, startMs: Math.round(startMs), endMs: Math.round(endMs) };
  });
}
