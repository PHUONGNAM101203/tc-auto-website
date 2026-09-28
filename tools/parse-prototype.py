#!/usr/bin/env python3
"""
Tach TC-Auto-Website-Prototype.html (export tu Figma) thanh:
  - public/slices/{slug}-{i}.webp   : anh nen @2x
  - public/fonts/f{n}.woff2         : font subset
  - src/styles/fonts.css            : @font-face tro tro file
  - src/data/pages/{slug}.json      : page spec (toa do + text + style)

Chay: python3 tools/parse-prototype.py [duong-dan-prototype.html]
Idempotent: chay lai ghi de, khong tao rac.
"""
from __future__ import annotations

import base64
import json
import re
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = ROOT.parent / "TC-Auto-Website-Prototype.html"

SLICE_DIR = ROOT / "public" / "slices"
FONT_DIR = ROOT / "public" / "fonts"
DATA_DIR = ROOT / "src" / "data" / "pages"
STYLE_DIR = ROOT / "src" / "styles"

CANVAS_WIDTH = 1440

ROUTES = {
    "home": "/",
    "trai-nghiem": "/trai-nghiem",
    "giai-phap": "/giai-phap",
    "cong-nghe": "/cong-nghe",
    "dai-ly": "/dai-ly",
    "nhan-su": "/nhan-su",
}

NUMERIC_CSS = ("left", "top", "width", "height")


class ParseError(RuntimeError):
    """Prototype khong dung dinh dang mong doi."""


def webp_dimensions(data: bytes) -> tuple[int, int]:
    """Doc kich thuoc thuc cua file WebP (VP8 / VP8L / VP8X)."""
    if len(data) < 30 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise ParseError("Khong phai file WebP hop le")
    chunk = data[12:16]
    if chunk == b"VP8X":
        w = 1 + int.from_bytes(data[24:27], "little")
        h = 1 + int.from_bytes(data[27:30], "little")
        return w, h
    if chunk == b"VP8L":
        bits = int.from_bytes(data[21:25], "little")
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    if chunk == b"VP8 ":
        w, h = struct.unpack("<HH", data[26:30])
        return w & 0x3FFF, h & 0x3FFF
    raise ParseError(f"Chunk WebP khong ho tro: {chunk!r}")


def parse_style(raw: str) -> dict[str, str]:
    """'left:82px;top:252px' -> {'left': '82px', 'top': '252px'}"""
    out: dict[str, str] = {}
    for decl in raw.split(";"):
        if ":" not in decl:
            continue
        key, _, value = decl.partition(":")
        key, value = key.strip(), value.strip()
        if key and value:
            out[key] = value
    return out


def px(value: str | None) -> float | None:
    if not value:
        return None
    match = re.match(r"^(-?[\d.]+)px$", value.strip())
    return float(match.group(1)) if match else None


def write_fonts(html: str) -> int:
    """Ghi font ra file + sinh fonts.css giu nguyen unicode-range goc."""
    face_block = "\n".join(re.findall(r"@font-face\{[^}]*\}", html))
    if not face_block:
        raise ParseError("Khong tim thay @font-face trong prototype")

    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in FONT_DIR.glob("f*.woff2"):
        stale.unlink()

    index = 0

    def swap(match: re.Match[str]) -> str:
        nonlocal index
        (FONT_DIR / f"f{index}.woff2").write_bytes(base64.b64decode(match.group(1)))
        replacement = f"url(/fonts/f{index}.woff2)"
        index += 1
        return replacement

    css = re.sub(r"url\(data:font/woff2;base64,([A-Za-z0-9+/=]+)\)", swap, face_block)

    STYLE_DIR.mkdir(parents=True, exist_ok=True)
    (STYLE_DIR / "fonts.css").write_text(
        "/* Tu dong sinh boi tools/parse-prototype.py - dung sua tay. */\n" + css + "\n",
        encoding="utf-8",
    )
    return index


def write_slices(slug: str, section: str) -> list[dict[str, object]]:
    """Ghi anh nen cua 1 trang, tra ve metadata theo thu tu xep doc."""
    bg = re.search(r'<div class="bg">(.*?)</div>', section, re.S)
    if not bg:
        raise ParseError(f"Trang {slug} khong co khoi .bg")

    pattern = r'<img[^>]*style="height:([\d.]+)px"[^>]*src="data:image/webp;base64,([A-Za-z0-9+/=]+)"'
    matches = re.findall(pattern, bg.group(1))
    if not matches:
        raise ParseError(f"Trang {slug} khong co slice anh nao")

    SLICE_DIR.mkdir(parents=True, exist_ok=True)
    for stale in SLICE_DIR.glob(f"{slug}-*.webp"):
        stale.unlink()

    slices: list[dict[str, object]] = []
    offset = 0.0
    for i, (css_height, b64) in enumerate(matches):
        data = base64.b64decode(b64)
        name = f"{slug}-{i}.webp"
        (SLICE_DIR / name).write_bytes(data)
        intrinsic_w, intrinsic_h = webp_dimensions(data)
        display_h = float(css_height)
        slices.append(
            {
                "src": f"/slices/{name}",
                "y": offset,
                "displayHeight": display_h,
                "intrinsicWidth": intrinsic_w,
                "intrinsicHeight": intrinsic_h,
                "bytes": len(data),
            }
        )
        offset += display_h
    return slices


def parse_nav(section: str, slug: str) -> list[dict[str, object]]:
    pattern = r'<a class="nv( act)?" style="left:([\d.]+)px" href="#([a-z-]+)">([^<]*)<i>'
    nav = [
        {
            "label": label,
            "href": ROUTES.get(target, f"/{target}"),
            "x": float(x),
            "active": bool(active),
        }
        for active, x, target, label in re.findall(pattern, section)
    ]
    if not nav:
        raise ParseError(f"Trang {slug} khong co nav")
    return nav


ITEM_RE = re.compile(
    r'<(?P<tag>div|a) class="it (?P<cls>[^"]*)"'
    r'(?P<mid>[^>]*?)'
    r' style="(?P<style>[^"]*)">'
    r'(?P<inner>.*)</(?:div|a)>\s*$'
)


def drop_repeat(html: str) -> str:
    """Bo phan lap khi mot khoi chu bi NHAN BAN lien tiep trong ban thiet ke.

    Bon khoi tren cac trang chinh bi designer dan lai chinh no 2-4 lan: cung mot
    cau, khong sai mot dau phay. Tren khung co dinh cua Figma phan thua bi cat
    nen khong lo, nhung o day chu chay tu do thi hien het ca ba bon ban sao.
    Lay CHU KY NGAN NHAT.
    """
    text = html.strip()
    size = len(text)
    for period in range(1, size // 2 + 1):
        if size % period == 0 and text[:period] * (size // period) == text:
            return text[:period]
    return html


def parse_items(slug: str, section: str) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    for line in section.splitlines():
        line = line.strip()
        match = ITEM_RE.match(line)
        if not match:
            continue

        style = parse_style(match.group("style"))
        href_match = re.search(r'href="([^"]*)"', match.group("mid") or "")
        href = href_match.group(1) if href_match else None
        if href and href.startswith("#"):
            href = ROUTES.get(href[1:], href)
        elif href and href.startswith("javascript:"):
            href = None

        classes = match.group("cls").split()
        inner = match.group("inner")

        box = {key: px(style.get(key)) for key in NUMERIC_CSS}
        css = {k: v for k, v in style.items() if k not in NUMERIC_CSS}
        inner = drop_repeat(inner)

        items.append(
            {
                "id": f"{slug}-{len(items):03d}",
                "tag": "a" if match.group("tag") == "a" else "div",
                "classes": classes,
                "x": box["left"] or 0.0,
                "y": box["top"] or 0.0,
                "w": box["width"],
                "h": box["height"],
                "css": css,
                "href": href,
                "html": inner,
                "text": re.sub(r"<[^>]+>", "", inner).replace("&amp;", "&").strip(),
            }
        )

    if not items:
        raise ParseError(f"Trang {slug} khong parse duoc item nao")
    return items


SECTION_RE = re.compile(
    r'<section class="pg" id="p-(?P<slug>[a-z-]+)"[^>]*'
    r'data-title="(?P<title>[^"]*)"[^>]*'
    r'style="height:(?P<height>[\d.]+)px">(?P<body>.*?)</section>',
    re.S,
)


def parse(src: Path) -> dict[str, object]:
    html = src.read_text(encoding="utf-8", errors="replace")

    font_count = write_fonts(html)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for stale in DATA_DIR.glob("*.json"):
        stale.unlink()

    index: list[dict[str, object]] = []
    for match in SECTION_RE.finditer(html):
        slug = match.group("slug")
        body = match.group("body")
        form = re.search(r'<form class="ff" style="top:([\d.]+)px"', body)

        page = {
            "slug": slug,
            "route": ROUTES.get(slug, f"/{slug}"),
            "title": match.group("title"),
            "canvasWidth": CANVAS_WIDTH,
            "height": float(match.group("height")),
            "slices": write_slices(slug, body),
            "nav": parse_nav(body, slug),
            "items": parse_items(slug, body),
            "contactForm": {"y": float(form.group(1))} if form else None,
        }
        (DATA_DIR / f"{slug}.json").write_text(
            json.dumps(page, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
        )
        index.append(
            {
                "slug": slug,
                "route": page["route"],
                "title": page["title"],
                "height": page["height"],
                "items": len(page["items"]),
                "slices": len(page["slices"]),
            }
        )

    if len(index) != len(ROUTES):
        raise ParseError(f"Mong doi {len(ROUTES)} trang, parse duoc {len(index)}")

    (DATA_DIR / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    return {"fonts": font_count, "pages": index}


def main() -> int:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.is_file():
        print(f"Khong tim thay prototype: {src}", file=sys.stderr)
        return 1
    try:
        result = parse(src)
    except ParseError as error:
        print(f"Parse that bai: {error}", file=sys.stderr)
        return 1

    print(f"fonts: {result['fonts']} file")
    for page in result["pages"]:  # type: ignore[index]
        print(
            f"  {page['slug']:<12} {page['route']:<14} "
            f"h={page['height']:>7.0f}  items={page['items']:>3}  slices={page['slices']}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
