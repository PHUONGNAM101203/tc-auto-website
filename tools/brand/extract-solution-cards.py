#!/usr/bin/env python3
"""
Tach dai 4 the o muc "Giải pháp" (trang chu) ra khoi anh nen.

Vi sao: thiet ke ve chet dai the vao anh, the thu 4 bi cat o mep canvas va co
mot mui ten trang bao "con nua". Muon mui ten do bam duoc thi dai the phai la
phan tu that de truot ngang duoc.

Viec nay lam ba thu:
  1. Cat rieng 3 the dau TU CHINH ANH THIET KE — giu nguyen ca chu da ve san,
     nen luc dung yen man hinh trung khop tuyet doi voi thiet ke.
  2. Lay anh the thu 4 tu bo tai nguyen roi ("Rectangle 39.png" — dan loa DEGO).
     The nay trong thiet ke bi cat nen khong co chu; chu se duoc ve bang CSS.
  3. Xoa dai the khoi lat nen. Nen o day la TRANG THUAN nen chi can to trang.

Chay: python3 tools/brand/extract-solution-cards.py
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
DOWNLOADS = Path("/Users/phuongnam/Downloads/[TC] Website")
SOURCE = DOWNLOADS / "Website_TC" / "1. Page_Home" / "Home.png"
ASSETS = DOWNLOADS / "Tài nguyên Web" / "0. Homepage"
OUT = ROOT / "public" / "solutions"
SLICE_DIR = ROOT / "public" / "slices"
SPEC = ROOT / "src" / "data" / "pages" / "home.json"
DATA = ROOT / "src" / "data" / "solution-cards.json"

CANVAS_WIDTH = 1440

# Hinh hoc dai the, do tu Home.png (xem ghi chu trong git blame / probe).
CARD_TOP = 1458
CARD_WIDTH = 263
CARD_HEIGHT = 371
CARD_XS = (539, 818, 1097, 1376)
# Khung nhin: tu mep trai the dau den mep phai canvas. The thu 4 tho ra ngoai —
# dung y thiet ke la "con nua, keo di".
VIEW = {"x": CARD_XS[0], "y": CARD_TOP, "width": CANVAS_WIDTH - CARD_XS[0], "height": CARD_HEIGHT}
PITCH = CARD_XS[1] - CARD_XS[0]

# Mui ten trang ve san tren the thu 4. Do duoc: tam giac dac 10,33 x 30.
ARROW = {"x": 1400, "y": 1629, "width": 10.33, "height": 30}

# Vung to trang de xoa dai the. Rong hon dai mot chut cho chac; quanh do la nen
# trang thuan (da kiem tra: y 1425..1862 trang hoan toan o x >= 500).
SCRUB = (530, 1450, CANVAS_WIDTH - 530, 1835 - 1450)

CARDS = [
    {
        "id": "phim-cach-nhiet",
        "title": "PHIM CÁCH NHIỆT",
        "subtitle": "3M | 5DO",
        "href": "/giai-phap/phim-dan-kinh",
        "from": "design",
    },
    {
        "id": "ppf",
        "title": "PPF",
        "subtitle": "3M | 5DO",
        "href": "/giai-phap/ppf",
        "from": "design",
    },
    {
        "id": "phu-kien",
        "title": "PHỤ KIỆN",
        "subtitle": "WINCA",
        "href": "/giai-phap/man-hinh",
        "from": "design",
    },
    {
        "id": "loa",
        "title": "LOA",
        "subtitle": "DEGO",
        "href": "/giai-phap/loa",
        # The nay trong thiet ke bi cat o mep canvas nen khong co chu. Anh lay
        # tu bo tai nguyen roi; chu do ta dat theo dung mach cua ba the kia.
        "from": "Rectangle 39.png",
        "labelInCss": True,
    },
]


def export_cards() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    page = Image.open(SOURCE)
    scale = page.width / CANVAS_WIDTH
    manifest = []

    for index, card in enumerate(CARDS):
        if card["from"] == "design":
            x = CARD_XS[index]
            art = page.crop(
                (
                    round(x * scale),
                    round(CARD_TOP * scale),
                    round((x + CARD_WIDTH) * scale),
                    round((CARD_TOP + CARD_HEIGHT) * scale),
                )
            ).convert("RGB")
        else:
            source = ASSETS / card["from"]
            if not source.is_file():
                raise SystemExit(f"Thieu anh the: {source}")
            art = Image.open(source).convert("RGB")

        target = OUT / f"{card['id']}.webp"
        art.save(target, "WEBP", quality=86, method=6)
        manifest.append(
            {
                "id": card["id"],
                "title": card["title"],
                "subtitle": card["subtitle"],
                "href": card["href"],
                "src": f"/solutions/{card['id']}.webp",
                "labelInCss": card.get("labelInCss", False),
            }
        )
        print(f"  {target.relative_to(ROOT)}  {art.width}x{art.height}  "
              f"{target.stat().st_size / 1e3:.0f} KB")

    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Dai the muc Giai phap tren trang chu. Hinh hoc do tu Home.png; "
                    "tieu de doc tu chinh anh thiet ke. The 'loa' bi cat o mep canvas "
                    "nen khong co chu trong anh — chu do CSS ve, danh dau labelInCss."
                ),
                "view": VIEW,
                "card": {"width": CARD_WIDTH, "height": CARD_HEIGHT},
                "pitch": PITCH,
                "arrow": ARROW,
                "cards": manifest,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  {DATA.relative_to(ROOT)}")


def scrub_strip() -> int:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    x, y, w, h = SCRUB
    touched = 0

    for scale in (2, 3):
        for index, slice_spec in enumerate(spec["slices"]):
            top = slice_spec["y"]
            bottom = top + slice_spec["displayHeight"]
            if y + h <= top or y >= bottom:
                continue

            name = f"home-{index}.webp" if scale == 2 else f"home-{index}@3x.webp"
            path = SLICE_DIR / name
            if not path.is_file():
                continue

            image = Image.open(path).convert("RGB")
            box = (
                round(x * scale),
                round((max(y, top) - top) * scale),
                round((x + w) * scale),
                round((min(y + h, bottom) - top) * scale),
            )
            image.paste((255, 255, 255), box)
            image.save(path, "WEBP", quality=80, method=6)
            touched += 1

    return touched


def main() -> int:
    if not SOURCE.is_file():
        print(f"Khong tim thay nguon: {SOURCE}")
        return 1

    export_cards()
    touched = scrub_strip()
    print(f"\n  Da xoa dai the khoi {touched} lat nen cua trang chu.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
