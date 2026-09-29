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
#: Nen WebP o hai ti le khac nhau thi lech chung 1..3. Nguong 8 con xa muc do
#: nhieu do ma van bat duoc vung chua xoa (do thuc te: 28 o PPF, 20 o quiz).
LIMIT = 8.0


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
    total = 0
    for name, two, three in pairs():
        total += 1
        score, at = worst_block(
            Image.open(two).convert("RGB"), Image.open(three).convert("RGB")
        )
        if score > LIMIT:
            bad.append((score, str(name), at))

    print(f"  Da so {total} cap anh @2x/@3x duoi public/.")
    if not bad:
        print("  Hai ti le khop nhau o moi anh.")
        return 0

    print(f"\n  {len(bad)} anh co ban @3x KHAC ban @2x — nhieu kha nang bo xoa")
    print("  hoac bo va chi dong toi @2x ma quen @3x:\n")
    for score, name, at in sorted(bad, reverse=True):
        print(f"    lech {score:5.1f}  {name}  quanh hang {at} (@2x)")
    return 1


if __name__ == "__main__":
    sys.exit(main())
