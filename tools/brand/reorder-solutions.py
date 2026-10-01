#!/usr/bin/env python3
"""
Dua muc "MÀN HÌNH Ô TÔ" len tren "PHIM CÁCH NHIỆT" tren trang Giai phap.

Khach yeu cau (01/10/2026): "cái màn hình dưới cùng xế lên trên phim cách
nhiệt". Trong ban thiet ke, bon muc giai phap xep PHIM -> PPF -> LOA -> MÀN
HÌNH; khach muon MÀN HÌNH len dau.

── Vi sao phai co bo rieng ───────────────────────────────────────────────
Ca bon muc deu duoc VE CHET trong anh nen. Doi thu tu nghia la cat mot dai
ANH roi dan vao cho khac, VA doi theo moi toa do dang tro vao vung do: chu
tren canvas, the noi, vung bam, nut "XEM THÊM".

── Cat o dau ────────────────────────────────────────────────────────────
Do bang cach tim nhung hang HOAN TOAN la mau nen (lech duoi 6/255, duoi 12
diem mot hang). Ba cho yen tinh dung lam duong cat:
    1887..1950   ngay truoc "PHIM CÁCH NHIỆT"
    4610..4668   ngay truoc "MÀN HÌNH Ô TÔ"
    5154..5400   ngay sau cac the man hinh

Chon: dai MÀN HÌNH = [4640, 5152), chen vao 1920.

5152 chu khong phai 5154: dai sang can doi mau trong `darken-light-bands.py`
bat dau o 5153. Lay 5154 thi 5153 roi vao khoi bi di doi va dai do lech cho.

── Phep doi toa do ──────────────────────────────────────────────────────
Chieu cao KHONG doi (chi hoan vi hai khoi lien nhau), nen moi thu tu 5152 tro
xuong giu nguyen — ke ca dai du an, vung to nen va dai can mau.

    y < 1920            -> y
    1920 <= y < 4640    -> y + 512
    4640 <= y < 5152    -> y - 2720
    y >= 5152           -> y

Chay: python3 tools/brand/reorder-solutions.py
Vi tri trong chuoi: SAU `clean-hero.py`, TRUOC `darken-light-bands.py`.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
SPEC = ROOT / "src" / "data" / "pages" / "giai-phap.json"
SLICE_DIR = ROOT / "public" / "slices"
LIFT = ROOT / "src" / "data" / "lift-cards.json"
CTA = ROOT / "src" / "data" / "cta-links.json"

CANVAS_WIDTH = 1440

#: Dai duoc di chuyen, va cho no den.
BLOCK_TOP = 4640
BLOCK_BOTTOM = 5152
INSERT_AT = 1920

BLOCK_HEIGHT = BLOCK_BOTTOM - BLOCK_TOP      # 512
SHIFT_DOWN = BLOCK_HEIGHT                     # cac muc cu bi day xuong
SHIFT_UP = BLOCK_TOP - INSERT_AT              # 2720


def remap(y: float) -> float:
    """Toa do cu -> toa do moi. Xem phep doi o dau tep."""
    if y < INSERT_AT:
        return y
    if y < BLOCK_TOP:
        return y + SHIFT_DOWN
    if y < BLOCK_BOTTOM:
        return y - SHIFT_UP
    return y


def rebuild_image(image: Image.Image, scale: float) -> Image.Image:
    """Hoan vi hai khoi lien nhau tren MOT tam anh da ghep lien."""
    top = round(INSERT_AT * scale)
    cut = round(BLOCK_TOP * scale)
    end = round(BLOCK_BOTTOM * scale)

    out = image.copy()
    moved = image.crop((0, cut, image.width, end))
    pushed = image.crop((0, top, image.width, cut))

    out.paste(moved, (0, top))
    out.paste(pushed, (0, top + moved.height))
    return out


def rebuild_slices(suffix: str) -> int:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    paths = [SLICE_DIR / f"giai-phap-{i}{suffix}.webp" for i in range(len(spec["slices"]))]
    if not all(path.is_file() for path in paths):
        raise SystemExit(f"Thieu lat nen cho ti le {suffix or '@2x'}")

    images = [Image.open(path).convert("RGB") for path in paths]
    scale = images[0].width / CANVAS_WIDTH

    tall = Image.new("RGB", (images[0].width, sum(im.height for im in images)))
    y = 0
    for im in images:
        tall.paste(im, (0, y))
        y += im.height

    tall = rebuild_image(tall, scale)

    y = 0
    for path, im in zip(paths, images):
        tall.crop((0, y, tall.width, y + im.height)).save(
            path, "WEBP", quality=88, method=6
        )
        y += im.height
    return len(paths)


def remap_page_items() -> int:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    touched = 0
    for item in spec["items"]:
        moved = remap(item["y"])
        if moved != item["y"]:
            item["y"] = moved
            touched += 1
    spec[MARK] = True
    SPEC.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return touched


def remap_json(path: Path, pick) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    touched = 0
    for entry in pick(data):
        moved = remap(entry["y"])
        if moved != entry["y"]:
            entry["y"] = moved
            touched += 1
        for key in ("bodyBox", "coverBox"):
            box = entry.get(key)
            if isinstance(box, dict) and "y" in box:
                shifted = remap(box["y"])
                if shifted != box["y"]:
                    box["y"] = shifted
                    touched += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return touched


#: Dau da chay, ghi vao chinh tep dac ta cua trang.
MARK = "solutionsReordered"


def main() -> int:
    # Chay hai lan la hoan vi hai lan — dai thu hai bi mang di dau mat. Bo
    # tach the tung dinh dung cai bay nay (xem ghi chu trong
    # tools/brand/extract-solution-cards.py), nen cho nay chot cua truoc.
    #
    # Trong chuoi `npm run parse:prototype` thi khong sao: buoc dau cua chuoi
    # dung lai lat nen va tep dac ta tu anh thiet ke goc, nen dau nay bi xoa
    # theo. Chot nay chi chan viec GOI TAY lan thu hai.
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    if spec.get(MARK):
        print("  Da doi thu tu roi — bo qua. Muon lam lai thi chay"
              " `npm run parse:prototype` (buoc dau dung lai tu anh goc).")
        return 0

    slices = rebuild_slices("") + rebuild_slices("@3x")
    items = remap_page_items()
    lifts = remap_json(LIFT, lambda d: d["pages"].get("giai-phap", []))
    ctas = remap_json(CTA, lambda d: d.get("giai-phap", []))

    print(f"  Da dua MÀN HÌNH Ô TÔ len tren PHIM CÁCH NHIỆT tren trang Giai phap.")
    print(f"    {slices} lat nen dung lai, {items} phan tu chu, {lifts} the noi, {ctas} nut CTA")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
