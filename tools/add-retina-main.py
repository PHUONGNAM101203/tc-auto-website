#!/usr/bin/env python3
"""
Them ban @3x cho 6 trang chinh, cat tu PNG thiet ke goc.

Lat @2x hien co duoc trich tu ban export prototype HTML va dat do chinh xac
LECH 0 PIXEL — khong dung vao. Script nay chi THEM ban @3x cat tu
'[TC] Website/Website_TC', dung y het ranh gioi lat cua ban @2x, roi ghi
srcSet vao page spec.

Chay sau tools/parse-prototype.py (npm run parse:prototype da ghep san).
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "tools" / "subpage-manifest.json"
DATA_DIR = ROOT / "src" / "data" / "pages"
SLICE_DIR = ROOT / "public" / "slices"

CANVAS_WIDTH = 1440
SOURCE_SCALE = 3
RETINA_SCALE = 3
QUALITY = 80


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    source_root = Path(manifest["sourceRoot"])
    mains = {p["slug"]: p for p in manifest["pages"] if p.get("main")}

    total = 0
    for slug, entry in mains.items():
        spec_path = DATA_DIR / f"{slug}.json"
        spec = json.loads(spec_path.read_text(encoding="utf-8"))

        source = source_root / entry["dir"] / entry["file"]
        image = Image.open(source).convert("RGB")
        if image.width != CANVAS_WIDTH * SOURCE_SCALE:
            raise RuntimeError(f"{source.name}: rong {image.width}px, mong doi 4320px")

        # Doi chieu chieu cao: PNG va page spec phai ta CUNG mot trang.
        png_height = image.height / SOURCE_SCALE
        if abs(png_height - spec["height"]) > 1:
            raise RuntimeError(
                f"{slug}: PNG cao {png_height:.0f}px nhung page spec ghi {spec['height']:.0f}px"
            )

        for stale in SLICE_DIR.glob(f"{slug}-*@3x.webp"):
            stale.unlink()

        page_bytes = 0
        for index, slice_spec in enumerate(spec["slices"]):
            top = round(slice_spec["y"] * RETINA_SCALE)
            bottom = min(
                round((slice_spec["y"] + slice_spec["displayHeight"]) * RETINA_SCALE),
                image.height,
            )
            chunk = image.crop((0, top, image.width, bottom))

            name = f"{slug}-{index}@3x.webp"
            path = SLICE_DIR / name
            chunk.save(path, "WEBP", quality=QUALITY, method=6)
            size = path.stat().st_size
            page_bytes += size

            slice_spec["srcSet"] = [
                {"src": slice_spec["src"], "scale": 2},
                {"src": f"/slices/{name}", "scale": RETINA_SCALE},
            ]
            slice_spec["bytesByScale"] = {
                "2": slice_spec["bytes"],
                "3": size,
            }

        spec_path.write_text(
            json.dumps(spec, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
        )
        total += page_bytes
        print(f"  {slug:<14} {len(spec['slices'])} lat @3x  {page_bytes / 1e6:5.2f} MB")

    print(f"\n  Tong ban @3x cua 6 trang chinh: {total / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
