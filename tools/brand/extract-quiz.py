#!/usr/bin/env python3
"""
Tach khoi trac nghiem "PHONG CÁCH CHƠI XE CỦA BẠN LÀ GÌ?" khoi anh nen.

Thiet ke ve chet MOT cau hoi vao anh: tieu de, cau hoi, nam lua chon A-E, o
nhap "Khác" va nut "CÂU THIẾP THEO". Ve chet thi khong bam duoc, va cung khong
the doi sang cau thu hai. Muon no chay that thi ca khoi phai la phan tu that.

Chay: python3 tools/brand/extract-quiz.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _backdrop import rebuild_background  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent.parent
SLICE_DIR = ROOT / "public" / "slices" / "sub"
SPEC = ROOT / "src" / "data" / "subpages" / "trai-nghiem__ban-sac-rieng.json"
DATA = ROOT / "src" / "data" / "quiz-layout.json"

CANVAS_WIDTH = 1440

# Hinh hoc do tu 3.BẢN SẮC RIÊNG.png (quet net chu theo hang va cot).
LAYOUT = {
    "title": {"y": 1444, "height": 41, "fontSize": 40},
    "question": {"x": 389, "y": 1545, "fontSize": 18, "lineHeight": 26},
    "options": {"x": 376, "y": 1597, "step": 48.2, "fontSize": 15, "lineHeight": 22},
    "input": {"x": 370, "y": 1827, "width": 708, "height": 97, "fontSize": 15},
    "button": {"x": 620, "y": 1946, "width": 200, "height": 44},
}

# Vung xoa. Moc noi suy nam ngay tren tieu de va ngay duoi nut — da kiem tra
# ca hai dai deu sach (khong net chu nao trong 1424..1444 va 1990..2006).
SCRUB = (310, 1424, 830, 572)
ANCHOR = 10


def main() -> int:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    x, y, w, h = SCRUB

    # Khoi trac nghiem VAT NGANG ranh giua hai lat nen. Khong the xu ly tung
    # lat rieng: moc noi suy cua nua duoi nam trong lat kia. Ghep cac lat lien
    # quan lai thanh mot buc, dung lai nen tren do, roi cat tra ve tung lat.
    parts = [
        (index, s)
        for index, s in enumerate(spec["slices"])
        if not (y + h <= s["y"] or y >= s["y"] + s["displayHeight"])
    ]
    if not parts:
        raise SystemExit("Khong lat nen nao chua khoi trac nghiem")

    paths = [SLICE_DIR / f"trai-nghiem__ban-sac-rieng-{i}@2x.webp" for i, _ in parts]
    for path in paths:
        if not path.is_file():
            raise SystemExit(f"Thieu lat nen: {path}")

    images = [Image.open(path).convert("RGB") for path in paths]
    scale = images[0].width / CANVAS_WIDTH
    origin = parts[0][1]["y"]
    stitched = Image.new(
        "RGB", (images[0].width, sum(image.height for image in images))
    )
    offset = 0
    for image in images:
        stitched.paste(image, (0, offset))
        offset += image.height

    box = (
        round(x * scale),
        round((y - origin) * scale),
        round((x + w) * scale),
        round((y + h - origin) * scale),
    )
    stitched.paste(
        rebuild_background(stitched, box, anchor=ANCHOR, smooth=40), (box[0], box[1])
    )

    offset = 0
    for path, image in zip(paths, images):
        piece = stitched.crop((0, offset, image.width, offset + image.height))
        piece.save(path, "WEBP", quality=82, method=6)
        offset += image.height
    touched = len(paths)

    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Hinh hoc khoi trac nghiem tren /trai-nghiem/ban-sac-rieng, do tu "
                    "3.BẢN SẮC RIÊNG.png. Noi dung cau hoi o src/lib/style-quiz.ts. "
                    "Xem tools/brand/extract-quiz.py."
                ),
                "scrub": {"x": x, "y": y, "width": w, "height": h},
                "layout": LAYOUT,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  {DATA.relative_to(ROOT)}")
    print(f"  Da xoa khoi trac nghiem khoi {touched} lat nen.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
