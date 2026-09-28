#!/usr/bin/env python3
"""
Cong kiem tra: hinh phan trang VE SAN phai bien mat khoi anh lat nen.

So trang phai suy ra tu so bai viet co that, nen bo phan trang duoc ve bang
phan tu that. Neu hinh ve san con sot lai trong anh thi nguoi dung thay HAI bo
phan trang chong len nhau — day la loi that da tung xay ra.

Chay: python3 tools/fidelity/check-pager.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
PUBLIC = ROOT / "public"
BOXES = ROOT / "src" / "data" / "detected-pagination.json"
SUBPAGES = ROOT / "src" / "data" / "subpages"

# Chu so va vien cua bo phan trang sang hon han nen navy quanh no.
BRIGHT = 95
# Duoi nguong nay coi nhu chi con nhieu nen.
MAX_BRIGHT_PIXELS = 150
# No ra ngoai hop mot chut: hinh ve san thuong co quang sang lan ra.
PAD = 10


def main() -> int:
    boxes = json.loads(BOXES.read_text(encoding="utf-8"))
    failures = 0

    for slug, box in boxes.items():
        spec = json.loads((SUBPAGES / f"{slug.replace('/', '__')}.json").read_text("utf-8"))
        holder = next(
            (s for s in spec["slices"] if s["y"] <= box["y"] < s["y"] + s["displayHeight"]),
            None,
        )
        if holder is None:
            print(f"FAIL  {slug}: hop phan trang nam ngoai moi lat")
            failures += 1
            continue

        image = Image.open(PUBLIC / holder["src"].split("?", 1)[0].lstrip("/")).convert("RGB")
        scale = image.width / 1440
        crop = image.crop(
            (
                round((box["x"] - PAD) * scale),
                round((box["y"] - PAD - holder["y"]) * scale),
                round((box["x"] + box["width"] + PAD) * scale),
                round((box["y"] + box["height"] + PAD - holder["y"]) * scale),
            )
        )
        bright = int((np.asarray(crop, dtype=np.float32).mean(axis=2) > BRIGHT).sum())
        ok = bright <= MAX_BRIGHT_PIXELS
        if not ok:
            failures += 1
        print(f"{'PASS' if ok else 'FAIL'}  {slug:<46} {bright:>5} px sang")

    print()
    if failures:
        print(f"{failures}/{len(boxes)} trang con hinh phan trang ve san trong anh.")
        return 1
    print(f"{len(boxes)}/{len(boxes)} trang da xoa sach hinh phan trang ve san.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
