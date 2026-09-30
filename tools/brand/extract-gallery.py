#!/usr/bin/env python3
"""
Tach dai anh "BỘ SƯU TẬP" tren trang Trai nghiem > Khoanh khac.

── Vi sao ──────────────────────────────────────────────────────────────────
Thiet ke ve chet mot dai ba tam anh: tam giua nam phang o giua, hai tam kia
le ra hai ben va bi canh canvas cat, kem mui ten "‹ ›". Y la mot bang chuyen —
khach muon no tu chay va bam vao tam nao thi tam do chay vao giua (30/09/2026).

Trang nay la TRANG CON: toan bo noi dung nam trong anh PNG, nen dai cung nam
trong anh va khong nhuc nhich duoc. Bo nay:
  1. Chep ba tam anh GOC tu bo tai nguyen.
  2. Xoa dai da ve chet khoi lat nen bang noi suy DOC (nen quanh do la navy
     phang nen khong de lai vet).

Hinh hoc do tu chinh ban thiet ke:
  - cho giua  x 282..1157, y 1802..2223
  - tam phai lo ra tu x 1210, tam trai het o x 236  ->  moi bac cach 890px
Anh nao vao cho nao thi do bang cach so tung tam voi vung tuong ung trong
lat nen (khong doan theo ten tep).

Chay: python3 tools/brand/extract-gallery.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _backdrop import feathered, rebuild_background  # noqa: E402
from asset_source import require as require_asset  # noqa: E402

OUT = ROOT / "public" / "gallery"
DATA = ROOT / "src" / "data" / "gallery.json"
SPEC = ROOT / "src" / "data" / "subpages" / "trai-nghiem__khoanh-khac.json"
SLICE_DIR = ROOT / "public" / "slices" / "sub"
STEM = "trai-nghiem__khoanh-khac"

CANVAS_WIDTH = 1440
PAGE = "trai-nghiem/khoanh-khac"
#: Cho GIUA — cac cho khac do component tu suy ra tu day.
#:
#: Do bang cach so tung diem anh voi mau nen navy (2,16,25), KHONG do theo do
#: sang: lan dau toi do theo do sang nen chi bat duoc phan sang cua tam anh
#: (1802..2223) thay vi ca tam (1761..2346). Vung xoa khi do lot vao trong tam,
#: hai dai moc noi suy roi dung vao chinh anh, va ca dai bi keo thanh vet doc.
#:
#: 875 x 585 dung bang ti le cua anh goc (1750x1170) — the giua khong cat anh.
CENTRE = {"x": 282, "y": 1761, "width": 875, "height": 585}
#: Khoang cach giua hai bac, tinh tu tam den tam.
#: Hai the ben nho con 0,88-0,92 lan the giua (do duoc 516,5 va 536 so voi
#: 585), khop voi muc thu nho 0,085 moi bac cua Coverflow. Voi ti le do thi
#: mep trong cua hai the roi vao 206,5 va 1218 — suy ra buoc 905.
STEP = 905
#: Dai da ve chet, can xoa. Noi rong 10px moi be cho bo tron va bong do.
SCRUB = {"x": 0, "y": 1743, "width": CANVAS_WIDTH, "height": 615}
ANCHOR = 10
FEATHER = 12

#: Thu tu o day la thu tu BAT DAU cua bang chuyen: tam dau nam giua, tam thu
#: hai le sang phai, tam thu ba le sang trai (xem offsetFrom trong
#: src/lib/coverflow.ts). Xep dung nhu vay thi luc nghi trang khop thiet ke.
PHOTOS = (
    ("song-tron-bien", "Chiếc xe bên bờ biển cùng tấm ván lướt sóng", "Rectangle 196"),
    ("song-tron-noi-that", "Khoảnh khắc trong khoang lái", "Rectangle 197"),
    ("song-tron-xe-co", "Chiếc xe cổ trong xưởng chăm sóc", "Rectangle 198"),
)
SOURCE_DIR = "1. Page_Trải nghiệm/1.3. Khoảnh khắc"


def export() -> list[dict]:
    OUT.mkdir(parents=True, exist_ok=True)
    out = []
    for slug, alt, name in PHOTOS:
        src = require_asset(f"{SOURCE_DIR}/{name}.png")
        image = Image.open(src).convert("RGB")
        path = OUT / f"{slug}.webp"
        image.save(path, "WEBP", quality=88, method=6)
        out.append(
            {
                "id": slug,
                "alt": alt,
                "src": f"/gallery/{slug}.webp",
                "width": image.width,
                "height": image.height,
            }
        )
        print(f"  {path.relative_to(ROOT)}  {image.width}x{image.height}")
    return out


def scrub() -> int:
    """
    Xoa dai ve san khoi lat nen.

    GHEP ca trang lai roi moi xoa, xong cat tra ve tung lat. Vung can xoa vat
    qua ranh gioi giua hai lat (bat dau o y 1792, ma lat moi bat dau o 1800),
    ma `rebuild_background` doi phai co dai moc o CA HAI phia trong CUNG mot
    anh — xoa tren tung lat rieng thi lat nao cung thieu mot phia.
    """
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    heights = [s["displayHeight"] for s in spec["slices"]]
    touched = 0

    for retina in (2, 3):
        paths = [
            SLICE_DIR / f"{STEM}-{i}@{retina}x.webp" for i in range(len(heights))
        ]
        for path in paths:
            if not path.is_file():
                raise SystemExit(f"Thieu lat nen: {path}")
        parts = [Image.open(p).convert("RGB") for p in paths]
        scale = parts[0].width / CANVAS_WIDTH

        tall = Image.new("RGB", (parts[0].width, sum(p.height for p in parts)))
        y = 0
        for part in parts:
            tall.paste(part, (0, y))
            y += part.height

        box = (
            max(0, round(SCRUB["x"] * scale)),
            round(SCRUB["y"] * scale),
            min(tall.width, round((SCRUB["x"] + SCRUB["width"]) * scale)),
            min(tall.height, round((SCRUB["y"] + SCRUB["height"]) * scale)),
        )
        patch = feathered(
            rebuild_background(tall, box, anchor=round(ANCHOR * scale)),
            round(FEATHER * scale),
        )
        # `feathered` lam mo ca BON canh. Dai nay chay het be ngang canvas, nen
        # hai canh trai/phai lai roi dung vao mep anh: o do mieng va trong
        # suot va tam anh cu lo ra mot soi. Tra lai do duc cho hai canh do —
        # chi giu mo o tren va duoi, la hai cho that su phai hoa vao nen.
        if box[0] <= 0 and box[2] >= tall.width:
            alpha = patch.getchannel("A")
            pixels = alpha.load()
            edge = round(FEATHER * scale) + 1
            for yy in range(patch.height):
                for xx in range(edge):
                    pixels[xx, yy] = pixels[edge, yy]
                    pixels[patch.width - 1 - xx, yy] = pixels[patch.width - 1 - edge, yy]
            patch.putalpha(alpha)
        tall.paste(patch, (box[0], box[1]), patch)

        y = 0
        for path, part in zip(paths, parts):
            tall.crop((0, y, tall.width, y + part.height)).save(
                path, "WEBP", quality=82, method=6
            )
            y += part.height
            touched += 1
    return touched


def main() -> int:
    photos = export()
    n = scrub()
    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Dai anh 'BỘ SƯU TẬP' tren trang Khoảnh khắc. Thiet ke ve chet "
                    "ba tam le ra hai ben; o day dai duoc dung lai bang anh goc de "
                    "no tu chay va bam vao tam nao thi tam do chay vao giua. "
                    "Xem tools/brand/extract-gallery.py va Coverflow.tsx."
                ),
                "page": PAGE,
                "centre": CENTRE,
                "step": STEP,
                "photos": photos,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  Da xoa dai ve san khoi {n} lat nen cua /{PAGE}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
