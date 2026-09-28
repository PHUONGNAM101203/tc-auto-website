#!/usr/bin/env python3
"""
Dung lai nen o mot vung anh, sau khi da boc phan tu ra khoi do.

Dung chung cho cac cong cu tach phan tu khoi lat nen (extract-cards.py,
extract-tech-boxes.py): chung deu phai xoa mot cum khoi anh roi va lai nen.
"""
from __future__ import annotations

import numpy as np
from PIL import Image

# Do day dai pixel dung lam moc noi suy, ngay tren va ngay duoi vung can xoa.
ANCHOR = 10

# Bien do hat nhieu them vao vung dung lai. Nen la mot dai navy rat toi, noi suy
# tuyen tinh thuan tuy se sinh ra vet soc (banding) khi nen WebP; mot chut hat
# theo dung do lech chuan cua nen that se pha vet soc ma mat khong nhan ra.
DITHER = 1.6


def _blur_columns(line: np.ndarray, radius: int) -> np.ndarray:
    """Trung binh truot theo truc x tren mot dai mot hang (x, kenh mau)."""
    window = radius * 2 + 1
    padded = np.pad(line, ((radius, radius), (0, 0)), mode="edge")
    kernel = np.ones(window, dtype=np.float32) / window
    return np.stack(
        [np.convolve(padded[:, c], kernel, mode="valid") for c in range(line.shape[1])],
        axis=1,
    )


def rebuild_background(
    image: Image.Image,
    box: tuple[int, int, int, int],
    anchor: int = ANCHOR,
    smooth: int = 0,
) -> Image.Image:
    """Dung lai nen trong `box` bang cach noi suy doc tung cot.

    Vi sao khong lat lap mot dai nen: nen thuong co gradient doc (vang sang hat
    len tu duoi) nen dai nao lat lap cung lo mach ngang. Noi suy giua dai ngay
    tren va dai ngay duoi giu duoc ca gradient lan cac vach luoi DOC, vi moi cot
    tu noi suy theo gia tri cua chinh no.
    """
    x0, y0, x1, y1 = box
    if y0 - anchor < 0 or y1 + anchor > image.height:
        raise ValueError("khong du le de lay moc noi suy")

    pixels = np.asarray(image, dtype=np.float32)
    top = pixels[y0 - anchor : y0, x0:x1].mean(axis=0)
    bottom = pixels[y1 : y1 + anchor, x0:x1].mean(axis=0)

    # Nen vung xoa von bi che boi mot day the, hai dai moc van con vet sang toi
    # theo tung cot cua the. Lam muot NGANG hai dai moc thi vet do bien mat ma
    # gradient ngang that cua nen — von rat thoai — van giu nguyen.
    if smooth > 0:
        top = _blur_columns(top, smooth)
        bottom = _blur_columns(bottom, smooth)

    ramp = np.linspace(0.0, 1.0, y1 - y0, dtype=np.float32)[:, None, None]
    patch = top[None] * (1.0 - ramp) + bottom[None] * ramp

    noise = np.random.default_rng(7).normal(0.0, DITHER, patch.shape).astype(np.float32)
    patch = np.clip(patch + noise, 0.0, 255.0)

    return Image.fromarray(patch.astype(np.uint8), "RGB")


def feathered(card: Image.Image, pad: int) -> Image.Image:
    """Lam mo dan vien anh ve trong suot tren be day `pad` (tinh bang pixel anh).

    Phan tu duoc cat kem mot vien nen. Neu de vien cung, dat len nen da dung lai
    se lo mot o chu nhat. Mo dan thi mep tan vao nen.
    """
    width, height = card.size

    def ramp(length: int) -> np.ndarray:
        line = np.ones(length, dtype=np.float32)
        edge = np.linspace(0.0, 1.0, pad, dtype=np.float32)
        line[:pad] = edge
        line[-pad:] = edge[::-1]
        return line

    out = card.convert("RGBA")
    alpha = np.outer(ramp(height), ramp(width))
    out.putalpha(Image.fromarray((alpha * 255).astype(np.uint8), "L"))
    return out


def rebuild_columns(
    image: Image.Image, box: tuple[int, int, int, int], anchor: int = ANCHOR
) -> Image.Image:
    """Dung lai nen trong `box` bang cach noi suy NGANG tung hang.

    Dung khi vung can xoa cham sat day khung chua no (vi du ruot mot the: chu
    phu de nam ngay tren duong vien), khong con cho lay moc o tren/duoi. Hai dai
    moc nam ngay ben trai va ben phai vung xoa; noi dung cua the (anh minh hoa,
    tieu de, phu de) deu can giua nen hai mep trong ay sach.

    Moi hang tu noi suy theo gia tri hai dau CUA CHINH NO, nen bien thien doc
    cua nen — phan kho tai tao nhat — duoc giu nguyen.
    """
    x0, y0, x1, y1 = box
    if x0 - anchor < 0 or x1 + anchor > image.width:
        raise ValueError("khong du le de lay moc noi suy")

    pixels = np.asarray(image, dtype=np.float32)
    left = pixels[y0:y1, x0 - anchor : x0].mean(axis=1)
    right = pixels[y0:y1, x1 : x1 + anchor].mean(axis=1)

    ramp = np.linspace(0.0, 1.0, x1 - x0, dtype=np.float32)[None, :, None]
    patch = left[:, None, :] * (1.0 - ramp) + right[:, None, :] * ramp

    noise = np.random.default_rng(11).normal(0.0, DITHER, patch.shape).astype(np.float32)
    patch = np.clip(patch + noise, 0.0, 255.0)

    return Image.fromarray(patch.astype(np.uint8), "RGB")
