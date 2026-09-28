#!/usr/bin/env python3
"""
Tach cac SLIDER ANH duoc ve chet vao anh thiet ke.

Thiet ke ve mot tam anh kem mui ten "›" — y la con anh nua, keo di. Muon mui ten
do bam duoc thi vung anh phai la phan tu that.

Cach lam (giong dai the muc Giai phap):
  - Slide DAU cat tu CHINH ban thiet ke -> luc dung yen man hinh khong lech
    mot pixel nao.
  - Cac slide sau lay tu bo tai nguyen roi, dua ve cung khung.
  - KHONG xoa gi khoi anh nen: slide dau nam dung cho anh goc nen phu len la vua.

Chay: python3 tools/brand/extract-photo-sliders.py
"""
from __future__ import annotations

import sys
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
DOWNLOADS = Path("/Users/phuongnam/Downloads/[TC] Website")
DESIGN = DOWNLOADS / "Website_TC"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from asset_source import find as find_asset  # noqa: E402


def ASSET(*parts: str):
    """Ban to nhat cua anh nay trong cac bo tai nguyen."""
    return find_asset("/".join(parts))
OUT = ROOT / "public" / "sliders"
DATA = ROOT / "src" / "data" / "photo-sliders.json"

CANVAS_WIDTH = 1440

SLIDERS = [
    {
        "page": "home",
        "id": "cau-chuyen-khoi-nghiep",
        "label": "Câu chuyện khởi nghiệp",
        "source": DESIGN / "1. Page_Home" / "Home.png",
        # Khung tam anh truoc, do bang cach dan anh roi len ban thiet ke va tim
        # vi tri lech it nhat, roi chinh lai bang mat.
        "box": {"x": 458, "y": 2976, "width": 876, "height": 376},
        # Mui ten "›" ve san trong anh, do bang tools/detect-arrows.py.
        "arrow": {"x": 1335, "y": 3108, "width": 12, "height": 33},
        "extra": [
            ASSET("0. Homepage", "Rectangle 23 — 3D Transform.png"),
            ASSET("0. Homepage", "Rectangle 23 — 3D Transform-1.png"),
        ],
    },
    {
        "page": "dai-ly",
        "id": "chan-dung-dai-ly",
        "label": "Chân dung đại lý",
        "source": DESIGN / "5.Page_Đại lý " / "1. Đại lý.png",
        # Do bang cach quet vung sang hon nen navy trong dai y 2150..2750.
        "box": {"x": 650, "y": 2167, "width": 697, "height": 416},
        "arrow": {"x": 1386, "y": 2370, "width": 12, "height": 30},
        "extra": [
            ASSET("4. Page_Đại lý", "Rectangle 186 — Perspective Warp — Perspective Warp-1.png"),
            ASSET("4. Page_Đại lý", "Rectangle 186 — Perspective Warp — Perspective Warp-2.png"),
        ],
    },
    {
        "page": "nhan-su",
        "id": "con-nguoi-tc",
        "label": "Con người TC",
        "source": DESIGN / "6.Page_Nhân Sự " / "1. Nhân sự.png",
        # Do bang cach quet vung sang hon nen navy trong dai y 1300..1900.
        "box": {"x": 310, "y": 1312, "width": 811, "height": 447},
        # Muc nay co CA HAI mui ten, do bang tools/detect-arrows.py.
        "arrow": {"x": 1218, "y": 1497, "width": 12, "height": 33},
        "prev": {"x": 210, "y": 1497, "width": 12, "height": 33},
        "extra": [
            ASSET("5. Page_Nhân sự", "Rectangle 186.png"),
            ASSET("5. Page_Nhân sự", "Rectangle 187.png"),
            ASSET("5. Page_Nhân sự", "Rectangle 188.png"),
        ],
    },
]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, list[dict]] = {}

    for slider in SLIDERS:
        if not slider["source"].is_file():
            print(f"  Thieu ban thiet ke: {slider['source']}")
            return 1

        page = Image.open(slider["source"])
        scale = page.width / CANVAS_WIDTH
        box = slider["box"]
        crop = (
            round(box["x"] * scale),
            round(box["y"] * scale),
            round((box["x"] + box["width"]) * scale),
            round((box["y"] + box["height"]) * scale),
        )

        slides = []
        first = page.crop(crop).convert("RGB")
        target = OUT / f"{slider['id']}-1.webp"
        first.save(target, "WEBP", quality=88, method=6)
        slides.append(f"/sliders/{slider['id']}-1.webp")
        print(f"  {target.relative_to(ROOT)}  {first.width}x{first.height}  (cat tu ban thiet ke)")

        for index, path in enumerate(slider["extra"], start=2):
            if not path.is_file():
                print(f"  Thieu anh: {path}")
                return 1
            # GIU kenh trong suot: anh da duoc cat theo hinh nghieng 3D, phan
            # ngoai hinh phai trong de cac lop anh phia sau (van nam trong anh
            # nen) hien ra. Chuyen sang RGB la mat, thanh mot o den chan het.
            art = Image.open(path).convert("RGBA")

            # KHONG phong to qua do phan giai goc: truoc day ep moi slide ve
            # cung kich thuoc voi slide cat tu thiet ke (@3x), nen anh roi nho
            # hon bi keo gian ra va mo nhoe. Giu nguyen do phan giai goc, chi
            # dua ve dung TI LE cua khung — trinh duyet thu nho lai luon net.
            ratio = first.width / first.height
            width = min(first.width, art.width)
            height = round(width / ratio)
            if height > art.height:
                height = art.height
                width = round(height * ratio)
            art = art.resize((width, height), Image.LANCZOS)
            target = OUT / f"{slider['id']}-{index}.webp"
            art.save(target, "WEBP", quality=88, method=6)
            slides.append(f"/sliders/{slider['id']}-{index}.webp")
            print(f"  {target.relative_to(ROOT)}  {art.width}x{art.height}  ({path.name})")

        entry = {
            "id": slider["id"],
            "label": slider["label"],
            "box": box,
            "arrow": slider["arrow"],
            "slides": slides,
        }
        if slider.get("prev"):
            entry["prev"] = slider["prev"]
        manifest.setdefault(slider["page"], []).append(entry)

    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Slider anh ve chet trong ban thiet ke. Slide dau cat tu chinh ban "
                    "thiet ke nen luc dung yen trung khop tuyet doi; cac slide sau lay tu "
                    "bo tai nguyen roi. Khong xoa gi khoi anh nen — slide dau phu dung cho."
                ),
                "pages": manifest,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  {DATA.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
