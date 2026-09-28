#!/usr/bin/env python3
"""
Tim cac MUI TEN slider duoc ve chet vao anh thiet ke.

Cach nhan: mui ten la mot mang sang nho, DUNG LE — khong co mang sang nao khac
ke ben trong vong 70px. Chu thi luon di thanh hang nen bi loai.

Chay: python3 tools/detect-arrows.py
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE_ROOT = Path("/Users/phuongnam/Downloads/[TC] Website/Website_TC")

CANVAS_WIDTH = 1440
BRIGHT = 185
# Kich thuoc mot mui ten, theo he toa do 1440px.
MIN_W, MAX_W = 6, 46
MIN_H, MAX_H = 12, 56
# Khong co mang sang nao khac trong ban kinh nay -> dung le -> kha nang la mui ten.
LONELY = 70


def components(mask: np.ndarray, block: int = 3) -> list[tuple[int, int, int, int]]:
    """Cac mang sang lien thong, tra ve (x0, y0, x1, y1) theo he toa do goc.

    Gom theo o luoi `block` x `block` pixel cho nhanh: chi can biet hop bao cua
    tung mang, khong can do chinh xac tung pixel.
    """
    h, w = mask.shape
    gh, gw = (h + block - 1) // block, (w + block - 1) // block
    pad = np.zeros((gh * block, gw * block), dtype=bool)
    pad[:h, :w] = mask
    grid = pad.reshape(gh, block, gw, block).any(axis=(1, 3))

    seen = np.zeros_like(grid)
    boxes: list[tuple[int, int, int, int]] = []
    for start_y, start_x in zip(*np.nonzero(grid)):
        if seen[start_y, start_x]:
            continue
        stack = [(int(start_y), int(start_x))]
        seen[start_y, start_x] = True
        y0 = y1 = int(start_y)
        x0 = x1 = int(start_x)
        while stack:
            cy, cx = stack.pop()
            y0, y1 = min(y0, cy), max(y1, cy)
            x0, x1 = min(x0, cx), max(x1, cx)
            for ny in (cy - 1, cy, cy + 1):
                for nx in (cx - 1, cx, cx + 1):
                    if 0 <= ny < gh and 0 <= nx < gw and grid[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
        boxes.append((x0 * block, y0 * block, (x1 + 1) * block, (y1 + 1) * block))
    return boxes


def scan(path: Path) -> list[dict]:
    image = Image.open(path).convert("L")
    scale = image.width / CANVAS_WIDTH
    small = image.resize((CANVAS_WIDTH, round(image.height / scale)), Image.BILINEAR)
    gray = np.asarray(small, dtype=np.uint8)

    boxes = components(gray > BRIGHT)
    sized = [
        b
        for b in boxes
        if MIN_W <= b[2] - b[0] <= MAX_W and MIN_H <= b[3] - b[1] <= MAX_H
    ]

    found = []
    for box in sized:
        cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        neighbours = [
            o
            for o in boxes
            if o is not box
            and abs((o[0] + o[2]) / 2 - cx) < LONELY
            and abs((o[1] + o[3]) / 2 - cy) < LONELY
        ]
        if neighbours:
            continue
        found.append(
            {
                "x": int(box[0]),
                "y": int(box[1]),
                "width": int(box[2] - box[0]),
                "height": int(box[3] - box[1]),
            }
        )
    return found


def main() -> int:
    out: dict[str, list[dict]] = {}
    files = [
        os.path.join(r, f)
        for r, _, fs in os.walk(SOURCE_ROOT)
        for f in fs
        if f.lower().endswith(".png")
    ]
    for path in sorted(files):
        hits = scan(Path(path))
        if hits:
            out[os.path.basename(path)] = hits
            print(f"  {os.path.basename(path):<58} {len(hits)} mui ten")
            for h in hits:
                print(f"       x{h['x']:>5} y{h['y']:>5}  {h['width']}x{h['height']}")

    print(f"\n  {sum(len(v) for v in out.values())} mui ten tren {len(out)} trang.")
    (ROOT / "src" / "data" / "detected-arrows.json").write_text(
        json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
