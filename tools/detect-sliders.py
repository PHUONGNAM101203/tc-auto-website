#!/usr/bin/env python3
"""
Do bo chi muc slider tren toan bo 37 frame thiet ke.

Chu ky do duoc tu frame goc (Home.png, y=826):
  - mot HANG cao 2-4px
  - 3..9 VACH NGANG sang
  - dung MOT vach dai han han (dang duoc chon): rong ~86px
  - cac vach con lai deu nhau: ~11px
  - khoang cach giua cac vach ~8px
  - ca cum can giua trang (tam x ~ 720)

Do la vach chu khong phai cham tron — do rong RAT khac nhau giua vach dang chon
va cac vach con lai, nen khong the loc bang "cac phan tu rong bang nhau".

Chay: python3 tools/detect-sliders.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent / "brand"))
from design_root import resolve_root  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "tools" / "subpage-manifest.json"
TARGET = ROOT / "src" / "data" / "detected-sliders.json"

CANVAS_WIDTH = 1440
BRIGHT = 70

MIN_DASHES, MAX_DASHES = 3, 9
DASH_MIN_W, DASH_MAX_W = 6, 160
GAP_MIN, GAP_MAX = 4, 22
SPAN_MIN, SPAN_MAX = 80, 520
# Ca cum phai nam gan truc giua trang.
MAX_CENTRE_OFFSET = 170
# Vach dang chon phai dai gap it nhat ngan nay lan vach thuong.
ACTIVE_RATIO = 2.0
# Chieu cao hop le cua thanh chi muc.
BAR_MIN_H, BAR_MAX_H = 2, 6


def bright_runs(row: np.ndarray) -> list[tuple[int, int]]:
    mask = row >= BRIGHT
    if not mask.any():
        return []
    edges = np.diff(mask.astype(np.int8))
    starts = list(np.nonzero(edges == 1)[0] + 1)
    ends = list(np.nonzero(edges == -1)[0] + 1)
    if mask[0]:
        starts.insert(0, 0)
    if mask[-1]:
        ends.append(len(row))
    return list(zip(starts, ends))


def row_matches(row: np.ndarray) -> dict | None:
    runs = [(a, b) for a, b in bright_runs(row) if DASH_MIN_W <= b - a <= DASH_MAX_W]
    if not (MIN_DASHES <= len(runs) <= MAX_DASHES):
        return None

    gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
    if not gaps or min(gaps) < GAP_MIN or max(gaps) > GAP_MAX:
        return None

    left, right = runs[0][0], runs[-1][1]
    span = right - left
    if not (SPAN_MIN <= span <= SPAN_MAX):
        return None
    if abs((left + right) / 2 - CANVAS_WIDTH / 2) > MAX_CENTRE_OFFSET:
        return None

    widths = sorted(b - a for a, b in runs)
    longest = widths[-1]
    typical = widths[len(widths) // 2]
    if longest < typical * ACTIVE_RATIO:
        return None

    active = next(i for i, (a, b) in enumerate(runs) if b - a == longest)
    return {
        "count": len(runs),
        "left": int(left),
        "right": int(right),
        "activeIndex": active,
        "dashes": [{"x": int(a), "w": int(b - a)} for a, b in runs],
    }


def find_bars(gray: np.ndarray) -> list[dict]:
    hits: list[tuple[int, dict]] = []
    for y in range(gray.shape[0]):
        match = row_matches(gray[y])
        if match:
            hits.append((y, match))

    bars: list[dict] = []
    for y, match in hits:
        if bars and y - (bars[-1]["y"] + bars[-1]["height"] - 1) <= 1 and match["count"] == bars[-1]["count"]:
            bars[-1]["height"] += 1
            continue
        bars.append({"y": y, "height": 1, **match})

    return [b for b in bars if BAR_MIN_H <= b["height"] <= BAR_MAX_H]


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    source_root = resolve_root(manifest["sourceRoot"])

    result: dict[str, list[dict]] = {}
    total = 0

    for entry in manifest["pages"]:
        source = source_root / entry["dir"] / entry["file"]
        image = Image.open(source).convert("L")
        gray = np.asarray(
            image.resize(
                (CANVAS_WIDTH, round(image.height * CANVAS_WIDTH / image.width)), Image.BILINEAR
            ),
            dtype=np.uint8,
        )

        bars = find_bars(gray)
        if not bars:
            continue

        result[entry["slug"]] = bars
        total += len(bars)
        for bar in bars:
            print(
                f"  {entry['slug']:<58} y={bar['y']:>5} "
                f"{bar['count']} vach, dang chon #{bar['activeIndex'] + 1}, "
                f"x{bar['left']}..{bar['right']}"
            )

    TARGET.write_text(json.dumps(result, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\n  {total} thanh chi muc tren {len(result)} trang · ghi {TARGET.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
