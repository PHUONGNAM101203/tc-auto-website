#!/usr/bin/env python3
"""
Cat anh minh hoa cho ban MOBILE cua 31 trang con.

Trang con von la mot buc PNG: ca chu lan anh deu nam trong do. Ban mobile dung
lai chu tu van ban OCR — nhung truoc gio KHONG co anh nao, nen tren dien thoai
cac trang con chi la nhung buc tuong chu.

Cach tim anh: cac dong chu OCR gom thanh tung DAI. Khoang ho giua hai dai lien
nhau, neu du cao, chinh la cho designer dat anh. Cat cho do roi cho qua tidy()
— ham da dung cho 6 trang chinh — de bo vach phan cach va dua ve 4:3.

Chay: python3 tools/brand/extract-subpage-tiles.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from importlib.machinery import SourceFileLoader  # noqa: E402

_tiles = SourceFileLoader(
    "mobile_tiles", str(Path(__file__).resolve().parent / "extract-mobile-tiles.py")
).load_module()
tidy = _tiles.tidy
is_usable = _tiles.is_usable

ROOT = Path(__file__).resolve().parent.parent.parent
# Bo tai nguyen roi (khach gui bo sung 27/09/2026) — anh GOC, phan giai cao,
# khong bi chu de len. Dung cho nhung trang ma anh va chu chong nhau nen khong
# cat duoc o nao sach tu chinh trang.
ASSETS = Path("/Users/phuongnam/Downloads/Tài nguyên Web")
SUBPAGES = ROOT / "src" / "data" / "subpages"
TEXT = ROOT / "src" / "data" / "subpage-text.json"
SLICE_DIR = ROOT / "public" / "slices" / "sub"
OUT = ROOT / "public" / "mobile" / "sub"
DATA = ROOT / "src" / "data" / "subpage-tiles.json"

CANVAS_WIDTH = 1440
# Ti le anh tren mobile — dung chung voi 6 trang chinh.
TILE_RATIO = 4 / 3
# Dai header (logo, nav) va dai chan trang deu da co ban mobile rieng.
HEADER_BOTTOM = 560
FOOTER_MARGIN = 430
# Khoang ho doc du lon de coi la sang mot dai chu khac — giong mobile-subpage.ts.
BAND_GAP = 70
# Khoang ho giua hai dai chu phai cao bang nay moi dang cat lam anh.
MIN_GAP = 190
# Khong lay qua nhieu anh mot trang: doc tren dien thoai se loang.
MAX_TILES = 4
# Ti le diem anh co VAN toi thieu. Do la thuoc do tach bach nhat giua mot buc
# ANH CHUP va mot hinh ve phang (bieu tuong ung dung, logo, dai mau chuyen):
# anh chup co hat li ti khap noi nen 0,24-0,56; hinh ve phang chi co vien sac o
# duong bao nen 0,00-0,09.
MIN_GRAIN = 0.18
# Anh dau trang: chu tua de duoc VE SAN trong anh o cot trai (x~82). Ban mobile
# ve lai tua de bang chu that, nen phai cat bo cot do — neu khong tua de hien
# hai lan chong len nhau.
HERO_TOP, HERO_BOTTOM = 90, 850
# Le an toan hai ben khi cat anh dau trang.
HERO_GUTTER = 28
# Ben phai phai cat rong tay hon: moi dong thuoc tinh co mot BIEU TUONG ve o
# ben trai chu, ma bieu tuong thi OCR khong thay.
HERO_RIGHT_GUTTER = 84
# Chu phai lech han qua mot ben bang nay thi moi ke la "mot cot".
SIDE_MARGIN = 90
# Le an toan de khong cat pham vao cot chu.
SIDE_GUTTER = 24
# Dai chu phai cao bang nay thi nua ben kia moi du cho mot buc anh tu te.
MIN_SIDE_HEIGHT = 150
# So o bao mon mat na truoc khi tim o chu nhat dac (xem largest_opaque).
ERODE = 3
# Ti le be rong giu lai khi noi long o de co cho chon (xem largest_opaque).
RELAX = 0.85


# Trang nao khong cat duoc anh nao tu chinh no thi lay anh roi tuong ung.
# Cac muc nay doi chieu 1-1 voi bon muc cua trang /trai-nghiem (da so sanh anh
# de xac dinh, khong phai doan theo ten tep).
SUBPAGE_ASSETS = {
    "trai-nghiem/hanh-trinh": ["0. Homepage/Vector 7.png"],
    "trai-nghiem/ban-sac-rieng": ["0. Homepage/Rectangle 182.png"],
    "trai-nghiem/khoanh-khac": ["0. Homepage/Vector 9.png", "0. Homepage/Vector 8.png"],
    "trai-nghiem/phong-cach-song": [
        "0. Homepage/Rectangle 185.png",
        "0. Homepage/Rectangle 183.png",
    ],
}


def centre_crop(image: Image.Image) -> Image.Image:
    """Cat giua ve dung ti le 4:3."""
    width, height = image.size
    if width / height > TILE_RATIO:
        keep = round(height * TILE_RATIO)
        offset = (width - keep) // 2
        return image.crop((offset, 0, offset + keep, height))
    keep = round(width / TILE_RATIO)
    offset = (height - keep) // 2
    return image.crop((0, offset, width, offset + keep))


def largest_opaque(image: Image.Image) -> Image.Image:
    """O chu nhat DAC lon nhat trong mot buc anh co mat na.

    Vai anh trong bo tai nguyen duoc cat theo hinh binh hanh (mep cheo trong
    suot). Dan thang len nen toi thi lo ra hai goc den; phai lay phan dac.
    """
    if image.mode != "RGBA":
        return image

    width_small = 320
    small = image.resize(
        (width_small, round(width_small * image.height / image.width)), Image.BILINEAR
    )
    solid = np.asarray(small.getchannel("A"), dtype=np.uint8) > 250
    if solid.all():
        return centre_crop(image.convert("RGB"))

    # Mep cheo cua mat na bi lam mem khi thu nho, con vai o "gan dac" o ria. Bao
    # mon mat na vai o de o tim duoc khong dinh mot vet toi nao.
    for _ in range(ERODE):
        solid = (
            solid
            & np.roll(solid, 1, axis=0)
            & np.roll(solid, -1, axis=0)
            & np.roll(solid, 1, axis=1)
            & np.roll(solid, -1, axis=1)
        )
    solid = solid.astype(np.int32)

    # Tim o 4:3 LON NHAT, khong phai o dien tich lon nhat.
    #
    # Mat na o day la hinh binh hanh nghieng. O dien tich lon nhat trong mot
    # hinh binh hanh la mot dai cao va hep — dung lam anh minh hoa thi xau.
    # Ta can dung ti le se hien tren dien thoai, nen tim thang o ti le do:
    # do rong lon dan, moi lan kiem tra bang tong tich luy nen rat nhanh.
    height, width = solid.shape
    integral = np.zeros((height + 1, width + 1), dtype=np.int32)
    integral[1:, 1:] = solid.cumsum(axis=0).cumsum(axis=1)

    # Tong tich luy do sang, de trong nhieu o vua vao thi chon o SANG NHAT.
    grey = np.asarray(small.convert("L"), dtype=np.int64)
    light = np.zeros((height + 1, width + 1), dtype=np.int64)
    light[1:, 1:] = grey.cumsum(axis=0).cumsum(axis=1)

    def find(box_width: int) -> tuple[int, int] | None:
        box_height = round(box_width / TILE_RATIO)
        if box_width > width or box_height > height:
            return None
        total = (
            integral[box_height:, box_width:]
            - integral[:-box_height, box_width:]
            - integral[box_height:, :-box_width]
            + integral[:-box_height, :-box_width]
        )
        fits = total == box_width * box_height
        if not fits.any():
            return None
        # Trong nhieu o vua vao, chon o SANG NHAT. Chu the cua mot buc anh phong
        # canh gan nhu luon nam o phan duoc chieu sang; lay o toi nhat thi chi
        # duoc mot mang tien canh den.
        brightness = (
            light[box_height:, box_width:]
            - light[:-box_height, box_width:]
            - light[box_height:, :-box_width]
            + light[:-box_height, :-box_width]
        )
        scored = np.where(fits, brightness, -1)
        row, col = np.unravel_index(int(scored.argmax()), scored.shape)
        return int(col), int(row)

    low, high, best = 8, min(width, round(height * TILE_RATIO)), None
    while low <= high:
        middle = (low + high) // 2
        found = find(middle)
        if found:
            best = (middle, round(middle / TILE_RATIO), *found)
            low = middle + 1
        else:
            high = middle - 1

    if best is None:
        return centre_crop(image.convert("RGB"))

    # O rong nhat thuong chi vua duoc DUNG MOT cho, nen khong con gi de chon.
    # Lui lai mot chut de co nhieu vi tri kha di roi moi chon o sang nhat —
    # mat vai phan tram be rong, duoc dung phan dep cua buc anh.
    relaxed = find(round(best[0] * RELAX))
    if relaxed:
        best = (round(best[0] * RELAX), round(best[0] * RELAX / TILE_RATIO), *relaxed)

    box_width, box_height, left, top = best
    best = (0, left, top, left + box_width, top + box_height)

    _, x0, y0, x1, y1 = best
    fx, fy = image.width / width, image.height / height
    box = [round(x0 * fx), round(y0 * fy), round(x1 * fx), round(y1 * fy)]

    # Kiem lai tren AI PHA DO PHAN GIAI THAT: o tim duoc o ban thu nho co the
    # van liem phai mot goc trong suot. Co dan vao cho den khi khong con.
    alpha = np.asarray(image.getchannel("A"), dtype=np.uint8)
    for _ in range(24):
        patch = alpha[box[1] : box[3], box[0] : box[2]]
        # Chap nhan vai diem le o ria (mep mat na duoc lam min nen co mot dai
        # chuyen mo); doi hoi DAC TUYET DOI thi o bi co lai den mat mot nua.
        if patch.size == 0 or float((patch < 240).mean()) < 0.002:
            break
        inset = max(2, round((box[2] - box[0]) * 0.02))
        box = [box[0] + inset, box[1] + inset, box[2] - inset, box[3] - inset]

    return image.convert("RGB").crop(tuple(box))


def is_photographic(tile: Image.Image) -> bool:
    """Day co phai ANH CHUP khong, hay chi la mot hinh ve phong to?

    Khoang ho giua hai dai chu khong phai luc nao cung la anh — no co the la
    mot hang bieu tuong ung dung, mot logo, hay mot dai mau chuyen. Phong to
    nhung thu do len be rong dien thoai thi xau khong chiu duoc.
    """
    grey = np.asarray(tile.resize((240, 180)).convert("L"), dtype=np.float32)
    dx = np.abs(np.diff(grey, axis=1))[:-1]
    dy = np.abs(np.diff(grey, axis=0))[:, :-1]
    return float(((dx + dy) > 6).mean()) >= MIN_GRAIN


def bands(blocks: list[dict], page_height: float) -> list[dict]:
    """Cac dai chu cua trang, theo thu tu tu tren xuong.

    Moi dai ghi ca pham vi NGANG cua chu trong no — de biet con thua ben nao.
    """
    rows = sorted(
        (
            b
            for b in blocks
            if HEADER_BOTTOM <= b["y"] <= page_height - FOOTER_MARGIN
        ),
        key=lambda b: b["y"],
    )
    out: list[dict] = []
    for block in rows:
        top, bottom = block["y"], block["y"] + block["h"]
        left, right = block["x"], block["x"] + block["w"]
        if out and top - out[-1]["bottom"] <= BAND_GAP:
            band = out[-1]
            band["bottom"] = max(band["bottom"], bottom)
            band["left"] = min(band["left"], left)
            band["right"] = max(band["right"], right)
        else:
            out.append({"top": top, "bottom": bottom, "left": left, "right": right})
    return out


def gaps(page_height: float, text_bands: list[dict]) -> list[tuple[float, float, int, int]]:
    """Cac khoang ho giua cac dai chu — cho designer dat anh (rong het trang)."""
    edges = [
        {"top": HEADER_BOTTOM, "bottom": HEADER_BOTTOM},
        *text_bands,
        {"top": page_height - FOOTER_MARGIN, "bottom": page_height - FOOTER_MARGIN},
    ]
    out = []
    for before, after in zip(edges, edges[1:]):
        if after["top"] - before["bottom"] >= MIN_GAP:
            out.append((before["bottom"], after["top"], 0, CANVAS_WIDTH))
    return out


def side_slots(text_bands: list[dict]) -> list[tuple[float, float, int, int]]:
    """Nua trang doi dien voi cot chu, trong nhung dai ma chu chi chiem mot ben.

    Nhieu trang con khong he co khoang ho ngang nao — anh va chu nam CANH nhau.
    Cach doc chung la: neu ca dai chu deu nam lech han sang mot phia thi nua kia
    la anh.
    """
    out = []
    for band in text_bands:
        if band["bottom"] - band["top"] < MIN_SIDE_HEIGHT:
            continue
        if band["left"] > CANVAS_WIDTH / 2 + SIDE_MARGIN:
            out.append((band["top"], band["bottom"], 0, round(band["left"]) - SIDE_GUTTER))
        elif band["right"] < CANVAS_WIDTH / 2 - SIDE_MARGIN:
            out.append((band["top"], band["bottom"], round(band["right"]) + SIDE_GUTTER, CANVAS_WIDTH))
    return out


def read_band(
    spec: dict, slug_file: str, y0: float, y1: float, x0: int = 0, x1: int = CANVAS_WIDTH
) -> Image.Image | None:
    """Ghep cac lat nen lai de lay dung o (x0..x1, y0..y1) cua trang, o @2x."""
    scale = 2
    canvas = Image.new("RGB", ((x1 - x0) * scale, round((y1 - y0) * scale)), (0, 0, 0))
    drawn = False

    for index, slice_spec in enumerate(spec["slices"]):
        top = slice_spec["y"]
        bottom = top + slice_spec["displayHeight"]
        if y1 <= top or y0 >= bottom:
            continue
        path = SLICE_DIR / f"{slug_file}-{index}@{scale}x.webp"
        if not path.is_file():
            continue
        image = Image.open(path).convert("RGB")
        cut_top = max(y0, top)
        cut_bottom = min(y1, bottom)
        piece = image.crop(
            (
                x0 * scale,
                round((cut_top - top) * scale),
                x1 * scale,
                round((cut_bottom - top) * scale),
            )
        )
        canvas.paste(piece, (0, round((cut_top - y0) * scale)))
        drawn = True

    return canvas if drawn else None


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    text = json.loads(TEXT.read_text(encoding="utf-8"))
    out: dict[str, list[dict]] = {}
    total = 0

    for path in sorted(SUBPAGES.glob("*.json")):
        spec = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(spec, dict) or "slug" not in spec:
            continue
        slug = spec["slug"]
        page = text.get(slug)
        if not page:
            continue

        # Anh dau trang rieng, cat bo cot chua tua de ve san va cot thuoc tinh
        # ben phai (CLARITY / PROTECTION / ...). Bien cat do THANG tu toa do
        # chu OCR chu khong dat cung: moi trang co tua de dai ngan khac nhau.
        hero_text = [
            b for b in page["blocks"] if HERO_TOP <= b["y"] <= HERO_BOTTOM
        ]
        left_edge = max(
            (b["x"] + b["w"] for b in hero_text if b["x"] < CANVAS_WIDTH / 2),
            default=0,
        )
        right_edge = min(
            (b["x"] for b in hero_text if b["x"] >= CANVAS_WIDTH * 0.75),
            default=CANVAS_WIDTH,
        )
        hero_x0 = round(left_edge) + HERO_GUTTER
        hero_x1 = round(right_edge) - HERO_RIGHT_GUTTER
        hero = (
            read_band(spec, path.stem, HERO_TOP, HERO_BOTTOM, hero_x0, hero_x1)
            if hero_x1 - hero_x0 >= 320
            else None
        )
        hero_src = None
        if hero is not None:
            hero = centre_crop(hero)
            if is_usable(hero):
                hero.save(OUT / f"{path.stem}-hero.webp", "WEBP", quality=84, method=6)
                hero_src = f"/mobile/sub/{path.stem}-hero.webp"

        text_bands = bands(list(page["blocks"]), spec["height"])
        slots = [*gaps(spec["height"], text_bands), *side_slots(text_bands)]
        rows = []
        for index, (y0, y1, x0, x1) in enumerate(sorted(slots)):
            if len(rows) >= MAX_TILES:
                break
            if x1 - x0 < 260:
                continue
            band = read_band(spec, path.stem, y0, y1, x0, x1)
            if band is None:
                continue
            tile = tidy(band)
            if not is_usable(tile) or not is_photographic(tile):
                continue
            name = f"{path.stem}-{index}.webp"
            tile.save(OUT / name, "WEBP", quality=82, method=6)
            # `after` = dai chu dung NGAY TREN anh; ban mobile chen anh vao sau
            # dai chu do de giu dung mach doc cua thiet ke.
            rows.append({"after": y0, "src": f"/mobile/sub/{name}"})

        if not rows:
            # Trang nay chu de len het anh nen khong cat duoc o nao sach — lay
            # anh goc trong bo tai nguyen roi.
            anchor = text_bands[0]["bottom"] if text_bands else HEADER_BOTTOM
            for index, name in enumerate(SUBPAGE_ASSETS.get(slug, [])):
                source = ASSETS / name
                if not source.is_file():
                    print(f"    thieu anh roi: {source}")
                    continue
                # Anh roi von da sach: `largest_opaque` da tra ve dung o 4:3
                # can lay, cho qua tidy() nua chi lam no be di vo ich.
                tile = largest_opaque(Image.open(source).convert("RGBA"))
                file_name = f"{path.stem}-asset-{index}.webp"
                tile.save(OUT / file_name, "WEBP", quality=84, method=6)
                rows.append({"after": anchor + index, "src": f"/mobile/sub/{file_name}"})

        if rows or hero_src:
            out[slug] = {"hero": hero_src, "tiles": rows}
            total += len(rows)
        print(f"  {slug:<52} {len(rows)} anh")

    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Anh minh hoa ban MOBILE cua cac trang con. Cat o khoang ho giua "
                    "hai dai chu OCR — do chinh la cho designer dat anh. "
                    "Xem tools/brand/extract-subpage-tiles.py."
                ),
                "pages": out,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"\n  {DATA.relative_to(ROOT)} — {total} anh tren {len(out)} trang")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
