#!/usr/bin/env node
/** Render src/assets/asset-manifest.json as docs/asset-manifest.md (human-readable view). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const m = JSON.parse(fs.readFileSync(path.join(root, "src/assets/asset-manifest.json"), "utf8"));
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const order = ["character", "environment", "equipment", "appliance", "lighting-preset", "camera-preset", "branding", "visual-language", "animation-clip", "prop"];
const counts = {};
for (const a of m.assets) counts[a.status] = (counts[a.status] ?? 0) + 1;

let out = `# Asset manifest\n\n_Generated from \`src/assets/asset-manifest.json\` by \`node scripts/manifest-report.mjs\` — edit the JSON, not this file._\n\n`;
out += `Updated: ${m.updated} · ${m.assets.length} assets · reference files live (git-ignored) under \`${m.referenceRoot}/\`.\n\n`;
out += `| Status | Count |\n|---|---|\n` + Object.entries(counts).map(([k, v]) => `| ${k} | ${v} |`).join("\n") + "\n";

for (const cat of order) {
  const items = m.assets.filter((a) => a.category === cat);
  if (!items.length) continue;
  out += `\n## ${cat}\n\n| ID | Name | Status | Model | Phase | Scale | Reference |\n|---|---|---|---|---|---|---|\n`;
  for (const a of items) {
    const scale = a.scale ? (a.scale.heightM ? `${a.scale.heightM} m` : a.scale.footprintM ? `${a.scale.footprintM.join("×")} m` : "") + ` (${a.scale.basis})` : "";
    const refs = a.references.map((r) => `${r.file.replace(/^.*\//, "")}${r.section ? ` ${r.section}` : ""}`).join("; ");
    out += `| \`${a.id}\` | ${esc(a.name)}${a.nameTh ? ` (${a.nameTh})` : ""} | ${a.status} | ${a.modelType} | ${a.phase} | ${esc(scale)} | ${esc(refs) || "—"} |\n`;
  }
  for (const a of items) {
    const pal = Object.entries(a.palette);
    if (!pal.length && !a.animationCapabilities.length && !a.issues.length && !a.notes) continue;
    out += `\n**\`${a.id}\`**`;
    if (a.notes) out += ` — ${esc(a.notes)}`;
    out += "\n";
    if (pal.length) out += `- Palette: ${pal.map(([k, p]) => `${k} \`${p.hex}\` (${p.source})`).join(", ")}\n`;
    if (a.animationCapabilities.length) out += `- Animation: ${a.animationCapabilities.join(", ")}\n`;
    if (a.implementation) out += `- Implementation: \`${a.implementation}\`\n`;
    for (const i of a.issues) out += `- ⚠ ${esc(i)}\n`;
  }
}
fs.writeFileSync(path.join(root, "docs/asset-manifest.md"), out);
console.log(`docs/asset-manifest.md written (${m.assets.length} assets)`);
