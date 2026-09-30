#!/usr/bin/env python3
"""
Xoa THANH DIEU HUONG da ve chet trong anh nen cua 31 trang con.

── Vi sao ──────────────────────────────────────────────────────────────────
Sau trang chinh, chu tren thanh nav la PHAN TU THAT. Con 31 trang con thi
duoc cat thang tu PNG, nen ca chu lan khung danh dau muc dang xem deu nam
trong anh; ben tren chi la mot lop lien ket TRONG SUOT (`.tc-ghost`).

He qua: khung danh dau khong nhuc nhich duoc. Khach muon mot khung duy nhat
luot theo chuot va dung lai o muc dang xem — tren trang con thi khong lam
duoc, vi khung that se nam de len khung ve chet (khach bao 30/09/2026).

Xoa han thanh nav khoi anh roi de chu ve that thi:
  - khung luot duoc, giong het trang chinh;
  - chu tren nav doc duoc, chon duoc, may tim kiem doc duoc.

── Xoa the nao ────────────────────────────────────────────────────────────
Thanh nav nam tren anh hero, khong phai nen phang. Dung noi suy DOC: lay mot
dai moc ngay tren va ngay duoi vung xoa roi chuyen dan giua chung. Anh hero o
day la troi/nui doi rat cham theo chieu doc nen cach nay khong de lai vet.

Chay: python3 tools/scrub-nav.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools" / "brand"))
from _backdrop import rebuild_background  # noqa: E402

SPEC_DIR = ROOT / "src" / "data" / "subpages"
SLICE_DIR = ROOT / "public" / "slices" / "sub"
MAIN_SPEC_DIR = ROOT / "src" / "data" / "pages"
MAIN_SLICE_DIR = ROOT / "public" / "slices"

#: Trang chinh nao co O TIM KIEM ve chet trong anh nen.
#: Ban prototype export ra mot mang toi dac thay cho o tim kiem o trang Cong
#: nghe, nen tools/patch-from-design.py va lai vung do bang pixel cua ban thiet
#: ke — ma pixel do gom ca khung, kinh lup va dong chu. Xoa no di thi o that
#: hien ra, va ca 37 trang cung mot kieu o tim kiem.
MAIN_SEARCH_BAKED = ("cong-nghe",)

CANVAS_WIDTH = 1440
#: Hai vung phai xoa. Do tren trang da dung:
#:   cac muc nav nam o x 431..1014, y 48..74
#:   o tim kiem      nam o x 1123..1358, y 37..67
#: Noi rong ra cho chac — ke ca dau ">" va phan net tha xuong cua chu.
#: Hai o rieng chu khong mot o rong: it dien tich phai dung lai thi it kha
#: nang lo vet.
#: LOGO thi de nguyen — khong co phan tu that nao thay the no.
SCRUB = (
    {"x": 418, "y": 38, "width": 610, "height": 46},
    {"x": 1113, "y": 29, "width": 256, "height": 48},
)
#: Be day dai moc lay o tren va duoi vung xoa.
ANCHOR = 14


def scrub_page(stem: str) -> int:
    spec = json.loads((SPEC_DIR / f"{stem}.json").read_text(encoding="utf-8"))
    touched = 0

    for retina in (2, 3):
        for index, slice_spec in enumerate(spec["slices"]):
            top = slice_spec["y"]
            bottom = top + slice_spec["displayHeight"]
            hit = [
                area
                for area in SCRUB
                if area["y"] < bottom and area["y"] + area["height"] > top
            ]
            if not hit:
                continue
            path = SLICE_DIR / f"{stem}-{index}@{retina}x.webp"
            if not path.is_file():
                raise SystemExit(f"Thieu lat nen: {path}")
            image = Image.open(path).convert("RGB")
            scale = image.width / CANVAS_WIDTH
            for area in hit:
                box = (
                    round(area["x"] * scale),
                    round((area["y"] - top) * scale),
                    round((area["x"] + area["width"]) * scale),
                    round((area["y"] + area["height"] - top) * scale),
                )
                image.paste(
                    rebuild_background(image, box, anchor=round(ANCHOR * scale)),
                    (box[0], box[1]),
                )
            image.save(path, "WEBP", quality=82, method=6)
            touched += 1
    return touched


def scrub_main(slug: str) -> int:
    """Xoa O TIM KIEM ve chet khoi lat nen cua mot trang chinh."""
    spec = json.loads((MAIN_SPEC_DIR / f"{slug}.json").read_text(encoding="utf-8"))
    area = SCRUB[1]
    touched = 0
    for suffix in ("", "@3x"):
        for index, slice_spec in enumerate(spec["slices"]):
            top = slice_spec["y"]
            bottom = top + slice_spec["displayHeight"]
            if area["y"] + area["height"] <= top or area["y"] >= bottom:
                continue
            path = MAIN_SLICE_DIR / f"{slug}-{index}{suffix}.webp"
            if not path.is_file():
                raise SystemExit(f"Thieu lat nen: {path}")
            image = Image.open(path).convert("RGB")
            scale = image.width / CANVAS_WIDTH
            box = (
                round(area["x"] * scale),
                round((area["y"] - top) * scale),
                round((area["x"] + area["width"]) * scale),
                round((area["y"] + area["height"] - top) * scale),
            )
            image.paste(
                rebuild_background(image, box, anchor=round(ANCHOR * scale)),
                (box[0], box[1]),
            )
            image.save(path, "WEBP", quality=82, method=6)
            touched += 1
    return touched


def main() -> int:
    # `--main` chi xoa o tim kiem cua trang chinh; chuoi parse:prototype goi voi
    # co nay, con parse:subpages goi khong co co.
    if "--main" in sys.argv:
        for slug in MAIN_SEARCH_BAKED:
            print(f"  Da xoa o tim kiem ve san khoi {scrub_main(slug)} lat nen cua /{slug}.")
        return 0

    stems = sorted(p.stem for p in SPEC_DIR.glob("*.json") if p.stem != "index")
    total = 0
    for stem in stems:
        total += scrub_page(stem)
    print(f"  Da xoa thanh nav khoi {total} lat nen cua {len(stems)} trang con.")

    for slug in MAIN_SEARCH_BAKED:
        n = scrub_main(slug)
        print(f"  Da xoa o tim kiem ve san khoi {n} lat nen cua /{slug}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
