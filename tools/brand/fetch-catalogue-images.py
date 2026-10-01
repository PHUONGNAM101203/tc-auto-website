#!/usr/bin/env python3
"""
Tai ANH GIOI THIEU cho cac mau man hinh chua co anh trong bo thiet ke.

── Vi sao ──────────────────────────────────────────────────────────────────
Bo thiet ke chi ve chin mau Winca; danh muc o src/data/screen-catalogue.json
con bay mau nua chi co trong trang hang. Khach hoi "sao trang tat ca cac man
hinh lai khong co hinh" (01/10/2026).

── Chon anh the nao ───────────────────────────────────────────────────────
Trang hang cham nhieu anh duoi /thumb/: logo tron, bang hieu ngang dung chung
cho nhieu trang, va anh gioi thieu san pham. Chi anh thu ba la dung.

Phan biet bang TI LE: anh gioi thieu luon VUONG (900x900 hoac 2000x2000), con
bang hieu la 1958x745. Lan dau toi chi loc theo dien tich thi sau mau deu nhan
dung mot tam bang hieu — cung mot tep cham tren ca sau trang.

Bo nay CAN MANG nen khong nam trong chuoi `npm run parse:*`. Chay tay:

    python3 tools/brand/fetch-catalogue-images.py
"""
from __future__ import annotations

import io
import json
import re
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "public" / "catalogue"
DATA = ROOT / "src" / "data" / "screen-catalogue.json"

THUMB = re.compile(r"https://wincavn\.com/thumb/[a-f0-9]+\.webp")
#: Anh gioi thieu la hinh VUONG; bang hieu ngang thi khong.
RATIO = (0.9, 1.1)
MIN_SIDE = 500
#: Diem anh lech hon nguong nay so voi mau nen thi coi la noi dung.
INK = 12
PAD = 14


def fetch(url: str, timeout: int = 30) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def trim(image: Image.Image) -> Image.Image:
    """Cat bot le trang, lay mau nen tu bon goc chu khong gia dinh la trang."""
    rgb = image.convert("RGB")
    a = np.asarray(rgb, dtype=np.int16)
    bg = np.median(
        np.stack([a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]]).astype(np.int16), axis=0
    )
    ink = np.abs(a - bg[None, None, :]).max(axis=2) > INK
    rows, cols = np.nonzero(ink.any(axis=1))[0], np.nonzero(ink.any(axis=0))[0]
    if len(rows) == 0 or len(cols) == 0:
        return rgb
    return rgb.crop(
        (
            max(0, cols.min() - PAD),
            max(0, rows.min() - PAD),
            min(a.shape[1], cols.max() + 1 + PAD),
            min(a.shape[0], rows.max() + 1 + PAD),
        )
    )


def best_image(page_url: str) -> tuple[bytes, tuple[int, int]] | None:
    html = fetch(page_url).decode("utf-8", "ignore")
    best = None
    for url in dict.fromkeys(THUMB.findall(html)):
        try:
            raw = fetch(url, 20)
            image = Image.open(io.BytesIO(raw))
        except Exception:
            continue
        width, height = image.size
        if not (RATIO[0] <= width / height <= RATIO[1] and min(width, height) >= MIN_SIDE):
            continue
        if best is None or width * height > best[1]:
            best = (raw, width * height, image.size)
    return (best[0], best[2]) if best else None


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    data = json.loads(DATA.read_text(encoding="utf-8"))
    missing: list[str] = []

    for model in data["models"]:
        # Mau nao da co trang rieng thi da co anh cat tu thiet ke.
        if model.get("route"):
            continue
        found = best_image(model["source"])
        if not found:
            missing.append(model["slug"])
            print(f"  {model['slug']:<32} KHONG tim duoc anh vuong")
            continue
        raw, _ = found
        image = trim(Image.open(io.BytesIO(raw)))
        path = OUT / f"{model['slug']}.webp"
        image.save(path, "WEBP", quality=88, method=6)
        model["image"] = f"/catalogue/{model['slug']}.webp"
        model["imageWidth"] = image.width
        model["imageHeight"] = image.height
        print(f"  {path.relative_to(ROOT)}  {image.width}x{image.height}")

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n  {DATA.relative_to(ROOT)}")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
