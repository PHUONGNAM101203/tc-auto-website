#!/usr/bin/env python3
"""
Tach dai 4 the "3M PPF" tren trang /giai-phap/ppf ra khoi anh nen.

Vi sao: thiet ke ve chet dai the vao anh, hai the ngoai cung bi cat o mep canvas
va co mot mui ten moi ben bao "con nua". Muon hai mui ten do bam duoc thi dai
the phai la phan tu that de truot ngang.

Viec nay lam ba thu:
  1. Cat hai the giua TU CHINH ANH THIET KE — giu nguyen ca chu da ve san, nen
     luc dung yen man hinh trung khop tuyet doi voi thiet ke.
  2. Dung lai hai the bi cat: nen the rong ("Rectangle 189.png") + anh minh hoa
     roi ("Rectangle 191/193.png"). Chu cua chung do CSS ve — trong anh thiet ke
     chi con mot nua nen khong cat duoc.
  3. Xoa dai the khoi lat nen. Nen o day la dai mau chuyen toi, tai tao bang
     noi suy DOC tung cot: moc lay ngay tren va ngay duoi dai the.

Chay: python3 tools/brand/extract-ppf-cards.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _backdrop import rebuild_background  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent.parent
DOWNLOADS = Path("/Users/phuongnam/Downloads/[TC] Website")
SOURCE = DOWNLOADS / "Website_TC" / "3.Page_Giải pháp" / "3.PPF.png"
ASSETS = DOWNLOADS / "Tài nguyên Web" / "2. Page_Giải pháp" / "2.3. PPF"
OUT = ROOT / "public" / "ppf"
SLICE_DIR = ROOT / "public" / "slices" / "sub"
SPEC = ROOT / "src" / "data" / "subpages" / "giai-phap__ppf.json"
DATA = ROOT / "src" / "data" / "ppf-cards.json"

CANVAS_WIDTH = 1440

# Hinh hoc do tu 3.PPF.png:
#   - canh doc manh nhat o x = 245/325, 679/759, 1113/1193  -> the rong 354, buoc 434
#   - canh ngang manh nhat o y = 1090 va 1534               -> the cao 444
# Be rong 354 va cao 444 trung khop voi "Rectangle 189.png" (708x888 @2x).
CARD_TOP = 1090
CARD_WIDTH = 354
CARD_HEIGHT = 444
PITCH = 434
CARD_XS = (-109, 325, 759, 1193)

# Vung xoa: phu het dai the, chua thua vai pixel. Moc noi suy nam ngoai vung nay
# va da kiem tra la nen sach (do lech ngang toi da 3/765 o ca hai phia).
SCRUB = (0, CARD_TOP - 4, CANVAS_WIDTH, CARD_HEIGHT + 8)

# Hai mui ten do tools/detect-arrows.py tim duoc tren chinh anh thiet ke.
# Ban kinh lam muot ngang cho moc noi suy khi dung lai nen (xem _backdrop.py).
SCRUB_SMOOTH = 60

ARROWS = {
    "prev": {"x": 36, "y": 1305, "width": 15, "height": 42},
    "next": {"x": 1389, "y": 1305, "width": 15, "height": 42},
}

# Hinh hoc chu ben trong the, do tu the thu hai (the duy nhat lo tron ven).
# Toa do tinh TU GOC TREN TRAI CUA THE. `top` la MEP TREN HOP DONG, da bu lech
# giua net chu va hop dong bang cach do lai net mau tren trinh duyet.
LAYOUT = {
    "padding": 19,
    "paddingRight": 26,
    "title": {"top": 252.5, "fontSize": 18, "lineHeight": 22},
    "body": {"top": 294, "fontSize": 14, "lineHeight": 17},
    "button": {"x": 170, "y": 388, "width": 159, "height": 33},
}

CARDS = [
    {
        "id": "50-gloss",
        "title": "3M PPF – 50 Gloss Series",
        # Trong thiet ke the nay bi cat mat nua trai. Phan chu con doc duoc:
        # "...loss Series tại TC Auto bảo vệ / ... xước, đá văng và tác động /
        #  ...ồng thời duy trì vẻ bóng đẹp / ...ất với chi phí hợp lý."
        # Doan duoi noi lai theo dung mach ay.
        "body": (
            "3M PPF 50 Gloss Series tại TC Auto bảo vệ sơn khỏi trầy xước, đá văng "
            "và tác động thường ngày, đồng thời duy trì vẻ bóng đẹp như ban đầu "
            "với chi phí hợp lý."
        ),
        "art": "Rectangle 191.png",
    },
    {
        "id": "100-gloss",
        "title": "3M PPF – 100 Gloss Series",
        # Chu nay da ve san trong anh the nen ban desktop khong dung toi; ban
        # mobile thu the xuong be rong dien thoai thi chu trong anh khong con
        # doc noi, phai co chu that.
        "body": (
            "3M PPF 100 Gloss Series tại TC Auto bảo vệ sơn khỏi đá văng, va quẹt và "
            "trầy xước, đồng thời duy trì độ bóng và vẻ đẹp nguyên bản của xe theo "
            "thời gian."
        ),
        "from": "design",
        "slot": 1,
    },
    {
        "id": "150-gloss",
        "title": "3M PPF – 150 Gloss Series",
        "body": (
            "3M PPF 150 Gloss Series tại TC Auto bảo vệ sơn trước tác động và trầy "
            "xước, với khả năng tự phục hồi và duy trì độ bóng, giữ trọn vẻ đẹp "
            "nguyên bản của xe theo thời gian."
        ),
        "from": "design",
        "slot": 2,
    },
    {
        "id": "200-gloss",
        "title": "3M PPF – 200 Gloss Series",
        # Phan con doc duoc: "3M PPF 200 Gloss Series bảo vệ ... / lớp, hấp thụ
        # tác động, tự phục h... / trì độ bóng nguyên bản."
        "body": (
            "3M PPF 200 Gloss Series bảo vệ sơn đa lớp, hấp thụ tác động, tự phục "
            "hồi và duy trì độ bóng nguyên bản."
        ),
        "art": "Rectangle 193.png",
    },
]

# Anh minh hoa cao 470 @2x = 235 tren canvas; phan con lai la than the.
ART_HEIGHT = 235


def build_cut_card(shell: Image.Image, art_name: str, scale: int) -> Image.Image:
    """Dung lai mot the bi cat: nen the rong + anh minh hoa dan len dau."""
    source = ASSETS / art_name
    if not source.is_file():
        raise SystemExit(f"Thieu anh minh hoa: {source}")

    card = shell.resize((CARD_WIDTH * scale, CARD_HEIGHT * scale), Image.LANCZOS).convert("RGBA")
    art = Image.open(source).convert("RGBA")
    art = art.resize((CARD_WIDTH * scale, ART_HEIGHT * scale), Image.LANCZOS)
    card.alpha_composite(art, (0, 0))
    # Anh minh hoa la hinh chu nhat vuong goc; nen the thi bo goc. Lay lai dung
    # vien bo goc cua nen the, neu khong hai goc tren cua the se vuong ra.
    card.putalpha(shell.resize(card.size, Image.LANCZOS).getchannel("A"))
    return card


def export_cards() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    page = Image.open(SOURCE)
    scale = round(page.width / CANVAS_WIDTH)
    shell = Image.open(ASSETS / "Rectangle 189.png").convert("RGBA")
    manifest = []

    for card in CARDS:
        if card.get("from") == "design":
            x = CARD_XS[card["slot"]]
            art = page.crop(
                (
                    x * scale,
                    CARD_TOP * scale,
                    (x + CARD_WIDTH) * scale,
                    (CARD_TOP + CARD_HEIGHT) * scale,
                )
            ).convert("RGBA")
        else:
            art = build_cut_card(shell, card["art"], scale)

        # Ha ve @2x — dung do phan giai cac lat nen dang dung.
        art = art.resize((CARD_WIDTH * 2, CARD_HEIGHT * 2), Image.LANCZOS)
        target = OUT / f"{card['id']}.webp"
        art.save(target, "WEBP", quality=88, method=6)

        # Ban cho MOBILE: chi lay phan ANH MINH HOA o dau the. Ban mobile ve
        # lai tieu de va mo ta bang chu that; giu ca the thi chu hien hai lan —
        # mot lan trong anh, mot lan duoi anh.
        art.crop((0, 0, CARD_WIDTH * 2, ART_HEIGHT * 2)).save(
            OUT / f"{card['id']}-art.webp", "WEBP", quality=88, method=6
        )
        manifest.append(
            {
                "id": card["id"],
                "title": card["title"],
                "body": card.get("body"),
                "src": f"/ppf/{card['id']}.webp",
                "art": f"/ppf/{card['id']}-art.webp",
                # The nao bi cat trong thiet ke thi chu do CSS ve.
                "labelInCss": card.get("from") != "design",
            }
        )
        print(f"  {target.relative_to(ROOT)}  {art.width}x{art.height}  "
              f"{target.stat().st_size / 1e3:.0f} KB")

    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Dai the 3M PPF tren /giai-phap/ppf. Hinh hoc do tu 3.PPF.png. "
                    "Hai the giua cat nguyen tu thiet ke (ke ca chu); hai the ngoai "
                    "bi cat o mep canvas nen duoc dung lai tu nen the rong + anh "
                    "minh hoa roi, chu do CSS ve (labelInCss)."
                ),
                "view": {"x": 0, "y": CARD_TOP, "width": CANVAS_WIDTH, "height": CARD_HEIGHT},
                "card": {"width": CARD_WIDTH, "height": CARD_HEIGHT},
                "pitch": PITCH,
                "firstX": CARD_XS[0],
                "arrows": ARROWS,
                "layout": LAYOUT,
                "cards": manifest,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  {DATA.relative_to(ROOT)}")


def scrub_strip() -> int:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    x, y, w, h = SCRUB
    touched = 0

    for index, slice_spec in enumerate(spec["slices"]):
        top = slice_spec["y"]
        bottom = top + slice_spec["displayHeight"]
        if y + h <= top or y >= bottom:
            continue

        path = SLICE_DIR / f"giai-phap__ppf-{index}@2x.webp"
        if not path.is_file():
            raise SystemExit(f"Thieu lat nen: {path}")

        image = Image.open(path).convert("RGB")
        scale = image.width / CANVAS_WIDTH
        box = (
            round(x * scale),
            round((y - top) * scale),
            round((x + w) * scale),
            round((y + h - top) * scale),
        )
        image.paste(rebuild_background(image, box, smooth=SCRUB_SMOOTH), (box[0], box[1]))
        image.save(path, "WEBP", quality=82, method=6)
        touched += 1

    return touched


def main() -> int:
    if not SOURCE.is_file():
        print(f"Khong tim thay nguon: {SOURCE}")
        return 1

    export_cards()
    touched = scrub_strip()
    print(f"\n  Da xoa dai the khoi {touched} lat nen cua /giai-phap/ppf.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
