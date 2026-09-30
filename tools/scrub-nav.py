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
from _backdrop import feathered, rebuild_background  # noqa: E402

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

#: Sau trang chinh deu co KHUNG BO TRON ve san quanh muc nav dang xem, ngay
#: trong anh nen (tools/patch-from-design.py va lai vung nav bang pixel cua ban
#: thiet ke). Chu thi la phan tu that, chi con moi cai khung nam lai trong anh.
#:
#: Khach bao (30/09/2026, anh 66): "bo cai khung mac dinh khi ma bam vao cai
#: nav item do di" — khung ve san khong nhuc nhich duoc, ma khung truot that
#: lai dau ngay len tren no, thanh hai lop chong nhau. Xoa khung ve san thi
#: khung truot la dau duy nhat: no dau o muc dang xem va luot khi re chuot.
MAIN_PAGES = ("home", "trai-nghiem", "giai-phap", "cong-nghe", "dai-ly", "nhan-su")

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
#: Be day vien MO DAN cua mieng va, tinh theo he toa do canvas.
#: Nen o day la mot dai chuyen mau. Noi suy doc dung lai duoc dung mau nhung
#: mat het van, nen neu dat mieng va voi mep cung thi lo ra mot o chu nhat hoi
#: khac tong — khach nhin thay ngay. Mo dan 10px thi mep tan vao nen.
FEATHER = 10


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
                patch = feathered(
                    rebuild_background(image, box, anchor=round(ANCHOR * scale)),
                    round(FEATHER * scale),
                )
                image.paste(patch, (box[0], box[1]), patch)
            image.save(path, "WEBP", quality=82, method=6)
            touched += 1
    return touched


def scrub_main(slug: str, areas) -> int:
    """Xoa cac vung ve chet khoi lat nen cua mot trang chinh."""
    spec = json.loads((MAIN_SPEC_DIR / f"{slug}.json").read_text(encoding="utf-8"))
    touched = 0
    for suffix in ("", "@3x"):
        for index, slice_spec in enumerate(spec["slices"]):
            top = slice_spec["y"]
            bottom = top + slice_spec["displayHeight"]
            hit = [
                a
                for a in areas
                if a["y"] < bottom and a["y"] + a["height"] > top
            ]
            if not hit:
                continue
            path = MAIN_SLICE_DIR / f"{slug}-{index}{suffix}.webp"
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
                patch = feathered(
                    rebuild_background(image, box, anchor=round(ANCHOR * scale)),
                    round(FEATHER * scale),
                )
                image.paste(patch, (box[0], box[1]), patch)
            image.save(path, "WEBP", quality=82, method=6)
            touched += 1
    return touched


def main() -> int:
    # `--main` chi xoa o tim kiem cua trang chinh; chuoi parse:prototype goi voi
    # co nay, con parse:subpages goi khong co co.
    if "--main" in sys.argv:
        for slug in MAIN_PAGES:
            areas = [SCRUB[0]] + ([SCRUB[1]] if slug in MAIN_SEARCH_BAKED else [])
            n = scrub_main(slug, areas)
            print(f"  Da xoa khung nav ve san khoi {n} lat nen cua /{slug}.")
        return 0

    stems = sorted(p.stem for p in SPEC_DIR.glob("*.json") if p.stem != "index")
    total = 0
    for stem in stems:
        total += scrub_page(stem)
    print(f"  Da xoa thanh nav khoi {total} lat nen cua {len(stems)} trang con.")

    for slug in MAIN_PAGES:
        areas = [SCRUB[0]] + ([SCRUB[1]] if slug in MAIN_SEARCH_BAKED else [])
        n = scrub_main(slug, areas)
        print(f"  Da xoa khung nav ve san khoi {n} lat nen cua /{slug}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
