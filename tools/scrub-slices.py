#!/usr/bin/env python3
"""
Xoa mot vung khoi cac lat nen cua trang con (ca ban @2x va @3x).

Dung khi mot dieu khien duoc VE CHET vao anh thiet ke nhung website can dieu
khien THAT (bam duoc, chay theo du lieu). Vi du bo phan trang "1 2 3 …": so
trang phai suy ra tu so bai viet co that, khong the de cung trong anh.

Cach xoa: chep mot dai pixel ngay ben canh de len. Cac vung nay nam tren nen
phang nen khong de lai vet.

Chay: python3 tools/scrub-slices.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SLICE_DIR = ROOT / "public" / "slices" / "sub"
INDEX = ROOT / "src" / "data" / "subpages" / "index.json"
PAGINATION = ROOT / "src" / "data" / "detected-pagination.json"

SLICE_DISPLAY_HEIGHT = 900
# No them ra ngoai hop do duoc, de an het quang sang quanh vien.
PAD = 14


def slice_key(slug: str) -> str:
    return slug.replace("/", "__")


def flattest_neighbour(image: Image.Image, x0: int, x1: int, y0: int, y1: int) -> Image.Image:
    """Dai nen de chep de len, chon giua dai NGAY TREN va dai NGAY DUOI.

    Truoc day luon lay dai phia tren. O hai trang co nut "XEM THÊM" nam ngay
    tren bo phan trang, dai do chua chu — chep xuong la in nguyen chu vao cho
    vua xoa. Nen chon dai nao PHANG hon (do lech chuan nho hon) thi an toan.
    """
    height = y1 - y0
    options = []
    if y0 - height >= 0:
        options.append(image.crop((x0, y0 - height, x1, y0)))
    if y1 + height <= image.height:
        options.append(image.crop((x0, y1, x1, y1 + height)))
    if not options:
        raise ValueError("khong co dai nen nao de chep")
    return min(options, key=lambda strip: float(np.asarray(strip, dtype=np.float32).std()))


def scrub_region(slug: str, box: dict, index: dict) -> int:
    """Xoa mot hop khoi cac lat chua no. Tra ve so lat da sua."""
    top, bottom = box["y"] - PAD, box["y"] + box["height"] + PAD
    left, right = box["x"] - PAD, box["x"] + box["width"] + PAD

    touched = 0
    for scale in (2, 3):
        for i, slice_spec in enumerate(index["slices"]):
            s_top = slice_spec["y"]
            s_bottom = s_top + slice_spec["displayHeight"]
            if bottom <= s_top or top >= s_bottom:
                continue

            path = SLICE_DIR / f"{slice_key(slug)}-{i}@{scale}x.webp"
            if not path.is_file():
                continue

            image = Image.open(path).convert("RGB")
            # Toa do trong PHAM VI cua lat nay.
            y0 = round((max(top, s_top) - s_top) * scale)
            y1 = round((min(bottom, s_bottom) - s_top) * scale)
            x0, x1 = round(left * scale), round(right * scale)
            height = y1 - y0

            if height <= 0:
                continue

            image.paste(flattest_neighbour(image, x0, x1, y0, y1), (x0, y0))
            image.save(path, "WEBP", quality=80, method=6)
            touched += 1

    return touched


def main() -> int:
    index = {row["slug"]: row for row in json.loads(INDEX.read_text(encoding="utf-8"))}
    boxes = json.loads(PAGINATION.read_text(encoding="utf-8"))

    specs = {}
    for slug in boxes:
        spec_path = ROOT / "src" / "data" / "subpages" / f"{slice_key(slug)}.json"
        specs[slug] = json.loads(spec_path.read_text(encoding="utf-8"))

    total = 0
    for slug, box in boxes.items():
        touched = scrub_region(slug, box, specs[slug])
        total += touched
        print(f"  {slug:<58} xoa pager, sua {touched} lat")

    print(f"\n  Da sua {total} tep lat nen.")
    print("  Luu y: chay lai `npm run parse:subpages` se tao lai lat GOC (con pager),")
    print("  nen phai chay lai lenh nay ngay sau do.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
