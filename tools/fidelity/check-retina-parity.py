#!/usr/bin/env python3
"""
Ban @3x cua moi lat nen phai GIONG ban @2x — chi khac do net.

Vi sao can kiem tra nay:

Nhieu khoi tuong tac duoc dung bang cach XOA phan ve chet khoi lat nen roi ve
lai bang phan tu that. Neu bo xoa chi dong toi ban @2x ma quen ban @3x thi
tren man thuong moi thu binh thuong, con tren man retina rong se hien CA HAI:
anh goc van nam trong nen, chong len khoi that ve de len.

Loi nay tung xay ra that voi tools/brand/extract-ppf-cards.py va
tools/brand/extract-quiz.py. No khong the bi gate pixel bat, vi gate chay o ti
le 1 nen khong bao gio tai ban @3x.

Cach do: cat ca hai ban thanh o vuong roi so tung o. So sanh trung binh ca lat
thi mot vung nho bi hong se bi pha loang trong vung sach xung quanh.

Chay: python3 tools/fidelity/check-retina-parity.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
PUBLIC = ROOT / "public"

#: Canh o vuong, do o ti le @2x.
BLOCK = 128
#: Nen WebP o hai ti le khac nhau thi lech chung 1..3. Rieng nhung o co hoa
#: tiet day dac — vi du luoi day 3D tren trang Cong nghe — thi phep thu nho
#: ban @3x ve @2x sinh ra sai so lon hon: do duoc 8,04 o do, va do la CUNG MOT
#: noi dung chu khong phai vung chua xoa.
#: Nguong 12 van con xa cac loi that (do thuc te: 28 o PPF, 20 o quiz, 42 o
#: anh hero khi mat na do duc tinh rieng tung ti le).
LIMIT = 12.0

#: Be ngang he toa do canvas.
CANVAS_WIDTH = 1440
#: Dai HEADER — soi ky hon phan con lai.
#:
#: Nguong 12 o tren la muc chung cho ca anh; no bo lot mot loi that: ban @3x
#: cua trang Giai phap con NUONG SAN o tim kiem (khung vien sang 1px cong dong
#: chu xam nhat) tren mot dai chuyen mau rat muot. Lay trung binh ca o vuong
#: 128px thi chenh lech do tan ra chi con vai don vi — duoi nguong — nen cua
#: nay bao "khop", trong khi tren man retina rong chu "Nhập để tìm kiếm..."
#: hien HAI LAN (khach bao 30/09/2026).
#:
#: O dai header thi ta biet chac ket qua phai ra sao: moi thu o do la phan tu
#: THAT ve de len, nen nen bat buoc phai trong va hai ti le phai khop gan nhu
#: tuyet doi. Do bang LECH LON NHAT tung diem anh chu khong lay trung binh —
#: mot net chu mo cung du lam vot con so nay len.
HEADER_BAND = {"x": 400, "y": 18, "width": 980, "height": 78}
HEADER_LIMIT = 26.0


def header_gap(a: Image.Image, b: Image.Image) -> float:
    """Lech lon nhat tung diem anh trong dai header. 0 neu anh khong chua no."""
    scale = a.width / CANVAS_WIDTH
    top = round(HEADER_BAND["y"] * scale)
    bottom = round((HEADER_BAND["y"] + HEADER_BAND["height"]) * scale)
    if top >= a.height:
        return 0.0
    box = (
        round(HEADER_BAND["x"] * scale),
        top,
        round((HEADER_BAND["x"] + HEADER_BAND["width"]) * scale),
        min(bottom, a.height),
    )
    big = b.resize(a.size, Image.LANCZOS)
    x = np.abs(
        np.asarray(a.crop(box), dtype=np.int16)
        - np.asarray(big.crop(box), dtype=np.int16)
    )
    # Bo 0,05% diem te nhat: nhieu ma hoa WebP thi thinh thoang co mot diem
    # don doc vot han len, con chu ve san thi bao gio cung la ca mot mang.
    return float(np.percentile(x, 99.95))


def worst_block(a: Image.Image, b: Image.Image) -> tuple[float, int]:
    """Do lech cua o te nhat, va toa do y cua o do (theo he toa do canvas)."""
    big = b.resize(a.size, Image.LANCZOS)
    x = np.abs(np.asarray(a, dtype=np.int16) - np.asarray(big, dtype=np.int16))
    worst, at = 0.0, 0
    for top in range(0, x.shape[0], BLOCK):
        for left in range(0, x.shape[1], BLOCK):
            block = x[top : top + BLOCK, left : left + BLOCK]
            if block.size == 0:
                continue
            score = float(block.mean())
            if score > worst:
                worst, at = score, top
    return worst, at


def pairs():
    """
    MOI cap @2x/@3x o bat cu dau duoi public/.

    Quet theo TEP chu khong theo page spec. Ban dau bo nay chi doc
    src/data/pages va src/data/subpages, va da bo sot public/hero/ — anh hero
    trang chu cung co cap @2x/@3x rieng, va ban @3x cua no nuong san ca thanh
    menu lan doan chu gioi thieu. Ket qua: chu hien hai lan ngay tren man hinh
    dau tien cua trang chu.

    Hai cach dat ten:
      X@2x.webp  <-> X@3x.webp          (anh hero, lat trang con)
      X.webp     <-> X@3x.webp          (lat trang chinh: ban goc la @2x nhung
                                         khong mang hau to)
    """
    seen: set[Path] = set()
    for three in sorted(PUBLIC.rglob("*@3x.webp")):
        stem = three.name[: -len("@3x.webp")]
        for candidate in (three.parent / f"{stem}@2x.webp", three.parent / f"{stem}.webp"):
            if candidate.is_file() and candidate not in seen:
                seen.add(candidate)
                yield candidate.relative_to(PUBLIC), candidate, three
                break


def main() -> int:
    bad = []
    header_bad = []
    total = 0
    for name, two, three in pairs():
        total += 1
        a = Image.open(two).convert("RGB")
        b = Image.open(three).convert("RGB")
        score, at = worst_block(a, b)
        if score > LIMIT:
            bad.append((score, str(name), at))
        # Chi lat DAU trang va anh hero moi chua dai header.
        parts = name.parts
        stem = name.stem.removesuffix("@2x")
        if (parts[0] == "slices" and stem.endswith("-0")) or parts[0] == "hero":
            gap = header_gap(a, b)
            if gap > HEADER_LIMIT:
                header_bad.append((gap, str(name)))

    print(f"  Da so {total} cap anh @2x/@3x duoi public/.")

    if header_bad:
        print(f"\n  {len(header_bad)} anh co DAI HEADER khac nhau giua hai ti le.")
        print("  Cho do moi thu deu la phan tu that ve de len, nen nen bat buoc")
        print("  phai trong — lech nghia la con menu hoac o tim kiem ve san:\n")
        for gap, name in sorted(header_bad, reverse=True):
            print(f"    lech {gap:5.1f}  {name}")

    if not bad and not header_bad:
        print("  Hai ti le khop nhau o moi anh.")
        return 0
    if not bad:
        return 1

    print(f"\n  {len(bad)} anh co ban @3x KHAC ban @2x — nhieu kha nang bo xoa")
    print("  hoac bo va chi dong toi @2x ma quen @3x:\n")
    for score, name, at in sorted(bad, reverse=True):
        print(f"    lech {score:5.1f}  {name}  quanh hang {at} (@2x)")
    return 1


if __name__ == "__main__":
    sys.exit(main())
