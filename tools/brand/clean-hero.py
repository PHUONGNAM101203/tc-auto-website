#!/usr/bin/env python3
"""
Dung anh HERO cua trang chu tu TAM ANH GOC, khong lay tu lat nen.

── Vi sao doi cach lam ────────────────────────────────────────────────────
Truoc day anh hero duoc cat thang tu lat nen `home-0`, ma lat do NUONG SAN ca
doan chu gioi thieu ("DRIVE · EXPERIENCE · ELEVATE" va ba dong duoi no) —
trong khi chinh doan do cung la phan tu that de doc va chon duoc. Hai ban chong
khit nhau nen binh thuong khong ai thay; nhung luc phong web chua tai xong,
ban that duoc ve bang phong du phong co be ngang khac, the la chu hien BONG
DOI. Khach bao ba lan.

Nay lay thang tam anh goc trong bo tai nguyen ("Rectangle 1.png") — anh sach,
khong mot chu nao. Da doi chieu: no trung khop 1:1 voi lat nen, khong xe dich
mot pixel (do bang cach quet ti le 2880..3000 va dich +-90px, diem tot nhat
dung o ti le 1 va dich 0).

Nhung anh goc cung khong co LOGO va COT BIEU TUONG (CLARITY / PROTECTION /
COMFORT / CONFIDENCE) — hai thu do cung duoc ve chet vao thiet ke va khong co
phan tu that nao thay the. Nen chung duoc DAN LAI tu lat nen. Chi rieng khoi
chu la bo han.

Ba vung duoi day do bang cach so anh goc voi lat nen roi khoanh cac cho khac
nhau (nguong 40/255).

── Va van con phai xoa cac dieu khien ve san ──────────────────────────────
Bang hero gio co dieu khien THAT (bam duoc, chay theo slide, dung duoc bang ban
phim). Anh goc van co san vach chi muc va hai mui ten ve chet vao do — thanh ra
ve doi, va vach sang cua anh nen (vach thu 3) khong khop voi vach sang that.

Cach xoa: cac vung nay rat nho va nam tren nen troi/co muot, nen chi can chep
mot dai pixel ngay ben canh de len la khong con dau vet.

PHAI chay SAU tools/patch-retina-main.py: logo va cot bieu tuong duoc dan lai
TU LAT NEN, ma ban @3x cua lat do luc moi cat ra con nuong san chu — bo va kia
moi la cho don di. Chuoi `npm run parse:prototype` da xep dung thu tu nay.

Chay: python3 tools/brand/clean-hero.py
Ket qua: public/hero/home-hero@2x.webp va @3x.webp
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from asset_source import require as require_asset  # noqa: E402

OUT = ROOT / "public" / "hero"

#: Be ngang he toa do canvas cua ban thiet ke.
CANVAS_WIDTH = 1440

#: Tam anh goc, khong co chu nao.
CLEAN_PHOTO = "0. Homepage/Rectangle 1.png"

#: Hai vung PHAI dan lai tu lat nen — anh goc khong co chung, ma cung khong co
#: phan tu that nao thay the. Do bang cach so anh goc voi lat nen; noi rong
#: them vai pixel cho chac.
KEEP = (
    (78, 30, 236, 78),      # logo TC AUTO SOLUTIONS
    (1184, 495, 1364, 744),  # cot CLARITY / PROTECTION / COMFORT / CONFIDENCE
)

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


def build(scale: int) -> Image.Image:
    """Anh hero o mot ti le: anh goc sach + logo va cot bieu tuong dan lai."""
    name = "home-0.webp" if scale == 2 else "home-0@3x.webp"
    slice_path = ROOT / "public" / "slices" / name
    if not slice_path.is_file():
        raise SystemExit(f"Khong tim thay {slice_path}")
    backdrop = Image.open(slice_path).convert("RGB")

    photo = Image.open(require_asset(CLEAN_PHOTO)).convert("RGB")
    if photo.width != CANVAS_WIDTH * 2:
        photo = photo.resize(
            (CANVAS_WIDTH * 2, round(photo.height * CANVAS_WIDTH * 2 / photo.width)),
            Image.LANCZOS,
        )
    if scale != 2:
        photo = photo.resize(
            (CANVAS_WIDTH * scale, round(photo.height * scale / 2)), Image.LANCZOS
        )

    # Anh goc thap hon lat nen mot chut (1760 so voi 1800 o @2x): phan thieu o
    # DAY lay tu lat nen — cho do khong co chu nao, chi la vung toi dan.
    out = backdrop.copy()
    out.paste(photo, (0, 0))

    for x0, y0, x1, y1 in KEEP:
        box = (x0 * scale, y0 * scale, x1 * scale, y1 * scale)
        out.paste(backdrop.crop(box), (box[0], box[1]))

    return scrub(out, scale)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for scale in (2, 3):
        image = build(scale)
        target = OUT / f"home-hero@{scale}x.webp"
        image.save(target, "WEBP", quality=82, method=6)
        print(f"  {target.relative_to(ROOT)}  {image.width}x{image.height}  "
              f"{target.stat().st_size / 1e6:.2f} MB")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
