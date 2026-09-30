#!/usr/bin/env python3
"""
Go cho NUT DE LEN CHU o mot the tai ung dung.

── Vi sao ──────────────────────────────────────────────────────────────────
Trang "Cập nhật & vá lỗi" xep the theo luoi 3 cot x 5 hang; moi the co mot
dong tieu de roi den nut "TẢI VỀ" o mot do cao CO DINH. Mot the co tieu de
dai hon cac the khac — "[CẬP NHẬT] ES File Explorer File Manager" — nen no
xuong hai dong, va dong thu hai chui xuong duoi mep tren cua nut. Trong ban
thiet ke nut duoc ve DE LEN chu (khach bao 30/09/2026: "chỗ này đừng để nút
đè chữ").

Ca tieu de lan nut deu nam TRONG anh nen, nen khong the chi keo nut xuong:
phan chu bi nut che da mat han khoi anh, keo nut di chi lo ra nen trong.

── Cach sua ────────────────────────────────────────────────────────────────
Xoa ca cum (hai dong tieu de + nut) khoi anh nen, roi ve lai bang PHAN TU
THAT: tieu de tu xuong dong theo be rong the, nut nam ngay duoi no. Chi lam
voi DUY NHAT the bi de — 29 the con lai giu nguyen tung diem anh cua thiet ke.

Chay: python3 tools/brand/fix-overlap-card.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _backdrop import feathered, rebuild_background  # noqa: E402

SPEC_DIR = ROOT / "src" / "data" / "subpages"
SLICE_DIR = ROOT / "public" / "slices" / "sub"
DATA = ROOT / "src" / "data" / "overlap-cards.json"

CANVAS_WIDTH = 1440

#: The duy nhat bi de, do tu ban thiet ke:
#:   dong 1  y 1348,5..1369,4   x 584,0..856,1
#:   dong 2  y 1370,1..1387,3   x 656,9..785,1   <- bi nut che tu y 1383
#:   nut     y 1383..1415       x 640,0..798,5   (158x32)
#: Cum can xoa lay rong ra vai pixel cho bong chu va vien bo tron cua nut.
CARD = {
    "page": "cong-nghe/ung-dung/cap-nhat-va-loi",
    "stem": "cong-nghe__ung-dung__cap-nhat-va-loi",
    "scrub": {"x": 556, "y": 1338, "width": 328, "height": 86},
    # Khung ve lai: giua the, de tieu de tu can giua.
    "footer": {"x": 556, "y": 1340, "width": 328},
    "title": "[CẬP NHẬT] ES File Explorer File Manager",
    # Duong tai lay tu bang cua tools/brand/link-app-downloads.py — the nay
    # bi ve lai nen no khong con nam trong lop vung bam chung nua.
    "button": {"label": "TẢI VỀ", "width": 158, "height": 32},
    "app": "es file explorer file manager",
}
ANCHOR = 10
FEATHER = 8


def scrub(card: dict) -> int:
    spec = json.loads((SPEC_DIR / f"{card['stem']}.json").read_text(encoding="utf-8"))
    area = card["scrub"]
    touched = 0
    for retina in (2, 3):
        for index, slice_spec in enumerate(spec["slices"]):
            top = slice_spec["y"]
            bottom = top + slice_spec["displayHeight"]
            if area["y"] + area["height"] <= top or area["y"] >= bottom:
                continue
            path = SLICE_DIR / f"{card['stem']}-{index}@{retina}x.webp"
            if not path.is_file():
                raise SystemExit(f"Thieu lat nen: {path}")
            image = Image.open(path).convert("RGB")
            scale = image.width / CANVAS_WIDTH
            box = (
                round(area["x"] * scale),
                round((area["y"] - top) * scale),
                round((area["x"] + area["width"]) * scale),
                round((area["y"] + area["height"] - top) * scale),
            )
            patch = feathered(
                rebuild_background(image, box, anchor=round(ANCHOR * scale)),
                round(FEATHER * scale),
            )
            image.paste(patch, (box[0], box[1]), patch)
            image.save(path, "WEBP", quality=82, method=6)
            touched += 1
    return touched


def download_href(app: str, page: str) -> str | None:
    """Duong tai cua app nay, lay tu bang do link-app-downloads.py sinh ra."""
    path = ROOT / "src" / "data" / "app-downloads.json"
    if not path.is_file():
        return None
    pages = json.loads(path.read_text(encoding="utf-8"))["pages"]
    for spot in pages.get(page, []):
        if app in spot["label"].lower():
            return spot["href"]
    return None


def drop_download_spot(app: str, page: str) -> bool:
    """
    Go vung bam cu cua nut nay khoi bang app-downloads.json.

    Nut goc da bi xoa khoi anh va ve lai o cho THAP hon, nen vung bam sinh
    theo vi tri cu gio nam tren nen trong — mot o bam duoc ma khong co gi de
    bam. Nut moi tu mang duong tai cua no (xem OverlapCard.tsx).
    """
    path = ROOT / "src" / "data" / "app-downloads.json"
    if not path.is_file():
        return False
    data = json.loads(path.read_text(encoding="utf-8"))
    spots = data["pages"].get(page, [])
    kept = [s for s in spots if app not in s["label"].lower()]
    if len(kept) == len(spots):
        return False
    data["pages"][page] = kept
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return True


def main() -> int:
    n = scrub(CARD)
    href = download_href(CARD["app"], CARD["page"])
    if not href:
        print("  CANH BAO: khong tim thay duong tai — nut se khong bam duoc.")
    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "The bi nut de len chu tren trang Cap nhat & va loi. Ca cum da "
                    "duoc xoa khoi anh nen va ve lai bang phan tu that. "
                    "Xem tools/brand/fix-overlap-card.py va OverlapCard.tsx."
                ),
                "cards": [
                    {
                        "page": CARD["page"],
                        "footer": CARD["footer"],
                        "title": CARD["title"],
                        "button": {
                            k: v for k, v in CARD["button"].items()
                        }
                        | ({"href": href} if href else {}),
                    }
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    if drop_download_spot(CARD["app"], CARD["page"]):
        print("  Da go vung bam cu cua nut nay (no da doi cho).")
    print(f"  Da xoa cum tieu de + nut khoi {n} lat nen cua /{CARD['page']}.")
    print(f"  {DATA.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
