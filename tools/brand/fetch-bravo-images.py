#!/usr/bin/env python3
"""
Tai ANH SAN PHAM cua ba dong Bravo tu trang chinh hang.

── Vi sao ──────────────────────────────────────────────────────────────────
Bo thiet ke khong co frame nao cho Bravo, va hai bo tai nguyen khach gui cung
khong co anh Bravo nao (da tim: `find ... -iname '*bravo*'` ra rong). Nen ba
dong Bravo truoc day chi co bang thong so, khong co anh — trong khi chin dong
Winca ben canh deu co.

Khach yeu cau (01/10/2026): "ảnh bravo bạn lấy trên web hãng luôn đi".

── Cach lam ────────────────────────────────────────────────────────────────
Chep ba anh gioi thieu tren wincavn.com — dung kieu voi anh san pham Winca da
co (ten dong + day the thong so + anh may), nen ba trang nhin dong bo voi nhau.

CAT BOT le trang: anh goc la hinh vuong 900x900 co nhieu khoang trang tren
duoi, trong khi anh Winca la anh ngang. Cat theo mau nen that chu khong cat
theo so do co dinh — moi anh chua mot luong le khac nhau.

Bo nay KHONG nam trong chuoi `npm run parse:*`: no can mang, ma mot buoc can
mang nam trong chuoi dung lai la lan nao mat mang cung khong dung duoc. Chay
tay khi can lay lai anh:

    python3 tools/brand/fetch-bravo-images.py
"""
from __future__ import annotations

import io
import json
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "public" / "products"
DATA = ROOT / "src" / "data" / "authored-pages.json"
PAGE = "giai-phap/man-hinh/bravo"

#: Ten dong -> anh gioi thieu tren trang hang. Doc ngay 01/10/2026.
SOURCES = {
    "Bravo B10 LITE": (
        "bravo-b10-lite",
        "https://wincavn.com/thumb/ea5ec0a4c740d0baff931fa010be86bc.webp",
        "https://wincavn.com/man-hinh-dvd-android-o-to-bravo-lite",
    ),
    "Bravo B100": (
        "bravo-b100",
        "https://wincavn.com/thumb/4529a396835e712ec1f4bbdf2a8f8c79.webp",
        "https://wincavn.com/man-hinh-dvd-android-o-to-bravo-b100-plus",
    ),
    "Bravo B100 PRO": (
        "bravo-b100-pro",
        "https://wincavn.com/thumb/64412923d591565d00b661158e8d8733.webp",
        "https://wincavn.com/man-hinh-android-bravo-b100-pro",
    ),
}

#: Diem anh lech hon nguong nay so voi mau nen thi coi la NOI DUNG.
INK = 12
#: Chua them vai diem anh quanh phan noi dung cho thoang.
PAD = 14


def trim(image: Image.Image) -> Image.Image:
    """
    Cat bot le trang quanh anh.

    Lay mau nen tu bon goc chu khong gia dinh la mau trang: vai anh nen hoi
    nga xam, cat theo mau trang thuan se khong cat duoc gi.
    """
    rgb = image.convert("RGB")
    a = np.asarray(rgb, dtype=np.int16)
    corners = np.stack(
        [a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]]
    ).astype(np.int16)
    bg = np.median(corners, axis=0)

    ink = np.abs(a - bg[None, None, :]).max(axis=2) > INK
    rows = np.nonzero(ink.any(axis=1))[0]
    cols = np.nonzero(ink.any(axis=0))[0]
    if len(rows) == 0 or len(cols) == 0:
        return rgb

    top = max(0, rows.min() - PAD)
    bottom = min(a.shape[0], rows.max() + 1 + PAD)
    left = max(0, cols.min() - PAD)
    right = min(a.shape[1], cols.max() + 1 + PAD)
    return rgb.crop((left, top, right, bottom))


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    data = json.loads(DATA.read_text(encoding="utf-8"))
    page = next(p for p in data["pages"] if p["slug"] == PAGE)
    by_name = {item["name"]: item for item in page["products"]["items"]}

    for name, (slug, url, source) in SOURCES.items():
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
        image = trim(Image.open(io.BytesIO(raw)))
        path = OUT / f"{slug}.webp"
        image.save(path, "WEBP", quality=88, method=6)
        print(f"  {path.relative_to(ROOT)}  {image.width}x{image.height}  <- {url}")

        item = by_name[name]
        item["image"] = f"/products/{slug}.webp"
        item["imageWidth"] = image.width
        item["imageHeight"] = image.height
        item["imageSource"] = source

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n  Da ghi duong dan anh vao {DATA.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
