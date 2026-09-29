#!/usr/bin/env python3
"""
Tach ba the "CÁC BÀI VIẾT KHÁC" o cuoi trang bai viet.

── Vi sao can bo nay ───────────────────────────────────────────────────────
Ba anh nay truoc day duoc dat vao public/related/ bang tay, lay tu bo
"Tài nguyên Web 2". Bo do xuat MOI tep o dung 512px chieu cao, nen ba anh chi
rong 770px trong khi cho dat chung rong 597px tren canvas — tuc chua day @1,3x.
Tren man retina chung mo han so voi phan con lai cua trang.

── Lay tu dau cho net ──────────────────────────────────────────────────────
The GIUA nam tron trong canvas nen cat thang tu PNG thiet ke @3x -> 1790px,
dung bang @3x, va trung khop tuyet doi voi thiet ke.

Hai the NGOAI bi canh canvas cat mat (chi thay 375 tren 597), nen phan thieu
phai lay tu bo tai nguyen roi. Ban to nhat tim duoc la 1262px o bo "Tài nguyên
Web" (bo cu) — van hon ban 770px gap ruoi.

Bo cu va bo moi khac nhau ve SAC DO. De ba the dung canh nhau khong lech mau,
anh lay tu bo roi duoc keo ve dung mau cua thiet ke: khop tuyen tinh tung kenh
(he so nhan + so cong) do tren dung phan cua the co mat trong canvas.

Bo nay TU KIEM TRA: neu anh trong bo tai nguyen khong phai cung tam voi cai
thiet ke ve, sai so sau khi khop se vot len va bo nem loi thay vi lang le xuat
nham anh.

Chay: python3 tools/brand/extract-related-cards.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from asset_source import require as require_asset  # noqa: E402
from manifest_source import load, sub_root  # noqa: E402

MANIFEST = ROOT / "tools" / "subpage-manifest.json"
OUT = ROOT / "public" / "related"
ARTICLE = "trai-nghiem/phong-cach-song/doi-mau-doi-dien-mao"

CANVAS_WIDTH = 1440
#: Do bang cach quet cac COT toan mau nen (#021118) trong be cao cua the —
#: hai khe nam o x 375,7..422,0 va 1018,7..1065,0, moi khe rong 46,3.
CARD_WIDTH = 596.7
CARD_LEFTS = (-221.0, 422.0, 1065.0)
#: Do bang cach tim hang dau tien HET phang trong be ngang the giua.
CARD_TOP = 2801.0
CARD_HEIGHT = 397.0

#: Thu tu trung voi "cards" trong src/data/related-strip.json.
#: `asset` la None voi the nam tron trong canvas — the do cat thang tu thiet ke.
CARDS = (
    ("khong-gian-rieng-tu", "1. Page_Trải nghiệm/1.4. Phong cách sống/Rectangle 194.png"),
    ("xe-chon-ban", None),
    ("gu-nghe-nhac", "1. Page_Trải nghiệm/1.4. Phong cách sống/Rectangle 202.png"),
)

#: Sai so con lai cho phep sau khi khop mau, tren thang 0..255.
#:
#: Do thuc te: khong-gian-rieng-tu 1,6 — gan nhu trung khop. gu-nghe-nhac 18,4:
#: cung tam anh, cung khung (da do bang cach quet phong to 0,94..1,10 va dich
#: +-60px, diem tot nhat dung o phong 1,00 dich (0,0)), nhung hai bo tai nguyen
#: chinh mau khac nhau va tam nay co mang troi phang rat rong nen mot chenh
#: lech tong nho cung cong don lai. Lay nham tam anh thi sai so vot len tren 30,
#: nen 22 van con la cai luoi phan biet duoc hai truong hop.
MAX_RESIDUAL = 22.0


def design_canvas() -> tuple[Image.Image, int]:
    manifest = load(MANIFEST)
    entry = next(p for p in manifest["pages"] if p["slug"] == ARTICLE)
    path = sub_root(manifest) / entry["dir"] / entry["file"]
    image = Image.open(path).convert("RGB")
    return image, image.width // CANVAS_WIDTH


def crop_card(page: Image.Image, scale: int, left: float) -> Image.Image:
    """Phan cua the CO MAT trong canvas, cat o do phan giai goc."""
    x0 = round(max(0.0, left) * scale)
    x1 = round(min(float(CANVAS_WIDTH), left + CARD_WIDTH) * scale)
    return page.crop((x0, round(CARD_TOP * scale), x1, round((CARD_TOP + CARD_HEIGHT) * scale)))


#: Bo bot mep khi DO, vi hai ben bo goc khac nhau: the trong thiet ke bi canh
#: canvas cat phang, con anh trong bo tai nguyen mang san goc bo cua no.
MARGIN = 40


def inner(image: Image.Image) -> np.ndarray:
    a = np.asarray(image, dtype=np.float64)
    return a[MARGIN:-MARGIN, MARGIN:-MARGIN]


def fit_colour(source: Image.Image, overlap: Image.Image, target: Image.Image) -> Image.Image:
    """
    Keo `source` ve dung sac do cua `target` — mot he so nhan, mot so cong.

    `overlap` la DUNG phan cua `source` ung voi `target`. Phai truyen rieng:
    lay ca `source` ma khop voi mot manh cua no la so hai noi dung khac nhau,
    ket qua ra mot phep bien doi bac mau.
    """
    a, b = inner(overlap.resize(target.size, Image.LANCZOS)), inner(target)
    out = np.asarray(source, dtype=np.float64).copy()
    for channel in range(3):
        x, y = a[..., channel].ravel(), b[..., channel].ravel()
        gain, offset = np.polyfit(x, y, 1) if x.std() > 1 else (1.0, 0.0)
        out[..., channel] = out[..., channel] * gain + offset
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def residual(source: Image.Image, target: Image.Image) -> float:
    a = inner(source.resize(target.size, Image.LANCZOS))
    return float(np.abs(a - inner(target)).mean())


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    page, scale = design_canvas()
    width = round(CARD_WIDTH * scale)
    height = round(CARD_HEIGHT * scale)
    problems: list[str] = []

    for index, (card_id, asset) in enumerate(CARDS):
        left = CARD_LEFTS[index]
        visible = crop_card(page, scale, left)

        if asset is None:
            art = visible.resize((width, height), Image.LANCZOS)
            note = "cat thang tu thiet ke"
        else:
            art = Image.open(require_asset(asset)).convert("RGB")
            art = art.resize((width, height), Image.LANCZOS)
            # Phan the co mat trong canvas nam o cuoi anh (the bi cat mep trai)
            # hay o dau anh (the bi cat mep phai)?
            window = (
                (width - visible.width, 0, width, height)
                if left < 0
                else (0, 0, visible.width, height)
            )
            art = fit_colour(art, art.crop(window), visible)
            score = residual(art.crop(window), visible)
            note = f"bo tai nguyen, sai so {score:.1f}"
            if score > MAX_RESIDUAL:
                problems.append(f"{card_id}: sai so {score:.1f} > {MAX_RESIDUAL}")

        target = OUT / f"{card_id}.webp"
        art.save(target, "WEBP", quality=88, method=6)
        print(f"  {target.relative_to(ROOT)}  {art.width}x{art.height}  "
              f"{target.stat().st_size / 1e3:5.0f} KB  — {note}")

    if problems:
        print("\n  Anh khong khop voi thiet ke:")
        for line in problems:
            print(f"    {line}")
        return 1

    # KHONG ghi de hinh hoc trong related-strip.json. Bo nay chi doi NGUON ANH;
    # bo cuc cua dai da duoc khach duyet roi. Kich thuoc do duoc tu thiet ke nam
    # o cac hang so dau tep, de doi chieu khi can.
    return 0


if __name__ == "__main__":
    sys.exit(main())
