#!/usr/bin/env python3
"""
Do vi tri nut CTA duoc ve san trong anh thiet ke.

Nut trong he thiet ke TC co mau nen chinh xac #C22326 (mau nhan), bo goc 6px,
cao 34px o ti le hien thi. Quet dung mau do -> gom thanh hinh chu nhat ->
loc theo kich thuoc, ta co toa do nut ma khong can doan bang mat.

Do chinh xac duoc KIEM CHUNG tren 6 trang chinh: toa do do duoc phai trung
voi toa do that lay tu ban export HTML cua prototype.

Chay:
  python3 tools/detect-buttons.py --validate     # doi chieu voi 6 trang chinh
  python3 tools/detect-buttons.py --emit         # ghi src/data/hotspots.json
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent / "brand"))
from design_root import resolve_root  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "tools" / "subpage-manifest.json"

BRAND_RED = (194, 35, 38)      # #C22326
COLOR_TOLERANCE = 26
CANVAS_WIDTH = 1440

# Nut CTA thuc te: cao 34px, rong 179-270px. Noi rong bien de khong bo sot.
MIN_W, MAX_W = 60, 340
# Nut CTA cao 34px (do duoc ~32px sau khu rang cua). Chu NHAN mau do (.lbl)
# cao 22-23px cung lot qua bo loc mau — nguong 28px tach sach hai loai.
MIN_H, MAX_H = 28, 42
# Chu TRANG tren nut khoet thung vung do (chi ~59% pixel la do) va co the cat
# dut lien thong. Lap kin khoang trong theo phuong ngang truoc khi gom vung.
MAX_TEXT_GAP = 60      # be rong toi da cua mot khoang chu can lap
MIN_FILL = 0.90        # sau khi lap kin, nut phai gan nhu dac hoan toan
# Bo qua vung chan trang (chua nut GUI cua form, da xu ly rieng).
FOOTER_SKIP = 200


def red_mask(image: Image.Image) -> np.ndarray:
    small = image.convert("RGB").resize(
        (CANVAS_WIDTH, round(image.height * CANVAS_WIDTH / image.width)), Image.BILINEAR
    )
    pixels = np.asarray(small, dtype=np.int16)
    distance = np.abs(pixels - np.array(BRAND_RED, dtype=np.int16)).sum(axis=2)
    return distance <= COLOR_TOLERANCE


def close_text_gaps(mask: np.ndarray) -> np.ndarray:
    """
    Lap kin cac khoang do chu trang tao ra, theo tung hang.
    Hai pixel do cach nhau <= MAX_TEXT_GAP thi phan giua duoc coi la do.
    """
    filled = mask.copy()
    for y in range(mask.shape[0]):
        reds = np.nonzero(mask[y])[0]
        if reds.size < 2:
            continue
        starts = reds[:-1]
        ends = reds[1:]
        gaps = ends - starts
        for start, end in zip(starts[gaps <= MAX_TEXT_GAP], ends[gaps <= MAX_TEXT_GAP]):
            filled[y, start:end] = True
    return filled


def find_rects(mask: np.ndarray) -> list[dict[str, int]]:
    """Gom vung pixel do lien thong thanh hinh chu nhat (flood fill theo hang)."""
    mask = close_text_gaps(mask)
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    rects: list[dict[str, int]] = []

    ys, xs = np.nonzero(mask)
    for y0, x0 in zip(ys.tolist(), xs.tolist()):
        if seen[y0, x0]:
            continue

        # BFS theo hang de gom nhanh (nut la khoi dac hinh chu nhat).
        stack = [(y0, x0)]
        seen[y0, x0] = True
        min_x = max_x = x0
        min_y = max_y = y0
        count = 0

        while stack:
            y, x = stack.pop()
            count += 1
            min_x, max_x = min(min_x, x), max(max_x, x)
            min_y, max_y = min(min_y, y), max(max_y, y)

            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))

        w = max_x - min_x + 1
        h = max_y - min_y + 1
        if not (MIN_W <= w <= MAX_W and MIN_H <= h <= MAX_H):
            continue
        if count / (w * h) < MIN_FILL:
            continue

        rects.append({"x": min_x, "y": min_y, "w": w, "h": h})

    return sorted(rects, key=lambda r: (r["y"], r["x"]))


def detect(path: Path) -> list[dict[str, int]]:
    image = Image.open(path)
    mask = red_mask(image)
    if mask.shape[0] > FOOTER_SKIP:
        mask[-FOOTER_SKIP:, :] = False
    return find_rects(mask)



#: Phep doi NGUOC cua tools/brand/reorder-solutions.py — toa do moi -> toa do
#: trong anh thiet ke goc. Giu dong bo voi ba hang so o do.
_BLOCK_TOP, _BLOCK_BOTTOM, _INSERT_AT = 4640, 5152, 1920
_BLOCK_HEIGHT = _BLOCK_BOTTOM - _BLOCK_TOP
_SHIFT_UP = _BLOCK_TOP - _INSERT_AT


def unreorder(y: float) -> float:
    """Toa do sau khi doi thu tu -> toa do trong anh thiet ke goc."""
    if y < _INSERT_AT:
        return y
    if y < _INSERT_AT + _BLOCK_HEIGHT:
        return y + _SHIFT_UP
    if y < _BLOCK_BOTTOM:
        return y - _BLOCK_HEIGHT
    return y


def validate() -> int:
    """Doi chieu ket qua do voi toa do that cua 6 trang chinh."""
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    main_root = resolve_root(manifest.get("mainSourceRoot") or manifest["sourceRoot"])
    new_root = resolve_root(manifest["sourceRoot"])
    mains = {e["slug"]: e for e in manifest["pages"] if e.get("main")}

    # Trang nao co PHAN TU da duoc va theo thiet ke moi thi phai doi chieu voi
    # thiet ke MOI — xem tools/patch-page-items.py. Cac trang con lai van doi
    # chieu voi bo khung cung doi voi prototype dang dung.
    #
    # Lay nham bo la ham nay bao sai theo ca hai chieu: doi chieu mot trang da
    # va voi thiet ke cu thi bao "thua nut", con doi chieu trang chua va voi
    # thiet ke moi thi bao lech vi tri.
    #
    # Bo nay HIEN DANG RONG. "cong-nghe" tung nam trong day vi thiet ke 28/09
    # gop hai khoi lam mot va bo mot nut "TÌM HIỂU THÊM". Ngay 30/09 khach yeu
    # cau giu lai tieu de phu cu nen muc va trong patch-page-items.py da bi go,
    # ma dong nay thi quen — tu do den gio cua kiem van doi chieu trang Cong
    # nghe voi thiet ke moi va bao sai 1 nut. Do lai: doi chieu voi khung cu
    # thi khop ca 5/5.
    #
    # THEM SLUG VAO DAY khi va items theo thiet ke moi, va GO RA khi thoi va.
    PATCHED_TO_NEW_DESIGN: set[str] = set()

    total_expected = total_matched = total_extra = 0

    for slug, entry in mains.items():
        source_root = new_root if slug in PATCHED_TO_NEW_DESIGN else main_root
        spec = json.loads((ROOT / "src" / "data" / "pages" / f"{slug}.json").read_text("utf-8"))
        # Trang Giai phap da duoc DOI THU TU muc theo yeu cau cua khach: mien
        # 1920..5152 bi hoan vi hai khoi. Anh thiet ke thi van theo thu tu cu,
        # nen phai dua toa do do CHIEU NGUOC lai truoc khi doi chieu — neu
        # khong thi hai nut "KHÁM PHÁ NGAY" bao lech ca nghin pixel.
        # Xem tools/brand/reorder-solutions.py.
        undo = unreorder if spec.get("solutionsReordered") else (lambda y: y)
        expected = [
            {
                "x": round(i["x"]),
                "y": round(undo(i["y"])),
                "w": round(i["w"]),
                "h": round(i["h"]),
            }
            for i in spec["items"]
            if "btn" in i["classes"]
        ]
        found = detect(source_root / entry["dir"] / entry["file"])

        matched: list[tuple[dict, dict, int]] = []
        leftovers = list(found)
        for want in expected:
            best = None
            for got in leftovers:
                delta = (
                    abs(got["x"] - want["x"])
                    + abs(got["y"] - want["y"])
                    + abs(got["w"] - want["w"])
                    + abs(got["h"] - want["h"])
                )
                if best is None or delta < best[1]:
                    best = (got, delta)
            if best and best[1] <= 12:
                matched.append((want, best[0], best[1]))
                leftovers.remove(best[0])

        total_expected += len(expected)
        total_matched += len(matched)
        total_extra += len(leftovers)

        worst = max((d for _, _, d in matched), default=0)
        flag = "ok  " if len(matched) == len(expected) else "SAI "
        print(
            f"  {flag}{slug:<14} that={len(expected):>2}  do duoc={len(found):>2}  "
            f"khop={len(matched):>2}  du={len(leftovers):>2}  lech toi da={worst}px"
        )
        for want, got, delta in matched:
            if delta > 3:
                print(f"        lech {delta}px: that={want} do={got}")

    print(
        f"\n  Tong: khop {total_matched}/{total_expected} nut, {total_extra} vung do thua"
    )
    return 0 if total_matched == total_expected else 1


def emit() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    source_root = resolve_root(manifest["sourceRoot"])
    out: dict[str, list[dict[str, int]]] = {}

    for entry in manifest["pages"]:
        if entry.get("main"):
            continue
        rects = detect(source_root / entry["dir"] / entry["file"])
        out[entry["slug"]] = rects
        print(f"  {entry['slug']:<58} {len(rects)} nut")

    target = ROOT / "src" / "data" / "detected-buttons.json"
    target.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\n  Ghi {target.relative_to(ROOT)} — {sum(len(v) for v in out.values())} nut")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true")
    parser.add_argument("--emit", action="store_true")
    args = parser.parse_args()
    if args.validate:
        raise SystemExit(validate())
    if args.emit:
        raise SystemExit(emit())
    parser.print_help()
