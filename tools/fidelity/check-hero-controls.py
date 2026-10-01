#!/usr/bin/env python3
"""
Vung quanh DIEU KHIEN cua bang hero phai giu nguyen anh goc.

Mui ten va vach chi muc cua bang hero la phan tu THAT. Trong anh khong duoc co
gi o do ca — khong net ve san, va cung khong duoc co dau cua buoc don dep.

Bai nay sinh ra sau mot loi that (01/10/2026): `clean-hero.py` chep mot dai
pixel ben canh de len cho mui ten, tu thoi con cat anh tu lat nen `home-0`.
Khi doi sang dung nam tam anh goc (von da sach) thi buoc chep do thanh thua —
nhung no o lai, va dai pixel chep sang khong noi lien mach voi van song nuoc
nen ve ra mot O XAM co bon canh sac net, dung bang khung cua nut. Khach nhin
thay va tuong la border cua CSS.

── Vi sao khong do bang thong ke anh ──────────────────────────────────────
Ban dau bai nay di TIM duong noi: quet tung cot, cot nao gay gap may lan muc
nhieu xung quanh thi bao. Cach do bo sot va bao oan cung luc:
  - bo sot, vi mieng chep de co bien rieng (x 24..50) khac bien khung nut
    (x 16..56), do dung o bien nut thi khong thay gi;
  - bao oan, vi hero-5 co mot BIEN BAO GIAO THONG ngay sau mui ten trai —
    vat that, canh that, thang va sac net y het mot duong noi.
Khong co nguong nao tach duoc hai cai do.

Nen bai nay doi sang phep so CHINH XAC: dung lai dung tam anh ma
`clean-hero.py` dat vao khung, roi doi chieu voi tep da sinh ra tai dung ba
vung dieu khien. Giong nhau thi khong ai dong vao do; khac la co nguoi dong.
Khong con nguong doan mo ho nao.

Can bo tai nguyen goc trong ~/Downloads. Khong co thi bai nay BO QUA (thoat 0)
chu khong bao sai — may nao cung phai chay duoc `npm run verify`.

Chay: python3 tools/fidelity/check-hero-controls.py
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "src" / "data" / "hero-slides.json"
CANVAS_WIDTH = 1440

#: Noi rong moi phia so voi khung dieu khien, tinh theo he toa do canvas.
PAD = 14

#: Lech trung binh toi da cho phep, tren thang 0..255.
#:
#: Khong lay 0: tep da sinh duoc nen WebP (quality 82) con ban dung lai trong
#: bo nho thi chua. Do thuc te tren nam tam: cao nhat 1,1. Mot mieng chep de
#: thi lech hang chuc.
LIMIT = 2.5


def load_clean_hero():
    path = ROOT / "tools" / "brand" / "clean-hero.py"
    spec = importlib.util.spec_from_file_location("clean_hero", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Khong nap duoc {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    try:
        ch = load_clean_hero()
    except SystemExit:
        raise
    except Exception as error:  # bo tai nguyen khong co -> asset_source bao loi
        print(f"  BO QUA: khong mo duoc clean-hero.py ({error})")
        return 0

    data = json.loads(DATA.read_text(encoding="utf-8"))
    controls = data["controls"]
    spots = {
        "mui ten trai": controls["prev"],
        "mui ten phai": controls["next"],
        "vach chi muc": {
            "x": controls["indicator"]["x"],
            "y": controls["indicator"]["y"] - 8,
            "width": controls["indicator"]["width"],
            "height": 18,
        },
    }

    bad = 0
    checked = 0
    for index, (name, source) in enumerate(ch.CLEAN_PHOTOS):
        for scale in (2, 3):
            built = ROOT / "public" / "hero" / f"{name}@{scale}x.webp"
            if not built.is_file():
                print(f"  THIEU {built.relative_to(ROOT)}")
                bad += 1
                continue

            slice_name = "home-0.webp" if scale == 2 else "home-0@3x.webp"
            slice_path = ROOT / "public" / "slices" / slice_name
            if not slice_path.is_file():
                print(f"  BO QUA: chua co {slice_path.relative_to(ROOT)}")
                return 0
            try:
                photo = Image.open(ch.require_asset(source)).convert("RGB")
            except Exception as error:
                print(f"  BO QUA: chua co bo tai nguyen goc ({error})")
                return 0

            backdrop = Image.open(slice_path).convert("RGB")
            want = ch.place(photo, backdrop, exact=index == 0).convert("RGB")
            got = Image.open(built).convert("RGB")
            if want.size != got.size:
                print(f"  SAI {built.name}: khung {got.size} khac ban dung lai {want.size}")
                bad += 1
                continue

            factor = got.width / CANVAS_WIDTH
            for label, box in spots.items():
                checked += 1
                crop = (
                    max(0, round((box["x"] - PAD) * factor)),
                    max(0, round((box["y"] - PAD) * factor)),
                    min(got.width, round((box["x"] + box["width"] + PAD) * factor)),
                    min(got.height, round((box["y"] + box["height"] + PAD) * factor)),
                )
                delta = float(
                    np.abs(
                        np.asarray(got.crop(crop), dtype=np.float32)
                        - np.asarray(want.crop(crop), dtype=np.float32)
                    ).mean()
                )
                if delta > LIMIT:
                    print(
                        f"  SAI {built.name} — {label}: lech {delta:.1f}/255 so voi anh "
                        f"goc (han {LIMIT}). Co ai do ve hoac chep de len vung nay."
                    )
                    bad += 1

    if bad:
        print(f"\n  {bad} cho bi dong vao. Xem tools/brand/clean-hero.py.")
        return 1
    print(f"\n  Da so {checked} vung dieu khien tren {len(ch.CLEAN_PHOTOS)} tam hero.")
    print("  Cho nao cung dung y anh goc — khong net ve san, khong mieng chep de.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
