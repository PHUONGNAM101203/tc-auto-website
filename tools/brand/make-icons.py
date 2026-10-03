#!/usr/bin/env python3
"""
Sinh bo icon cua website tu logo TC Auto trong bo nhan dien thuong hieu.

Nguon: 'Design system/Design System 3.png' — ban logo chinh do phan giai cao nhat
co trong file thiet ke. Nen navy phang nen tach alpha duoc chinh xac tuyet doi,
khong phai to lai hay ve phong theo.

Mau lay dung theo trang LOGO & ICON cua bo nhan dien:
   Velvet Red #B0171F · Deep Teal #0D3B46

Chay: python3 tools/brand/make-icons.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from design_root import asset_roots, design_root, design_system  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent.parent
SOURCE = design_system()
APP = ROOT / "src" / "app"
PUBLIC = ROOT / "public"

# Vung chi chua RIENG emblem tron cua logo chinh (khong dinh chu "TC AUTO"
# va khong dinh duong ke trang tri phia tren).
SEARCH_BOX = (345, 635, 600, 880)
# Nen cua trang design system.
BACKGROUND = (2, 17, 28)
BG_TOLERANCE = 30

VELVET_RED = (176, 23, 31)
DEEP_TEAL = (13, 59, 70)
# Do phan giai master truoc khi thu nho ve tung kich thuoc icon.
MASTER = 1024
# Le xung quanh, tinh theo % canh — icon co le trong thi de nhin hon khi bo tron.
PADDING = 0.12


def load_mark() -> Image.Image:
    """Cat dung emblem, tach nen navy thanh alpha."""
    page = Image.open(SOURCE).convert("RGB")
    region = page.crop(SEARCH_BOX)
    pixels = np.asarray(region, dtype=np.int16)

    distance = np.abs(pixels - np.array(BACKGROUND, dtype=np.int16)).sum(axis=2)
    foreground = distance > BG_TOLERANCE

    rows = np.nonzero(foreground.any(axis=1))[0]
    cols = np.nonzero(foreground.any(axis=0))[0]
    if rows.size == 0 or cols.size == 0:
        raise RuntimeError("Khong tim thay logo trong vung da cho")

    box = (int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1)
    mark = region.crop(box)
    mask = foreground[box[1] : box[3], box[0] : box[2]]

    # Alpha muot theo do lech so voi nen -> giu duoc rang cua goc.
    sub = np.asarray(mark, dtype=np.int16)
    delta = np.abs(sub - np.array(BACKGROUND, dtype=np.int16)).sum(axis=2)
    alpha = np.clip((delta / 90.0) * 255, 0, 255).astype(np.uint8)
    alpha[~mask] = 0

    out = Image.fromarray(np.dstack([np.asarray(mark, dtype=np.uint8), alpha]), "RGBA")
    print(f"  emblem goc: {out.width}x{out.height}px")
    return out


def snap_colors(image: Image.Image) -> Image.Image:
    """
    Ep ve dung hai mau thuong hieu.
    Phong to lam mau bi lem; ep lai giu logo dung mau quy chuan o moi kich thuoc.
    """
    data = np.asarray(image, dtype=np.float32)
    rgb, alpha = data[..., :3], data[..., 3:]

    to_red = np.linalg.norm(rgb - np.array(VELVET_RED, dtype=np.float32), axis=2)
    to_teal = np.linalg.norm(rgb - np.array(DEEP_TEAL, dtype=np.float32), axis=2)

    nearest = np.where(
        (to_red < to_teal)[..., None],
        np.array(VELVET_RED, dtype=np.float32),
        np.array(DEEP_TEAL, dtype=np.float32),
    )
    # CHI ep nhung pixel von da gan mot trong hai mau thuong hieu. Pixel trang
    # (chu) hay xam (rang cua) phai giu nguyen — ep bua se bien chu thanh do.
    close = (np.minimum(to_red, to_teal) < 90)[..., None]
    snapped = np.where(close, nearest, rgb)

    return Image.fromarray(
        np.concatenate([snapped, alpha], axis=2).astype(np.uint8), "RGBA"
    )


def build_master(mark: Image.Image) -> Image.Image:
    """Dat emblem vao khung vuong co le, o do phan giai master."""
    inner = round(MASTER * (1 - PADDING * 2))
    ratio = min(inner / mark.width, inner / mark.height)
    scaled = snap_colors(
        mark.resize((round(mark.width * ratio), round(mark.height * ratio)), Image.LANCZOS)
    )

    canvas = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    canvas.alpha_composite(
        scaled, ((MASTER - scaled.width) // 2, (MASTER - scaled.height) // 2)
    )
    return canvas


def on_navy(image: Image.Image, radius_ratio: float = 0.22) -> Image.Image:
    """
    Ban nen navy bo goc — dung cho apple-icon va icon PWA.
    iOS khong ho tro nen trong suot: de nguyen se bi to nen trang, logo teal chim han.
    """
    from PIL import ImageDraw

    size = image.width
    plate = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=round(size * radius_ratio), fill=255
    )
    plate.paste(Image.new("RGBA", (size, size), (2, 17, 28, 255)), mask=mask)
    plate.alpha_composite(image)
    return plate


def main() -> int:
    if not SOURCE.is_file():
        print(f"Khong tim thay nguon: {SOURCE}")
        return 1

    master = build_master(load_mark())
    PUBLIC.mkdir(parents=True, exist_ok=True)

    written: list[str] = []

    def save(image: Image.Image, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path)
        written.append(f"{path.relative_to(ROOT)}  {image.width}x{image.height}")

    # favicon.ico nhieu kich thuoc — trinh duyet tu chon ban phu hop
    ico = APP / "favicon.ico"
    master.resize((256, 256), Image.LANCZOS).save(
        ico, sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    written.append(f"{ico.relative_to(ROOT)}  16/32/48/64/128/256")

    # Next.js tu gan <link rel="icon"> tu cac file nay
    save(master.resize((512, 512), Image.LANCZOS), APP / "icon.png")
    save(on_navy(master.resize((180, 180), Image.LANCZOS)), APP / "apple-icon.png")

    # Icon cho PWA manifest
    save(on_navy(master.resize((192, 192), Image.LANCZOS)), PUBLIC / "icon-192.png")
    save(on_navy(master.resize((512, 512), Image.LANCZOS)), PUBLIC / "icon-512.png")
    # Ban maskable can le rong hon de he dieu hanh cat theo hinh gi cung khong mat logo
    maskable = Image.new("RGBA", (512, 512), (2, 17, 28, 255))
    inner = master.resize((320, 320), Image.LANCZOS)
    maskable.alpha_composite(inner, (96, 96))
    save(maskable, PUBLIC / "icon-maskable-512.png")

    # Ban SVG nhung anh PNG — dung cho og:image va cho no dung o moi kich thuoc
    save(master.resize((1024, 1024), Image.LANCZOS), PUBLIC / "logo-mark.png")

    print("\n".join(f"  {line}" for line in written))
    print(f"\n  Xong {len(written)} tep icon.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
