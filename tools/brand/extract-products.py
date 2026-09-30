#!/usr/bin/env python3
"""
Tach cac THE SAN PHAM tren cac trang danh muc Giai phap, de moi san pham co mot
trang chi tiet rieng.

── Vi sao co bo nay ────────────────────────────────────────────────────────
Moi the deu co nut "XEM THÊM", nhung bo thiet ke KHONG ve trang chi tiet cho
san pham nao — ca bo chi co dung MOT trang mau la "3M Ceramic Elite IM". Khach
da duyet (29/09/2026): dung trang cho tung san pham theo mach cua trang mau do;
sau nay co thiet ke rieng thi lam lai theo thiet ke.

── Chi lay nhung gi CO THAT trong thiet ke ────────────────────────────────
  - ANH: cat thang tu frame @3x.
  - TEN va MO TA: doc tu lop chu OCR cua chinh frame.
Khong them mot chu nao. The nao thiet ke con de trong ("5DO ...", "Loa ...")
thi BO QUA — chua co san pham that de lam trang.

── Hinh hoc ───────────────────────────────────────────────────────────────
Da thu cho bo tu do khung anh: khong on: anh the co vung toi giong mau nen nen
phep quet cat hut, ra anh cao 307px thay vi 624px va nhat ca dong mo ta lam ten.
Nen khung anh duoc DO SAN cho tung hang, ghi thang o `ROWS` ben duoi.

Hai thu van tu suy ra, vi chung on dinh:
  - Cot the: lay tu NUT DO da do duoc (`detected-buttons.json`), lui sang trai
    CARD_DX. Nut do la thu do duoc chac chan nhat tren ca ba trang.
  - Dai chu: tinh theo NUT chu khong theo day anh. Do tren ca bon hang co that:
    ten nam o nut-137..nut-131, mo ta bat dau o nut-93 — rat deu, trong khi
    khoang cach tu day anh xuong ten thi moi trang mot khac (17px den 47px).

Chay: python3 tools/brand/extract-products.py
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from manifest_source import load, sub_root  # noqa: E402

MANIFEST = ROOT / "tools" / "subpage-manifest.json"
TEXT = ROOT / "src" / "data" / "subpage-text.json"
BUTTONS = ROOT / "src" / "data" / "detected-buttons.json"
INDEX = ROOT / "src" / "data" / "subpages" / "index.json"
OUT = ROOT / "public" / "products"
DATA = ROOT / "src" / "data" / "products.json"

CATEGORIES = [
    {
        "slug": "giai-phap/man-hinh",
        "label": "MÀN HÌNH Ô TÔ",
        "title": "Màn hình ô tô",
        "parent": "/giai-phap",
        "parentLabel": "Giải pháp",
        # (nut y, anh y, anh cao)
        "rows": ((1498, 1111, 207), (2028, 1641, 209), (2558, 2171, 207)),
    },
    {
        "slug": "giai-phap/phim-dan-kinh",
        "label": "PHIM DÁN KÍNH",
        "title": "Phim dán kính",
        "parent": "/giai-phap",
        "parentLabel": "Giải pháp",
        # Hang thu ba con de trong trong thiet ke ("5DO ..."), nen khong co o day.
        "rows": ((1488, 1104, 230), (2175, 1788, 235)),
    },
    {
        "slug": "giai-phap/ppf",
        "label": "PPF",
        "title": "PPF",
        "parent": "/giai-phap",
        "parentLabel": "Giải pháp",
        # Hang dau la DAI THE TRUOT (xem PpfCarousel — da co du lieu rieng trong
        # src/data/ppf-cards.json, va hai trong bon the bi canh canvas cat).
        # Hang ba con de trong. Chi hang hai la the tinh co ten that.
        "rows": ((2176, 1789, 232),),
    },
]

#: Mep trai the so voi mep trai nut do. Nut rong 159 nam giua the rong 354.
CARD_DX = 167
CARD_WIDTH = 354
#: Dai chu, tinh NGUOC tu nut.
NAME_BAND = (-150, -110)
BODY_BAND = (-110, -20)
#: Dong chu phai nam trong be ngang the moi tinh la cua the do.
INSIDE = 30
#: Hai nut cung mot hang khi lech nhau duoi muc nay.
ROW_TOLERANCE = 30
#: Ten giong tieu de mot trang thiet ke da ve san toi muc nay thi bo qua —
#: trang do da co that roi, dung dung them ban do ta soan.
DESIGNED_SIMILARITY = 0.78

CTA = re.compile(
    r"^\s*(XEM\s*TH[EÊẼ]M|XEM\s*CHI\s*TI[EÊ]T|T[IÌ]M\s*HI[EÊỀ]U\s*TH[EÊ]M)\s*$",
    re.IGNORECASE,
)
#: OCR doc nham vai chu La-tinh thanh chu Ki-rin trong cac ten nhu "3M".
CYRILLIC = str.maketrans({"З": "3", "М": "M", "С": "C", "Е": "E", "А": "A", "Р": "P", "О": "O"})


def clean(name: str) -> str:
    return " ".join(name.translate(CYRILLIC).split())


def is_placeholder(name: str) -> bool:
    """The thiet ke con de trong: ten chi la ten hang kem dau ba cham."""
    return name.endswith("...") or name.endswith("…") or len(name) < 4


def slugify(name: str) -> str:
    text = unicodedata.normalize("NFD", name.lower())
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.replace("đ", "d").replace("+", "-plus")
    slug = "".join(ch if ch.isalnum() else "-" for ch in text)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


def lines_in(blocks, x0, x1, y0, y1):
    return sorted(
        (
            b
            for b in blocks
            if y0 <= b["y"] < y1
            and b["x"] >= x0 - INSIDE
            and b["x"] + b["w"] <= x1 + INSIDE
            and len(b["text"].strip()) > 1
        ),
        key=lambda b: b["y"],
    )


def row_buttons(rects, y: float):
    return sorted(
        (r for r in rects if abs(r["y"] - y) <= ROW_TOLERANCE), key=lambda r: r["x"]
    )


def main() -> int:
    manifest = load(MANIFEST)
    text = json.loads(TEXT.read_text(encoding="utf-8"))
    buttons = json.loads(BUTTONS.read_text(encoding="utf-8"))
    designed = json.loads(INDEX.read_text(encoding="utf-8"))

    OUT.mkdir(parents=True, exist_ok=True)
    categories, products = [], []
    seen: set[str] = set()

    for config in CATEGORIES:
        slug = config["slug"]
        entry = next(p for p in manifest["pages"] if p["slug"] == slug)
        frame = Image.open(sub_root(manifest) / entry["dir"] / entry["file"]).convert("RGB")
        scale = frame.width // 1440
        blocks = text[slug]["blocks"]
        rects = buttons.get(slug, [])
        # Tieu de cac trang thiet ke DA VE SAN trong chinh danh muc nay.
        drawn = [row["title"] for row in designed if row["route"].startswith(f"/{slug}/")]
        kept = 0

        for button_y, photo_y, photo_h in config["rows"]:
            for rect in row_buttons(rects, button_y):
                left = rect["x"] - CARD_DX
                right = left + CARD_WIDTH

                names = lines_in(
                    blocks, left, right, rect["y"] + NAME_BAND[0], rect["y"] + NAME_BAND[1]
                )
                if not names:
                    print(f"  BO QUA {slug} nut x={rect['x']} y={rect['y']}: khong doc duoc ten")
                    continue
                name = clean(names[0]["text"])
                if is_placeholder(name):
                    print(f"  BO QUA {slug}: '{name}' — thiet ke con de trong")
                    continue

                near = max(
                    (SequenceMatcher(None, name.lower(), t.lower()).ratio() for t in drawn),
                    default=0.0,
                )
                if near >= DESIGNED_SIMILARITY:
                    print(f"  BO QUA '{name}': thiet ke da ve san trang rieng")
                    continue

                slug_name = slugify(name)
                route = f"/{slug}/{slug_name}"
                if route in seen:
                    print(f"  BO QUA '{name}': trung duong dan {route}")
                    continue
                seen.add(route)

                body = lines_in(
                    blocks, left, right, rect["y"] + BODY_BAND[0], rect["y"] + BODY_BAND[1]
                )
                description = " ".join(
                    clean(b["text"]) for b in body if not CTA.match(b["text"].strip())
                ).strip()

                art = frame.crop(
                    (
                        round(left * scale),
                        round(photo_y * scale),
                        round(right * scale),
                        round((photo_y + photo_h) * scale),
                    )
                )
                target = OUT / f"{slug_name}.webp"
                art.save(target, "WEBP", quality=88, method=6)

                products.append(
                    {
                        "slug": slug_name,
                        "route": route,
                        "category": slug,
                        "name": name,
                        "description": description,
                        "image": f"/products/{slug_name}.webp",
                        "imageWidth": art.width,
                        "imageHeight": art.height,
                        "order": len(products),
                        "cta": {
                            "x": round(rect["x"], 1),
                            "y": round(rect["y"], 1),
                            "w": round(rect["w"], 1),
                            "h": round(rect["h"], 1),
                        },
                    }
                )
                kept += 1
                print(f"  {target.relative_to(ROOT)}  {art.width}x{art.height}  {name}")

        categories.append({k: v for k, v in config.items() if k != "rows"})
        print(f"  -> {slug}: {kept} san pham\n")

    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "San pham tren cac trang danh muc Giai phap, tach tu chinh frame "
                    "thiet ke bang tools/brand/extract-products.py. Ten va mo ta doc tu "
                    "lop chu OCR — KHONG them chu nao. The nao thiet ke con de trong thi "
                    "bo qua. Thong so ky thuat khong co trong thiet ke nen trang chi tiet "
                    "noi thang la dang cho TC Auto cung cap."
                ),
                "categories": categories,
                "products": products,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  {DATA.relative_to(ROOT)} — {len(products)} san pham")
    return 0 if products else 1


if __name__ == "__main__":
    sys.exit(main())
