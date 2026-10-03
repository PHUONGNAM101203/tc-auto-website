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

from PIL import Image, ImageChops, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _backdrop import feathered, rebuild_background  # noqa: E402

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from design_root import asset_roots, design_root, design_system  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent.parent
DESIGN = design_root()
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

# Bon tam muc "Trai nghiem" tren trang chu. Cac tam dung SAT NHAU, ngan bang
# mot vach doc sang hon hai ben — do bang cach lay trung binh cot trong dai
# y 1000..1300 va tim cac cot troi len: x = 410,8 / 667,8 / 924,8 / 1181,8,
# cach deu 257. Tam cuoi chay het mep canvas (1181,8 + 257 = 1438,8).
# Be cao: vach ngan sang tu y 927; chu cuoi cung ("Hành trình của bạn"...) het
# o y 1379, roi 1380..1424 la nen troi, va muc trang tiep theo bat dau o 1425.
# Lay den 1382 de trum tron chan chu — dung o 1376 la cat mat chan cua dong
# phu de, va luc the phong to thi ban cat do nam lech tren ban ve chet ben
# duoi, nhin nhu chu bi gach ngang.
# Tieu de nam TRONG the (khong phai ngoai nhu bon o muc Cong nghe): ca cum
# anh + chu cung phong to mot the.
# Lam tron ve SO NGUYEN: cat anh thi lam tron, con CSS dat the theo so le —
# lech nua pixel la mep the khong trung anh nen, va gate pixel bat duoc ngay
# (do thuc te: 8127 diem lech truoc khi lam tron).
# Tam cuoi rong hon 1px de chay sat mep canvas 1440.
LIFE_RULES = (411, 668, 925, 1182)
LIFE_TOP, LIFE_HEIGHT, LIFE_WIDTH = 927, 455, 257
LIFE_LAST_WIDTH = 1440 - LIFE_RULES[3]

GROUPS = [
    {
        "page": "home",
        "slug": "home-trai-nghiem",
        "source": DESIGN / "1. Page_Home" / "Home.png",
        "spec": ROOT / "src" / "data" / "pages" / "home.json",
        "slice_prefix": "home",
        # KHONG xoa nen. Bon tam nam SAT NHAU va chay het mep canvas, ma nen
        # sau chung khong phang (co mot lop sang mo phu ca dai) nen dung lai se
        # lo ra. Thay vi nhac len, the nay PHONG TO tu tam — phong to thi no
        # luon phu kin dung cho cu, khong he ho nen ra. Xem `grow` ben duoi.
        "rebuild": "none",
        # The nam de len chinh anh nen cu (khong xoa), nen phai cat ra TU
        # CHINH LAT NEN chu khong tu PNG thiet ke — xem from_slices().
        "from": "slices",
        "quality": 92,
        # Mep khong lam mo: cac tam giap nhau, lam mo la thay duong noi.
        "feather": 0,
        "grow": True,
        # Tieu de nam TRONG anh the (khong phai ngoai nhu bon o muc Cong nghe).
        # Ban mobile nho do ma khong in lai chu, neu khong se doc thay hai lan.
        "captionInImage": True,
        "cards": [
            {
                "id": "hanh-trinh",
                "title": "HÀNH TRÌNH",
                "subtitle": "Hành trình của bạn",
                "href": "/trai-nghiem/hanh-trinh",
                "x": LIFE_RULES[0],
                "y": LIFE_TOP,
                "width": LIFE_WIDTH,
                "height": LIFE_HEIGHT,
            },
            {
                "id": "ban-sac-rieng",
                "title": "BẢN SẮC RIÊNG",
                "subtitle": "Định hình phong cách",
                "href": "/trai-nghiem/ban-sac-rieng",
                "x": LIFE_RULES[1],
                "y": LIFE_TOP,
                "width": LIFE_WIDTH,
                "height": LIFE_HEIGHT,
            },
            {
                "id": "khoanh-khac",
                "title": "KHOẢNH KHẮC",
                "subtitle": "Khoảnh khắc đáng nhớ",
                "href": "/trai-nghiem/khoanh-khac",
                "x": LIFE_RULES[2],
                "y": LIFE_TOP,
                "width": LIFE_WIDTH,
                "height": LIFE_HEIGHT,
            },
            {
                "id": "phong-cach-song",
                "title": "PHONG CÁCH SỐNG",
                "subtitle": "Hành trình đầy cảm hứng",
                "href": "/trai-nghiem/phong-cach-song",
                "x": LIFE_RULES[3],
                "y": LIFE_TOP,
                "width": LIFE_LAST_WIDTH,
                "height": LIFE_HEIGHT,
            },
        ],
    },
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
        # Tieu de NAM TRONG anh the (da kiem bang cach mo
        # public/lift/home-innovation@m.webp: chu "INNOVATION / Tiên phong
        # cong nghe" o ngay trong do). Khong khai thi ban mobile in lai chu
        # mot lan nua, doc ra hai lop chong len nhau — khach da chup lai
        # (02/10/2026). Chu thich o nhom `home-trai-nghiem` ghi "khong phai
        # ngoai nhu bon o muc Cong nghe" la ghi nham, bon o nay cung co chu
        # trong anh.
        "captionInImage": True,
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
        # Tieu de nam TRONG anh the — da kiem bang cach mo tep @m.webp.
        # Khong khai thi ban mobile in lai chu mot lan nua, doc ra hai
        # lop chong len nhau.
        "captionInImage": True,
        # Muc nay nam tren nen TRANG THUAN -> chi can to trang, khong can noi suy.
        "rebuild": "white",
        # Nen sau hai the nay trong thiet ke la DAI TRANG, nen khi cat ra thi
        # bon goc cua anh giu lai mau trang do. Bo goc de chung trong suot han.
        #
        # 64 chu khong phai 25. Lan truoc do "75px o ti le 3x = 25px canvas" —
        # do nham mot thu khac. Ban kinh THAT cua the suy tu chinh anh da cat:
        # diem trang con sot nam cach goc 10,4..26,3px canvas, ma mot goc bo
        # ban kinh R thi cho gan goc nhat o 0,414·R; 26,3 / 0,414 = 63,5.
        # Lay 64, va dai o bang 0 — khong con diem sang nao o bon goc.
        #
        # Hau qua cua viec do thieu: mot cung TRANG mong o ca bon goc, lo ra
        # ro nhat tren luoi mobile voi nen navy. Khach chi dung cho do
        # (02/10/2026): "sao chỗ này lại có mấy cái trắng bao bọc 4 góc nhỉ".
        "cornerRadius": 64,
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
        # Tieu de nam TRONG anh the — da kiem bang cach mo tep @m.webp.
        # Khong khai thi ban mobile in lai chu mot lan nua, doc ra hai
        # lop chong len nhau.
        "captionInImage": True,
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
    {
        # Hai the "MÀN HÌNH WINCA" / "MÀN HÌNH BRAVO" tren trang Giai phap.
        # Khach yeu cau (01/10/2026): ro chuot vao thi the noi len, bam WINCA
        # thi sang thang trang man hinh, bam BRAVO thi sang tab Bravo.
        #
        # Do tu lat nen: hai the cao 487, rong 375, cach nhau 33px, bat dau o
        # y 4665 — tieu de va mo ta deu nam TRONG anh the.
        "page": "giai-phap",
        "slug": "giai-phap-man-hinh",
        "lossless": True,
        "sliceScale": 2,
        # Them ban @3x BEN CANH ban @2x, khong thay the no. Man retina rong
        # 2560 can 1333px cho moi the; @2x chi cho 750 (ti le 0,56, duoi tran
        # 0,84 cua ban thiet ke). Nhung doi han sang @3x thi gate pixel bao
        # lech 1667 diem — nen @2x thu nho 2->1 con the @3x thu nho 3->1, sai
        # so lay mau khac nhau. Giu ca hai thi ti le 1 van di duong @2x (lech
        # 0) ma man retina duoc ban net.
        "retina": True,
        "source": DESIGN / "3.Page_Giải pháp" / "1.Giải pháp.png",
        "spec": ROOT / "src" / "data" / "pages" / "giai-phap.json",
        "slice_prefix": "giai-phap",
        # Nen sau hai the la mot dai chuyen mau chu khong phang, nen KHONG
        # dung lai nen; the phong to tu tam de luon phu kin cho cu.
        "rebuild": "none",
        "from": "slices",
        "quality": 92,
        "feather": 0,
        "grow": True,
        "captionInImage": True,
        "cards": [
            {
                "id": "winca",
                "title": "MÀN HÌNH WINCA",
                "subtitle": "Màn hình Android Winca – hiển thị QLED 2K sắc nét",
                "href": "/giai-phap/man-hinh",
                "x": 576,
                "y": 4665,
                "width": 375,
                "height": 487,
            },
            {
                "id": "bravo",
                "title": "MÀN HÌNH BRAVO",
                "subtitle": "Màn hình Android Bravo – cấu hình ổn định",
                # Tab Bravo ngay tren trang do, khong phai mot trang rieng —
                # khach da bo trang rieng (02/10/2026). ScreenTabs doc `?tab=`.
                "href": "/giai-phap/man-hinh?tab=bravo",
                "x": 984,
                "y": 4665,
                "width": 375,
                "height": 487,
            },
        ],
    },
    {
        # Ba the PPF xep doc tren trang Giai phap. Khach yeu cau ro chuot vao
        # thi noi len (01/10/2026).
        # Do tu lat nen: rong 672, cao 204, bat dau x 80, cac y cach nhau 229.
        "page": "giai-phap",
        "slug": "giai-phap-ppf",
        "lossless": True,
        "sliceScale": 2,
        #: Nhu tren: them ban @3x 2016px ben canh ban @2x 1344px.
        "retina": True,
        "source": DESIGN / "3.Page_Giải pháp" / "1.Giải pháp.png",
        "spec": ROOT / "src" / "data" / "pages" / "giai-phap.json",
        "slice_prefix": "giai-phap",
        "rebuild": "none",
        "from": "slices",
        "quality": 92,
        "feather": 0,
        "grow": True,
        "captionInImage": True,
        "cards": [
            {
                "id": "3m",
                "title": "3M PPF",
                "subtitle": "Phim bảo vệ sơn 3M",
                "href": "/giai-phap/ppf",
                "x": 80,
                "y": 2964,
                "width": 672,
                "height": 204,
            },
            {
                "id": "nano-sun",
                "title": "NANO SUN PPF",
                "subtitle": "Phim bảo vệ sơn Nano Sun",
                "href": "/giai-phap/ppf",
                "x": 80,
                "y": 3193,
                "width": 672,
                "height": 204,
            },
            {
                "id": "5do",
                "title": "5DO PPF",
                "subtitle": "Phim bảo vệ sơn 5DO",
                "href": "/giai-phap/ppf",
                "x": 80,
                "y": 3422,
                "width": 672,
                "height": 199,
            },
        ],
    },
]


def round_corners(art: Image.Image, radius: int, scale: float) -> Image.Image:
    """
    Lam trong suot bon goc theo dung ban kinh bo goc cua the.

    Chi dung cho nhom nao co nen DAC o goc — vi du dai the trang Dai ly nam
    tren dai trang trong thiet ke, cat ra la dinh theo bon o trang vuong.
    Nhom nao goc da trong suot san thi truyen radius = 0 va ham nay khong lam gi.
    """
    if radius <= 0:
        return art
    r = round(radius * scale)
    mask = Image.new("L", art.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, art.width - 1, art.height - 1), radius=r, fill=255
    )
    out = art.copy()
    alpha = out.getchannel("A")
    # Nhan vao alpha san co chu khong thay han: giu nguyen phan mo dan o mep
    # do `feathered()` tao ra.
    out.putalpha(ImageChops.multiply(alpha, mask))
    return out



def from_slices(group: dict, box: tuple[float, float, float, float], scale: int) -> Image.Image:
    """Cat mot o (theo he toa do canvas) ra tu chinh CAC LAT NEN dang hien thi.

    Dung cho nhom KHONG xoa nen: the nam de len anh nen cu nen hai ban phai
    trung nhau tung diem. Cat tu PNG thiet ke thi khong trung — lat nen cua 6
    trang chinh duoc tach tu ban export prototype, la mot ban RENDER KHAC voi
    PNG thiet ke; hai ban lech nhau du de gate pixel bat duoc (do thuc te:
    2088 diem, va nen o chat luong 100 cung khong bot).
    """
    spec = json.loads(Path(group["spec"]).read_text(encoding="utf-8"))
    x0, y0, x1, y1 = box
    out = Image.new("RGB", (round((x1 - x0) * scale), round((y1 - y0) * scale)))
    suffix = "" if scale == 2 else f"@{scale}x"
    for index, slice_spec in enumerate(spec["slices"]):
        top = slice_spec["y"]
        bottom = top + slice_spec["displayHeight"]
        if bottom <= y0 or top >= y1:
            continue
        path = SLICE_DIR / f"{group['slice_prefix']}-{index}{suffix}.webp"
        if not path.is_file():
            raise SystemExit(f"Thieu lat nen: {path}")
        image = Image.open(path).convert("RGB")
        piece = image.crop(
            (
                round(x0 * scale),
                round((max(y0, top) - top) * scale),
                round(x1 * scale),
                round((min(y1, bottom) - top) * scale),
            )
        )
        out.paste(piece, (0, round((max(y0, top) - y0) * scale)))
    return out


def build_art(
    group: dict,
    page: Image.Image,
    box: tuple[float, float, float, float],
    scale: float,
    slice_scale: int,
) -> Image.Image:
    """Cat mot the ra khoi anh nguon, lam mem mep va bo goc.

    `slice_scale` tach rieng khoi `scale` de con sinh duoc ban @3x di kem —
    xem `retina` o phan khai bao nhom.
    """
    if group.get("from") == "slices":
        # Ban CHINH phai cat o CUNG TI LE voi ban ma trinh duyet dung cho anh
        # nen.
        #
        # Gate so pixel chup o ti le 1, va o do trinh duyet chon ban @2x cho
        # lat nen (mo ta `w`, xem src/lib/slice-srcset.ts). Neu the duoc cat tu
        # @3x thi hai duong di khac nhau — nen @2x thu nho 2->1, the @3x thu
        # nho 3->1 — va sai so lay mau khien the hoi khac nen du noi dung y
        # het. Do duoc: 1614 diem tren trang Giai phap, va 1667 diem khi thu
        # lai ngay 01/10. Cat tu @2x thi hai ban di chung mot duong.
        art = from_slices(group, box, slice_scale)
    else:
        art = page.crop(
            (
                round(box[0] * scale),
                round(box[1] * scale),
                round(box[2] * scale),
                round(box[3] * scale),
            )
        ).convert("RGB")
    feather = group.get(
        "feather",
        FEATHER_FLAT if group["rebuild"] in ("white", "fill") else FEATHER,
    )
    art = feathered(art, round(feather * scale)) if feather else art.convert("RGBA")
    return round_corners(art, group.get("cornerRadius", 0), scale)


def export_group(group: dict) -> list[dict]:
    OUT.mkdir(parents=True, exist_ok=True)
    page = Image.open(group["source"])
    scale = page.width / CANVAS_WIDTH
    manifest = []

    for card in group["cards"]:
        box = (
            card["x"],
            card["y"],
            card["x"] + card["width"],
            card["y"] + card["height"],
        )
        art = build_art(group, page, box, scale, group.get("sliceScale", 3))

        target = OUT / f"{group['slug']}-{card['id']}.webp"
        # Nhom nao KHONG xoa nen thi the nam de len chinh anh nen cu: hai ban
        # phai trung nhau tung diem, nen nen o chat luong cao hon de sai so ma
        # hoa khong lo ra o gate pixel.
        quality = group.get("quality", 88)
        # `lossless`: the nao ve DE LEN dung cho cu cua no (rebuild "none")
        # thi moi diem anh phai trung khit. Nen co mat du mot chut la gate so
        # pixel bao dong — ma do khong phai thay doi giao dien, chi la nhieu
        # nen. Cac nhom khac da xoa nen cu di nen khong can.
        if group.get("lossless"):
            art.save(target, "WEBP", lossless=True, method=6)
        else:
            art.save(target, "WEBP", quality=quality, method=6)
        entry = {**card, "src": f"/lift/{group['slug']}-{card['id']}.webp"}

        # Ban @3x di KEM, khong thay the. Mo ta `w` chu khong `x` (xem
        # src/lib/slice-srcset.ts): the duoc phong theo be rong cua so nen chi
        # co `w` moi chon dung ban.
        if group.get("retina"):
            big = build_art(group, page, box, scale, 3)
            big_target = OUT / f"{group['slug']}-{card['id']}@3x.webp"
            if group.get("lossless"):
                big.save(big_target, "WEBP", lossless=True, method=6)
            else:
                big.save(big_target, "WEBP", quality=quality, method=6)
            entry["srcSet"] = [
                {"src": entry["src"], "width": art.width},
                {"src": f"/lift/{group['slug']}-{card['id']}@3x.webp", "width": big.width},
            ]
            print(f"  {big_target.relative_to(ROOT)}  {big.width}x{big.height}  "
                  f"{big_target.stat().st_size / 1e3:.0f} KB")
        if group.get("grow"):
            # Phong to thay vi nhac len — xem ghi chu o nhom.
            entry["grow"] = True
        if group.get("captionInImage"):
            entry["captionInImage"] = True
        # Cac the CUNG MOT NHOM mo di khi ro chuot vao mot the trong nhom; cac
        # nhom khac tren cung trang thi khong lien quan.
        entry["group"] = group["slug"]
        manifest.append(entry)
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
    if group["rebuild"] == "none":
        return 0
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
