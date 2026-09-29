#!/usr/bin/env python3
"""
Lam cho ban @3x cua 6 TRANG CHINH khop voi ban @2x ve NOI DUNG.

── Van de ──────────────────────────────────────────────────────────────────
Hai ban khong cung mot nguon:

  @2x  tach tu TC-Auto-Website-Prototype.html (export Figma). O day CHU va NUT
       la phan tu that, nen trong anh nen cho do de TRONG.
  @3x  cat tu PNG thiet ke (tools/add-retina-main.py). PNG la anh chup ca trang
       nen chu va nut bi NUONG CHET vao anh.

Truoc day chuyen nay khong lo ra, vi srcset dung mo ta `x` — ban @3x chi duoc
chon tren may co mat do diem anh >= 3, ma may do la dien thoai, ma dien thoai
thi xem lop mobile chu khong xem canvas. Tu khi doi sang mo ta `w`
(src/lib/slice-srcset.ts) thi man retina RONG cung lay ban @3x — va chu se
hien HAI LAN: mot lan nuong trong nen, mot lan do phan tu that ve de len.

── Cach sua ────────────────────────────────────────────────────────────────
Ban @2x la CHUAN ve "trong nen co gi"; ban @3x chi dong gop DO NET. Nen o dau
hai ban da khop thi giu nguyen @3x (anh chup, do hoa — duoc net that), o dau
lech thi lay lai chinh @2x phong to (chu, nut — cho nay nen von phang, phong
to khong mat gi, va chu that se duoc ve de len o do net day du).

Mat na duoc suy ra tu chenh lech chu KHONG tu danh sach o chu: nhieu muc trong
page spec khong co chieu cao (`h: null`), va con ca nut lan the khong nam trong
danh sach do.

Chay sau tools/add-retina-main.py. Idempotent: chay lai tren ket qua da va thi
mat na rong, khong doi gi them.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SLICE_DIR = ROOT / "public" / "slices"
SPEC_DIR = ROOT / "src" / "data" / "pages"

#: Lam mo truoc khi so, de nhieu nen WebP khong tu tao ra mat na li ti.
PRE_BLUR = 2.0
#: Lech tren nguong nay (0..255) thi coi la "ban @3x co thu ma ban @2x khong co".
THRESHOLD = 18
#: No mat na ra, do @3x cho nen do bong cua chu thuong nhat hon net chu.
GROW = 10
#: Lam mem mep mat na de khong thay duong ranh.
FEATHER = 4.0


def build_mask(up: Image.Image, three: Image.Image) -> Image.Image:
    """Mat na xam: 255 o cho phai lay lai tu @2x, 0 o cho giu @3x."""
    a = np.asarray(up.filter(ImageFilter.GaussianBlur(PRE_BLUR)), dtype=np.int16)
    b = np.asarray(three.filter(ImageFilter.GaussianBlur(PRE_BLUR)), dtype=np.int16)
    diff = np.abs(a - b).max(axis=2)
    mask = Image.fromarray(((diff > THRESHOLD) * 255).astype(np.uint8))
    return mask.filter(ImageFilter.MaxFilter(GROW * 2 + 1)).filter(
        ImageFilter.GaussianBlur(FEATHER)
    )


def patch(slug: str) -> tuple[int, float]:
    spec = json.loads((SPEC_DIR / f"{slug}.json").read_text(encoding="utf-8"))
    if not isinstance(spec, dict) or "slices" not in spec:
        return 0, 0.0
    touched, covered, total = 0, 0.0, 0.0
    for index in range(len(spec["slices"])):
        two = SLICE_DIR / f"{slug}-{index}.webp"
        three = SLICE_DIR / f"{slug}-{index}@3x.webp"
        if not (two.is_file() and three.is_file()):
            continue
        base = Image.open(three).convert("RGB")
        up = Image.open(two).convert("RGB").resize(base.size, Image.LANCZOS)
        mask = build_mask(up, base)
        share = float(np.asarray(mask, dtype=np.float32).mean()) / 255
        covered += share * base.width * base.height
        total += base.width * base.height
        if share > 0.0005:
            Image.composite(up, base, mask).save(
                three, "WEBP", quality=88, method=6
            )
            touched += 1
    return touched, (covered / total * 100 if total else 0.0)


def main() -> int:
    slugs = sorted(p.stem for p in SPEC_DIR.glob("*.json"))
    for slug in slugs:
        touched, share = patch(slug)
        print(f"  {slug:<14} va {touched} lat  — {share:5.1f}% dien tich lay lai tu @2x")
    print("\n  Phan con lai giu nguyen do net @3x.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
