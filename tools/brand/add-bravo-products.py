#!/usr/bin/env python3
"""
Bien ba dong Bravo thanh TRANG SAN PHAM that, dung nhu chin dong Winca.

Truoc day Bravo co mot trang rieng `/giai-phap/man-hinh/bravo` liet ke ca ba
dong. Khach yeu cau bo trang do (02/10/2026): Bravo chi la mot TAB cua trang
"Màn hình ô tô", va bam vao mot dong thi phai den dung trang cua dong do —
"dẫn tới chỗ hợp lý".

Noi dung nam o `src/data/bravo-models.json` (viet tay, co nguon tung muc). Bo
nay chi NOI no vao hai tep dan xuat:
  - products.json      -> de co trang `/giai-phap/man-hinh/<slug>`
  - product-specs.json -> de trang do co bang thong so

── Vi sao phai la mot bo, khong sua tay ───────────────────────────────────
`products.json` do `extract-products.py` sinh ra tu anh thiet ke. Them tay vao
do thi lan chay `npm run parse:cta` sau se xoa sach. Bo nay chay NGAY SAU bo
kia trong cung chuoi.

── Truong `brand` ────────────────────────────────────────────────────────
Ba dong Bravo cung category `giai-phap/man-hinh` voi Winca (chung deu la man
hinh o to, va deu thuoc trang do). Nhung luoi cua tab Winca thi KHONG duoc co
chung. Nen moi san pham nay mang `brand`; cho nao can tach thi loc theo do.
Cac san pham cu khong co truong nay — mac dinh coi la Winca.

Chay: python3 tools/brand/add-bravo-products.py
Vi tri trong chuoi: trong `parse:cta`, NGAY SAU `extract-products.py`.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
MODELS = ROOT / "src" / "data" / "bravo-models.json"
PRODUCTS = ROOT / "src" / "data" / "products.json"
SPECS = ROOT / "src" / "data" / "product-specs.json"
PUBLIC = ROOT / "public"

CATEGORY = "giai-phap/man-hinh"
BRAND = "Bravo"


def main() -> int:
    models = json.loads(MODELS.read_text(encoding="utf-8"))
    products = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    specs = json.loads(SPECS.read_text(encoding="utf-8"))

    # Xoa ban cu truoc khi them lai, de chay hai lan khong sinh trung.
    products["products"] = [
        item for item in products["products"] if item.get("brand") != BRAND
    ]
    highest = max(
        (item["order"] for item in products["products"] if item["category"] == CATEGORY),
        default=0,
    )

    for offset, model in enumerate(models["models"], start=1):
        raw = model["image"].split("?")[0].lstrip("/")
        path = PUBLIC / raw
        if not path.is_file():
            raise SystemExit(f"Khong tim thay {path}")
        with Image.open(path) as image:
            width, height = image.size

        products["products"].append({
            "slug": model["slug"],
            "route": f"/{CATEGORY}/{model['slug']}",
            "category": CATEGORY,
            "brand": BRAND,
            "name": model["name"],
            "description": model["tagline"],
            "image": f"/{raw}",
            "imageWidth": width,
            "imageHeight": height,
            "order": highest + offset,
        })

        specs["products"][model["slug"]] = {
            "source": model.get("imageSource") or models.get("source", ""),
            "specs": model["specs"],
        }

    PRODUCTS.write_text(
        json.dumps(products, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    SPECS.write_text(
        json.dumps(specs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"  Da them {len(models['models'])} dong Bravo vao products.json "
          f"va product-specs.json.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
