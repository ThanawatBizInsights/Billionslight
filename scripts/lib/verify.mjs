/** Verify an MP4 with ffprobe: existence, codecs, dimensions, fps, frame count. */
import { execFileSync } from "node:child_process";
import fs from "node:fs";

export function probe(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-count_frames", "-show_entries", "stream=index,codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt,sample_rate,channels:format=duration,size,bit_rate", "-of", "json", file],
    { encoding: "utf8" },
  );
  return JSON.parse(out);
}

export function verifyVideo(file, expected = {}) {
  const errors = [];
  if (!fs.existsSync(file)) return { ok: false, errors: [`file not found: ${file}`] };
  const size = fs.statSync(file).size;
  if (size < 10_000) errors.push(`file suspiciously small (${size} bytes)`);
  let info;
  try {
    info = probe(file);
  } catch (e) {
    return { ok: false, errors: [`ffprobe failed: ${e.message}`] };
  }
  const v = info.streams.find((s) => s.codec_type === "video");
  const a = info.streams.find((s) => s.codec_type === "audio");
  if (!v) errors.push("no video stream");
  if (v && v.codec_name !== "h264") errors.push(`video codec ${v.codec_name} ≠ h264`);
  if (v && v.pix_fmt !== "yuv420p") errors.push(`pix_fmt ${v.pix_fmt} ≠ yuv420p`);
  if (!a) errors.push("no audio stream");
  if (a && a.codec_name !== "aac") errors.push(`audio codec ${a.codec_name} ≠ aac`);
  const [num, den] = (v?.r_frame_rate ?? "0/1").split("/").map(Number);
  const fps = num / (den || 1);
  const frames = Number(v?.nb_read_frames ?? 0);
  if (expected.width && v?.width !== expected.width) errors.push(`width ${v?.width} ≠ ${expected.width}`);
  if (expected.height && v?.height !== expected.height) errors.push(`height ${v?.height} ≠ ${expected.height}`);
  if (expected.fps && Math.abs(fps - expected.fps) > 0.01) errors.push(`fps ${fps} ≠ ${expected.fps}`);
  if (expected.frames && frames !== expected.frames) errors.push(`frames ${frames} ≠ ${expected.frames}`);
  return {
    ok: errors.length === 0,
    errors,
    sizeBytes: size,
    durationSec: Number(info.format?.duration ?? 0),
    video: v && { codec: v.codec_name, width: v.width, height: v.height, fps, pixFmt: v.pix_fmt },
    audio: a && { codec: a.codec_name, sampleRate: Number(a.sample_rate), channels: a.channels },
    frames,
  };
}
