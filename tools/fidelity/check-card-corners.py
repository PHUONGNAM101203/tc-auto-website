#!/usr/bin/env python3
"""
Goc cua the cat ra khong duoc con sot mau nen cu.

── Loi that ────────────────────────────────────────────────────────────
Nhieu the duoc cat tu nhung vung ma thiet ke de NEN TRANG. The co goc bo
tron, con phep cat thi la hinh chu nhat — nen bon goc giu lai mau trang do.
`round_corners()` xoa chung di, nhung chi dung khi BAN KINH khai dung.

Hai the muc "Câu chuyện đồng hành" khai 25 trong khi ban kinh that la 64:
con lai mot cung TRANG mong o ca bon goc. Luc nghi tren nen trang thi khong
ai thay; tren luoi mobile nen navy thi lo ro. Khach chi ra 02/10/2026.

── Do the nao ──────────────────────────────────────────────────────────
Voi moi the, dem diem SANG con du trong o vuong 150px o bon goc. The nao cat
dung thi bon goc hoan toan trong suot hoac mang mau cua chinh the — khong co
diem sang nao.

Nguong 150/255 doc theo do sang trung binh: anh that trong the (bau troi,
tuong trang) cung sang, nhung chung nam o GIUA the chu khong o goc; goc thi
da bi bo tron cat di.

Chay: python3 tools/fidelity/check-card-corners.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
PUBLIC = ROOT / "public"

#: O vuong o moi goc, tinh bang pixel anh.
BOX = 150
#: Do sang coi la "sot nen trang" — tinh tren kenh TOI NHAT, de anh that co
#: mang sang nhung khong trang tinh thi khong bi tinh.
LIGHT = 185
#: Ti le toi da cua vien bi coi la sot nen, tren tong so diem vien o bon goc.
LIMIT = 0.08

#: Cac tep du lieu co the cat ra, kem cach lay danh sach.
SOURCES = [
    ("the noi", ROOT / "src" / "data" / "lift-cards.json",
     lambda d: [c for cards in d["pages"].values() for c in cards]),
    ("the ung dung", ROOT / "src" / "data" / "app-cards.json",
     lambda d: d if isinstance(d, list) else d.get("cards", [])),
    ("the giai phap", ROOT / "src" / "data" / "solution-cards.json",
     lambda d: d.get("cards", []) if isinstance(d, dict) else d),
]


def edge_pixels(array, box):
    """Cac diem nam NGAY SAT mep bo tron, trong bon o goc.

    Day moi la cho co y nghia. Dem "diem sang trong o goc" thi bat ca noi dung
    anh that — mot bau troi hay mot chiec xe trang o goc the cung bi tinh. Con
    mau NGAY SAT mep thi phai la mau cua chinh the; neu no trang tinh thi do la
    nen cu con sot.
    """
    height, width = array.shape[:2]
    alpha = array[..., 3]
    inside = alpha > 200
    # Mep = diem duc ma co hang xom trong suot.
    pad = np.pad(alpha, 1, constant_values=0)
    neighbour_clear = (
        (pad[:-2, 1:-1] < 60) | (pad[2:, 1:-1] < 60)
        | (pad[1:-1, :-2] < 60) | (pad[1:-1, 2:] < 60)
    )
    edge = inside & neighbour_clear

    corner = np.zeros_like(edge)
    corner[:box, :box] = True
    corner[:box, width - box:] = True
    corner[height - box:, :box] = True
    corner[height - box:, width - box:] = True
    return edge & corner


def corners(path: Path) -> tuple[int, int]:
    """(so diem vien trang, tong so diem vien) trong bon o goc."""
    with Image.open(path) as image:
        array = np.asarray(image.convert("RGBA"))
    height, width = array.shape[:2]
    box = min(BOX, height // 2, width // 2)

    mask = edge_pixels(array, box)
    total = int(mask.sum())
    if total == 0:
        return 0, 0
    darkest = array[..., :3].min(axis=2)
    return int((mask & (darkest > LIGHT)).sum()), total


def main() -> int:
    problems = []
    checked = 0

    for label, path, pick in SOURCES:
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for card in pick(data):
            raw = (card.get("src") or card.get("art") or "").split("?")[0]
            if not raw:
                continue
            image_path = PUBLIC / raw.lstrip("/")
            if not image_path.is_file():
                continue
            checked += 1
            light, total = corners(image_path)
            if total == 0:
                continue
            share = light / total
            if share > LIMIT:
                problems.append(
                    f"{label} {image_path.name}: {share * 100:.0f}% vien bo goc "
                    f"la mau trang ({light}/{total} diem, han {LIMIT * 100:.0f}%). "
                    f"Ban kinh bo goc khai thieu nen con sot nen cu — xem "
                    f"`cornerRadius` trong tools/brand/extract-*.py."
                )

    if problems:
        print("")
        for line in problems:
            print(f"  SAI {line}")
        return 1
    print(f"\n  Da so bon goc cua {checked} the. Khong the nao con sot nen cu.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
