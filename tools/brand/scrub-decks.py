#!/usr/bin/env python3
"""
Xoa CHONG ANH da ve chet trong anh nen cua ba trang chinh.

── Vi sao ──────────────────────────────────────────────────────────────────
Ban thiet ke ve mot chong 3-4 tam anh xoe len phia tren ben phai (trang chu:
"Câu chuyện khởi nghiệp"; Dai ly: "Chân dung đại lý"; Nhan su: "Con người TC").
Chi tam TREN CUNG la phan tu that; may tam phia sau nam trong anh nen.

He qua: chung dung yen mai mai. Bam chuyen anh thi tam tren cung doi, con may
tam sau van y nguyen — noi dung cua chung khong lien quan gi den anh dang xem.
Khach goi dung ten: "ảnh bịa" (30/09/2026).

Xoa ca chong khoi anh nen roi de component ve lai bang anh THAT thi:
  - tam nao cung la anh co that trong bo tai nguyen;
  - bam vao tam phia sau thi no len dau duoc.

── Xoa the nao ────────────────────────────────────────────────────────────
Vung chong anh nam tren nen phang mau navy, tren va duoi deu la nen tron, nen
noi suy DOC (lay mot dai moc ngay tren va ngay duoi roi chuyen dan) tra lai
dung mau ma khong de lai vet.

Chay: python3 tools/brand/scrub-decks.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _backdrop import feathered, rebuild_background  # noqa: E402

SPEC_DIR = ROOT / "src" / "data" / "pages"
SLICE_DIR = ROOT / "public" / "slices"
SLIDERS = ROOT / "src" / "data" / "photo-sliders.json"

CANVAS_WIDTH = 1440
#: Mac dinh phai KHOP voi DECK_STEP trong src/lib/photo-sliders.ts.
DEFAULT_STEP = {"x": 20, "y": -20}
#: No them ra moi be, de vien bo tron va bong do cua the cung bay theo.
PAD = 10
#: Be day dai moc lay o tren va duoi vung xoa.
ANCHOR = 16
#: Vien mo dan, de mieng va tan vao nen thay vi lo ra mot o chu nhat.
FEATHER = 12


def deck_area(slider) -> dict:
    """Hinh chu nhat bao tron ca chong, theo he toa do canvas."""
    box = slider["box"]
    step = slider.get("deck", DEFAULT_STEP)
    back = len(slider["slides"]) - 1
    left = min(box["x"], box["x"] + step["x"] * back)
    right = max(box["x"] + box["width"], box["x"] + box["width"] + step["x"] * back)
    top = min(box["y"], box["y"] + step["y"] * back)
    bottom = max(box["y"] + box["height"], box["y"] + box["height"] + step["y"] * back)
    return {
        "x": left - PAD,
        "y": top - PAD,
        "width": right - left + PAD * 2,
        "height": bottom - top + PAD * 2,
    }


def scrub(slug: str, areas) -> int:
    spec = json.loads((SPEC_DIR / f"{slug}.json").read_text(encoding="utf-8"))
    touched = 0
    for suffix in ("", "@3x"):
        for index, slice_spec in enumerate(spec["slices"]):
            top = slice_spec["y"]
            bottom = top + slice_spec["displayHeight"]
            hit = [a for a in areas if a["y"] < bottom and a["y"] + a["height"] > top]
            if not hit:
                continue
            path = SLICE_DIR / f"{slug}-{index}{suffix}.webp"
            if not path.is_file():
                raise SystemExit(f"Thieu lat nen: {path}")
            image = Image.open(path).convert("RGB")
            scale = image.width / CANVAS_WIDTH
            for area in hit:
                box = (
                    max(0, round(area["x"] * scale)),
                    max(0, round((area["y"] - top) * scale)),
                    min(image.width, round((area["x"] + area["width"]) * scale)),
                    min(image.height, round((area["y"] + area["height"] - top) * scale)),
                )
                if box[2] <= box[0] or box[3] <= box[1]:
                    continue
                patch = feathered(
                    rebuild_background(image, box, anchor=round(ANCHOR * scale)),
                    round(FEATHER * scale),
                )
                image.paste(patch, (box[0], box[1]), patch)
            image.save(path, "WEBP", quality=82, method=6)
            touched += 1
    return touched


def main() -> int:
    pages = json.loads(SLIDERS.read_text(encoding="utf-8"))["pages"]
    for slug, sliders in pages.items():
        areas = [deck_area(s) for s in sliders]
        n = scrub(slug, areas)
        spots = ", ".join(s["label"] for s in sliders)
        print(f"  Da xoa chong anh ve san ({spots}) khoi {n} lat nen cua /{slug}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
