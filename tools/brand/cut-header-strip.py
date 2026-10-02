#!/usr/bin/env python3
"""
Cat DAI HEADER ra mot tep rieng, de cac trang ngoai canvas dung lai.

── Vi sao can ─────────────────────────────────────────────────────────────
Sau trang chinh va 31 trang con deu ve header len CANVAS 1440px: hinh nen (nen
chuyen mau, logo, khung o tim kiem) nam trong lat anh, con chu nav va o nhap
thi la phan tu that de len. Cach do khong mang sang duoc nhung trang KHONG co
canvas — trang bai viet, trang san pham, trang danh muc, FAQ. Nhung trang do
dang phai dung thanh dieu huong cua DIEN THOAI (nut ba gach) ngay ca tren man
hinh rong, nen nhin ra mot site khac han. Khach bao: "menu header y chang
không được thay đổi" (02/10/2026).

Nay dai header duoc cat thanh mot tep; `DocHeader` dung no lam nen roi dat
dung `SiteHeader` len tren — cung component, cung toa do, nen hai ben giong
nhau tung pixel.

Cat tu lat `home-0`: do la lat da qua `scrub-nav.py` (khung danh dau muc dang
xem da duoc xoa) va `patch-retina-main.py` (ban @3x lay lai vung header tu @2x
nen khong con chu nuong san). Lay dung phan tren 100px — bang `.hdr` trong
canvas.css.

Chay: python3 tools/brand/cut-header-strip.py
Vi tri trong chuoi: SAU `patch-retina-main.py` va `scrub-nav.py`.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
SLICES = ROOT / "public" / "slices"
OUT = ROOT / "public" / "brand"

CANVAS_WIDTH = 1440
#: Chieu cao `.hdr` trong src/styles/canvas.css.
HEIGHT = 100


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    made = []
    for suffix, name in (("", "header-strip@2x.webp"), ("@3x", "header-strip@3x.webp")):
        source = SLICES / f"home-0{suffix}.webp"
        if not source.is_file():
            raise SystemExit(f"Khong tim thay {source}")
        with Image.open(source) as image:
            scale = image.width / CANVAS_WIDTH
            strip = image.convert("RGB").crop((0, 0, image.width, round(HEIGHT * scale)))
        target = OUT / name
        strip.save(target, "WEBP", quality=90, method=6)
        made.append(f"{target.relative_to(ROOT)} {strip.width}x{strip.height}")

    for line in made:
        print(f"  {line}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
