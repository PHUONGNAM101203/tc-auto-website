#!/usr/bin/env python3
"""
Va lai nhung vung ma ban PROTOTYPE export ra sai so voi ban THIET KE.

Lat nen cua 6 trang chinh duoc cat tu prototype. O mot vai cho prototype ve
khac ban thiet ke — vi du header trang Cong nghe: prototype de mot MANG TOI
thay cho o tim kiem, con ban thiet ke thi ve o tim kiem binh thuong tren nen
troi. Ta lay dung pixel cua ban thiet ke dap vao do.

Chay SAU `add-retina-main.py`, TRUOC cac buoc tach phan tu.
"""
from __future__ import annotations

import json
import os
import sys
import unicodedata
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools" / "brand"))
from _backdrop import feathered  # noqa: E402

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent / "brand"))
from design_root import design_root  # noqa: E402

DESIGN = design_root()
SLICE_DIR = ROOT / "public" / "slices"
PAGES = ROOT / "src" / "data" / "pages"

CANVAS_WIDTH = 1440
# Mep mang va duoc lam mo dan de tan vao anh goc.
BLEND = 8

PATCHES = [
    {
        "slug": "cong-nghe",
        "source": "1. Công Nghệ.png",
        # Prototype de mot mang toi dac o day thay cho o tim kiem cua header.
        "box": {"x": 1105, "y": 18, "width": 280, "height": 74},
        "why": "prototype ve mang toi thay cho o tim kiem tren header",
    },
]


def index_design() -> dict[str, str]:
    return {
        unicodedata.normalize("NFC", name): os.path.join(root, name)
        for root, _, names in os.walk(DESIGN)
        for name in names
        if name.lower().endswith(".png")
    }


def main() -> int:
    design = index_design()
    total = 0

    for patch in PATCHES:
        path = design.get(unicodedata.normalize("NFC", patch["source"]))
        if not path:
            print(f"  khong tim thay ban thiet ke: {patch['source']}")
            return 1

        page = Image.open(path).convert("RGB")
        page_scale = page.width / CANVAS_WIDTH
        spec = json.loads((PAGES / f"{patch['slug']}.json").read_text(encoding="utf-8"))
        box = patch["box"]

        for index, slice_spec in enumerate(spec["slices"]):
            top = slice_spec["y"]
            bottom = top + slice_spec["displayHeight"]
            if box["y"] + box["height"] <= top or box["y"] >= bottom:
                continue

            for scale in (2, 3):
                suffix = "" if scale == 2 else "@3x"
                target = SLICE_DIR / f"{patch['slug']}-{index}{suffix}.webp"
                if not target.is_file():
                    continue

                image = Image.open(target).convert("RGB")
                source = page.crop(
                    (
                        round(box["x"] * page_scale),
                        round(box["y"] * page_scale),
                        round((box["x"] + box["width"]) * page_scale),
                        round((box["y"] + box["height"]) * page_scale),
                    )
                ).resize((round(box["width"] * scale), round(box["height"] * scale)), Image.LANCZOS)

                source = feathered(source, round(BLEND * scale))
                spot = (round(box["x"] * scale), round((box["y"] - top) * scale))
                image.paste(source, spot, source)
                image.save(target, "WEBP", quality=80, method=6)
                total += 1

        print(f"  {patch['slug']:<12} va {box['width']}x{box['height']} tai ({box['x']},{box['y']}) "
              f"— {patch['why']}")

    print(f"\n  Da va {total} tep lat nen.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
