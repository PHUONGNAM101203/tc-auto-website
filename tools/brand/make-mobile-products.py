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

Vi tri trong chuoi: HAI CHO, va phai du ca hai.
  - `parse:cta`, sau `extract-products.py`  -> cho anh san pham
  - `parse:prototype`, sau `extract-lift-cards.py` -> cho the noi

De thieu mot cho la cho do mat `mobileSrc` sau lan chay chuoi tiep theo, va
ban dien thoai lai keo ve anh to. Da dinh dung cai bay do: chay lai
`parse:prototype` lam trang Giai phap tren dien thoai vot tu 1,36 len 2,94 MB,
`verify:weight` bat duoc.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "src" / "data" / "products.json"
LIFT = ROOT / "src" / "data" / "lift-cards.json"
PROJECTS = ROOT / "src" / "data" / "projects.json"
PUBLIC = ROOT / "public"

#: Be ngang ban hep. 360 = 180px CSS o mat do 2, du cho o luoi rong 169px.
WIDTH = 360

#: Rieng dai anh chay TRAN BE NGANG (dai du an) thi o rong gan ca man hinh:
#: `sizes="calc(100vw - 40px)"` → 350px CSS tren may 390px, nhan mat do 2 la
#: 700px. Lay 360 cho no la mo han.
WIDE = 720


def shrink(raw: str, width: int = WIDTH) -> tuple[str, int, int] | None:
    """Sinh ban hep cho mot duong dan anh. Tra ve (duong dan, truoc, sau)."""
    source = PUBLIC / raw.split("?")[0].lstrip("/")
    if not source.is_file():
        raise SystemExit(f"Khong tim thay {source}")
    with Image.open(source) as image:
        if image.width <= width:
            return None
        height = round(image.height * width / image.width)
        target = source.with_name(source.stem + "@m.webp")
        image.convert("RGB").resize((width, height), Image.LANCZOS).save(
            target, "WEBP", quality=80, method=6
        )
    return (
        "/" + str(target.relative_to(PUBLIC)),
        source.stat().st_size,
        target.stat().st_size,
    )


def lift_cards() -> None:
    """Cac THE NOI cung hien o luoi mobile, cung mot van de qua kho.

    Tren may ban chung duoc dat tuyet doi theo toa do canvas va hien to; tren
    dien thoai chung vao luoi `.tc-m-tiles` chi rong 169px moi o, ma anh goc
    rong 750px. Do duoc: trang Giai phap tren dien thoai NANG HON tren may ban
    (2,94 so voi 2,67 MB) dung vi may tam nay.
    """
    data = json.loads(LIFT.read_text(encoding="utf-8"))
    before = after = made = 0
    for cards in data["pages"].values():
        for card in cards:
            result = shrink(card["src"])
            if result is None:
                card.pop("mobileSrc", None)
                continue
            card["mobileSrc"], was, now = result
            before += was
            after += now
            made += 1
    LIFT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if made:
        print(f"  {made} the noi co ban hep {WIDTH}px: "
              f"{before / 1e6:.2f} MB -> {after / 1e6:.2f} MB "
              f"({100 - after * 100 / before:.0f}% nhe hon)")


def projects() -> None:
    """Bon tam dai "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" — cung mot van de.

    Tren dien thoai chung chay trong mot bang truot rong bang man hinh, tuc la
    khoang 350px; anh goc thi rong 1154-1920px. Ba trong bon tam da duoc thay
    bang ban goc 1920px lay tu tcauto.vn (02/10/2026,
    tools/brand/find-sharper-photos.py) — net hon han tren may ban, nhung lam
    trang Giai phap tren dien thoai NANG HON tren may ban (1,86 so voi
    1,75 MB). Cua `verify:weight` bat dung cho do.
    """
    data = json.loads(PROJECTS.read_text(encoding="utf-8"))
    before = after = 0
    made = 0
    for photo in data["photos"]:
        result = shrink(photo["src"], WIDE)
        if result is None:
            photo.pop("mobileSrc", None)
            continue
        photo["mobileSrc"], was, now = result
        before += was
        after += now
        made += 1
    PROJECTS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if made:
        print(f"  {made} anh du an co ban hep {WIDTH}px: "
              f"{before / 1e6:.2f} MB -> {after / 1e6:.2f} MB "
              f"({100 - after * 100 / before:.0f}% nhe hon)")


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
        print("  Khong anh san pham nao can ban hep.")

    lift_cards()
    projects()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
