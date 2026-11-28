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

/**
 * Greedy word wrap at word boundaries. A single word longer than the limit is
 * split by grapheme as a last resort. Leading/trailing spaces are trimmed.
 */
export function wrapThai(text: string, maxChars: number): string[] {
  const words = segmentThai(text.trim());
  const lines: string[] = [];
  let cur = "";
  const push = () => {
    if (cur.trim()) lines.push(cur.trim());
    cur = "";
  };
  for (const w of words) {
    if (isSpace(w)) {
      if (cur) cur += " ";
      continue;
    }
    // punctuation sticks to the previous word
    if (isClosingPunct(w) || visualLength(cur + w) <= maxChars) {
      cur += w;
      continue;
    }
    push();
    if (visualLength(w) <= maxChars) {
      cur = w;
      continue;
    }
    // over-long word: split by grapheme clusters
    const graphemes = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(w)].map((g) => g.segment);
    for (const g of graphemes) {
      if (visualLength(cur + g) > maxChars) push();
      cur += g;
    }
  }
  push();
  return lines;
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
