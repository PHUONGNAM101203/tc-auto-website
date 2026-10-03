#!/usr/bin/env python3
"""
Trich bo logo TC Auto day du tu 'Design system/Design System 3.png' (trang LOGO & ICON).

Moi bien the deu duoc CAT TU PIXEL GOC roi tach nen thanh alpha — khong to lai,
khong ve phong theo. Nen cua tung vung khac nhau (nen trang navy, panel xanh teal)
nen mau nen duoc lay tu chinh vien cua vung cat.

Chay: python3 tools/brand/make-logos.py
Ket qua: public/brand/*.png
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from design_root import asset_roots, design_root, design_system  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent.parent
SOURCE = design_system()
OUT = ROOT / "public" / "brand"

# Bien the logo va vung chua no trong anh nguon (toa do pixel goc).
VARIANTS = [
    {
        "name": "logo-horizontal-on-dark",
        "box": (330, 590, 1160, 860),
        "note": "Logo chính nằm ngang — emblem màu + chữ trắng. Dùng trên nền tối.",
        "target_width": 1600,
    },
    {
        "name": "logo-stacked-on-dark",
        "box": (300, 1370, 1010, 1860),
        "note": "Logo phụ xếp dọc — emblem trên, TC AUTO SOLUTIONS dưới. Nền tối.",
        "target_width": 1000,
    },
    {
        "name": "logo-stacked-compact-on-dark",
        "box": (300, 1920, 1010, 2390),
        "note": "Logo phụ xếp dọc gọn — chỉ có chữ TC AUTO. Nền tối.",
        "target_width": 1000,
    },
    {
        "name": "logo-mono-white",
        "box": (1650, 570, 2470, 810),
        "note": "Đơn sắc trắng — dùng khi nền quá nhiều màu hoặc in một màu.",
        "target_width": 1600,
    },
    {
        "name": "logo-mono-black",
        "box": (1650, 825, 2470, 1060),
        "note": "Đơn sắc đen — dùng trên nền sáng.",
        "target_width": 1600,
    },
]

# Do lech mau toi da con coi la nen (tong |dR|+|dG|+|dB|).
BG_TOLERANCE = 34
# Do lech de alpha dat 255 — quyet do muot cua vien.
ALPHA_RAMP = 95.0


def background_colour(region: np.ndarray) -> np.ndarray:
    """
    Mau nen = mau xuat hien nhieu nhat tren vien cua vung cat.
    Lay tu vien chu khong lay ca vung: giua vung la logo, se lam lech ket qua.
    """
    border = np.concatenate(
        [
            region[0, :, :],
            region[-1, :, :],
            region[:, 0, :],
            region[:, -1, :],
        ]
    )
    colours, counts = np.unique(border.reshape(-1, 3), axis=0, return_counts=True)
    return colours[counts.argmax()].astype(np.int16)


def longest_band(mask: np.ndarray) -> tuple[int, int] | None:
    """Dai hang lien nhau DAI NHAT trong mask.

    Trong ban Design System co mot vach trang tri nam ngay tren logo. Neu chi
    cat theo hang dau/hang cuoi co noi dung thi vach do bi giu lai, thanh mot
    gach mo o mep tren logo. Lay dai lien nhau dai nhat thi chi con than logo.
    """
    runs: list[tuple[int, int]] = []
    start: int | None = None
    for index, value in enumerate(mask):
        if value and start is None:
            start = index
        if not value and start is not None:
            runs.append((start, index - 1))
            start = None
    if start is not None:
        runs.append((start, len(mask) - 1))
    return max(runs, key=lambda run: run[1] - run[0]) if runs else None


def extract(page: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    region = np.asarray(page.crop(box).convert("RGB"), dtype=np.int16)
    bg = background_colour(region)

    distance = np.abs(region - bg).sum(axis=2)
    alpha = np.clip((distance / ALPHA_RAMP) * 255, 0, 255).astype(np.uint8)
    alpha[distance <= BG_TOLERANCE] = 0

    rows = longest_band((alpha > 8).any(axis=1))
    cols = np.nonzero((alpha > 8).any(axis=0))[0]
    if rows is None or cols.size == 0:
        raise RuntimeError(f"Vung {box} khong co logo")

    rgba = np.dstack([region.astype(np.uint8), alpha])
    trimmed = rgba[rows[0] : rows[1] + 1, cols[0] : cols[-1] + 1]
    return Image.fromarray(trimmed, "RGBA")


def main() -> int:
    if not SOURCE.is_file():
        print(f"Khong tim thay nguon: {SOURCE}")
        return 1

    page = Image.open(SOURCE)
    OUT.mkdir(parents=True, exist_ok=True)

    lines: list[str] = []
    for variant in VARIANTS:
        logo = extract(page, variant["box"])
        scale = variant["target_width"] / logo.width
        big = logo.resize(
            (variant["target_width"], max(1, round(logo.height * scale))), Image.LANCZOS
        )

        path = OUT / f"{variant['name']}.png"
        big.save(path)
        lines.append(
            f"  {variant['name']:<32} cat {logo.width}x{logo.height} -> {big.width}x{big.height}"
        )

    # README nho de nguoi khac biet dung ban nao
    readme = ["# Bộ nhận diện TC Auto Solutions", ""]
    readme += [
        "Trích trực tiếp từ `Design system/Design System 3.png` bằng",
        "`tools/brand/make-logos.py` — pixel gốc, không vẽ lại.",
        "",
        "| Tệp | Dùng khi |",
        "|---|---|",
    ]
    for variant in VARIANTS:
        readme.append(f"| `{variant['name']}.png` | {variant['note']} |")
    readme += [
        "| `../logo-mark.png` | Chỉ riêng emblem tròn — favicon, avatar, watermark. |",
        "",
        "## Màu chuẩn",
        "",
        "| | Mã | RGB |",
        "|---|---|---|",
        "| Velvet Red | `#B0171F` | 176, 23, 31 |",
        "| Deep Teal | `#0D3B46` | 13, 59, 70 |",
        "| White | `#FFFFFF` | 255, 255, 255 |",
        "",
        "## Quy tắc (theo bộ nhận diện)",
        "",
        "- Chiều cao logo tiêu chuẩn **40px**, tối thiểu **30px**",
        "- Giữ đúng tỷ lệ · dùng đúng màu · chọn bản phù hợp với nền",
        "- Không kéo méo, không tự đổi màu, không xoay, không thêm hiệu ứng",
        "- Không đặt logo trên nền làm giảm khả năng nhận diện",
        "",
    ]
    (OUT / "README.md").write_text("\n".join(readme), encoding="utf-8")

    print("\n".join(lines))
    print(f"\n  {len(VARIANTS)} biến thể + README vào {OUT.relative_to(ROOT)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
