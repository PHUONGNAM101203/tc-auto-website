#!/usr/bin/env python3
"""
Do vi tri bo phan trang "‹ 1 2 3 … ›" ve san trong anh cac trang danh sach.

Cach do: bo phan trang la mot khoi bo tron SANG HON nen, can giua trang. Quet
tung hang, so do sang trung binh cua doan giua voi hai ben; doan nao sang han
la thuoc khoi. Vien ngoai co quang sang nen lay MEP DUOI lam moc (on dinh nhat)
roi tru ra chieu cao thuc do duoc.

Chay: python3 tools/detect-pagination.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "tools" / "subpage-manifest.json"
INDEX = ROOT / "src" / "data" / "subpages" / "index.json"
TARGET = ROOT / "src" / "data" / "detected-pagination.json"

CANVAS_WIDTH = 1440
# Khoi phan trang do duoc: bat dau x=591, rong 257, cao 56.
BOX_X = 591
BOX_W = 257
BOX_H = 56
# Chi quet trong dai nay tinh tu day trang.
SEARCH_FROM_BOTTOM = (210, 380)
CONTRAST = 4.0

# Bo do chi tim "khoi sang hon nen o giua" — vai thu khac cung khop (nut XEM THEM
# mau do, chu thich anh, khoang trong). Danh sach nay la ket qua KIEM BANG MAT
# tung truong hop: chi nhung trang thuc su co "‹ 1 2 3 … ›" moi duoc giu.
VERIFIED = {
    "trai-nghiem/phong-cach-song",
    "giai-phap/man-hinh",
    "giai-phap/du-an",
    "cong-nghe/tien-phong-cong-nghe/bai-viet",
    "cong-nghe/ung-dung/cap-nhat-va-loi",
    "cong-nghe/ung-dung/kho-ung-dung",
    "dai-ly/cau-chuyen-dong-hanh",
    "dai-ly/chan-dung-dai-ly",
    "dai-ly/gallery-by-brand",
    "nhan-su/tuyen-dung/vi-tri-dang-tuyen",
}


# Bo do lay HANG CUOI co do tuong phan lam day khoi. O hai trang duoi day vien
# sang cua khoi hat xuong them mot doan, keo day khoi xuong ~12px — khien bo
# phan trang that bi ve de len mep anh phia tren. Hai con so nay do TAY tu anh
# thiet ke goc (xem probe/orig-du-an.png va probe/orig-bai-viet.png).
CORRECTIONS = {
    "giai-phap/du-an": {"y": 3360, "height": 64},
    "cong-nghe/tien-phong-cong-nghe/bai-viet": {"y": 3287, "height": 65},
}


def find_box(gray: np.ndarray, height: int) -> dict | None:
    rows: list[int] = []
    lo, hi = SEARCH_FROM_BOTTOM
    for y in range(height - hi, height - lo):
        if y < 0 or y >= gray.shape[0]:
            continue
        inside = gray[y, 600:840].mean()
        outside = (gray[y, 470:550].mean() + gray[y, 890:970].mean()) / 2
        if inside - outside > CONTRAST:
            rows.append(y)

    if len(rows) < 20:
        return None

    bottom = rows[-1]
    return {"x": BOX_X, "y": bottom - BOX_H, "width": BOX_W, "height": BOX_H}


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    source_root = Path(manifest["sourceRoot"])
    index = {row["slug"]: row for row in json.loads(INDEX.read_text(encoding="utf-8"))}

    out: dict[str, dict] = {}
    for entry in manifest["pages"]:
        slug = entry["slug"]
        if entry.get("main") or slug not in index or slug not in VERIFIED:
            continue

        source = source_root / entry["dir"] / entry["file"]
        image = Image.open(source).convert("L")
        scale = image.width / CANVAS_WIDTH
        gray = np.asarray(
            image.resize((CANVAS_WIDTH, round(image.height / scale)), Image.BILINEAR),
            dtype=np.int16,
        )

        box = find_box(gray, int(index[slug]["height"]))
        if box:
            box.update(CORRECTIONS.get(slug, {}))
            out[slug] = box
            print(f"  {slug:<58} x{box['x']} y{box['y']} {box['width']}x{box['height']}")

    TARGET.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\n  {len(out)} trang co phan trang · ghi {TARGET.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
