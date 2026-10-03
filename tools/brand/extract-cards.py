#!/usr/bin/env python3
"""
Tach RUOT cua 3 the o muc "Ứng dụng" (trang Cong nghe) ra khoi anh nen.

Vi sao: thiet ke ve chet 3 the vao anh, the giua to hon hai the ben. Muon bam de
doi cho nhau thi phan doi cho phai la mot phan tu rieng.

Chi tach RUOT (anh minh hoa + tieu de + phu de), KHONG tach ca the: khung va
vien cua tung the phai dung yen dung cho thiet ke ve. Neu tach ca the thi khi
doi cho, khung cua the nay bi phong to/thu nho vao o cua the kia va nhin ra
canh hai khung chong len nhau.

Viec nay lam hai thu:
  1. Cat rieng ruot cua tung the.
  2. Xoa ruot khoi lat nen, dung lai nen ben trong the bang cach noi suy NGANG
     tung hang giua hai dai mep trong — noi dung the deu can giua nen hai mep ay
     sach.

Chay: python3 tools/brand/extract-cards.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _backdrop import feathered, rebuild_columns  # noqa: E402

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from design_root import asset_roots, design_root, design_system  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent.parent
SOURCE = Path(
    design_root() / "4.Page_Công nghệ " / "1. Công Nghệ.png"
)
OUT = ROOT / "public" / "cards"
SLICE_DIR = ROOT / "public" / "slices"
SPEC = ROOT / "src" / "data" / "pages" / "cong-nghe.json"
DATA = ROOT / "src" / "data" / "app-cards.json"

CANVAS_WIDTH = 1440

# Than (khung) tung the, do tu anh nguon bang cach quet chuyen tiep sang/toi.
# Cac khung nay DUNG YEN — chung o lai trong anh nen.
FRAMES = [
    {
        "id": "hieu-suat",
        "title": "Hiệu suất",
        # Muc nay chua co trang rieng trong bo thiet ke — dan ve trang "Ứng dụng"
        # la muc cha cua ca ba the.
        "href": "/cong-nghe/ung-dung",
        "x": 139,
        "y": 2057,
        "width": 310,
        "height": 287,
    },
    {
        "id": "kho-ung-dung",
        "title": "Kho ứng dụng",
        "href": "/cong-nghe/ung-dung/kho-ung-dung",
        "x": 475,
        "y": 1970,
        "width": 492,
        "height": 400,
    },
    {
        "id": "cap-nhat-va-loi",
        "title": "Cập nhật & vá lỗi",
        "href": "/cong-nghe/ung-dung/cap-nhat-va-loi",
        "x": 989,
        "y": 2057,
        "width": 310,
        "height": 287,
    },
]

# Ruot nam thut vao trong khung bao nhieu.
#
# ĐỀU BẰNG 0 tu 02/10/2026. Truoc day thut 24/14/4, va chinh cho do la loi:
# khung bo tron SANG duoc ve chet trong anh nen, con ruot thi cat thut vao
# trong no — nhin ra HAI hinh vuong long nhau, mot nho trong mot to. Khach chi
# dung cho do: "chưa hợp nhất full khung hình vuông".
#
# Hoi do thut vao de chua lot dai moc noi suy, vi the con TRAO CHO cho nhau:
# ruot chay sang khung khac thi nen phia sau phai dung lai. Nay khach da bo
# han viec trao cho (bam the nao di thang the do), nen the dung yen va khong
# con ly do gi de thut.
INSET_SIDE = 0
INSET_TOP = 0
INSET_BOTTOM = 0

# Be day dai moc noi suy, tinh theo pixel hien thi.
ANCHOR = 14
# Be day vien mo dan cua anh the.
#
# BANG 0 tu 02/10/2026, cung luc voi INSET_* o tren. Lam mo dan chi dung khi
# anh cat THUT VAO trong khung: luc do mep anh nam giua vung nen, mo dan de
# khong lo duong cat. Nay anh cat TRUM ca khung, nen mep anh CHINH LA net vien
# sang cua khung — lam mo no di la net vien nhat han so voi thiet ke. Do duoc:
# 681 diem lech doc canh tren cua the giua.
FEATHER = 0

# The nao noi suy ngang duoc, the nao phai muon nen cua the khac. Suy tu du lieu
# chu khong viet cung: the to nhat la the giua.
MIDDLE_CARD = max(range(len(FRAMES)), key=lambda i: FRAMES[i]["width"] * FRAMES[i]["height"])
SIDE_CARDS = [i for i in range(len(FRAMES)) if i != MIDDLE_CARD]


def content_box(frame: dict) -> tuple[int, int, int, int]:
    return (
        frame["x"] + INSET_SIDE,
        frame["y"] + INSET_TOP,
        frame["width"] - INSET_SIDE * 2,
        frame["height"] - INSET_TOP - INSET_BOTTOM,
    )


def export_contents(page: Image.Image, scale: float) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []

    for frame in FRAMES:
        x, y, w, h = content_box(frame)
        art = page.crop(
            (round(x * scale), round(y * scale), round((x + w) * scale), round((y + h) * scale))
        ).convert("RGB")
        art = feathered(art, round(FEATHER * scale))

        target = OUT / f"{frame['id']}.webp"
        art.save(target, "WEBP", quality=88, method=6)
        entry = {
            "id": frame["id"],
            "title": frame["title"],
            "src": f"/cards/{frame['id']}.webp",
            "frame": {k: frame[k] for k in ("x", "y", "width", "height")},
            "content": {"x": x, "y": y, "width": w, "height": h},
        }
        if frame.get("href"):
            entry["href"] = frame["href"]
        manifest.append(entry)
        print(f"  {target.relative_to(ROOT)}  {art.width}x{art.height}  "
              f"{target.stat().st_size / 1e3:.0f} KB")

    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Ba the muc 'Ứng dụng' tren trang Cong nghe. `frame` la khung the — "
                    "DUNG YEN, van nam trong anh nen. `content` la ruot da duoc tach ra, "
                    "phan nay moi doi cho khi bam."
                ),
                "cards": manifest,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  {DATA.relative_to(ROOT)}")


def scrub_contents() -> int:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    boxes = [content_box(frame) for frame in FRAMES]
    top_most = min(b[1] for b in boxes)
    bottom_most = max(b[1] + b[3] for b in boxes)

    covering = [
        i
        for i, s in enumerate(spec["slices"])
        if s["y"] <= top_most and bottom_most <= s["y"] + s["displayHeight"]
    ]
    if not covering:
        raise SystemExit("Ruot the vat qua ranh giua hai lat — phai cat lat lai truoc.")
    index = covering[0]
    slice_top = spec["slices"][index]["y"]

    touched = 0
    for scale in (2, 3):
        name = f"cong-nghe-{index}.webp" if scale == 2 else f"cong-nghe-{index}@3x.webp"
        path = SLICE_DIR / name
        if not path.is_file():
            continue

        image = Image.open(path).convert("RGB")

        def pixel_box(index: int) -> tuple[int, int, int, int]:
            x, y, w, h = boxes[index]
            return (
                round(x * scale),
                round((y - slice_top) * scale),
                round((x + w) * scale),
                round((y + h - slice_top) * scale),
            )

        # Hai the BEN: noi suy ngang duoc, vi hai dai mep trong chi co nen.
        for index in SIDE_CARDS:
            box = pixel_box(index)
            image.paste(rebuild_columns(image, box, anchor=round(ANCHOR * scale)), (box[0], box[1]))

        # The GIUA: anh cuc quang trai kin ca ruot nen hai dai mep trong cung
        # dinh mau — noi suy tu do se ra mot vung loang. Thay vao do lay chinh
        # nen vua dung lai cua the ben roi keo cho vua, de ba the rong giong nhau.
        donor = image.crop(pixel_box(SIDE_CARDS[0]))
        middle = pixel_box(MIDDLE_CARD)
        image.paste(
            donor.resize((middle[2] - middle[0], middle[3] - middle[1]), Image.LANCZOS),
            (middle[0], middle[1]),
        )

        image.save(path, "WEBP", quality=80, method=6)
        touched += 1

    return touched


def main() -> int:
    if not SOURCE.is_file():
        print(f"Khong tim thay nguon: {SOURCE}")
        return 1

    page = Image.open(SOURCE)
    export_contents(page, page.width / CANVAS_WIDTH)

    touched = scrub_contents()
    print(f"\n  Da xoa ruot ba the khoi {touched} lat nen cua trang Cong nghe.")
    print("  Luu y: chay lai `npm run parse:prototype` se tao lai lat GOC (con ruot),")
    print("  nen phai chay lai lenh nay ngay sau do.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
