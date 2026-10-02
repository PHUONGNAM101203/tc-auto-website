#!/usr/bin/env python3
"""
Cho nao co PHAN TU THAT thi nen phia sau phai TRONG — o ca hai ti le.

── Loi that, khach da bao ba lan ────────────────────────────────────────
Ban @2x tach tu prototype nen de trong cho chu va nut; ban @3x cat tu PNG
thiet ke nen NUONG CHET chung vao anh. `patch-retina-main.py` va lai @3x tu
@2x o nhung cho hai ban lech nhau — nhung mat na cua no suy tu CHENH LECH,
va chenh lech thi tut xuong duoi nguong voi:
  - khung vien 1px tren nen phang,
  - chu xam nhat (chu goi y trong o nhap).

Hau qua: tren man retina rong, cho do hien chu HAI LAN. Da gap:
  - 30/09/2026 — o tim kiem: "Nhập để tìm kiếm..." hien doi.
  - 02/10/2026 — form lien he: chu goi y nhoe, vi mat na bat duoc mot phan
    nen chu ve san bi xoa lo cho, con lai nhung manh roi rac.

Ca hai lan deu la khach nhin thay truoc. Bai nay de khong con lan thu ba.

── Do the nao ──────────────────────────────────────────────────────────
Voi moi vung co phan tu that (thanh header, form lien he), so ban @3x voi ban
@2x PHONG TO. Hai ban cung mot noi dung thi chenh lech chi la sai so ma hoa;
@3x con nuong chu thi chenh lech vot han len.

KHONG dung lai nguong cua patch-retina-main.py: chinh nguong do la cai bo sot.
O day do TRUNG BINH tuyet doi tren ca vung, khong lam mo, khong thu nho —
chu ve san du nhat den may cung keo trung binh len.

Chay: python3 tools/fidelity/check-ghost-text.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
PAGES = ROOT / "src" / "data" / "pages"
SLICES = ROOT / "public" / "slices"
CANVAS_WIDTH = 1440

#: Lech trung binh toi da cho phep tren mot vung, thang 0..255.
#:
#: Do thuc te sau khi sua: cao nhat 1.9 (dai header trang Nhan su — anh nen o
#: do la mot dai chuyen mau, phong to tu @2x thi hoi khac ban @3x that).
#: Truoc khi sua, form lien he tren trang Giai phap do duoc 6.2.
#: Lay 3.5 — tren muc sai so phong to, duoi han muc mot dong chu ve san.
LIMIT = 3.5

#: Cac vung LUON co phan tu that de len. Giu dong bo voi patch-retina-main.py.
HEADER = {"x": 400, "y": 18, "width": 980, "height": 78}
FORM = {"x": 726, "width": 390, "height": 100, "padTop": 6}


def regions(slug: str, spec: dict) -> list[tuple[str, dict]]:
    out = [("thanh header", HEADER)]
    form = spec.get("contactForm")
    if form and "y" in form:
        out.append(("form lien he", {
            "x": FORM["x"],
            "y": form["y"] - FORM["padTop"],
            "width": FORM["width"],
            "height": FORM["height"],
        }))
    return out


def main() -> int:
    problems = []
    checked = 0

    for spec_path in sorted(PAGES.glob("*.json")):
        slug = spec_path.stem
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
        # `index.json` la BAN MUC LUC (mot mang), khong phai mot trang — cung
        # cai bay da lam sap trang chu hoi 01/10. Xem next.config.ts.
        if not isinstance(spec, dict):
            continue
        slices = spec.get("slices") or []

        for label, box in regions(slug, spec):
            for index, entry in enumerate(slices):
                top = entry["y"]
                bottom = top + entry["displayHeight"]
                if box["y"] + box["height"] <= top or box["y"] >= bottom:
                    continue

                two = SLICES / f"{slug}-{index}.webp"
                three = SLICES / f"{slug}-{index}@3x.webp"
                if not (two.is_file() and three.is_file()):
                    continue

                with Image.open(two) as t2, Image.open(three) as t3:
                    scale2 = t2.width / CANVAS_WIDTH
                    scale3 = t3.width / CANVAS_WIDTH
                    y0 = max(box["y"] - top, 0)
                    y1 = min(box["y"] + box["height"] - top, entry["displayHeight"])

                    crop2 = t2.convert("RGB").crop((
                        round(box["x"] * scale2), round(y0 * scale2),
                        round((box["x"] + box["width"]) * scale2), round(y1 * scale2),
                    ))
                    crop3 = t3.convert("RGB").crop((
                        round(box["x"] * scale3), round(y0 * scale3),
                        round((box["x"] + box["width"]) * scale3), round(y1 * scale3),
                    ))

                if crop3.width < 8 or crop3.height < 8:
                    continue
                checked += 1

                grown = crop2.resize(crop3.size, Image.LANCZOS)
                delta = float(np.abs(
                    np.asarray(grown, dtype=np.float32)
                    - np.asarray(crop3, dtype=np.float32)
                ).mean())

                if delta > LIMIT:
                    problems.append(
                        f"{slug}-{index}@3x — {label}: lech {delta:.1f}/255 so voi "
                        f"ban @2x (han {LIMIT}). Ban @3x con nuong chu/khung o day, "
                        f"tren man retina rong se hien hai lan."
                    )

    if problems:
        print("")
        for line in problems:
            print(f"  SAI {line}")
        print(f"\n  {len(problems)} vung con chu ve san. Xem FORM_BAND / HEADER_BAND "
              f"trong tools/patch-retina-main.py.")
        return 1

    print(f"\n  Da so {checked} vung co phan tu that tren 6 trang chinh.")
    print("  Cho nao cung trong o ban @3x — khong cho nao hien chu hai lan.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
