#!/usr/bin/env python3
"""
Sinh trang BAI VIET cho moi nut "XEM THÊM" co noi dung that.

── Vi sao ──────────────────────────────────────────────────────────────────
Ban thiet ke ve mot khoi chu bi MO DAN o cuoi, kem nut "XEM THÊM". Truoc day
ta hieu nut do la "xo khoi chu dai ra tai cho". Khach noi lai (01/10/2026):
"ko phải bấm xem thêm là bấm nó dài ra mà bấm nó ra trang bài viết ấy" — nut
do phai DAN sang mot trang bai viet rieng.

Chu cua bai nam trong anh thiet ke; lop OCR da doc duoc het, GOM CA phan bi
lop mo che (xem tools/match-cta.py). Nen bo nay lay chinh phan chu do dung
thanh trang bai viet that, co duong dan rieng, co trong sitemap, co du lieu
co cau truc.

── Chi lay bai CO NOI DUNG ────────────────────────────────────────────────
Khong phai nut "XEM THÊM" nao cung la bai viet. Tren cac trang luoi san pham,
chu ngay tren nut la ten san pham chu khong phai tieu de bai, va OCR doc ra
nhung manh vun ("WINCA®", "Sava", "31 100 GLOSS SERIES"). Nen bo nay doi:
tieu de du dai, than bai du nhieu dong va du chu. Cho nao khong dat thi de
nguyen — xem bang ket qua in ra cuoi lan chay.

Chay: python3 tools/brand/build-spot-articles.py
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CTA = ROOT / "src" / "data" / "cta-links.json"
SUBPAGES = ROOT / "src" / "data" / "subpages"
OUT = ROOT / "src" / "data" / "spot-articles.json"

#: Nguong de coi mot nut la BAI VIET chu khong phai the san pham.
#:
#: Dem doan SAU khi da boc dong ngay thang ra: co bai gop lai chi con hai doan
#: nhung van du 500 ky tu — do la bai that, chi la viet lien mach. So KY TU moi
#: la thuoc do that; so doan chi de loai nhung manh vun mot dong cua OCR.
#: Tieu de ngan nhu "ĐÀO TẠO" (7 chu) hay "VĂN HOÁ TC" (10) van la tieu de
#: that. Nguong 12 truoc day loai oan ca hai. Bu lai bang MIN_CHARS: manh vun
#: OCR tren the san pham chi co 112-194 ky tu, con bai that thi 387-697.
MIN_TITLE = 7
MIN_LINES = 2
MIN_CHARS = 300

#: Tieu de la manh vun OCR hoac chu mau — khong phai ten bai.
JUNK = re.compile(r"^(bai viet|ten bai viet|winca|data|sam|sava|3m|autorilm|'autorilm|\d)", re.I)

#: Dong dau than bai thuong la ngay dang, vi du "Ngày 19.8.2026".
DATE = re.compile(r"^Ngày\s+(\d{1,2})\.(\d{1,2})\.(\d{4})\s*$")


def plain(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn").lower()


def slugify(title: str) -> str:
    text = plain(title).replace("đ", "d")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    # Cat cho duong dan khong dai qua dang; cat o RANH GIOI TU chu khong cat
    # giua chung, khong thi duong dan ra mot tu cut dau duoi.
    if len(text) > 60:
        text = text[:60].rsplit("-", 1)[0]
    return text


def route_of(page: str) -> str:
    spec = SUBPAGES / f"{page.replace('/', '__')}.json"
    if spec.is_file():
        return json.loads(spec.read_text(encoding="utf-8"))["route"]
    return f"/{page}"


def main() -> int:
    data = json.loads(CTA.read_text(encoding="utf-8"))
    articles: list[dict] = []
    seen: set[str] = set()
    skipped: list[tuple[str, str, str]] = []

    for page, spots in data.items():
        parent = route_of(page)
        for spot in spots:
            if spot.get("href") or spot.get("isPlaceholder"):
                continue
            title = (spot.get("heading") or "").strip()
            # Uu tien `bodyBox.paragraphs`: do la ban DA TACH DOAN theo khoang
            # cach dong trong chinh ban thiet ke. `body` chi la tung DONG roi —
            # dung no thi moi dong thanh mot doan, doc ra rat vun.
            box = spot.get("bodyBox") or {}
            body = [t.strip() for t in (box.get("paragraphs") or spot.get("body") or []) if t.strip()]
            chars = sum(len(line) for line in body)

            # Boc dong ngay thang ra TRUOC khi do, de phep dem khong tinh ca no.
            date = None
            if body and DATE.match(body[0]):
                day, month, year = DATE.match(body[0]).groups()
                date = f"{year}-{int(month):02d}-{int(day):02d}"
                body = body[1:]
                chars = sum(len(line) for line in body)

            why = None
            if len(title) < MIN_TITLE or JUNK.match(plain(title)):
                why = "tiêu đề không phải tên bài"
            elif len(body) < MIN_LINES or chars < MIN_CHARS:
                why = "thân bài quá ngắn"
            if why:
                skipped.append((page, title[:40], why))
                continue

            slug = slugify(title)
            route = f"{parent}/{slug}"
            if route in seen:
                skipped.append((page, title[:40], "trùng đường dẫn"))
                continue
            seen.add(route)

            articles.append(
                {
                    "slug": f"{page}/{slug}",
                    "route": route,
                    "parent": parent,
                    "parentPage": page,
                    "title": title,
                    "date": date,
                    # Moi dong OCR la mot DONG, khong phai mot doan. Noi lai
                    # thanh doan thi nguoi doc moi doc duoc nhu van xuoi.
                    "paragraphs": body,
                    # Toa do nut, de noi lai dung vung bam o trang cha.
                    "spot": {"x": spot["x"], "y": spot["y"]},
                }
            )

    OUT.write_text(
        json.dumps(
            {
                "_doc": (
                    "Trang bai viet sinh tu cac nut 'XEM THÊM' co noi dung that. Chu lay "
                    "tu lop OCR cua chinh ban thiet ke, gom ca phan bi lop mo che. "
                    "Xem tools/brand/build-spot-articles.py."
                ),
                "articles": articles,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"  Da sinh {len(articles)} trang bai viet:")
    for art in articles:
        print(f"    {art['route']}")
    if skipped:
        print(f"\n  Bo qua {len(skipped)} nut (de nguyen nhu cu):")
        counts: dict[str, int] = {}
        for _, _, why in skipped:
            counts[why] = counts.get(why, 0) + 1
        for why, n in sorted(counts.items(), key=lambda kv: -kv[1]):
            print(f"    {n:>3}  {why}")
    print(f"\n  {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
