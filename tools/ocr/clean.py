#!/usr/bin/env python3
"""
Lam sach ket qua OCR -> src/data/subpage-text.json

  - Bo vung header (nav, logo, o tim kiem) va footer: nhung phan nay DA co
    trong DOM duoi dang phan tu that, OCR lai se nhan doi noi dung.
  - Bo khoi do tin cay thap va rac ky tu.
  - Sap theo thu tu doc (tren xuong duoi, trai sang phai).
  - Phan loai tieu de / doan van theo chieu cao chu de sinh cau truc heading
    hop le cho SEO va trinh doc man hinh.

Chay: python3 tools/ocr/clean.py
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OCR_DIR = ROOT / "src" / "data" / "ocr"
INDEX = ROOT / "src" / "data" / "subpages" / "index.json"
TARGET = ROOT / "src" / "data" / "subpage-text.json"

HEADER_HEIGHT = 100          # .hdr cao 100px
FOOTER_HEIGHT = 250          # khoi chan trang
MIN_CONFIDENCE = 0.30
MIN_CHARS = 2

# Chieu cao chu (px, he 1440) -> cap tieu de
H2_MIN = 34.0
H3_MIN = 22.0

# Rac OCR hay gap: chuoi chi gom ky tu khong phai chu/so.
JUNK = re.compile(r"^[^\wÀ-ỹ]+$")
# Cum thuoc chrome bi lot vao (o tim kiem, logo)
CHROME_PHRASES = {
    "nhập để tìm kiếm...",
    "q nhập để tìm kiếm..",
    "q nhập để tìm kiếm...",
    "tc auto",
    "solutions",
    "solu",
}


def normalise(value: str) -> str:
    return unicodedata.normalize("NFC", value).strip()


def kind_of(height: float) -> str:
    if height >= H2_MIN:
        return "h2"
    if height >= H3_MIN:
        return "h3"
    return "p"


def clean_page(blocks: list[dict], page_height: float) -> dict:
    kept: list[dict] = []
    for block in blocks:
        text = normalise(block["text"])
        if len(text) < MIN_CHARS or JUNK.match(text):
            continue
        if block.get("confidence", 1.0) < MIN_CONFIDENCE:
            continue
        if text.lower() in CHROME_PHRASES:
            continue

        y = float(block["y"])
        if y < HEADER_HEIGHT or y > page_height - FOOTER_HEIGHT:
            continue

        kept.append(
            {
                "text": text,
                "kind": kind_of(float(block["h"])),
                "x": round(float(block["x"]), 1),
                "y": round(y, 1),
                "w": round(float(block["w"]), 1),
                "h": round(float(block["h"]), 1),
            }
        )

    # Thu tu doc: theo hang (gom cac khoi lech nhau < 12px vao cung hang), roi trai->phai.
    kept.sort(key=lambda b: (round(b["y"] / 12), b["x"]))

    return {
        "blocks": kept,
        "plain": " ".join(b["text"] for b in kept),
        "headings": [b["text"] for b in kept if b["kind"] in ("h2", "h3")],
    }


def main() -> int:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    heights = {row["slug"]: float(row["height"]) for row in index}

    out: dict[str, dict] = {}
    total_before = total_after = 0

    for row in index:
        slug = row["slug"]
        source = OCR_DIR / f"{slug.replace('/', '__')}.json"
        if not source.is_file():
            print(f"  thieu OCR: {slug}")
            continue

        blocks = json.loads(source.read_text(encoding="utf-8"))
        total_before += len(blocks)
        cleaned = clean_page(blocks, heights[slug])
        total_after += len(cleaned["blocks"])
        out[slug] = cleaned

        print(
            f"  {slug:<58} {len(blocks):>4} -> {len(cleaned['blocks']):>4} khoi, "
            f"{len(cleaned['plain']):>6} ky tu"
        )

    TARGET.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(
        f"\n  {len(out)} trang · {total_before} -> {total_after} khoi sau khi loc chrome · "
        f"{TARGET.stat().st_size / 1024:.0f} KB"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
