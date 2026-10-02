#!/usr/bin/env python3
"""
Phan tu THAT phai trung khit hinh VE SAN — khong duoc lech mot pixel nao.

── Vi sao can bai nay ──────────────────────────────────────────────────
Ca site dung mot cach lam: hinh cua nut, o nhap, khung the… duoc ve chet trong
anh nen, con phan tu that thi trong suot dat de len dung cho do. Lam dung thi
khong ai phan biet duoc. Lech vai pixel la lo ra HAI lop chong nhau — va khi
phan tu to nen/ve vien (luc chon gia tri, luc ro chuot) thi cai lech do hien
ra thanh hai duong vien long nhau.

Khach da bao bon lan, bon cho khac nhau:
  30/09 — thanh menu: khung bo tron ve san + khung truot that.
  01/10 — mui ten bang anh: o nen CSS phu len net ve san.
  02/10 — form lien he: chu goi y nuong trong ban @3x (xem check-ghost-text.py).
  02/10 — o tim dai ly: vien that thut vao trong vien ve san 1-2px.

── Do the nao ──────────────────────────────────────────────────────────
Quet chinh anh nen tim BIEN cua hinh ve san (vien sang tren nen toi, hoac
mang mau do cua nut), roi so voi toa do ma ma nguon khai. Lech qua 2px la bao.

Khong can trinh duyet: day la phep so hai con so.

Chay: python3 tools/fidelity/check-overlap.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
CANVAS_WIDTH = 1440
#: Lech toi da cho phep o moi canh, tinh bang pixel canvas.
LIMIT = 2


def read_const(source: Path, name: str) -> dict[str, int]:
    """Doc mot hang so dang `const X = { a: 1, b: 2 }` tu tep TypeScript."""
    text = source.read_text(encoding="utf-8")
    match = re.search(rf"const {name} = \{{(.+?)\}}", text, re.S)
    if not match:
        raise SystemExit(f"Khong tim thay hang so {name} trong {source}")
    return {
        key: int(value)
        for key, value in re.findall(r"(\w+):\s*(-?\d+)", match.group(1))
    }


def read_number(source: Path, name: str) -> int:
    text = source.read_text(encoding="utf-8")
    match = re.search(rf"const {name} = (\d+)", text)
    if not match:
        raise SystemExit(f"Khong tim thay {name} trong {source}")
    return int(match.group(1))


def load_slice(spec_path: Path, y: float) -> tuple[Image.Image, float, float]:
    """Lat nen chua do cao `y`, kem ti le va do cao goc cua lat."""
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    for entry in spec["slices"]:
        if entry["y"] <= y < entry["y"] + entry["displayHeight"]:
            path = ROOT / "public" / entry["src"].split("?")[0].lstrip("/")
            image = Image.open(path).convert("RGB")
            return image, image.width / CANVAS_WIDTH, entry["y"]
    raise SystemExit(f"Khong co lat nao chua y={y} trong {spec_path.name}")


def bright_edges(image, scale, top, box, pad=16):
    """Bien cua mot khung VIEN SANG tren nen toi, theo he toa do canvas."""
    array = np.asarray(image, dtype=np.float32).mean(axis=2)
    mid_y = box["y"] + box["height"] / 2
    row = array[int((mid_y - top) * scale)]
    lo, hi = box["x"] - pad, box["x"] + box["width"] + pad
    values = np.array([row[int(v * scale)] for v in range(lo, hi)])
    threshold = np.median(values) + 15
    hits = [lo + i for i, v in enumerate(values) if v > threshold]

    mid_x = box["x"] + box["width"] / 2
    column = array[:, int(mid_x * scale)]
    vlo, vhi = box["y"] - pad, box["y"] + box["height"] + pad
    vvalues = np.array([column[int((v - top) * scale)] for v in range(vlo, vhi)])
    vthreshold = np.median(vvalues) + 15
    vhits = [vlo + i for i, v in enumerate(vvalues) if v > vthreshold]

    if not hits or not vhits:
        return None
    return {"x": hits[0], "right": hits[-1], "y": vhits[0], "bottom": vhits[-1]}


def red_edges(image, scale, top, box, pad=24):
    """Bien cua mot mang mau DO (nut)."""
    array = np.asarray(image, dtype=np.float32)
    red = (array[:, :, 0] > 110) & (array[:, :, 1] < 80) & (array[:, :, 2] < 80)
    y0 = max(0, int((box["y"] - pad - top) * scale))
    y1 = min(red.shape[0], int((box["y"] + box["height"] + pad - top) * scale))
    x0 = max(0, int((box["x"] - pad) * scale))
    x1 = min(red.shape[1], int((box["x"] + box["width"] + pad) * scale))
    ys, xs = np.where(red[y0:y1, x0:x1])
    if len(xs) == 0:
        return None
    return {
        "x": round(x0 / scale + xs.min() / scale),
        "right": round(x0 / scale + xs.max() / scale),
        "y": round(top + y0 / scale + ys.min() / scale),
        "bottom": round(top + y0 / scale + ys.max() / scale),
    }


def main() -> int:
    dealer = ROOT / "src" / "components" / "site" / "DealerSearch.tsx"
    field = read_const(dealer, "FIELD")
    button = read_const(dealer, "BUTTON")
    brand_top = read_number(dealer, "BRAND_TOP")
    province_top = read_number(dealer, "PROVINCE_TOP")

    spec = ROOT / "src" / "data" / "subpages" / "dai-ly__mang-luoi-dai-ly.json"
    checks = [
        ("ô chọn hãng", {"x": field["left"], "y": brand_top,
                         "width": field["width"], "height": field["height"]}, bright_edges),
        ("ô chọn tỉnh", {"x": field["left"], "y": province_top,
                         "width": field["width"], "height": field["height"]}, bright_edges),
        ("nút TÌM KIẾM", {"x": button["left"], "y": button["top"],
                          "width": button["width"], "height": button["height"]}, red_edges),
    ]

    problems = []
    for label, box, find in checks:
        image, scale, top = load_slice(spec, box["y"])
        drawn = find(image, scale, top, box)
        if drawn is None:
            problems.append(f"{label}: khong tim thay hinh ve san o do")
            continue

        gaps = {
            "trái": abs(drawn["x"] - box["x"]),
            "phải": abs(drawn["right"] - (box["x"] + box["width"])),
            "trên": abs(drawn["y"] - box["y"]),
            "dưới": abs(drawn["bottom"] - (box["y"] + box["height"])),
        }
        worst = max(gaps.values())
        detail = ", ".join(f"{side} {value}px" for side, value in gaps.items())
        print(f"  {label:<16} lech {worst}px  ({detail})")
        if worst > LIMIT:
            problems.append(
                f"{label}: phan tu that lech {worst}px so voi hinh ve san "
                f"({detail}). Chon gia tri hoac ro chuot la lo ra hai lop."
            )

    if problems:
        print("")
        for line in problems:
            print(f"  SAI {line}")
        return 1
    print("\n  Phan tu that trung khit hinh ve san o moi cho da kiem.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
