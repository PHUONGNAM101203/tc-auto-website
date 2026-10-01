#!/usr/bin/env python3
"""
Tach dai anh "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" o cuoi trang Giai phap.

── Vi sao ──────────────────────────────────────────────────────────────────
Thiet ke ve chet mot dai nam tam anh: tam giua nam phang o giua, bon tam kia
nghieng dan ra hai ben va bi canh canvas cat. Y la mot bang chuyen — khach muon
bam vao tam nao thi tam do chay vao giua.

Muon lam duoc vay thi dai phai la phan tu that. Bo nay:
  1. Chep bon tam anh GOC (phang, chua bi lam nghieng) tu bo tai nguyen.
  2. To trang de xoa dai da ve chet khoi lat nen — nen quanh do la TRANG THUAN
     (da do: 255,255,255 o ca ba phia), nen chi can to lai.

Hinh hoc do tu chinh ban thiet ke: dai nam o y 5424..5704, nam cho lan luot o
x 0..100 / 112..492 / 503..919 / 929..1310 / 1322..1440 — cho giua rong hon,
hai cho ngoai cung bi canh canvas cat.

Bo nay PHAI nam trong chuoi `npm run parse:prototype`. Truoc day no chi duoc
chay tay mot lan: lan chay lai chuoi sau do sinh lai lat nen tu dau va dai ve
chet quay tro lai, nam ngay duoi dai that — khach thay "các hình ảnh cứng ở
phía sau" (01/10/2026). Gate so pixel khong bat duoc vi chinh vung do da duoc
khai la ngoai le trong design-deviations.ts.

Chay: python3 tools/brand/extract-projects.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from asset_source import require as require_asset  # noqa: E402

OUT = ROOT / "public" / "projects"
DATA = ROOT / "src" / "data" / "projects.json"
SPEC = ROOT / "src" / "data" / "pages" / "giai-phap.json"
SLICE_DIR = ROOT / "public" / "slices"

CANVAS_WIDTH = 1440
#: Dai da ve chet, can to trang de len.
#: Do do that cua dai ve chet: 5418..5709 (do bang do lech khoi mau nen navy,
#: nguong 4/255 — nguong 10 la qua chat, con sot 2 vach mo o 5417 va 5708 ma
#: khach da chi ra). Noi them 6px moi dau cho chac.
SCRUB = (0, 5412, CANVAS_WIDTH, 304)
#: Cho GIUA — cac cho khac do component tu suy ra tu day.
CENTRE = {"x": 503, "y": 5424, "width": 416, "height": 280}

#: Bon tam anh goc, con PHANG (chua bi lam nghieng nhu trong thiet ke).
PHOTOS = (
    ("le-ky-ket-thanh-tien-auto", "Lễ ký kết đại lý phân phối 3M AutoFilm — Thành Tiến Auto"),
    ("le-ky-ket-toyota-phu-tai-duc", "Lễ ký kết đại lý phân phối 3M AutoFilm — Toyota Phú Tài Đức"),
    ("le-ky-ket-otua-thanh-nien", "Lễ ký kết đại lý phân phối 3M AutoFilm — OTUA Thanh Niên"),
    ("le-ky-ket-tan-nat", "Lễ ký kết đại lý phân phối 3M AutoFilm — Tân Nát"),
)
SOURCES = (
    "2. Page_Giải pháp/2.5. Các dự án đã triển khai/Rectangle 128.png",
    "2. Page_Giải pháp/2.5. Các dự án đã triển khai/Rectangle 183.png",
    "2. Page_Giải pháp/2.5. Các dự án đã triển khai/Rectangle 185.png",
    "2. Page_Giải pháp/2.5. Các dự án đã triển khai/Rectangle 188.png",
)


def export() -> list[dict]:
    OUT.mkdir(parents=True, exist_ok=True)
    out = []
    for (slug, alt), source in zip(PHOTOS, SOURCES):
        art = Image.open(require_asset(source)).convert("RGB")
        target = OUT / f"{slug}.webp"
        art.save(target, "WEBP", quality=88, method=6)
        out.append(
            {
                "id": slug,
                "alt": alt,
                "src": f"/projects/{slug}.webp",
                "width": art.width,
                "height": art.height,
            }
        )
        print(f"  {target.relative_to(ROOT)}  {art.width}x{art.height}  "
              f"{target.stat().st_size / 1e3:.0f} KB")
    return out


def scrub() -> int:
    """To trang de xoa dai ve chet khoi lat nen — o CA HAI ti le."""
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    x, y, w, h = SCRUB
    touched = 0
    for retina in (2, 3):
        for index, slice_spec in enumerate(spec["slices"]):
            top = slice_spec["y"]
            bottom = top + slice_spec["displayHeight"]
            if y + h <= top or y >= bottom:
                continue
            suffix = "" if retina == 2 else "@3x"
            path = SLICE_DIR / f"giai-phap-{index}{suffix}.webp"
            if not path.is_file():
                raise SystemExit(f"Thieu lat nen: {path}")
            image = Image.open(path).convert("RGB")
            scale = image.width / CANVAS_WIDTH
            image.paste(
                (255, 255, 255),
                (
                    round(x * scale),
                    round((max(y, top) - top) * scale),
                    round((x + w) * scale),
                    round((min(y + h, bottom) - top) * scale),
                ),
            )
            image.save(path, "WEBP", quality=82, method=6)
            touched += 1
    return touched


def main() -> int:
    photos = export()
    n = scrub()
    print(f"  Da xoa dai khoi {n} lat nen cua /giai-phap.")
    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Dai anh 'CÁC DỰ ÁN ĐÃ TRIỂN KHAI' o cuoi trang Giai phap. "
                    "Thiet ke ve chet mot dai nam tam nghieng dan ra hai ben; o day "
                    "dai duoc dung lai bang bon tam anh GOC con phang, de bam vao "
                    "tam nao thi tam do chay vao giua. "
                    "Xem tools/brand/extract-projects.py va ProjectCoverflow.tsx."
                ),
                "page": "giai-phap",
                "centre": CENTRE,
                "photos": photos,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  {DATA.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
