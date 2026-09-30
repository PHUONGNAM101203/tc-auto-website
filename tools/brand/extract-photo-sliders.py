#!/usr/bin/env python3
"""
Tach cac SLIDER ANH duoc ve chet vao anh thiet ke.

Thiet ke ve mot tam anh kem mui ten "›" — y la con anh nua, keo di. Muon mui ten
do bam duoc thi vung anh phai la phan tu that.

Cach lam (giong dai the muc Giai phap):
  - Slide DAU cat tu CHINH ban thiet ke -> luc dung yen man hinh khong lech
    mot pixel nao.
  - Cac slide sau lay tu bo tai nguyen roi, dua ve cung khung.
  - KHONG xoa gi khoi anh nen: slide dau nam dung cho anh goc nen phu len la vua.

Chay: python3 tools/brand/extract-photo-sliders.py
"""
from __future__ import annotations

import sys
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
DOWNLOADS = Path("/Users/phuongnam/Downloads/[TC] Website")
DESIGN = DOWNLOADS / "Website_TC"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from asset_source import find as find_asset  # noqa: E402


def ASSET(*parts: str):
    """Ban to nhat cua anh nay trong cac bo tai nguyen."""
    return find_asset("/".join(parts))
OUT = ROOT / "public" / "sliders"
DATA = ROOT / "src" / "data" / "photo-sliders.json"

CANVAS_WIDTH = 1440

SLIDERS = [
    {
        "page": "home",
        "id": "cau-chuyen-khoi-nghiep",
        "label": "Câu chuyện khởi nghiệp",
        "source": DESIGN / "1. Page_Home" / "Home.png",
        # Khung tam anh truoc, do bang cach dan anh roi len ban thiet ke va tim
        # vi tri lech it nhat, roi chinh lai bang mat.
        "box": {"x": 458, "y": 2976, "width": 876, "height": 376},
        # Mui ten "›" ve san trong anh, do bang tools/detect-arrows.py.
        "arrow": {"x": 1335, "y": 3108, "width": 12, "height": 33},
        "extra": [
            ASSET("0. Homepage", "Rectangle 23 — 3D Transform.png"),
            ASSET("0. Homepage", "Rectangle 23 — 3D Transform-1.png"),
        ],
    },
    {
        "page": "dai-ly",
        "id": "chan-dung-dai-ly",
        "label": "Chân dung đại lý",
        "source": DESIGN / "5.Page_Đại lý " / "1. Đại lý.png",
        # Do bang cach quet vung sang hon nen navy trong dai y 2150..2750.
        "box": {"x": 650, "y": 2167, "width": 697, "height": 416},
        "arrow": {"x": 1386, "y": 2370, "width": 12, "height": 30},
        "extra": [
            ASSET("4. Page_Đại lý", "Rectangle 186 — Perspective Warp — Perspective Warp-1.png"),
            ASSET("4. Page_Đại lý", "Rectangle 186 — Perspective Warp — Perspective Warp-2.png"),
        ],
    },
    {
        "page": "nhan-su",
        "id": "con-nguoi-tc",
        "label": "Con người TC",
        "source": DESIGN / "6.Page_Nhân Sự " / "1. Nhân sự.png",
        # Do bang cach quet vung sang hon nen navy trong dai y 1300..1900.
        "box": {"x": 310, "y": 1312, "width": 811, "height": 447},
        # Muc nay co CA HAI mui ten, do bang tools/detect-arrows.py.
        "arrow": {"x": 1218, "y": 1497, "width": 12, "height": 33},
        "prev": {"x": 210, "y": 1497, "width": 12, "height": 33},
        "extra": [
            ASSET("5. Page_Nhân sự", "Rectangle 186.png"),
            ASSET("5. Page_Nhân sự", "Rectangle 187.png"),
            ASSET("5. Page_Nhân sự", "Rectangle 188.png"),
        ],
    },
]


#: Duoi muc nay so voi slide dau thi coi la anh da bi lam toi san, phai keo lai.
DIM_RATIO = 0.7


def stats(image: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    """Trung binh va do lech tung kenh mau, chi tinh tren phan DAC cua anh."""
    a = np.asarray(image.convert("RGBA"), dtype=np.float32)
    mask = a[..., 3] > 200
    rgb = a[..., :3][mask]
    return rgb.mean(axis=0), rgb.std(axis=0) + 1e-6


def match_exposure(art: Image.Image, mean: np.ndarray, std: np.ndarray) -> Image.Image:
    """
    Keo sang/mau cua mot slide ve ngang voi slide dau.

    Vi sao can: may tam phia sau trong bo tai nguyen la ban da duoc LAM TOI SAN
    cho hop voi vi tri "nam sau chong" trong ban thiet ke. Truoc day chuyen do
    khong lo ra vi chung khong bao gio duoc dua len tren cung. Tu khi chong anh
    xoay duoc (khach yeu cau 30/09/2026) thi bam vai cai la mot tam gan nhu den
    si nhay len dau — khach bao ngay (anh 67).

    Bo tai nguyen KHONG co ban sang cua hai tam do, nen o day keo lai bang
    phep tuyen tinh tung kenh: dua trung binh va do lech cua phan dac ve dung
    bang slide dau. Day la phep gan dung; muon mau that thi phai xin khach
    xuat lai anh goc.
    """
    a = np.asarray(art.convert("RGBA"), dtype=np.float32)
    alpha = a[..., 3:]
    rgb = a[..., :3]
    m, sd = stats(art)
    fixed = (rgb - m) * (std / sd) + mean
    out = np.concatenate([np.clip(fixed, 0, 255), alpha], axis=2)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, list[dict]] = {}

    for slider in SLIDERS:
        if not slider["source"].is_file():
            print(f"  Thieu ban thiet ke: {slider['source']}")
            return 1

        page = Image.open(slider["source"])
        scale = page.width / CANVAS_WIDTH
        box = slider["box"]
        crop = (
            round(box["x"] * scale),
            round(box["y"] * scale),
            round((box["x"] + box["width"]) * scale),
            round((box["y"] + box["height"]) * scale),
        )

        slides = []
        first = page.crop(crop).convert("RGB")
        target = OUT / f"{slider['id']}-1.webp"
        first.save(target, "WEBP", quality=88, method=6)
        slides.append(f"/sliders/{slider['id']}-1.webp")
        print(f"  {target.relative_to(ROOT)}  {first.width}x{first.height}  (cat tu ban thiet ke)")

        for index, path in enumerate(slider["extra"], start=2):
            if not path.is_file():
                print(f"  Thieu anh: {path}")
                return 1
            # GIU kenh trong suot: anh da duoc cat theo hinh nghieng 3D, phan
            # ngoai hinh phai trong de cac lop anh phia sau (van nam trong anh
            # nen) hien ra. Chuyen sang RGB la mat, thanh mot o den chan het.
            art = Image.open(path).convert("RGBA")

            # KHONG phong to qua do phan giai goc: truoc day ep moi slide ve
            # cung kich thuoc voi slide cat tu thiet ke (@3x), nen anh roi nho
            # hon bi keo gian ra va mo nhoe. Giu nguyen do phan giai goc, chi
            # dua ve dung TI LE cua khung — trinh duyet thu nho lai luon net.
            ratio = first.width / first.height
            width = min(first.width, art.width)
            height = round(width / ratio)
            if height > art.height:
                height = art.height
                width = round(height * ratio)
            art = art.resize((width, height), Image.LANCZOS)

            # Anh nao toi hon han slide dau thi keo lai cho ca chong dong bo.
            # Chi dung khi chenh lech LON — cac slide von da dung sang thi giu
            # nguyen, khong dong vao.
            base_mean, base_std = stats(first)
            art_mean, _ = stats(art)
            if art_mean.mean() < base_mean.mean() * DIM_RATIO:
                before = art_mean.mean()
                art = match_exposure(art, base_mean, base_std)
                print(
                    f"    keo sang {path.name}: {before:.0f} -> {stats(art)[0].mean():.0f}"
                    " (anh trong bo tai nguyen da bi lam toi san)"
                )

            target = OUT / f"{slider['id']}-{index}.webp"
            art.save(target, "WEBP", quality=88, method=6)
            slides.append(f"/sliders/{slider['id']}-{index}.webp")
            print(f"  {target.relative_to(ROOT)}  {art.width}x{art.height}  ({path.name})")

        entry = {
            "id": slider["id"],
            "label": slider["label"],
            "box": box,
            "arrow": slider["arrow"],
            "slides": slides,
        }
        if slider.get("prev"):
            entry["prev"] = slider["prev"]
        manifest.setdefault(slider["page"], []).append(entry)

    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Slider anh ve chet trong ban thiet ke. Slide dau cat tu chinh ban "
                    "thiet ke nen luc dung yen trung khop tuyet doi; cac slide sau lay tu "
                    "bo tai nguyen roi. Khong xoa gi khoi anh nen — slide dau phu dung cho."
                ),
                "pages": manifest,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  {DATA.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
