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

#: Be ngang he toa do canvas cua ban thiet ke.
CANVAS_WIDTH = 1440
#: Dai HEADER: luon lay tu @2x, khong hoi mat na.
#:
#: Mat na suy tu chenh lech co mot lo: o tim kiem cua ban thiet ke la mot khung
#: vien sang 1px cong dong chu xam nhat, nam tren dai chuyen mau rat muot. Thu
#: nho 4 lan roi lam mo di thi chenh lech tut xuong duoi nguong 18, nen mat na
#: bo qua — ban @3x giu lai o tim kiem ve san, va tren man retina rong chu
#: "Nhập để tìm kiếm..." hien HAI LAN (khach bao 30/09/2026, anh 63).
#:
#: Khong chua nguong xuong: ha nguong la mat na an ca vao vung anh that, mat
#: do net @3x o nhung cho dang ra phai giu. Thay vao do noi thang: tren 6 trang
#: chinh, CA DAI HEADER deu la phan tu that ve de len, nen nen o do BAT BUOC
#: phai trong. Vung nay von la nen phang/chuyen mau nen lay tu @2x phong to
#: khong mat chi tiet gi.
#:
#: Chua logo (x 78..314) — logo duoc ve chet o ca hai ban va giong het nhau.
HEADER_BAND = {"x": 400, "y": 18, "width": 980, "height": 78}

#: Dai FORM LIEN HE: cung ly do nhu HEADER_BAND, luon lay tu @2x.
#:
#: O nhap cua ban thiet ke cung la khung vien 1px cong chu goi y xam nhat tren
#: nen phang — y het o tim kiem. Chenh lech tut xuong duoi nguong 18 nen mat na
#: bo qua, va ban @3x giu nguyen ca khung lan chu goi y ve san. Tren man retina
#: rong, chu goi y hien HAI LAN, lech nhau vai pixel: khach bao 02/10/2026,
#: "tại sao chỗ này lại bị đè lên như này".
#:
#: Te hon ca o tim kiem: o day mat na bat duoc MOT PHAN (vai chu dam hon
#: nguong) nen chu ve san bi xoa lo cho, con lai nhung manh roi rac — nhin ra
#: chu nhoe chu khong ra chu doi.
#:
#: Toa do `x`/`width` lay tu `.ff` trong canvas.css; `y` thi khac nhau tung
#: trang nen doc tu `contactForm.y` cua page spec.
FORM_BAND = {"x": 726, "width": 390, "height": 100, "padTop": 6}


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


def form_band(slug: str) -> dict | None:
    """Dai form lien he cua mot trang, theo he toa do canvas."""
    spec_path = ROOT / "src" / "data" / "pages" / f"{slug}.json"
    if not spec_path.is_file():
        return None
    form = json.loads(spec_path.read_text(encoding="utf-8")).get("contactForm")
    if not form or "y" not in form:
        return None
    return {
        "x": FORM_BAND["x"],
        "y": form["y"] - FORM_BAND["padTop"],
        "width": FORM_BAND["width"],
        "height": FORM_BAND["height"],
    }


def header_forced(name: Path, size: tuple[int, int]) -> Image.Image | None:
    """
    Mat na ep buoc cho dai header, hoac None neu anh nay khong chua header.

    Chi ap cho anh nam o DAU trang: lat dau tien cua 6 trang chinh va cac anh
    hero (deu bat dau tu y = 0 cua he toa do canvas).

    `name` la duong dan cua ban @2x (xem `pairs()`), nen lat dau tien co ten
    `slices/<slug>-0.webp` chu khong phai `...-0@3x.webp`. Lan dau viet ham nay
    toi doi hau to `@3x` o day va dieu kien khong bao gio dung — o tim kiem ve
    san van nam nguyen trong anh.
    """
    parts = name.parts
    stem = name.stem.removesuffix("@2x")
    scale = size[0] / CANVAS_WIDTH
    boxes: list[tuple[int, int, int, int]] = []

    at_top = (parts[0] == "slices" and stem.endswith("-0")) or parts[0] == "hero"
    if at_top:
        boxes.append((
            round(HEADER_BAND["x"] * scale),
            round(HEADER_BAND["y"] * scale),
            round((HEADER_BAND["x"] + HEADER_BAND["width"]) * scale),
            round((HEADER_BAND["y"] + HEADER_BAND["height"]) * scale),
        ))

    # Form lien he nam o lat NAO cung duoc — phai suy tu do cao cua lat.
    if parts[0] == "slices" and "-" in stem:
        slug, _, index = stem.rpartition("-")
        band = form_band(slug) if index.isdigit() else None
        if band:
            top = slice_top(slug, int(index))
            if top is not None:
                local = band["y"] - top
                boxes.append((
                    round(band["x"] * scale),
                    round(local * scale),
                    round((band["x"] + band["width"]) * scale),
                    round((local + band["height"]) * scale),
                ))

    inside = [
        box for box in boxes if box[3] > 0 and box[1] < size[1]
    ]
    if not inside:
        return None

    mask = Image.new("L", size, 0)
    for box in inside:
        mask.paste(255, (box[0], max(0, box[1]), box[2], min(size[1], box[3])))
    # Mo mep de khong lo ranh gioi giua vung lay tu @2x va vung giu @3x.
    return mask.filter(ImageFilter.GaussianBlur(FEATHER))


def slice_top(slug: str, index: int) -> float | None:
    """Do cao cua lat thu `index` tren he toa do canvas."""
    spec_path = ROOT / "src" / "data" / "pages" / f"{slug}.json"
    if not spec_path.is_file():
        return None
    slices = json.loads(spec_path.read_text(encoding="utf-8"))["slices"]
    return slices[index]["y"] if index < len(slices) else None


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
        forced = header_forced(name, base.size)
        if forced is not None:
            mask = (
                forced
                if mask is None
                else Image.fromarray(
                    np.maximum(
                        np.asarray(mask, dtype=np.uint8),
                        np.asarray(forced, dtype=np.uint8),
                    )
                )
            )
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
