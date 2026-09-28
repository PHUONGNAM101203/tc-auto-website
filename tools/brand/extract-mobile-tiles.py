#!/usr/bin/env python3
"""
Cat anh minh hoa cho tung MUC cua 6 trang chinh, de dung ban mobile.

Canvas 1440px khong co dan duoc: tren dien thoai no bi thu con 27%, chu than
bai chi con 3-4px. Ban mobile vi vay duoc dung lai tu DU LIEU chu khong phai
thu nho anh: chu lay tu page spec, con anh thi cat o day.

Cach tim anh cua mot muc: trong thiet ke, chu cua muc nam GON mot cot va anh
nam o cot doi dien. Doc toa do x cua cac item trong muc la biet chu ben nao,
roi cat nua con lai.

Chay: python3 tools/brand/extract-mobile-tiles.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
PAGES = ROOT / "src" / "data" / "pages"
SLICE_DIR = ROOT / "public" / "slices"
OUT = ROOT / "public" / "mobile"
DATA = ROOT / "src" / "data" / "mobile-sections.json"

CANVAS_WIDTH = 1440
# Anh tren mobile hien o ti le 4:3 — vua mat, khong chiem het man hinh.
TILE_RATIO = 4 / 3
# Le an toan de khong cat pham vao cot chu.
GUTTER = 24
# Anh qua "phang" (gradient tron, nen tron) thi khong dang lam anh minh hoa.
MIN_DETAIL = 14.0
# Anh gan nhu trang xoa thuong la dai chan trang — bo.
MAX_WHITE = 0.45
# Anh co mang DEN lon thuong la phan khung nam ngoai pham vi lat nen — bo.
MAX_BLACK = 0.30
# Anh qua toi thi tren nen navy nhin ra nhu cho trong — bo, dung anh du phong.
MIN_MEAN = 26.0
MIN_LIT = 0.08
# Chi tiet du giau thi chac chan la anh that, du no toi.
RICH_DETAIL = 22.0
# Hang/cot gan nhu khong co chi tiet — vach phan cach hoac nen tron.
FLAT_STD = 3.5
# Do lech do sang giua hai hang/cot ke nhau du lon de coi la MOI GHEP.
SEAM = 11.0
# Doan giu lai phai chiem it nhat ngan nay chieu dai, neu khong thi khong tin.
MIN_KEEP = 0.42

# Muc co khung cat tay thi khong can anh du phong nua.
# Muc nao khong cat duoc anh dung (cot doi dien la nen phang hoac chan trang)
# thi muon anh SACH da boc san o buoc khac. Anh mo ta dung muc do nen khong
# phai la anh dat cho.
# Anh du phong cung di qua tidy(): chung duoc boc cho muc dich khac nen co the
# con dinh vien hay dai phan cach.
FALLBACK = {
    # Dai the "Giải pháp" da duoc tach ra khoi lat nen (cac the gio la phan tu
    # that), nen cho do trong lat chi con mau trang — phai lay anh the roi.
    "home-007": "/solutions/ppf.webp",
    "home-011": "/lift/home-innovation.webp",
    "cong-nghe-008": "/cards/kho-ung-dung.webp",
    "dai-ly-006": "/lift/dai-ly-hanh-trinh-hop-tac.webp",
    "dai-ly-014": "/sliders/chan-dung-dai-ly-2.webp",
    "giai-phap-011": "/solutions/loa.webp",
    "giai-phap-018": "/sliders/chan-dung-dai-ly-3.webp",
    "nhan-su-002": "/sliders/con-nguoi-tc-2.webp",
    "cong-nghe-016": "/lift/home-experience-lab.webp",
    "dai-ly-002": "/sliders/chan-dung-dai-ly-1.webp",
}

# Muc nao co khung cat do TAY thi dung khung nay, khong suy ra tu toa do chu.
# Can den khi vung anh cua muc gom NHIEU anh ghep lai (mot luoi anh chang han):
# thu gon ca luoi xuong be rong dien thoai thi khong con doc duoc gi, lay MOT
# anh trong do thi vua dep.
BOX_OVERRIDE = {
    # Luoi 4 anh "HÀNH TRÌNH / BẢN SẮC RIÊNG / KHOẢNH KHẮC / PHONG CÁCH SỐNG"
    # trai dai x416..1440. Lay o thu hai — o sang va bat mat nhat trong bon.
    "home-003": (672, 960, 928, 1152),
}

# Khoi dau moi muc.
SECTION_START = "lbl"
HEADINGS = ("h", "hi")
PARAGRAPHS = ("p", "pi")


def classes(item: dict) -> set[str]:
    return set(item.get("classes") or [])


# Tieu de doi khi duoc dat CAO HON nhan cua chinh muc do vai pixel (vi du
# home-012 o y=1888 trong khi nhan home-011 o y=1894). Neu chia muc bang cach
# so y thuan tuy thi tieu de roi nham sang muc truoc.
LABEL_TOLERANCE = 60


def split_sections(items: list[dict]) -> list[list[dict]]:
    """Chia danh sach item thanh cac muc, moi muc bat dau o mot nhan `lbl`."""
    ordered = sorted(items, key=lambda i: (i.get("y") or 0, i.get("x") or 0))
    labels = [i for i in ordered if SECTION_START in classes(i)]
    if not labels:
        return []

    # Ranh gioi muc: lui len tren nhan mot doan de don cac tieu de dat cao hon.
    bounds = [(label.get("y") or 0) - LABEL_TOLERANCE for label in labels]

    sections: list[list[dict]] = [[] for _ in labels]
    for item in ordered:
        y = item.get("y") or 0
        index = -1
        for position, edge in enumerate(bounds):
            if y >= edge:
                index = position
        if index >= 0:
            sections[index].append(item)

    return [section for section in sections if section]


def text_span(section: list[dict]) -> tuple[float, float]:
    left = min(i.get("x") or 0 for i in section)
    right = max((i.get("x") or 0) + (i.get("w") or 0) for i in section)
    return left, right


def tile_box(
    section: list[dict], top: float, bottom: float, page_height: float
) -> tuple[int, int, int, int] | None:
    """Vung anh cua muc: nua doi dien voi cot chu."""
    left, right = text_span(section)
    if left > CANVAS_WIDTH / 2:
        x0, x1 = 0, max(0, left - GUTTER)
    else:
        x0, x1 = min(CANVAS_WIDTH, right + GUTTER), CANVAS_WIDTH
    if x1 - x0 < 200:
        return None

    # KHONG duoc tran ra ngoai dai cua muc. Truoc day khung duoc noi cao ra de
    # dat 4:3, nen no nuot luon vach phan cach, dai chan trang, hoac nua anh cua
    # muc ke ben — day chinh la nguon goc cua nhung anh ghep loang choang. Gio
    # khung chi duoc CO LAI trong dai, con ti le do tidy() lo not.
    y0, y1 = top, bottom
    width = x1 - x0
    height = min(width / TILE_RATIO, y1 - y0)
    centre = (y0 + y1) / 2
    y0 = centre - height / 2
    y1 = centre + height / 2

    # Keo khung vao trong trang: phan tho ra ngoai khong co lat nen nao ve,
    # de nguyen se thanh mang den.
    if y0 < 0:
        y0, y1 = 0, height
    if y1 > page_height:
        y1, y0 = page_height, max(0.0, page_height - height)
    if y1 - y0 < height * 0.75:
        return None

    return round(x0), round(y0), round(x1), round(y1)


def read_band(spec: dict, slug: str, box: tuple[int, int, int, int]) -> Image.Image | None:
    """Ghep phan anh nam trong `box` tu cac lat nen cua trang."""
    x0, y0, x1, y1 = box
    scale = 2
    canvas = Image.new("RGB", ((x1 - x0) * scale, (y1 - y0) * scale))
    drawn = False

    for index, slice_spec in enumerate(spec["slices"]):
        top = slice_spec["y"]
        bottom = top + slice_spec["displayHeight"]
        if y1 <= top or y0 >= bottom:
            continue
        path = SLICE_DIR / f"{slug}-{index}.webp"
        if not path.is_file():
            continue

        image = Image.open(path).convert("RGB")
        from_y = max(y0, top)
        to_y = min(y1, bottom)
        part = image.crop(
            (
                round(x0 * scale),
                round((from_y - top) * scale),
                round(x1 * scale),
                round((to_y - top) * scale),
            )
        )
        canvas.paste(part, (0, round((from_y - y0) * scale)))
        drawn = True

    return canvas if drawn else None


def _largest_segment(profile: np.ndarray, length: int) -> tuple[int, int]:
    """Doan dai nhat khong bi cat boi mot moi ghep.

    `profile` la do sang trung binh cua tung hang (hoac tung cot). Cho nao do
    sang nhay bac thang thi do la ranh giua hai manh anh khac nhau — hoac mot
    vach phan cach, hoac dai chan trang, hoac nua anh cua muc ke ben.
    """
    steps = np.abs(np.diff(profile))
    cuts = [0, *[int(y) + 1 for y, v in enumerate(steps) if v > SEAM], length]
    best = (0, length)
    for start, end in zip(cuts, cuts[1:]):
        if end - start > best[1] - best[0]:
            best = (start, end)
    return best


def tidy(tile: Image.Image) -> Image.Image:
    """Cat bo vach phan cach va manh anh la lan vao hop cat.

    Hop cat cua mot muc duoc suy ra tu toa do chu, nen no hay lan sang phan ke
    ben: mot vach trang, dai chan trang, hay nua tren cua anh muc sau. Ba thu
    do deu de nhan: hoac la dai PHANG LI, hoac cach phan anh that bang mot
    buoc nhay do sang. Cat het roi dua ve dung ti le 4:3.
    """
    pixels = np.asarray(tile.convert("RGB"), dtype=np.float32)
    grey = pixels.mean(axis=2)

    # 1. Bo cac hang / cot phang li HOAC trang xoa / den kit o hai dau — deu la
    #    vach phan cach hay dai chan trang, khong phai anh.
    def junk(std: np.ndarray, mean: np.ndarray) -> np.ndarray:
        return (std < FLAT_STD) | (mean > 228.0) | (mean < 12.0)

    def trim(flat: np.ndarray, size: int) -> tuple[int, int]:
        """Doan LIEN TUC dai nhat khong dinh rac.

        Khong chi got hai dau: mot vach trang hay dai chan trang thuong con
        vai hang toi nam duoi no, got tu ngoai vao se dung ngay o hang toi do
        va vach van con nguyen trong anh.
        """
        best = (0, 0)
        start = None
        for index, junky in enumerate([*flat, True]):
            if not junky and start is None:
                start = index
            elif junky and start is not None:
                if index - start > best[1] - best[0]:
                    best = (start, index)
                start = None
        return best if best[1] - best[0] >= size * MIN_KEEP else (0, size)

    top, bottom = trim(junk(grey.std(axis=1), grey.mean(axis=1)), tile.height)
    left, right = trim(junk(grey.std(axis=0), grey.mean(axis=0)), tile.width)
    grey = grey[top:bottom, left:right]

    # 2. Giu doan lien tuc lon nhat giua cac moi ghep, theo ca hai truc.
    y0, y1 = _largest_segment(grey.mean(axis=1), grey.shape[0])
    if y1 - y0 < grey.shape[0] * MIN_KEEP:
        y0, y1 = 0, grey.shape[0]
    x0, x1 = _largest_segment(grey.mean(axis=0), grey.shape[1])
    if x1 - x0 < grey.shape[1] * MIN_KEEP:
        x0, x1 = 0, grey.shape[1]

    tile = tile.crop((left + x0, top + y0, left + x1, top + y1))

    # 3. Dua ve 4:3, cat giua.
    width, height = tile.size
    if width / height > TILE_RATIO:
        keep = round(height * TILE_RATIO)
        offset = (width - keep) // 2
        tile = tile.crop((offset, 0, offset + keep, height))
    else:
        keep = round(width / TILE_RATIO)
        offset = (height - keep) // 2
        tile = tile.crop((0, offset, width, offset + keep))
    return tile


def dedupe_repeats(text: str) -> str:
    """Bo phan lap khi mot doan bi nhan ban lien tiep.

    Mot so khoi chu trong ban thiet ke duoc ve lap lai — tren desktop khung co
    chieu cao co dinh nen phan thua bi cat, nhung ban mobile de chu chay tu do
    thi lo ra ca ba bon ban sao. Lay CHU KY NGAN NHAT.
    """
    text = text.strip()
    size = len(text)
    for period in range(1, size // 2 + 1):
        if size % period == 0 and text[:period] * (size // period) == text:
            return text[:period]
    return text


def is_usable(tile: Image.Image) -> bool:
    """Loai anh phang li hoac gan nhu trang xoa — do la nen hoac chan trang."""
    pixels = np.asarray(tile.resize((120, 90)), dtype=np.float32)
    grey = pixels.mean(axis=2)
    if float(grey.std()) < MIN_DETAIL:
        return False
    if float((grey > 232).mean()) >= MAX_WHITE:
        return False
    # Mang den tuyet doi la cho khung do ra ngoai pham vi lat nen.
    if float((grey < 10).mean()) >= MAX_BLACK:
        return False
    # Anh gan nhu den kit: tren nen navy no khong khac gi cho trong. Nhung mot
    # buc anh TOI THAT SU van day chi tiet — doi hoi do sang o day se bo mat
    # dung nhung khung hinh dem dep nhat, nen chi doi hoi khi anh nhat chi tiet.
    if float(grey.std()) >= RICH_DETAIL:
        return True
    return float(grey.mean()) >= MIN_MEAN and float((grey > 70).mean()) >= MIN_LIT


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    out: dict[str, list[dict]] = {}
    heroes: dict[str, dict] = {}

    for path in sorted(PAGES.glob("*.json")):
        spec = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(spec, dict) or "slug" not in spec:
            continue
        slug = spec["slug"]
        sections = split_sections(spec["items"])
        rows = []

        # Anh hero: cat nua PHAI cua dai hero (chu hero nam o nua trai, x=82),
        # ti le doc 3:4 cho vua man hinh dien thoai.
        hero_box = (760, 90, 1440, int(90 + (1440 - 760) * 4 / 3))
        hero = read_band(spec, slug, hero_box)
        hero_src = None
        if hero is not None and is_usable(hero):
            hero.save(OUT / f"{slug}-hero.webp", "WEBP", quality=82, method=6)
            hero_src = f"/mobile/{slug}-hero.webp"

        for index, section in enumerate(sections):
            top = min(i.get("y") or 0 for i in section)
            # Muc cuoi khong duoc lan xuong form lien he / chan trang.
            floor = (spec.get("contactForm") or {}).get("y") or spec["height"]
            bottom = (
                min(j.get("y") or 0 for j in sections[index + 1])
                if index + 1 < len(sections)
                else floor
            )

            label = next((i for i in section if SECTION_START in classes(i)), None)
            heading = next((i for i in section if classes(i) & set(HEADINGS)), None)
            body = next((i for i in section if classes(i) & set(PARAGRAPHS)), None)
            button = next((i for i in section if "btn" in classes(i)), None)

            row = {
                "id": (label or section[0])["id"],
                "label": (label or {}).get("text", ""),
                "heading": (heading or {}).get("html", (heading or {}).get("text", "")),
                "body": dedupe_repeats((body or {}).get("text", "")),
                "cta": {"label": (button or {}).get("text", ""), "itemId": (button or {}).get("id")}
                if button
                else None,
            }

            # Anh du phong duoc chon TAY cho dung muc, nen no luon thang anh
            # tu cat: cat tu dong chi la phuong an cuoi.
            if row["id"] in FALLBACK:
                source = ROOT / "public" / FALLBACK[row["id"]].lstrip("/")
                name = f"{slug}-{index}.webp"
                tidy(Image.open(source).convert("RGB")).save(
                    OUT / name, "WEBP", quality=82, method=6
                )
                row["image"] = f"/mobile/{name}"

            box = BOX_OVERRIDE.get(row["id"]) or tile_box(section, top, bottom, spec["height"])
            if "image" not in row and box:
                tile = read_band(spec, slug, box)
                if tile is not None:
                    tile = tidy(tile)
                if tile is not None and is_usable(tile):
                    name = f"{slug}-{index}.webp"
                    tile.save(OUT / name, "WEBP", quality=82, method=6)
                    row["image"] = f"/mobile/{name}"

            rows.append(row)

        out[slug] = rows
        heroes[slug] = {
            "image": hero_src,
            "title": next(
                (i.get("text") for i in spec["items"] if "herot" in classes(i)), spec["title"]
            ),
            "slogan": next((i.get("text") for i in spec["items"] if "slogan" in classes(i)), ""),
        }
        print(f"  {slug:<14} {len(rows)} muc, {sum(1 for r in rows if 'image' in r)} co anh")

    DATA.write_text(
        json.dumps(
            {
                "_doc": (
                    "Noi dung tung muc cua 6 trang chinh, dung cho ban MOBILE. Chu lay tu "
                    "page spec; anh cat tu lat nen o cot doi dien voi cot chu "
                    "(tools/brand/extract-mobile-tiles.py)."
                ),
                "heroes": heroes,
                "pages": out,
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
