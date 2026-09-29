#!/usr/bin/env python3
"""
Xoa cac dieu khien VE SAN trong anh hero cua trang chu.

Vi sao can: bang hero gio co dieu khien THAT (bam duoc, chay theo slide, dung
duoc bang ban phim). Anh nen lai da co san vach chi muc va hai mui ten ve chet
vao do — thanh ra ve doi, va vach sang cua anh nen (vach thu 3) khong khop voi
vach sang that (theo slide dang xem).

Cach xoa: cac vung nay rat nho va nam tren nen troi/co muot, nen chi can chep
mot dai pixel ngay ben canh de len la khong con dau vet.

PHAI chay SAU tools/patch-retina-main.py: anh hero duoc dan xuat tu chinh lat
nen home-0, ma ban @3x cua lat do luc moi cat ra con NUONG SAN chu (thanh menu,
o tim kiem, doan gioi thieu) — bo va kia moi la cho don di. Chay truoc thi anh
hero mang theo chu nuong san, va chu se hien hai lan tren man retina rong.
Chuoi `npm run parse:prototype` da xep dung thu tu nay.

Chay: python3 tools/brand/clean-hero.py
Ket qua: public/hero/home-hero@2x.webp va @3x.webp
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "public" / "hero"

# Vung can xoa, tinh theo he toa do canvas 1440px (co noi rong vai pixel).
#   vach chi muc : y 825.5..828, x 640..800
#   mui ten trai : y 437..464,   x 32..40
#   mui ten phai : y 432..464,   x 1400..1410
# Huong lay pixel thay the la huong NAM SAU TRONG ANH, khong phai huong ra mep:
# mui ten trai sat mep trai nen phai lay dai ben PHAI no, va nguoc lai. Lay ra
# ngoai mep thi PIL tra ve vung den va de lai vet.
REGIONS = [
    # (x0, y0, x1, y1, lay pixel tu dau)
    (632, 820, 808, 833, "above"),  # vach chi muc — nen co, doi cham theo chieu doc
    (24, 428, 50, 470, "right"),    # mui ten trai — lay dai ngay ben phai
    (1392, 424, 1418, 470, "left"), # mui ten phai — lay dai ngay ben trai
]


def scrub(image: Image.Image, scale: int) -> Image.Image:
    out = image.copy()
    for x0, y0, x1, y1, source in REGIONS:
        left, top = round(x0 * scale), round(y0 * scale)
        right, bottom = round(x1 * scale), round(y1 * scale)
        width, height = right - left, bottom - top

        if source == "above":
            # Lay dai ngay PHIA TREN vung can xoa (troi/co doi rat cham theo chieu doc).
            patch = out.crop((left, top - height, right, top))
        elif source == "left":
            patch = out.crop((left - width, top, left, bottom))
        else:
            patch = out.crop((right, top, right + width, bottom))

        out.paste(patch, (left, top))
    return out


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for scale in (2, 3):
        name = "home-0.webp" if scale == 2 else "home-0@3x.webp"
        source = ROOT / "public" / "slices" / name
        if not source.is_file():
            print(f"  Khong tim thay {source}")
            return 1

        image = Image.open(source).convert("RGB")
        cleaned = scrub(image, scale)
        target = OUT / f"home-hero@{scale}x.webp"
        cleaned.save(target, "WEBP", quality=82, method=6)
        print(f"  {target.relative_to(ROOT)}  {cleaned.width}x{cleaned.height}  "
              f"{target.stat().st_size / 1e6:.2f} MB")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
