#!/usr/bin/env python3
"""
Ban HEP cua anh hero, danh rieng cho dien thoai.

Bang hero tren dien thoai hien anh o be ngang khoang 350px; nhan voi mat do
diem anh 2 la can 700px. Nhung ban @2x rong 2880px — gap BON lan muc can, va
moi tam nang 0,10 den 0,22 MB. Do duoc tren trang chu ban dien thoai: hai tam
hero chiem gan nua tong luong tai.

Sinh ban 720px de dat cho khai `srcset`; trinh duyet tu chon. Khong dung lai
ban nay cho may ban: o do anh rong het canvas 1440px, lay ban 720 la mo han.

── Cat NGANG chu khong thu nho ca tam ───────────────────────────────────
Khung hero tren dien thoai cao hon rong (ti le 680/907), con anh goc thi
rong hon cao (1440/900). Thu nho ca tam roi de trinh duyet cat bang
`object-fit: cover` nghia la van tai phan hai ben se bi cat bo. Cat san o day
thi tep nho hon va khong mat gi — phan bi cat von khong ai nhin thay.

Chay: python3 tools/brand/make-mobile-hero.py
Vi tri trong chuoi: SAU `clean-hero.py` (anh hero phai dung xong truoc).
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
HERO = ROOT / "public" / "hero"
DATA = ROOT / "src" / "data" / "hero-slides.json"

#: Be ngang ban cho dien thoai. 720 = 360px CSS o mat do 2 — phu het cac may
#: pho bien (iPhone 390, Pixel 412 deu duoi muc nay sau khi tru le trang).
WIDTH = 720

#: Ti le khung tren dien thoai, lay tu `ratio` cua MobileCarousel.
RATIO_W, RATIO_H = 680, 907


def build(source: Path) -> Image.Image:
    photo = Image.open(source).convert("RGB")
    want = RATIO_W / RATIO_H
    have = photo.width / photo.height

    # Cat cho dung ti le khung TRUOC khi thu nho — xem ghi chu o dau tep.
    if have > want:
        keep = round(photo.height * want)
        left = (photo.width - keep) // 2
        box = (left, 0, left + keep, photo.height)
    else:
        keep = round(photo.width / want)
        top = (photo.height - keep) // 2
        box = (0, top, photo.width, top + keep)

    cropped = photo.crop(box)
    height = round(WIDTH * RATIO_H / RATIO_W)
    return cropped.resize((WIDTH, height), Image.LANCZOS)


def main() -> int:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    total_before = total_after = 0

    for slide in data["slides"]:
        stem = slide["src"].split("?")[0].rsplit("/", 1)[-1].replace("@2x.webp", "")
        source = HERO / f"{stem}@2x.webp"
        if not source.is_file():
            raise SystemExit(f"Khong tim thay {source}")

        target = HERO / f"{stem}@m.webp"
        build(source).save(target, "WEBP", quality=80, method=6)

        # Khai duong dan vao chinh tep du lieu, KHONG suy ra o phia ma nguon.
        # Suy ra thi dau `?v=` se mang ma bam cua ban @2x: tep @m doi ma dia
        # chi khong doi, ma /hero duoc phuc vu `immutable` — trinh duyet se
        # giu ban cu vinh vien. Dung cai bay da gap hoi thang 9. Khai o day thi
        # `stamp-slices.py` tu dong dau dung, va `check-asset-stamps.py` canh
        # cho no khong lech.
        slide["mobileSrc"] = f"/hero/{stem}@m.webp"

        total_before += source.stat().st_size
        total_after += target.stat().st_size
        print(f"  {target.relative_to(ROOT)}  {WIDTH}px  "
              f"{target.stat().st_size / 1e3:.0f} KB "
              f"(ban @2x: {source.stat().st_size / 1e3:.0f} KB)")

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n  Nam tam: {total_before / 1e6:.2f} MB -> {total_after / 1e6:.2f} MB "
          f"({100 - total_after * 100 / total_before:.0f}% nhe hon)")
    print("  Da khai `mobileSrc` vao src/data/hero-slides.json.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
