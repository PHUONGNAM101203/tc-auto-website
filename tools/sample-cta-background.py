#!/usr/bin/env python3
"""
Lay mau NEN tai cho tung khoi chu co nut "XEM THÊM".

Vi sao: bam "XEM THÊM" thi khoi chu xo dai ra ngay tai cho, de len phan ben
duoi. Muon nhin nhu khoi tu dai ra thi nen cua no phai TRUNG mau nen trang o
dung cho do — ma cac trang khong cung mau: phan lon la navy, vai cho la trang,
vai cho nam tren anh.

Chay SAU `npm run parse:cta`.
"""
from __future__ import annotations

import json
import os
import unicodedata
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DESIGN = Path("/Users/phuongnam/Downloads/[TC] Website/Website_TC")
TARGET = ROOT / "src" / "data" / "cta-links.json"
SUBPAGES = ROOT / "src" / "data" / "subpages"

CANVAS_WIDTH = 1440
# Lay mau NGAY TREN dong chu dau tien, thut vao mot chut so voi mep trai khoi
# chu. Truoc day lay o le ben trai khoi chu — voi cac the san pham thi diem do
# roi ra NGOAI the, nen panel xo ra mang mau nen trang chu khong phai mau the.
INDENT = 6
ABOVE = 10


def index_sources() -> dict[str, str]:
    return {
        unicodedata.normalize("NFC", name): os.path.join(root, name)
        for root, _, names in os.walk(DESIGN)
        for name in names
        if name.lower().endswith(".png")
    }


def main() -> int:
    sources = index_sources()
    data = json.loads(TARGET.read_text(encoding="utf-8"))
    pages = data.get("pages", data)

    stamped = 0
    for slug, items in pages.items():
        if not isinstance(items, list):
            continue
        spec_path = SUBPAGES / f"{slug.replace('/', '__')}.json"
        if not spec_path.is_file():
            continue
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
        path = sources.get(unicodedata.normalize("NFC", spec.get("sourceFile", "")))
        if not path:
            print(f"  khong tim thay anh goc cho {slug}")
            continue

        image = Image.open(path).convert("RGB")
        scale = image.width / CANVAS_WIDTH
        for item in items:
            box = item.get("bodyBox")
            if not box:
                continue
            x = max(0, round((box["x"] + INDENT) * scale))
            y = max(0, round((box["y"] - ABOVE) * scale))
            r, g, b = image.getpixel((x, y))
            item["background"] = f"#{r:02x}{g:02x}{b:02x}"
            # Chu sang hay toi tuy do sang cua nen (cong thuc do sang cam nhan).
            item["darkText"] = (0.299 * r + 0.587 * g + 0.114 * b) > 150
            stamped += 1

    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"  Da lay mau nen cho {stamped} khoi chu.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
