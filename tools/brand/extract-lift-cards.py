#!/usr/bin/env python3
"""
Tach cac THE ANH duoc ve chet vao anh thiet ke, de ro chuot vao the nao thi the
do noi len.

Muon nhac mot the len thi the do phai la phan tu rieng — va cho no vua roi phai
duoc DUNG LAI nen, neu khong se lo ra chinh tam anh cu nam duoi.

Chay: python3 tools/brand/extract-lift-cards.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _backdrop import feathered, rebuild_background  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent.parent
DESIGN = Path("/Users/phuongnam/Downloads/[TC] Website/Website_TC")
OUT = ROOT / "public" / "lift"
SLICE_DIR = ROOT / "public" / "slices"
DATA = ROOT / "src" / "data" / "lift-cards.json"

CANVAS_WIDTH = 1440
# Be day vien mo dan, tinh bang pixel hien thi. Tren nen co van (navy + luoi)
# thi can mo dan de mep tan vao nen; tren nen PHANG (trang thuan) thi mo dan lai
# tao quang sang — de 0, cat sac moi trung khop.
FEATHER = 6
FEATHER_FLAT = 0

# Bon o muc "Công nghệ" tren trang chu duoc ngan bang vach doc 1px, do duoc tai
# x = 136/394, 440/698, 744/1002, 1048/1304. Noi dung that chay tu y 2068 den
# 2392 — rong hon doan vach: phia tren co anh sang tran cua anh EXPERIENCE LAB,
# phia duoi co dong phu de thu hai ("Tin cậy").
TECH_RULES = ((136, 394), (440, 698), (744, 1002), (1048, 1304))
TECH_TOP, TECH_HEIGHT, TECH_PAD = 2066, 330, 2

GROUPS = [
    {
        "page": "home",
        "slug": "home",
        "source": DESIGN / "1. Page_Home" / "Home.png",
        "spec": ROOT / "src" / "data" / "pages" / "home.json",
        "slice_prefix": "home",
        # Nen sau bon o la navy co gradient doc -> dung lai bang noi suy doc.
        # Hai dai moc (day 12px, ngay tren va duoi) phai sach: do duoc y
        # 2015..2065 va y 2395..2425 khong co gi.
        "rebuild": "interpolate",
        "anchor": 12,
        "cards": [
            {
                "id": "innovation",
                "title": "INNOVATION",
                "subtitle": "Tiên phong công nghệ",
                "href": "/cong-nghe/tien-phong-cong-nghe",
                "x": TECH_RULES[0][0] - TECH_PAD,
                "y": TECH_TOP,
                "width": TECH_RULES[0][1] - TECH_RULES[0][0] + TECH_PAD * 2,
                "height": TECH_HEIGHT,
            },
            {
                "id": "applications",
                "title": "APPLICATIONS",
                "subtitle": "Ứng dụng đa dạng",
                "href": "/cong-nghe/ung-dung",
                "x": TECH_RULES[1][0] - TECH_PAD,
                "y": TECH_TOP,
                "width": TECH_RULES[1][1] - TECH_RULES[1][0] + TECH_PAD * 2,
                "height": TECH_HEIGHT,
            },
            {
                "id": "warranty",
                "title": "WARRANTY",
                "subtitle": "Bảo hành chính hãng",
                "href": "/cong-nghe",
                "x": TECH_RULES[2][0] - TECH_PAD,
                "y": TECH_TOP,
                "width": TECH_RULES[2][1] - TECH_RULES[2][0] + TECH_PAD * 2,
                "height": TECH_HEIGHT,
            },
            {
                "id": "experience-lab",
                "title": "EXPERIENCE LAB",
                "subtitle": "Thử nghiệm · Trải nghiệm · Tin cậy",
                "href": "/cong-nghe",
                "x": TECH_RULES[3][0] - TECH_PAD,
                "y": TECH_TOP,
                "width": TECH_RULES[3][1] - TECH_RULES[3][0] + TECH_PAD * 2,
                "height": TECH_HEIGHT,
            },
        ],
    },
    {
        "page": "dai-ly",
        "slug": "dai-ly",
        "source": DESIGN / "5.Page_Đại lý " / "1. Đại lý.png",
        "spec": ROOT / "src" / "data" / "pages" / "dai-ly.json",
        "slice_prefix": "dai-ly",
        # Muc nay nam tren nen TRANG THUAN -> chi can to trang, khong can noi suy.
        "rebuild": "white",
        "cards": [
            {
                "id": "hanh-trinh-hop-tac",
                "title": "HÀNH TRÌNH HỢP TÁC",
                "subtitle": "Tin cậy từ kết nối. Bền vững trong đồng hành.",
                "href": "/dai-ly/cau-chuyen-dong-hanh",
                "x": 82,
                "y": 1574,
                "width": 358,
                "height": 495,
            },
            {
                "id": "gia-tri-cung-dat-duoc",
                "title": "GIÁ TRỊ CÙNG ĐẠT ĐƯỢC",
                "subtitle": "Cùng tạo giá trị. Cùng phát triển bền vững.",
                "href": "/dai-ly/cau-chuyen-dong-hanh",
                "x": 454,
                "y": 1574,
                "width": 358,
                "height": 495,
            },
        ],
    },
    {
        "page": "giai-phap",
        "slug": "giai-phap",
        "source": DESIGN / "3.Page_Giải pháp" / "1.Giải pháp.png",
        "spec": ROOT / "src" / "data" / "pages" / "giai-phap.json",
        "slice_prefix": "giai-phap",
        # Nen quanh ba the la navy PHANG (#02111c) — to lai la xong.
        "rebuild": "fill",
        "fill": (2, 17, 28),
        "cards": [
            {
                "id": "phim-3m",
                "title": "PHIM CÁCH NHIỆT 3M",
                "subtitle": "Giải pháp cách nhiệt cao cấp",
                "href": "/giai-phap/phim-dan-kinh",
                "x": 49,
                "y": 2205,
                "width": 429,
                "height": 697,
            },
            {
                "id": "phim-nano-sun",
                "title": "PHIM CÁCH NHIỆT NANO SUN",
                "subtitle": "Công nghệ Nano window film",
                "href": "/giai-phap/phim-dan-kinh",
                "x": 502,
                "y": 2205,
                "width": 429,
                "height": 697,
            },
            {
                "id": "phim-5do",
                "title": "PHIM CÁCH NHIỆT 5DO",
                "subtitle": "Lựa chọn tối ưu chi phí",
                "href": "/giai-phap/phim-dan-kinh",
                "x": 955,
                "y": 2205,
                "width": 429,
                "height": 697,
            },
        ],
    },
]


def export_group(group: dict) -> list[dict]:
    OUT.mkdir(parents=True, exist_ok=True)
    page = Image.open(group["source"])
    scale = page.width / CANVAS_WIDTH
    manifest = []

    for card in group["cards"]:
        art = page.crop(
            (
                round(card["x"] * scale),
                round(card["y"] * scale),
                round((card["x"] + card["width"]) * scale),
                round((card["y"] + card["height"]) * scale),
            )
        ).convert("RGB")
        feather = FEATHER_FLAT if group["rebuild"] in ("white", "fill") else FEATHER
        art = feathered(art, round(feather * scale)) if feather else art.convert("RGBA")

        target = OUT / f"{group['slug']}-{card['id']}.webp"
        art.save(target, "WEBP", quality=88, method=6)
        manifest.append({**card, "src": f"/lift/{group['slug']}-{card['id']}.webp"})
        print(f"  {target.relative_to(ROOT)}  {art.width}x{art.height}  "
              f"{target.stat().st_size / 1e3:.0f} KB")

    return manifest


def scrub_group(group: dict) -> int:
    """Dung lai nen o cho cac the vua duoc tach ra.

    Cum the co the vat qua ranh giua hai lat nen, nen phai cat theo tung lat.
    Rieng kieu "interpolate" thi doi hoi ca cum nam gon trong MOT lat: no lay
    dai moc ngay tren va ngay duoi cum, ma lat bi cat doi thi mot dau bi mat.
    """
    spec = json.loads(Path(group["spec"]).read_text(encoding="utf-8"))
    left = min(c["x"] for c in group["cards"]) - 8
    right = max(c["x"] + c["width"] for c in group["cards"]) + 8
    top = min(c["y"] for c in group["cards"]) - 4
    bottom = max(c["y"] + c["height"] for c in group["cards"]) + 4

    holders = [
        i
        for i, s in enumerate(spec["slices"])
        if not (bottom <= s["y"] or top >= s["y"] + s["displayHeight"])
    ]
    if not holders:
        raise SystemExit(f"[{group['slug']}] khong tim thay lat nao chua cum the.")
    if group["rebuild"] == "interpolate" and len(holders) > 1:
        raise SystemExit(
            f"[{group['slug']}] cum the vat qua ranh giua hai lat — kieu noi suy "
            "can ca cum nam gon trong mot lat."
        )

    touched = 0
    for index in holders:
        slice_top = spec["slices"][index]["y"]
        slice_bottom = slice_top + spec["slices"][index]["displayHeight"]
        for scale in (2, 3):
            suffix = "" if scale == 2 else "@3x"
            path = SLICE_DIR / f"{group['slice_prefix']}-{index}{suffix}.webp"
            if not path.is_file():
                continue

            image = Image.open(path).convert("RGB")
            box = (
                round(left * scale),
                round((max(top, slice_top) - slice_top) * scale),
                round(right * scale),
                round((min(bottom, slice_bottom) - slice_top) * scale),
            )
            if group["rebuild"] == "white":
                image.paste((255, 255, 255), box)
            elif group["rebuild"] == "fill":
                image.paste(tuple(group["fill"]), box)
            else:
                anchor = round(group.get("anchor", 10) * scale)
                image.paste(rebuild_background(image, box, anchor=anchor), (box[0], box[1]))
            image.save(path, "WEBP", quality=80, method=6)
            touched += 1

    return touched


def main() -> int:
    pages: dict[str, list[dict]] = {}
    for group in GROUPS:
        if not Path(group["source"]).is_file():
            print(f"Khong tim thay nguon: {group['source']}")
            return 1
        pages.setdefault(group["page"], []).extend(export_group(group))
        print(f"    -> xoa khoi {scrub_group(group)} lat nen cua trang {group['page']}")

    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Cac the anh duoc tach khoi anh nen de ro chuot vao la noi len. Hinh "
                    "hoc do tu ban thiet ke; cho cac the vua roi da duoc dung lai nen."
                ),
                "pages": pages,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"\n  {DATA.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
