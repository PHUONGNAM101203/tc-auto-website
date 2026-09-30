#!/usr/bin/env python3
"""
Noi nut "TẢI VỀ" tren hai trang kho ung dung voi tep tai that cua hang.

── Vi sao ──────────────────────────────────────────────────────────────────
Hai trang "Kho ứng dụng" va "Cập nhật & vá lỗi" xep 15 the moi trang, the nao
cung co mot nut "TẢI VỀ" — nhung nut ve chet trong anh nen bam khong an. Khach
gui trang cua hang (wincavn.com) va yeu cau: "bấm vào là tải thôi"
(30/09/2026).

── Cach lam ────────────────────────────────────────────────────────────────
Bang duong dan o duoi chep tu https://wincavn.com/file-download. Vi tri nut
thi KHONG go tay: doc tu lop chu OCR cua chinh trang (src/data/subpage-text.json)
— tim tung khoi chu "TẢI VỀ", roi lay tieu de nam ngay tren no lam khoa tra
cuu. Lam vay thi thiet ke co xe dich hay doi thu tu the, chay lai bo nay la
vung bam tu bam theo.

Ten tren site TC co them tien to "[CẬP NHẬT]" / "[VÁ LỖI]" / "[MỚI NHẤT]" so
voi ten ben hang, nen phai chuan hoa truoc khi so.

Chay: python3 tools/brand/link-app-downloads.py
"""
from __future__ import annotations

import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
TEXT = ROOT / "src" / "data" / "subpage-text.json"
OUT = ROOT / "src" / "data" / "app-downloads.json"

PAGES = ("cong-nghe/ung-dung/kho-ung-dung", "cong-nghe/ung-dung/cap-nhat-va-loi")

#: Tep tai cua hang — chep tu https://wincavn.com/file-download (30/09/2026).
#: Khoa la ten da chuan hoa (bo dau, bo tien to, thuong hoa).
NAMES: dict[str, str] = {
    "winca control": "Winca Control",
    "es file explorer file manager": "ES File Explorer File Manager",
    "winca tube": "Winca Tube",
    "vietmap live": "VietMap Live",
    "dinh vi": "Định vị",
    "google maps": "Google Maps",
    "zalo": "Zalo",
    "cam hanh trinh x7": "Cam Hành Trình X7",
    "winca widget": "Winca Widget",
    "vml xu li gps": "VML xử lí GPS",
    "google play services": "Google Play Services",
    "giong noi winca": "Giọng nói Winca",
    "imedia": "Imedia",
    "vtv go": "VTV Go",
    "radio vietnam": "Radio Vietnam",
}

LINKS: dict[str, str] = {
    "winca control": "https://wincavn.com/storage/files/1788494093_winca-control-car-040926.apk",
    "es file explorer file manager": "https://wincavn.com/storage/files/ES+File+Explorer+File+Manager_4.4.0.2.1_APKPure.apk",
    "winca tube": "https://wincavn.com/storage/files/1789974055_winca-tube-v0297.apk",
    "vietmap live": "https://wincavn.com/storage/files/vml_3.3.5.apk",
    "dinh vi": "https://wincavn.com/storage/files/1789975489_winca-tracking-v103.apk",
    "google maps": "https://wincavn.com/storage/files/11. Google Maps.apk",
    "zalo": "https://wincavn.com/storage/files/7. Zalo.apk",
    "cam hanh trinh x7": "https://wincavn.com/storage/files/12. CamhanhtrinhX7.apk",
    "winca widget": "https://wincavn.com/storage/files/8. Winca Widget.apk",
    "vml xu li gps": "https://wincavn.com/storage/files/VIETMAP_LIVE_2.6.0+170684399.apk",
    "google play services": "https://wincavn.com/storage/files/15. Google Play services.apk",
    "giong noi winca": "https://wincavn.com/storage/files/16. GiongnoiWinca.apk",
    "imedia": "https://wincavn.com/storage/files/17. Imedia.apk",
    "vtv go": "https://wincavn.com/storage/files/21. VTV Go.apk",
    "radio vietnam": "https://wincavn.com/storage/files/Radio Vietnam Online_1.8.8_APKPure.xapk",
}

#: Tien to danh dau trang thai tren site TC, khong phai mot phan cua ten app.
#:
#: OCR doc dau ngoac vuong rat pho: "[VÁ LỖI]" hay ra thanh "IVÁ LỖII". Nen
#: mo ngoac va dong ngoac deu nhan ca `[`, `(`, `I` va `l`.
BRACKET_OPEN = r"[\[(Il]"
BRACKET_CLOSE = r"[\])Il]"
STATUS = r"(?:CẬP NHẬT|CAP NHAT|VÁ LỖI|VA LOI|MỚI NHẤT|MOI NHAT)"
PREFIX = re.compile(rf"^\s*{BRACKET_OPEN}?\s*{STATUS}\s*{BRACKET_CLOSE}*\s*", re.I)
SUFFIX = re.compile(rf"\s*{BRACKET_OPEN}\s*{STATUS}\s*{BRACKET_CLOSE}*\s*$", re.I)


def plain(text: str) -> str:
    """Bo dau, bo tien/hau to trang thai, thuong hoa — de so ten cho chac."""
    text = SUFFIX.sub("", PREFIX.sub("", text)).strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.replace("đ", "d").replace("Đ", "D")
    return re.sub(r"\s+", " ", text).strip().lower()


#: OCR con doc sai vai chu trong chinh ten app ("Manager" -> "Manaaer"), nen
#: sau khi so khop dung khong ra thi so GAN DUNG. Nguong 0,86 du chat: ten
#: ngan nhat trong bang la "zalo" (4 chu), lech mot chu la tut xuong 0,75.
FUZZY_CUTOFF = 0.86


def fuzzy_key(key: str) -> str | None:
    match = difflib.get_close_matches(key, LINKS.keys(), n=1, cutoff=FUZZY_CUTOFF)
    return match[0] if match else None


def main() -> int:
    data = json.loads(TEXT.read_text(encoding="utf-8"))
    out: dict[str, list[dict]] = {}
    missing: list[tuple[str, str]] = []

    for page in PAGES:
        blocks = data[page]["blocks"]
        buttons = [b for b in blocks if plain(b["text"]) in ("tai ve", "tai ve ")]
        spots = []
        for button in buttons:
            # Tieu de la khoi chu gan nhat NGAY TREN nut, trong cung mot cot.
            above = [
                b
                for b in blocks
                if b is not button
                and b["y"] + b["h"] <= button["y"] + 6
                and button["y"] - (b["y"] + b["h"]) < 60
                and abs((b["x"] + b["w"] / 2) - (button["x"] + button["w"] / 2)) < 190
            ]
            if not above:
                continue
            # Nhieu dong thi ghep lai theo thu tu tu tren xuong (tieu de dai
            # bi xuong dong, vi du "[CẬP NHẬT] ES File Explorer" + "File Manager").
            above.sort(key=lambda b: b["y"])
            title = " ".join(b["text"].strip() for b in above[-2:]) if len(above) > 1 and above[-1]["y"] - above[-2]["y"] < 30 else above[-1]["text"].strip()
            key = plain(title)
            canon = key if key in LINKS else fuzzy_key(key)
            href = LINKS.get(canon) if canon else None
            if not href or not canon:
                missing.append((page, title))
                continue
            # Nut ve chet rong 158 cao 32, tam trung voi khoi chu "TẢI VỀ".
            cx = button["x"] + button["w"] / 2
            cy = button["y"] + button["h"] / 2
            spots.append(
                {
                    "x": round(cx - 79, 1),
                    "y": round(cy - 16, 1),
                    "w": 158,
                    "h": 32,
                    "href": href,
                    # Ten hien thi lay tu BANG chu khong lay chu OCR: OCR doc
                    # "[VÁ LỖI]" thanh "IVÁ LỖII" va "Manager" thanh "Manaaer".
                    "label": f"Tải về {NAMES[canon]}",
                }
            )
        spots.sort(key=lambda s: (s["y"], s["x"]))
        out[page] = spots
        print(f"  {page}: noi duoc {len(spots)}/{len(buttons)} nut.")

    if missing:
        print("\n  KHONG tim thay tep tai cho:")
        for page, title in missing:
            print(f"    {page}  {title!r}")

    OUT.write_text(
        json.dumps(
            {
                "_doc": (
                    "Duong tai that cho nut 'TẢI VỀ' tren hai trang kho ung dung. "
                    "Chep tu https://wincavn.com/file-download; vi tri nut doc tu lop "
                    "chu OCR. Xem tools/brand/link-app-downloads.py."
                ),
                "pages": out,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"\n  {OUT.relative_to(ROOT)}")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
