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

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from asset_source import require as require_asset  # noqa: E402

OUT = ROOT / "public" / "hero"

#: Be ngang he toa do canvas cua ban thiet ke.
CANVAS_WIDTH = 1440

#: Nam tam anh goc cho nam slide cua bang hero — deu SACH, khong mot chu nao.
#:
#: Truoc day bon slide sau la ANH TAM: chung lay thang lat nen cua bon trang
#: kia, nen mang theo ca chu, logo VA CA KHUNG DANH DAU MUC MENU cua trang do.
#: Nguoi dung thay hai cuc cung luc tren thanh menu — khach bao (30/09/2026).
#: Moi trang trong bo tai nguyen deu co san tam anh hero rieng, sach hoan toan.
CLEAN_PHOTOS = (
    ("hero-1", "0. Homepage/Rectangle 1.png"),
    ("hero-2", "1. Page_Trải nghiệm/Rectangle 1.png"),
    ("hero-3", "2. Page_Giải pháp/Rectangle 1.png"),
    ("hero-4", "3. Page_Công nghệ/Rectangle 1.png"),
    ("hero-5", "4. Page_Đại lý/Rectangle 1.png"),
)

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


def fit(photo: Image.Image, width: int, height: int) -> Image.Image:
    """Phong anh cho PHU KIN khung roi cat bot phan thua o hai ben.

    Anh goc rong hon khung mot chut (ti le 1,64 so voi 1,60). Phu kin roi cat
    thi khong phai chen them gi o day — chen la lo mot dai mau khac.

    RIENG tam cua trang chu thi KHONG lam vay: no trung khop 1:1 voi lat nen
    (da do: ti le 1, dich 0), va gate pixel doi trang chu lech 0. Phong to roi
    cat la ca tam anh xe dich — do duoc 53099 diem lech. Xem `place()`.
    """
    # Cat TREN CHINH ANH GOC truoc roi moi phong, chu khong phong truoc roi cat:
    # lam nguoc lai thi phep lam tron o moi ti le ra mot khung cat khac nhau,
    # va ban @2x se lech ban @3x (do duoc 14,5 — verify:retina bat duoc).
    want = width / height
    have = photo.width / photo.height
    if have > want:
        keep = round(photo.height * want)
        left = (photo.width - keep) // 2
        box = (left, 0, left + keep, photo.height)
    else:
        keep = round(photo.width / want)
        top = (photo.height - keep) // 2
        box = (0, top, photo.width, top + keep)
    return photo.crop(box).resize((width, height), Image.LANCZOS)


def place(photo: Image.Image, backdrop: Image.Image, exact: bool) -> Image.Image:
    """Dat tam anh vao khung.

    `exact` = dat 1:1 tu goc trai tren, phan thieu o DAY lay tu lat nen. Dung
    cho tam cua trang chu, noi phai lech 0 pixel so voi ban thiet ke.
    Cac tam khac thi phu kin khung roi cat — chung khong bi rang buoc pixel,
    va lay day tu lat nen cua TRANG CHU se lo mot dai anh la.
    """
    if exact:
        # Phong ANH GOC len dung be ngang khung roi dan tu goc trai tren. Anh
        # goc chi co mot ban @2x, nen khung @3x phai phong len — khong phong
        # thi nhanh nay khong chay va anh bi cat phu, lam ban @3x lech han ban
        # @2x (do duoc 42,9 — verify:retina bat duoc).
        if photo.width != backdrop.width:
            photo = photo.resize(
                (backdrop.width, round(photo.height * backdrop.width / photo.width)),
                Image.LANCZOS,
            )
        out = backdrop.copy()
        out.paste(photo, (0, 0))
        return out
    return fit(photo, backdrop.width, backdrop.height)


def chrome(
    backdrop: Image.Image, base: Image.Image, scale: int, alpha_at_2x: Image.Image | None
) -> tuple[list[tuple[Image.Image, tuple[int, int]]], Image.Image]:
    """Tach rieng LOGO va COT BIEU TUONG ra khoi nen, kem do trong suot.

    Khong the cat mot o vuong tu lat nen roi dan sang tam khac: o do mang theo
    ca mieng nen cua trang chu, dan len anh khac la lo mot mang mau la.

    Lat nen = tam anh goc + lop chrome ve de len. Nen lay HIEU cua hai cai do
    thi duoc chinh lop chrome, va do lech manh hay nhe chinh la do duc cua no.

    Do duc (`alpha`) duoc tinh MOT LAN o ti le 2 roi phong len cho ti le 3.
    Tinh rieng o tung ti le thi ban @3x sac net hon sinh ra mat na khac, va hai
    ban lech nhau — verify:retina bat duoc (do 15/255). Mau thi van lay tu lat
    nen cua dung ti le do, nen net khong mat.
    """
    out = []
    made: list[Image.Image] = []
    for index, (x0, y0, x1, y1) in enumerate(KEEP):
        box = (x0 * scale, y0 * scale, x1 * scale, y1 * scale)
        patch = backdrop.crop(box).convert("RGBA")

        if alpha_at_2x is None:
            over = np.asarray(backdrop.crop(box), dtype=np.int16)
            under = np.asarray(base.crop(box), dtype=np.int16)
            # Lech tren 90/255 thi coi la net dac; duoi do mo dan ve trong suot.
            strength = np.clip(np.abs(over - under).max(axis=2) / 90.0, 0.0, 1.0)
            alpha = Image.fromarray((strength * 255).astype(np.uint8))
        else:
            alpha = ALPHA_CACHE[index].resize(patch.size, Image.LANCZOS)

        made.append(alpha)
        patch.putalpha(alpha)
        out.append((patch, (box[0], box[1])))
    return out, made


#: Mat na do duc, tinh mot lan o ti le 2 roi dung lai cho ti le 3.
ALPHA_CACHE: list[Image.Image] = []


def build(name: str, source: str, scale: int) -> Image.Image:
    """Mot tam hero: anh goc sach + logo va cot bieu tuong dan lai tu lat nen."""
    slice_name = "home-0.webp" if scale == 2 else "home-0@3x.webp"
    slice_path = ROOT / "public" / "slices" / slice_name
    if not slice_path.is_file():
        raise SystemExit(f"Khong tim thay {slice_path}")
    backdrop = Image.open(slice_path).convert("RGB")

    home = place(
        Image.open(require_asset(CLEAN_PHOTOS[0][1])).convert("RGB"),
        backdrop,
        exact=True,
    )
    exact = name == CLEAN_PHOTOS[0][0]
    photo = Image.open(require_asset(source)).convert("RGB")
    out = place(photo, backdrop, exact=exact).convert("RGBA")

    if exact:
        # Tam cua trang chu: nen o vung chrome CHINH LA anh nay, nen dan dac
        # nguyen mieng tu lat nen. Ghep trong suot o day chi lam lech them so
        # voi ban thiet ke ma chang duoc gi.
        for x0, y0, x1, y1 in KEEP:
            box = (x0 * scale, y0 * scale, x1 * scale, y1 * scale)
            out.paste(backdrop.crop(box).convert("RGBA"), (box[0], box[1]))
        return scrub(out.convert("RGB"), scale)

    # Logo va cot bieu tuong la phan CHUNG cua bang hero, phai co tren MOI tam;
    # anh goc khong co chung va cung khong co phan tu that nao thay the.
    patches, made = chrome(
        backdrop, home, scale, None if not ALPHA_CACHE else ALPHA_CACHE[0]
    )
    if not ALPHA_CACHE:
        ALPHA_CACHE.extend(made)
    for patch, at in patches:
        out.alpha_composite(patch, at)

    return scrub(out.convert("RGB"), scale)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, source in CLEAN_PHOTOS:
        for scale in (2, 3):
            image = build(name, source, scale)
            target = OUT / f"{name}@{scale}x.webp"
            image.save(target, "WEBP", quality=82, method=6)
            print(f"  {target.relative_to(ROOT)}  {image.width}x{image.height}  "
                  f"{target.stat().st_size / 1e6:.2f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
