#!/usr/bin/env python3
"""
Khop tung nut chu ("XEM THEM", "TAI VE"...) tren trang con voi trang chi tiet.

Cach khop: lay TIEU DE gan nhat NAM NGAY TREN nut, roi so voi tieu de cua cac
trang con khac. Tieu de la thu duy nhat noi mot dong trong danh sach voi trang
chi tiet cua no — khong doan theo thu tu, khong doan theo vi tri.

Nut nao khong khop duoc trang nao thi DE TRONG. Tuyet doi khong gan bua dich den.

Chay: python3 tools/match-cta.py --report   # xem khop duoc bao nhieu
      python3 tools/match-cta.py --emit     # ghi src/data/cta-links.json
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEXT = ROOT / "src" / "data" / "subpage-text.json"
INDEX = ROOT / "src" / "data" / "subpages" / "index.json"
BUTTONS = ROOT / "src" / "data" / "detected-buttons.json"
TARGET = ROOT / "src" / "data" / "cta-links.json"

CTA_PATTERN = re.compile(
    r"^>?\s*(XEM\s*TH[EÊẼ]M|XEM\s*CHI\s*TI[EÊ]T|T[IÌ]M\s*HI[EÊỀ]U\s*TH[EÊ]M|T[AẢ]I\s*V[EÊ])\s*$"
)
# Nut chu cao khoang 15-26px; cao hon la tieu de.
MAX_CTA_HEIGHT = 27
# Tieu de phai nam trong khoang nay phia tren nut moi duoc coi la cua no.
HEADING_LOOKBACK = 520
# Chu cao bao nhieu thi coi la TIEU DE bai viet (khong phai chu trong doan van).
TITLE_MIN_HEIGHT = 30.0
# Hai dong tieu de cach nhau duoi muc nay thi la cung mot tieu de bi xuong dong.
TITLE_LINE_GAP = 70.0
# Do giong toi thieu giua tieu de doc duoc va ten trang chi tiet.
# OCR doc sai vai ky tu (vi du "ĐÓ" -> "ĐÖ") nen khong the so khop tuyet doi.
TITLE_SIMILARITY = 0.70
# Nut chu nam TRONG mot nut do da do duoc thi bo qua — da co vung bam roi.
RED_BUTTON_PAD = 12
# Hai dong chu cach nhau xa hon muc nay thi khong con cung mot khoi. Nhip dong
# than bai la 17..20px va khoang giua hai doan la 20..35px, nen 90 la rong rai
# ma van tach duoc hai khoi nam cach nhau ca tram pixel.
MAX_PARAGRAPH_GAP = 90.0
# Cac dong cua CUNG mot khoi van ban deu thang le trai. OCR lech vai pixel nen
# cho 16px; rong hon nua la nhat ca chu cua khoi ben canh.
LEFT_MARGIN_TOLERANCE = 16.0



def split_runon_title(title: str) -> tuple[str, str]:
    """Tach tieu de bi OCR nuot lan sang than bai.

    Tieu de trong ban thiet ke LUON viet hoa. Khi hai khoi chu nam qua sat nhau,
    OCR gop chung thanh mot dong: "CÔNG NGHỆ MỚI TC AUTO ứng dụng công nghệ..."
    Cho nao bat dau co chu thuong la da sang than bai — cat tu do.

    Tra ve (tieu_de, phan_du). Neu ngay tu dau da la chu thuong thi do khong phai
    tieu de: tra ve ("", ca_chuoi) de no chay xuong than bai.
    """
    words = title.split()
    kept: list[str] = []
    for index, word in enumerate(words):
        if any(ch.islower() for ch in word):
            # Ten rieng viet hoa-thuong ("DEGO Definition of Sound", "3M
            # Crystalline 200") van la mot phan cua tieu de neu no dung ngay dau.
            if index <= 1 and len(words) <= 4:
                kept.append(word)
                continue
            return " ".join(kept), " ".join(words[index:])
        kept.append(word)
    return " ".join(kept), ""


def strip_accents(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    plain = "".join(c for c in decomposed if unicodedata.category(c) != "Mn")
    return plain.replace("đ", "d").replace("Đ", "D")


def key_of(value: str) -> str:
    """Chuan hoa tieu de de so khop: bo dau, bo ky tu la, gom khoang trang."""
    plain = strip_accents(value).upper()
    plain = re.sub(r"[^A-Z0-9 ]+", " ", plain)
    return re.sub(r"\s+", " ", plain).strip()


def red_button_of(block: dict, rects: list[dict]) -> dict | None:
    """Khung nut DO bao quanh chu nay, neu co.

    Mang che khi xo noi dung ra phai phu kin ca nut do — nut do rong hon chu
    nen chi che phan chu thi mep do van tho ra. Xem readMorePanel trong
    src/lib/cta-links.ts.
    """
    bx0, by0 = block["x"], block["y"]
    bx1, by1 = bx0 + block["w"], by0 + block["h"]
    for rect in rects:
        rx0, ry0 = rect["x"] - RED_BUTTON_PAD, rect["y"] - RED_BUTTON_PAD
        rx1 = rect["x"] + rect["w"] + RED_BUTTON_PAD
        ry1 = rect["y"] + rect["h"] + RED_BUTTON_PAD
        if bx0 >= rx0 and bx1 <= rx1 and by0 >= ry0 and by1 <= ry1:
            return rect
    return None


def overlaps_red_button(block: dict, rects: list[dict]) -> bool:
    bx0, by0 = block["x"], block["y"]
    bx1, by1 = bx0 + block["w"], by0 + block["h"]
    for rect in rects:
        rx0, ry0 = rect["x"] - RED_BUTTON_PAD, rect["y"] - RED_BUTTON_PAD
        rx1 = rect["x"] + rect["w"] + RED_BUTTON_PAD
        ry1 = rect["y"] + rect["h"] + RED_BUTTON_PAD
        if bx0 >= rx0 and bx1 <= rx1 and by0 >= ry0 and by1 <= ry1:
            return True
    return False



# Bai viet nam mot cot, anh minh hoa nam cot con lai. Chi lay chu CUNG COT voi
# nut, neu khong se nhat ca chu in tren anh (vi du logo "NANO SUN") hay chu o
# chan trang vao noi dung.
SAME_COLUMN = 260

# Hai co chu than bai duy nhat cua ban thiet ke: (khoang dong, co chu).
BODY_SCALES = ((20.0, 16.0), (17.0, 14.0))

# Dau ket cau ket thuc mot cau tron ven.
SENTENCE_END = ".!?…"


def trim_to_sentence(text: str) -> str:
    """Cat bo manh cau cut o cuoi khoi.

    Thiet ke lam MO DAN may dong cuoi cho toi khi khuat han, nen OCR doc duoc
    toi dau thi het toi do — thuong la dut ngang giua mot tu. Xo ra ma de
    nguyen thi nguoi doc tuong trang bi loi. Lui ve cau tron ven gan nhat.
    """
    text = text.strip()
    if not text or text[-1] in SENTENCE_END:
        return text
    cut = max(text.rfind(mark) for mark in SENTENCE_END)
    return text[: cut + 1].strip() if cut > 0 else text


# So tu toi da cua mot tieu de viet hoa-thuong (ten thuong hieu).
BRAND_TITLE_WORDS = 4


# Tieu de MUC duoc in giua trang (vi du "PHIM NANO SUN"). Chung nam giua hai
# hang the nen lot vao khoang giua tieu de va nut, roi bi nhat vao than the.
PAGE_CENTRE = 720
CENTRED_SLACK = 70


def is_section_header(block: dict) -> bool:
    centre = block["x"] + block["w"] / 2
    if abs(centre - PAGE_CENTRE) > CENTRED_SLACK:
        return False
    return not has_lowercase(block["text"])


def has_lowercase(text: str) -> bool:
    return any(ch.islower() for ch in text)


def title_groups(blocks: list[dict]) -> list[dict]:
    """
    Gom cac dong tieu de lien tiep thanh MOT tieu de.
    Tieu de bai viet trong thiet ke thuong xuong dong 2-3 lan; neu lay tung dong
    rieng le thi khong bao gio khop duoc voi ten trang chi tiet.
    """
    # Chu to THOI chua du: cau mo dau bai cung duoc ve to hon phan con lai
    # ("TC AUTO ứng dụng công nghệ tiên tiến..." cao 30px). Tieu de trong thiet
    # ke viet hoa toan bo; ngoai le duy nhat la ten thuong hieu ngan
    # ("DEGO Definition of Sound"), nen cho phep chu thuong neu chuoi that ngan.
    candidates = [
        b
        for b in blocks
        if b["h"] >= TITLE_MIN_HEIGHT
        and (not has_lowercase(b["text"]) or len(b["text"].split()) <= BRAND_TITLE_WORDS)
    ]
    candidates.sort(key=lambda b: (b["y"], b["x"]))

    groups: list[dict] = []
    for block in candidates:
        if groups:
            last = groups[-1]
            same_title = (
                block["y"] - last["bottom"] <= TITLE_LINE_GAP
                and abs(block["x"] - last["x"]) <= 60
                # Tieu de trong thiet ke viet hoa toan bo. Dong co chu thuong la
                # da sang than bai — gop vao se nuot mat cau mo dau.
                and not has_lowercase(block["text"])
            )
            if same_title:
                last["text"] += " " + block["text"]
                last["bottom"] = block["y"] + block["h"]
                continue
        groups.append(
            {
                "text": block["text"],
                "y": block["y"],
                "x": block["x"],
                "bottom": block["y"] + block["h"],
            }
        )
    return groups


def nearest_title(
    blocks: list[dict], button_y: float, button_x: float
) -> tuple[str | None, float]:
    """Tieu de gan nhat nam NGAY TREN nut, CUNG COT voi nut, kem toa do day.

    Rang buoc cung cot la bat buoc: bai viet nam mot cot, con chan trang / logo
    nam cot khac. Khong rang buoc thi chu "TC AUTO" duoi chan trang (x=230) bi
    nhat lam tieu de cua mot nut o cot x=621.
    """
    best = None
    for group in title_groups(blocks):
        gap = button_y - group["bottom"]
        if gap < 0 or gap > HEADING_LOOKBACK:
            continue
        if abs(group["x"] - button_x) > SAME_COLUMN:
            continue
        if best is None or group["bottom"] > best["bottom"]:
            best = group
    return (best["text"], best["bottom"]) if best else (None, 0.0)


def paragraphs_between(
    blocks: list[dict], top: float, bottom: float, button_x: float
) -> tuple[list[str], dict | None]:
    """
    Cac dong van ban nam giua tieu de va nut "XEM THÊM", trong cung mot cot.

    Day chinh la phan thiet ke lam MO DAN o cuoi — chu van duoc ve that trong anh
    nen OCR doc duoc. Nho vay bam "XEM THÊM" moi co gi de xo ra.

    Tra ve ca HOP BAO cua khoi chu: giao dien can biet khoi nay nam dau de xo
    phan con lai ra DUNG CHO do, khong phai mo mot lop phu.
    """
    # Chan tren CUNG: khong tim thay tieu de thi `top` bang 0, va khi do khoi
    # se vet tron moi dong chu trong cot tu DINH TRANG xuong. Tren
    # /giai-phap/man-hinh no nuot ca danh sach CLARITY/PROTECTION o y=502 roi
    # do ra mot mang cao hon 1000px phu kin the san pham. Nut nao cung chi co
    # the lay chu trong tam voi cua no.
    top = max(top, bottom - HEADING_LOOKBACK)

    lines = [
        b
        for b in blocks
        if top < b["y"] < bottom
        # Loai cac dong TIEU DE (chu to VA viet hoa). Dong chu to nhung co chu
        # thuong la cau mo dau bai — phai giu, neu khong bam "XEM THÊM" se thieu.
        and (b["h"] <= TITLE_MIN_HEIGHT or has_lowercase(b["text"]))
        and not is_section_header(b)
        and len(b["text"]) > 3
        and abs(b["x"] - button_x) <= SAME_COLUMN
    ]
    lines.sort(key=lambda b: (round(b["y"] / 10), b["x"]))

    # Chi giu DAI LIEN MACH ngay tren nut. Di nguoc tu duoi len, gap mot khoang
    # trong rong hon MAX_PARAGRAPH_GAP la sang khoi khac — dung lai. Nho vay
    # mot khoi chu roi nam cung cot nhung cach xa han se khong bi gom vao.
    # Chi giu cac dong THANG LE TRAI voi nhau.
    #
    # Rang buoc "cung cot" (SAME_COLUMN = 260) qua rong voi nhung khoi van ban
    # be ngang lon. Tren /giai-phap/du-an, bai o x=753 nuot them hai nhan the
    # cua cot trai o x=515 va x=523 — lech 235px, van lot. Ket qua la giua bai
    # bong moc ra "Crystalline 20 lop TAI" va "Phim cach nhiet cao cap 3M".
    #
    # Lay le trai PHO BIEN NHAT lam chuan: dong nao khong thang hang thi la cua
    # khoi khac.
    if lines:
        margins = Counter(round(b["x"] / LEFT_MARGIN_TOLERANCE) for b in lines)
        home = margins.most_common(1)[0][0] * LEFT_MARGIN_TOLERANCE
        aligned = [b for b in lines if abs(b["x"] - home) <= LEFT_MARGIN_TOLERANCE]
        if aligned:
            lines = aligned

    if lines:
        kept = [lines[-1]]
        for line in reversed(lines[:-1]):
            above = line["y"] + line["h"]
            if kept[0]["y"] - above > MAX_PARAGRAPH_GAP:
                break
            kept.insert(0, line)
        lines = kept

    out: list[str] = []
    for line in lines:
        text = line["text"].strip()
        # OCR doi khi doc hai lan mot dong (vung chong lan giua cac manh anh).
        if out and (text == out[-1] or key_of(text) == key_of(out[-1])):
            continue
        out.append(text)

    if not lines:
        return out, None

    # Do KIEU CHU cua khoi: phan xo ra phai giong het phan da hien, neu khong
    # nguoi doc thay ro cho noi.
    #
    # KHONG uoc co chu tu chieu cao net muc. Net muc cao hay thap con tuy dong
    # do co dau mu va net tha xuong hay khong — cung mot co chu ma chenh nhau
    # toi 40%. Thay vao do do NHIP DONG (rat on dinh) roi NEP ve dung mot trong
    # hai co than bai ma ban thiet ke dung: dem tren ban xuat prototype chi co
    # 16px/20px (22 lan) va 14px/17px (5 lan), khong co co nao khac.
    tops = sorted(b["y"] for b in lines)
    gaps = [round(b - a) for a, b in zip(tops, tops[1:]) if 4 < b - a < 120]
    pitch = Counter(gaps).most_common(1)[0][0] if gaps else 20
    line_height, font_size = min(BODY_SCALES, key=lambda scale: abs(scale[0] - pitch))

    # Khoang THEM giua hai doan, ngoai nhip dong.
    wide = sorted(g for g in gaps if g > line_height * 1.35)
    paragraph_gap = (
        round(wide[len(wide) // 2] - line_height, 1) if wide else round(line_height * 0.6, 1)
    )

    left = min(b["x"] for b in lines)
    right = max(b["x"] + b["w"] for b in lines)
    top_y = min(b["y"] for b in lines)
    bottom_y = max(b["y"] + b["h"] for b in lines)
    # Nhom dong thanh DOAN theo khoang cach thuc te: dong cach xa hon khoang
    # dong binh thuong la bat dau doan moi. Dua vao hinh hoc chac chan hon la
    # doan theo do dai cau.
    paragraphs: list[list[str]] = []
    previous_y: float | None = None
    for line in lines:
        text = line["text"].strip()
        if not text:
            continue
        if previous_y is None or line["y"] - previous_y > line_height * 1.35:
            paragraphs.append([])
        paragraphs[-1].append(text)
        previous_y = line["y"]

    text_paragraphs = [" ".join(group) for group in paragraphs]
    if text_paragraphs:
        text_paragraphs[-1] = trim_to_sentence(text_paragraphs[-1])
        text_paragraphs = [p for p in text_paragraphs if p]

    box = {
        "paragraphs": text_paragraphs,
        "fontSize": font_size,
        "lineHeight": line_height,
        "paragraphGap": max(0.0, paragraph_gap),
        "x": round(left, 1),
        "y": round(top_y, 1),
        "width": round(right - left, 1),
        "height": round(bottom_y - top_y, 1),
    }
    return out, box


def best_page(title: str, by_title: dict[str, str]) -> tuple[str | None, float]:
    """Trang chi tiet co ten giong tieu de nhat, neu du nguong."""
    needle = key_of(title)
    if len(needle) < 6:
        return None, 0.0

    best_href, best_score = None, 0.0
    for candidate, href in by_title.items():
        score = SequenceMatcher(None, needle, candidate).ratio()
        if score > best_score:
            best_href, best_score = href, score

    return (best_href, best_score) if best_score >= TITLE_SIMILARITY else (None, best_score)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", action="store_true")
    parser.add_argument("--emit", action="store_true")
    args = parser.parse_args()

    text = json.loads(TEXT.read_text(encoding="utf-8"))
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    red = json.loads(BUTTONS.read_text(encoding="utf-8"))

    # Tieu de -> route cua trang chi tiet.
    by_title: dict[str, str] = {}
    for row in index:
        by_title[key_of(row["title"])] = row["route"]

    out: dict[str, list[dict]] = {}
    matched = unmatched = skipped = 0
    misses: list[tuple[str, float, str]] = []

    for slug, page in sorted(text.items()):
        blocks = page["blocks"]
        rects = red.get(slug, [])
        found: list[dict] = []

        for block in blocks:
            if block["h"] > MAX_CTA_HEIGHT:
                continue
            if not CTA_PATTERN.match(strip_accents(block["text"]).upper().replace("  ", " ")):
                continue
            # KHONG bo qua nut do nua. Truoc day bo qua vi tuong hotspots.ts da
            # lo het, nhung bang do chi gan dich cho mot so nut — so con lai
            # khong co vung bam nao, nguoi dung bam khong an. Nay nhan het; luc
            # render moi loai nhung nut da co vung bam rieng (xem SubPage).
            if overlaps_red_button(block, rects):
                skipped += 1

            title, title_bottom = nearest_title(blocks, block["y"], block["x"])
            href, score = best_page(title, by_title) if title else (None, 0.0)
            # Khong tu tro ve chinh no.
            if href == f"/{slug}":
                href = None

            body, body_box = paragraphs_between(blocks, title_bottom, block["y"], block["x"])
            title, overflow = split_runon_title(title or "")
            if overflow:
                # Phan bi nuot vao tieu de thuc ra la cau mo dau than bai.
                body = [overflow, *body]
            entry = {
                "x": round(block["x"] - 8, 1),
                "y": round(block["y"] - 8, 1),
                "w": round(block["w"] + 16, 1),
                "h": round(block["h"] + 16, 1),
                "heading": title,
                # Tieu de "TÊN BÀI VIẾT" la chu mau trong thiet ke — bai nay chua co noi dung.
                "isPlaceholder": key_of(title) in {"TEN BAI VIET", "TEN BAI VIET 1"},
                # Noi dung doc duoc cua bai, GOM CA phan bi lop mo che trong thiet ke.
                "body": body,
                # Hop bao cua khoi chu — de xo noi dung ra dung cho do.
                "bodyBox": body_box,
            }
            red_rect = red_button_of(block, rects)
            if red_rect:
                entry["coverBox"] = {
                    "x": round(red_rect["x"], 1),
                    "y": round(red_rect["y"], 1),
                    "w": round(red_rect["w"], 1),
                    "h": round(red_rect["h"], 1),
                }
            if href:
                matched += 1
                entry["href"] = href
            else:
                unmatched += 1
                misses.append((slug, block["y"], title or "(khong doc duoc tieu de)"))
            found.append(entry)

        if found:
            out[slug] = found

    if args.report:
        print(f"  Khop duoc     : {matched} nut -> co dich den")
        print(f"  Khong khop     : {unmatched} nut -> de trong (khong co trang chi tiet)")
        print(f"  Bo qua         : {skipped} nut (da nam trong nut do co vung bam)")
        print(f"\n  Trang co nut khop duoc ({len(out)}):")
        for slug, spots in sorted(out.items()):
            print(f"     {slug:<58} {len(spots)} nut")
            for spot in spots:
                print(f"         y={spot['y']:>6.0f} -> {spot['href']}")
        print(f"\n  Mot so nut chua co dich den (hien {min(12, len(misses))}/{len(misses)}):")
        for slug, y, title in misses[:12]:
            print(f"     {slug:<44} y={y:>6.0f}  '{title[:44]}'")

    if args.emit:
        TARGET.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"\n  Ghi {TARGET.relative_to(ROOT)} — {matched} vung bam tren {len(out)} trang")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
