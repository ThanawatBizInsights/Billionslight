/** Minimal .env loader (no dependency). Existing process.env values win. */
import fs from "node:fs";
import path from "node:path";

export function loadEnv(root) {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const [, k, raw] = m;
    const v = raw.replace(/^["']|["']$/g, "");
    if (process.env[k] === undefined && v !== "") process.env[k] = v;
  }
}
