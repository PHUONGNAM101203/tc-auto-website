#!/usr/bin/env python3
"""
Cat ANH MINH HOA cho cac trang bai viet mo ra tu nut "XEM THÊM".

── Vi sao ──────────────────────────────────────────────────────────────────
Moi the bai viet trong ban thiet ke deu co MOT TAM ANH ben canh khoi chu.
Trang bai viet sinh ra tu the do (tools/brand/build-spot-articles.py) truoc
day chi lay phan CHU — khach bao "trong các xem thêm lại không đầy đủ hình"
(01/10/2026).

── Tim anh o dau ──────────────────────────────────────────────────────────
Khoi chu cua bai da biet toa do (bodyBox trong src/data/cta-links.json). Tam
anh nam NGAY CANH no, ben trai hoac ben phai tuy the. Nen bo nay quet ca hai
phia, do xem ben nao co mot mang khac mau nen du lon, roi lay ben do.

Khong doan truoc la trai hay phai: cac trang xep the khac nhau, va vai trang
con doi ben giua cac the de do don dieu.

Chay: python3 tools/brand/extract-article-shots.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
SPEC_DIR = ROOT / "src" / "data" / "subpages"
SLICE_DIR = ROOT / "public" / "slices" / "sub"
ARTICLES = ROOT / "src" / "data" / "spot-articles.json"
CTA = ROOT / "src" / "data" / "cta-links.json"
OUT = ROOT / "public" / "articles"

CANVAS_WIDTH = 1440
#: Le trai/phai cua noi dung trang.
MARGIN = 40
#: Khoang ho giua anh va khoi chu.
GUTTER = 36
#: Diem anh lech hon nguong nay so voi mau nen thi coi la noi dung.
INK = 16
#: Mang anh phai phu it nhat chung nay be ngang vung quet moi tinh la anh.
FILL = 0.55
#: Anh hep hon chung nay thi khong phai tam anh the.
MIN_WIDTH = 160
MIN_HEIGHT = 120


def page_image(stem: str) -> tuple[Image.Image, float]:
    """Ghep ca trang lai thanh mot anh, tra ve kem ti le."""
    spec = json.loads((SPEC_DIR / f"{stem}.json").read_text(encoding="utf-8"))
    parts = [
        Image.open(SLICE_DIR / f"{stem}-{i}@2x.webp").convert("RGB")
        for i in range(len(spec["slices"]))
    ]
    scale = parts[0].width / CANVAS_WIDTH
    tall = Image.new("RGB", (parts[0].width, sum(p.height for p in parts)))
    y = 0
    for part in parts:
        tall.paste(part, (0, y))
        y += part.height
    return tall, scale


def background(a: np.ndarray) -> np.ndarray:
    """Mau nen cua trang, lay trung vi cua bon goc."""
    return np.median(
        np.stack([a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]]).astype(np.float32), axis=0
    )


def find_shot(a: np.ndarray, scale: float, box: dict) -> tuple[int, int, int, int] | None:
    """Tim tam anh ben canh khoi chu `box` (toa do canvas)."""
    bg = background(a)
    diff = np.abs(a - bg[None, None, :]).max(axis=2)

    y0 = int((box["y"] - 30) * scale)
    y1 = int((box["y"] + box["height"] + 30) * scale)
    y0, y1 = max(0, y0), min(a.shape[0], y1)
    if y1 - y0 < MIN_HEIGHT * scale:
        return None

    sides = {
        "trai": (MARGIN, box["x"] - GUTTER),
        "phai": (box["x"] + box["width"] + GUTTER, CANVAS_WIDTH - MARGIN),
    }
    best = None
    for x0, x1 in sides.values():
        if x1 - x0 < MIN_WIDTH:
            continue
        strip = diff[y0:y1, int(x0 * scale) : int(x1 * scale)] > INK
        if strip.size == 0:
            continue
        cols = strip.mean(axis=0) > FILL
        rows = strip.mean(axis=1) > FILL
        if cols.sum() < MIN_WIDTH * scale or rows.sum() < MIN_HEIGHT * scale:
            continue
        cx = np.nonzero(cols)[0]
        ry = np.nonzero(rows)[0]
        area = (cx.max() - cx.min()) * (ry.max() - ry.min())
        rect = (
            int(x0 * scale) + cx.min(),
            y0 + ry.min(),
            int(x0 * scale) + cx.max(),
            y0 + ry.max(),
        )
        if best is None or area > best[0]:
            best = (area, rect)
    return best[1] if best else None


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    data = json.loads(ARTICLES.read_text(encoding="utf-8"))
    cta = json.loads(CTA.read_text(encoding="utf-8"))
    cache: dict[str, tuple[Image.Image, float, np.ndarray]] = {}
    found = 0

    for article in data["articles"]:
        page = article["parentPage"]
        if page not in cache:
            stem = page.replace("/", "__")
            image, scale = page_image(stem)
            cache[page] = (image, scale, np.asarray(image, dtype=np.float32))
        image, scale, a = cache[page]

        spot = next(
            (
                s
                for s in cta.get(page, [])
                if abs(s["x"] - article["spot"]["x"]) < 2
                and abs(s["y"] - article["spot"]["y"]) < 2
            ),
            None,
        )
        box = (spot or {}).get("bodyBox")
        if not box:
            print(f"  {article['slug']:<60} khong co khoi chu")
            continue

        rect = find_shot(a, scale, box)
        if not rect:
            print(f"  {article['slug']:<60} khong tim thay anh")
            continue

        shot = image.crop(rect)

        # Vai the khong co ANH ma chi co LOGO tren nen trang. Dat mot mang
        # trang gan nhu khong mau lam anh dai dien cho bai thi nhin rat hong
        # tren nen toi. Nhan ra bang hai dau hieu di cung nhau: rat sang va
        # gan nhu khong co mau.
        px = np.asarray(shot.resize((80, 80)), dtype=np.float32)
        bright = px.mean()
        colour = float((px.max(axis=2) - px.min(axis=2)).mean())
        if bright > 190 and colour < 26:
            print(f"  {article['slug']:<60} chi la logo tren nen trang — bo qua")
            continue

        name = article["slug"].replace("/", "__")
        path = OUT / f"{name}.webp"
        shot.save(path, "WEBP", quality=86, method=6)
        article["image"] = f"/articles/{name}.webp"
        article["imageWidth"] = shot.width
        article["imageHeight"] = shot.height
        found += 1
        print(f"  {path.relative_to(ROOT)}  {shot.width}x{shot.height}")

    ARTICLES.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\n  Co anh: {found}/{len(data['articles'])} bai")
    return 0


if __name__ == "__main__":
    sys.exit(main())
