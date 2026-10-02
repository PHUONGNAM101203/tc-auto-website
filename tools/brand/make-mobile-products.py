#!/usr/bin/env python3
"""
Ban HEP cua anh san pham, danh cho luoi hai cot tren dien thoai.

Tren may ban, cac the san pham duoc VE CHET trong anh nen — trinh duyet khong
tai rieng tam nao. Tren dien thoai thi khong co canvas, nen ban mobile dung
lai luoi bang anh that; o luoi hai cot moi o chi rong 169px, nhan mat do diem
anh 2 la can 338px. Ma anh goc rong 1062px — gap ba lan.

Do duoc tren trang "Màn hình ô tô": dien thoai tai 1,31 MB con may ban chi
0,95 MB, nguoc doi, va chenh lech gan nhu dung bang chin tam anh nay.

Sinh ban 360px de dat canh ban goc trong `srcset`; trinh duyet tu chon. Trang
chi tiet san pham van dung ban goc — o do anh hien to han.

Chay: python3 tools/brand/make-mobile-products.py
Vi tri trong chuoi: trong `parse:cta`, SAU `extract-products.py`.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "src" / "data" / "products.json"
PUBLIC = ROOT / "public"

#: Be ngang ban hep. 360 = 180px CSS o mat do 2, du cho o luoi rong 169px.
WIDTH = 360


def main() -> int:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    before = after = 0
    made = 0

    for product in data["products"]:
        raw = product["image"].split("?")[0].lstrip("/")
        source = PUBLIC / raw
        if not source.is_file():
            raise SystemExit(f"Khong tim thay {source}")

        image = Image.open(source).convert("RGB")
        if image.width <= WIDTH:
            # Da du nho roi thi khong sinh ban hep — them mot tep chi de nang
            # them mot luot tai.
            product.pop("mobileImage", None)
            continue

        target = source.with_name(source.stem + "@m.webp")
        height = round(image.height * WIDTH / image.width)
        image.resize((WIDTH, height), Image.LANCZOS).save(
            target, "WEBP", quality=80, method=6
        )

        # Khai duong dan vao chinh tep du lieu, KHONG suy ra o phia ma nguon:
        # suy ra thi dau `?v=` mang ma bam cua ban goc, tep @m doi ma dia chi
        # khong doi, ma /products duoc phuc vu `immutable`. Khai o day thi
        # `stamp-slices.py` dong dau dung va `check-asset-stamps.py` canh cho.
        product["mobileImage"] = "/" + str(target.relative_to(PUBLIC))

        before += source.stat().st_size
        after += target.stat().st_size
        made += 1

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if made:
        print(f"  {made} anh san pham co ban hep {WIDTH}px: "
              f"{before / 1e6:.2f} MB -> {after / 1e6:.2f} MB "
              f"({100 - after * 100 / before:.0f}% nhe hon)")
    else:
        print("  Khong anh nao can ban hep.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
