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
SUB_DIR = ROOT / "public" / "slices" / "sub"
MAIN_DIR = ROOT / "public" / "slices"
SUB_SPECS = ROOT / "src" / "data" / "subpages"
MAIN_SPECS = ROOT / "src" / "data" / "pages"

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


def pairs(spec_dir: Path, slice_dir: Path):
    for spec_path in sorted(spec_dir.glob("*.json")):
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
        if not isinstance(spec, dict) or "slices" not in spec:
            continue
        stem = spec_path.stem
        for index, slice_spec in enumerate(spec["slices"]):
            two = slice_dir / f"{stem}-{index}@2x.webp"
            three = slice_dir / f"{stem}-{index}@3x.webp"
            if not two.is_file():
                # Trang chinh dat ban 1x khong co hau to.
                two = slice_dir / f"{stem}-{index}.webp"
            if two.is_file() and three.is_file():
                yield stem, index, slice_spec.get("y", 0), two, three


def main() -> int:
    bad = []
    total = 0
    for spec_dir, slice_dir in ((SUB_SPECS, SUB_DIR), (MAIN_SPECS, MAIN_DIR)):
        for stem, index, y, two, three in pairs(spec_dir, slice_dir):
            total += 1
            a = Image.open(two).convert("RGB")
            b = Image.open(three).convert("RGB")
            score, at = worst_block(a, b)
            if score > LIMIT:
                bad.append((score, stem, index, round(y + at / 2)))

    print(f"  Da so {total} cap lat @2x/@3x.")
    if not bad:
        print("  Hai ti le khop nhau o moi trang.")
        return 0

    print(f"\n  {len(bad)} lat co ban @3x KHAC ban @2x — nhieu kha nang bo xoa")
    print("  nen chi dong toi @2x ma quen @3x:\n")
    for score, stem, index, y in sorted(bad, reverse=True):
        print(f"    lech {score:5.1f}  {stem}  lat {index}  quanh y={y}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
