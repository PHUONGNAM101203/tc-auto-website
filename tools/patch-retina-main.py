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

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

#: Tinh mat na o do phan giai THU NHO. Anh @3x cua trang chinh rong 4320px;
#: chay bo loc gian no o do phan giai day mat hang phut moi anh, trong khi mat
#: na von la thu tho — no chi can biet "vung nao lech", khong can tung diem anh.
SHRINK = 4
#: Lam mo truoc khi so, de nhieu nen WebP khong tu tao ra mat na li ti.
PRE_BLUR = 2.0
#: Lech tren nguong nay (0..255) thi coi la "ban @3x co thu ma ban @2x khong co".
THRESHOLD = 18
#: No mat na ra, do @3x cho nen do bong cua chu thuong nhat hon net chu.
#: Tinh theo diem anh cua ban THU NHO.
GROW = 3
#: Lam mem mep mat na de khong thay duong ranh (diem anh cua ban day du).
FEATHER = 4.0


def build_mask(up: Image.Image, three: Image.Image) -> Image.Image | None:
    """
    Mat na xam: 255 o cho phai lay lai tu @2x, 0 o cho giu @3x.

    Tra ve None khi hai ban da khop — khoi phai ghi de anh lam gi.
    """
    small = (up.width // SHRINK, up.height // SHRINK)
    a = np.asarray(
        up.resize(small, Image.LANCZOS).filter(ImageFilter.GaussianBlur(PRE_BLUR)),
        dtype=np.int16,
    )
    b = np.asarray(
        three.resize(small, Image.LANCZOS).filter(ImageFilter.GaussianBlur(PRE_BLUR)),
        dtype=np.int16,
    )
    hot = np.abs(a - b).max(axis=2) > THRESHOLD
    if not hot.any():
        return None
    mask = Image.fromarray((hot * 255).astype(np.uint8))
    mask = mask.filter(ImageFilter.MaxFilter(GROW * 2 + 1))
    return mask.resize(up.size, Image.BILINEAR).filter(
        ImageFilter.GaussianBlur(FEATHER)
    )


def pairs():
    """
    MOI cap @2x/@3x duoi public/ — quet theo TEP chu khong theo page spec.

    Ban dau bo nay chi di theo src/data/pages va da bo sot public/hero/: anh
    hero trang chu cung co cap @2x/@3x, va ban @3x nuong san ca thanh menu lan
    doan chu gioi thieu, nen chu hien hai lan ngay man hinh dau tien.

    Hai cach dat ten: `X@2x.webp` <-> `X@3x.webp`, va `X.webp` <-> `X@3x.webp`
    (lat trang chinh: ban goc la @2x nhung khong mang hau to).
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
    touched, skipped = [], 0
    for name, two, three in pairs():
        base = Image.open(three).convert("RGB")
        up = Image.open(two).convert("RGB").resize(base.size, Image.LANCZOS)
        mask = build_mask(up, base)
        share = 0.0 if mask is None else float(np.asarray(mask, dtype=np.float32).mean()) / 255
        if mask is None or share <= 0.0005:
            skipped += 1
            continue
        Image.composite(up, base, mask).save(three, "WEBP", quality=88, method=6)
        touched.append((share, str(name)))

    for share, name in sorted(touched, reverse=True):
        print(f"  {name:<40} {share * 100:5.1f}% dien tich lay lai tu @2x")
    print(f"\n  Da va {len(touched)} anh, {skipped} anh von da khop.")
    print("  Phan con lai giu nguyen do net @3x.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
