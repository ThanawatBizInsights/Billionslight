#!/usr/bin/env python3
"""Tile review stills into labelled contact sheets (optional dev tool; needs Pillow).

    python3 scripts/review/contact_sheet.py

Reads renders/phase-2-review/stills-plan.json and writes, for every folder of
labelled stills (expressions, poses), a sheet next to the folder.
"""
import json
import os
from collections import defaultdict

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
plan = json.load(open(os.path.join(ROOT, "renders/phase-2-review/stills-plan.json")))
out_dir = os.path.join(ROOT, plan["outDir"])

groups = defaultdict(list)
for job in plan["jobs"]:
    if "label" in job:
        groups[os.path.dirname(job["out"])].append(job)


def font(size):
    for f in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default(size=size)


for folder, jobs in groups.items():
    tiles = [Image.open(os.path.join(out_dir, j["out"])).convert("RGB") for j in jobs]
    w, h = tiles[0].size
    cols = 4 if len(tiles) > 6 else len(tiles)
    rows = (len(tiles) + cols - 1) // cols
    pad, label_h, title_h = 12, 44, 70
    sheet = Image.new("RGB", (cols * (w + pad) + pad, title_h + rows * (h + label_h + pad) + pad), (15, 39, 71))
    d = ImageDraw.Draw(sheet)
    title = folder.replace("/", " · ").upper() + " · PHASE 2 PROTOTYPE"
    d.text((pad + 4, 20), title, fill=(251, 191, 36), font=font(30))
    for i, (tile, job) in enumerate(zip(tiles, jobs)):
        x = pad + (i % cols) * (w + pad)
        y = title_h + (i // cols) * (h + label_h + pad)
        sheet.paste(tile, (x, y))
        d.text((x + 8, y + h + 8), job["label"], fill=(240, 240, 245), font=font(26))
    path = os.path.join(out_dir, folder + "-sheet.png")
    sheet.save(path)
    print("wrote", os.path.relpath(path, ROOT))
