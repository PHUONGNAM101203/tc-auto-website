#!/usr/bin/env python3
"""
Cat 31 frame thiet ke trang con (PNG @3x, 4320px) thanh:
  - public/slices/sub/{key}-{i}.webp   : lat nen @2x (2880px), cao <= 900px hien thi
  - src/data/subpages/{key}.json       : spec trang (chieu cao, lat nen, nav, form)
  - src/data/subpages/index.json

Chay: python3 tools/build-subpages.py [--quality 80] [--only <slug>]
Idempotent: chay lai ghi de dung file cua trang do.

Vi sao khong tai dung PNG @3x: 1GB cho 31 trang la khong the chap nhan tren web.
@2x (2880px) van net tuyet doi tren man hinh retina, va dung dung do phan giai
cua 30 lat nen san co cua 6 trang chinh.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent / "brand"))
from design_root import resolve_root  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "tools" / "subpage-manifest.json"
SLICE_DIR = ROOT / "public" / "slices" / "sub"
DATA_DIR = ROOT / "src" / "data" / "subpages"

CANVAS_WIDTH = 1440
SOURCE_SCALE = 3          # PNG nguon la @3x
# Xuat CA HAI do phan giai; trinh duyet tu chon theo mat do diem anh cua man hinh
# (xem srcset trong CanvasSlices / SubPageShell). Man thuong tai ban @2x, man
# retina tai ban @3x = dung do phan giai goc cua thiet ke.
OUTPUT_SCALES = (2, 3)
BASE_SCALE = 2            # ban mac dinh ghi trong thuoc tinh src
SLICE_DISPLAY_HEIGHT = 900

# Khoang cach co dinh tu day trang toi dinh khoi form lien he.
# Xac minh tren ca 6 trang chinh (3566-3443, 3464-3341, 5977-5854,
# 4087-3964, 4577-4454, 3374-3251) va doi chieu voi frame trang con.
FORM_OFFSET_FROM_BOTTOM = 123

# Toa do nav dung chung cho moi trang KHONG phai trang chu
# (lay tu page spec cua 5 trang chinh con lai — deu giong nhau).
NAV_LAYOUT = [
    {"label": "TRẢI NGHIỆM", "href": "/trai-nghiem", "x": 443.0, "section": "trai-nghiem"},
    {"label": "GIẢI PHÁP", "href": "/giai-phap", "x": 585.0, "section": "giai-phap"},
    {"label": "CÔNG NGHỆ", "href": "/cong-nghe", "x": 701.0, "section": "cong-nghe"},
    {"label": "ĐẠI LÝ", "href": "/dai-ly", "x": 834.0, "section": "dai-ly"},
    {"label": "NHÂN SỰ", "href": "/nhan-su", "x": 921.0, "section": "nhan-su"},
]


class BuildError(RuntimeError):
    """Nguon khong dung dinh dang mong doi."""


def slice_key(slug: str) -> str:
    """'trai-nghiem/hanh-trinh' -> 'trai-nghiem__hanh-trinh' (dung lam ten file)."""
    return slug.replace("/", "__")


def build_nav(section: str) -> list[dict[str, object]]:
    return [
        {
            "label": entry["label"],
            "href": entry["href"],
            "x": entry["x"],
            "active": entry["section"] == section,
        }
        for entry in NAV_LAYOUT
    ]


def breadcrumb(slug: str, titles: dict[str, str], routes: dict[str, str]) -> list[dict[str, str]]:
    """Duong dan phan cap tu goc toi trang hien tai (khong gom chinh no)."""
    parts = slug.split("/")
    trail: list[dict[str, str]] = [{"label": "Trang chủ", "href": "/"}]
    for depth in range(1, len(parts)):
        ancestor = "/".join(parts[:depth])
        trail.append(
            {
                "label": titles.get(ancestor, ancestor),
                "href": routes.get(ancestor, f"/{ancestor}"),
            }
        )
    return trail


def cut_slices(source: Path, slug: str, quality: int) -> tuple[list[dict[str, object]], float]:
    image = Image.open(source)
    if image.width != CANVAS_WIDTH * SOURCE_SCALE:
        raise BuildError(
            f"{source.name}: rong {image.width}px, mong doi {CANVAS_WIDTH * SOURCE_SCALE}px (@3x cua 1440)"
        )

    display_height = image.height / SOURCE_SCALE
    key = slice_key(slug)
    SLICE_DIR.mkdir(parents=True, exist_ok=True)
    for stale in SLICE_DIR.glob(f"{key}-*.webp"):
        stale.unlink()

    rgb = image.convert("RGB")
    # Cat cung mot bo ranh gioi cho moi do phan giai -> cac ban luon khop nhau.
    boundaries: list[tuple[float, float]] = []
    offset = 0.0
    while offset < display_height - 0.5:
        height = min(SLICE_DISPLAY_HEIGHT, display_height - offset)
        boundaries.append((offset, height))
        offset += height

    variants: dict[int, list[dict[str, object]]] = {}
    for scale in OUTPUT_SCALES:
        out_width = CANVAS_WIDTH * scale
        # Ha do phan giai MOT lan roi moi cat — tranh lam mem anh nhieu lan.
        scaled = (
            rgb
            if scale == SOURCE_SCALE
            else rgb.resize(
                (out_width, round(image.height * scale / SOURCE_SCALE)), Image.LANCZOS
            )
        )

        built: list[dict[str, object]] = []
        for index, (top_display, height_display) in enumerate(boundaries):
            top = round(top_display * scale)
            bottom = min(round((top_display + height_display) * scale), scaled.height)
            chunk = scaled.crop((0, top, out_width, bottom))

            name = f"{key}-{index}@{scale}x.webp"
            path = SLICE_DIR / name
            chunk.save(path, "WEBP", quality=quality, method=6)

            built.append(
                {
                    "src": f"/slices/sub/{name}",
                    "width": chunk.width,
                    "height": chunk.height,
                    "bytes": path.stat().st_size,
                }
            )
        variants[scale] = built

    slices: list[dict[str, object]] = []
    for index, (top_display, height_display) in enumerate(boundaries):
        base = variants[BASE_SCALE][index]
        slices.append(
            {
                "src": base["src"],
                "srcSet": [
                    {"src": variants[scale][index]["src"], "scale": scale}
                    for scale in OUTPUT_SCALES
                ],
                "y": top_display,
                "displayHeight": height_display,
                "intrinsicWidth": base["width"],
                "intrinsicHeight": base["height"],
                "bytes": base["bytes"],
                "bytesByScale": {
                    str(scale): variants[scale][index]["bytes"] for scale in OUTPUT_SCALES
                },
            }
        )

    return slices, display_height



def write_registry(index: list[dict[str, object]]) -> None:
    """
    Sinh registry.ts voi import tinh cho tung file JSON.

    Dung import tinh chu khong doc bang fs luc chay: bundler cua Next chi truy
    vet duoc cac file duoc import, nen ban standalone/serverless moi co du du lieu.
    """
    lines = [
        "// TU DONG SINH boi tools/build-subpages.py — DUNG SUA TAY.",
        "// Chay lai: npm run parse:subpages",
        "",
    ]
    for row in index:
        key = slice_key(str(row["slug"]))
        ident = "s_" + key.replace("-", "_").replace("__", "___")
        lines.append(f'import {ident} from "./{key}.json";')

    lines.append("")
    lines.append("export const SUBPAGE_MODULES: Readonly<Record<string, unknown>> = {")
    for row in index:
        key = slice_key(str(row["slug"]))
        ident = "s_" + key.replace("-", "_").replace("__", "___")
        lines.append(f'  "{row["slug"]}": {ident},')
    lines.append("};")
    lines.append("")
    lines.append("export const SUBPAGE_SLUGS = Object.keys(SUBPAGE_MODULES);")
    lines.append("")

    (DATA_DIR / "registry.ts").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quality", type=int, default=80)
    parser.add_argument("--only", default=None, help="chi build slug nay")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    source_root = resolve_root(manifest["sourceRoot"])
    entries = manifest["pages"]

    titles = {e["slug"]: e.get("title", e["slug"]) for e in entries}
    titles.update(
        {
            "trai-nghiem": "Trải nghiệm",
            "giai-phap": "Giải pháp",
            "cong-nghe": "Công nghệ",
            "dai-ly": "Đại lý",
            "nhan-su": "Nhân sự",
        }
    )
    routes = {e["slug"]: f"/{e['slug']}" for e in entries}

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    subpages = [e for e in entries if not e.get("main")]
    if args.only:
        subpages = [e for e in subpages if e["slug"] == args.only]
        if not subpages:
            print(f"Khong tim thay slug {args.only!r}", file=sys.stderr)
            return 1
    else:
        for stale in DATA_DIR.glob("*.json"):
            stale.unlink()

    index: list[dict[str, object]] = []
    total_bytes = 0
    total_height = 0.0

    for entry in subpages:
        slug = entry["slug"]
        source = source_root / entry["dir"] / entry["file"]
        if not source.is_file():
            raise BuildError(f"Khong tim thay nguon: {source}")

        slices, height = cut_slices(source, slug, args.quality)
        page_bytes = sum(int(s["bytes"]) for s in slices)
        total_bytes += page_bytes
        total_height += height

        page = {
            "slug": slug,
            "route": f"/{slug}",
            "title": entry.get("title", slug),
            "section": entry["section"],
            "isArticle": bool(entry.get("article")),
            "canvasWidth": CANVAS_WIDTH,
            "height": height,
            "slices": slices,
            "nav": build_nav(entry["section"]),
            "contactForm": {"y": height - FORM_OFFSET_FROM_BOTTOM},
            "breadcrumb": breadcrumb(slug, titles, routes),
            "sourceFile": entry["file"],
        }

        (DATA_DIR / f"{slice_key(slug)}.json").write_text(
            json.dumps(page, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
        )

        index.append(
            {
                "slug": slug,
                "route": page["route"],
                "title": page["title"],
                "section": entry["section"],
                "isArticle": page["isArticle"],
                "height": height,
                "slices": len(slices),
            }
        )
        print(
            f"  {slug:<58} h={height:>6.0f}  {len(slices)} lat  {page_bytes / 1e6:5.2f} MB"
        )

    if not args.only:
        index.sort(key=lambda row: row["slug"])
        (DATA_DIR / "index.json").write_text(
            json.dumps(index, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
        )
        write_registry(index)

    print(
        f"\n{len(subpages)} trang con · tong cao {total_height:,.0f}px · "
        f"tong anh {total_bytes / 1e6:.1f} MB"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BuildError as error:
        print(f"Build that bai: {error}", file=sys.stderr)
        raise SystemExit(1)
