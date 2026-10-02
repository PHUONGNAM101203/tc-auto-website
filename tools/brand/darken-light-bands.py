#!/usr/bin/env python3
"""
Doi cac DAI NEN TRANG trong anh thiet ke sang tong toi cua ca site.

── Vi sao ──────────────────────────────────────────────────────────────────
Ban thiet ke xen vai dai nen TRANG giua cac dai navy (trang chu 12%, Giai phap
10%, Dai ly 12% chieu cao). Khach bao nhin "bị lệch màu rối mắt" va muon dong
bo mot tong (01/10/2026).

── Trong dai co gi ────────────────────────────────────────────────────────
Da kiem: ba dai nay TRANG TRON trong anh nen — moi chu va moi tam the deu la
PHAN TU THAT ve de len. Nen bo nay lam hai viec:
  1. to lai nen trong lat anh;
  2. doi mau nhung PHAN TU co mau toi nam trong dai.

Viec 2 phai sua trong DAC TA TRANG chu khong sua bang CSS: vai phan tu mang
mau o thuoc tinh `style` ngay tren the (vi du home-009 co color:#02111C lay tu
prototype), ma inline thi thang moi luat CSS.

Van giu phep lam mo DAN o hai mep dai: mep tren va mep duoi giap voi dai navy
san co, to cung mep thi lo mot duong ranh.

Chay thu mot dai (khong ghi de):
    python3 tools/brand/darken-light-bands.py --preview home
Chay that:
    python3 tools/brand/darken-light-bands.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent.parent
SPEC_DIR = ROOT / "src" / "data" / "pages"
SLICE_DIR = ROOT / "public" / "slices"
OUT = ROOT / "tools" / "fidelity" / "out"

CANVAS_WIDTH = 1440
#: Mau nen toi cua ca site.
NAVY = np.array([2, 17, 28], dtype=np.float32)
#: Diem anh sang hon muc nay (ca ba kenh) thi coi la NEN TRANG.
WHITE = 200
#: Diem anh toi hon muc nay thi co the la CHU.
DARK = 140
#: Ban kinh lam mo de do "xung quanh co trang khong".
AROUND = 9
#: Xung quanh phai trang den muc nay thi moi coi la chu tren nen trang.
AROUND_MIN = 0.55

#: Cac dai nen trang tren 6 TRANG CHINH.
#:
#: Do bang cach quet LE TRANG (x 8..40 va x 1400..1432) — cho chi co nen,
#: khong co anh. Ban dau quet ca be ngang va dem "hang nao co >70% diem sang",
#: cach do bat ca ANH sang lam nen trang.
BANDS: dict[str, list[tuple[int, int]]] = {
    "home": [(1425, 1862)],
    "giai-phap": [(5153, 5738)],
    "dai-ly": [(1537, 2108)],
    # Khach ra soat lai 02/10/2026 va con tim ra nam dai nua.
    "trai-nghiem": [(1448, 2028)],
}

#: Nhu tren, cho 31 TRANG CON.
SUB_BANDS: dict[str, list[tuple[int, int]]] = {
    "cong-nghe/tien-phong-cong-nghe": [(1702, 2333)],
    "giai-phap/du-an": [(1382, 1875), (2371, 2863)],
    "nhan-su/nhan-su-tc": [(1496, 2656)],
    "nhan-su/van-hoa-tc": [(1897, 2553)],
}

#: Mau chu TOI (doc tu trang dang chay) -> mau thay the tren nen navy.
#: Mau do (#c22326) va trang thi giu nguyen — chung van noi ro tren navy.
RECOLOUR = {
    "#02111c": "#ffffff",
    "#5b6168": "rgba(255,255,255,0.72)",
    "#585c5f": "rgba(255,255,255,0.72)",
}


def bands_of(slug: str) -> list[tuple[int, int]]:
    return BANDS.get(slug) or SUB_BANDS.get(slug) or []


def spec_path_of(slug: str) -> Path:
    """Tep dac ta cua mot trang — trang chinh hay trang con deu duoc."""
    if slug in BANDS:
        return SPEC_DIR / f"{slug}.json"
    return ROOT / "src" / "data" / "subpages" / (slug.replace("/", "__") + ".json")


def repaint_items(slug: str) -> int:
    """Doi mau chu cua cac phan tu nam trong dai da to toi.

    Chi 6 trang chinh moi co `items` (chu that tach tu prototype). Trang con
    thi chu nam TRONG anh nen, nen to toi la chu cung toi theo — khong co gi
    de doi mau, va cung khong can: `recolour()` dao sang-toi nen chu den tren
    nen trang thanh chu trang tren nen navy.
    """
    path = spec_path_of(slug)
    spec = json.loads(path.read_text(encoding="utf-8"))
    if "items" not in spec:
        return 0
    bands = bands_of(slug)
    changed = 0
    for item in spec["items"]:
        y = item.get("y")
        if y is None or not any(a <= y <= b for a, b in bands):
            continue
        css = item.get("css") or {}
        colour = str(css.get("color", "")).strip().lower()
        if colour in RECOLOUR:
            css["color"] = RECOLOUR[colour]
            item["css"] = css
            changed += 1
    if changed:
        path.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed


def recolour(image: Image.Image, top: int, y0: int, y1: int) -> Image.Image:
    """Doi mau mot dai trong MOT lat nen. `top` la y cua lat tren canvas."""
    scale = image.width / CANVAS_WIDTH
    a0 = max(0, round((y0 - top) * scale))
    a1 = min(image.height, round((y1 - top) * scale))
    if a1 <= a0:
        return image

    band = np.asarray(image.crop((0, a0, image.width, a1)), dtype=np.float32)

    # Diem anh cang sang thi cang nga han ve navy. Cach nay vua to kin vung
    # trang tron, vua chuyen muot o nhung diem anh nua sang nua toi o mep dai —
    # khong de lai duong ranh.
    t = ((band.min(axis=2) - DARK) / (WHITE - DARK)).clip(0.0, 1.0)[..., None]
    out = band * (1.0 - t) + NAVY * t

    patched = np.asarray(image, dtype=np.float32).copy()
    patched[a0:a1] = out
    return Image.fromarray(patched.clip(0, 255).astype(np.uint8), "RGB")


def slice_path_of(slug: str, index: int, suffix: str) -> Path:
    """Lat nen thu `index`. Trang con dung dau `__` va hau to `@2x`."""
    if slug in BANDS:
        return SLICE_DIR / f"{slug}-{index}{suffix}.webp"
    stem = slug.replace("/", "__")
    tail = suffix or "@2x"
    return SLICE_DIR / "sub" / f"{stem}-{index}{tail}.webp"


#: Dau da chay, ghi vao chinh tep dac ta cua trang.
MARK = "lightBandsDarkened"


def run(slug: str, preview: bool) -> int:
    spec_file = spec_path_of(slug)
    spec = json.loads(spec_file.read_text(encoding="utf-8"))

    # Chay hai lan la XOA SACH CHU. `recolour()` dao theo do sang: lan dau no
    # bien nen trang thanh navy va chu den thanh chu TRANG. Lan hai, chinh chu
    # trang do lai bi coi la "nen sang" va bien thanh navy — dai con lai mot
    # mang toi tron. Da dinh dung cai bay nay ngay 02/10/2026 khi mo rong bo
    # sang trang con, va phai dung lai tu anh goc.
    #
    # Trong chuoi `npm run parse:*` thi khong sao: buoc dau cua chuoi dung lai
    # lat nen tu anh thiet ke goc nen dau nay bi xoa theo. Chot nay chi chan
    # viec GOI TAY lan thu hai.
    if not preview and spec.get(MARK):
        print(f"  /{slug}: da to toi roi — bo qua. Muon lam lai thi chay"
              f" `npm run parse:prototype` / `parse:subpages`.")
        return 0

    touched = 0
    for suffix in ("", "@3x"):
        for index, slice_spec in enumerate(spec["slices"]):
            top = slice_spec["y"]
            bottom = top + slice_spec["displayHeight"]
            hit = [(a, b) for a, b in bands_of(slug) if a < bottom and b > top]
            if not hit:
                continue
            path = slice_path_of(slug, index, suffix)
            if not path.is_file():
                continue
            image = Image.open(path).convert("RGB")
            for y0, y1 in hit:
                image = recolour(image, top, max(y0, top), min(y1, bottom))
            if preview:
                OUT.mkdir(parents=True, exist_ok=True)
                target = OUT / f"_dark_{slug.replace('/', '__')}-{index}{suffix}.png"
                image.save(target)
                print(f"  xem thu: {target.relative_to(ROOT)}")
            else:
                image.save(path, "WEBP", quality=88, method=6)
            touched += 1

    if touched and not preview:
        spec[MARK] = True
        spec_file.write_text(
            json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    return touched


def main() -> int:
    preview = "--preview" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    slugs = args or [*BANDS, *SUB_BANDS]
    for slug in slugs:
        n = run(slug, preview)
        extra = "" if preview else f", doi mau {repaint_items(slug)} phan tu chu"
        print(f"  /{slug}: {n} lat nen{extra}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
