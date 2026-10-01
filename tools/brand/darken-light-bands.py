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

#: Cac dai nen trang, do bang cach quet hang nao co >70% diem anh sang.
BANDS: dict[str, list[tuple[int, int]]] = {
    "home": [(1425, 1862)],
    "giai-phap": [(5153, 5738)],
    "dai-ly": [(1537, 2108)],
}

#: Mau chu TOI (doc tu trang dang chay) -> mau thay the tren nen navy.
#: Mau do (#c22326) va trang thi giu nguyen — chung van noi ro tren navy.
RECOLOUR = {
    "#02111c": "#ffffff",
    "#5b6168": "rgba(255,255,255,0.72)",
    "#585c5f": "rgba(255,255,255,0.72)",
}


def repaint_items(slug: str) -> int:
    """Doi mau chu cua cac phan tu nam trong dai da to toi."""
    path = SPEC_DIR / f"{slug}.json"
    spec = json.loads(path.read_text(encoding="utf-8"))
    bands = BANDS[slug]
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


def run(slug: str, preview: bool) -> int:
    spec = json.loads((SPEC_DIR / f"{slug}.json").read_text(encoding="utf-8"))
    touched = 0
    for suffix in ("", "@3x"):
        for index, slice_spec in enumerate(spec["slices"]):
            top = slice_spec["y"]
            bottom = top + slice_spec["displayHeight"]
            hit = [(a, b) for a, b in BANDS[slug] if a < bottom and b > top]
            if not hit:
                continue
            path = SLICE_DIR / f"{slug}-{index}{suffix}.webp"
            image = Image.open(path).convert("RGB")
            for y0, y1 in hit:
                image = recolour(image, top, max(y0, top), min(y1, bottom))
            if preview:
                OUT.mkdir(parents=True, exist_ok=True)
                target = OUT / f"_dark_{slug}-{index}{suffix}.png"
                image.save(target)
                print(f"  xem thu: {target.relative_to(ROOT)}")
            else:
                image.save(path, "WEBP", quality=88, method=6)
            touched += 1
    return touched


def main() -> int:
    preview = "--preview" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    slugs = args or list(BANDS)
    for slug in slugs:
        n = run(slug, preview)
        extra = "" if preview else f", doi mau {repaint_items(slug)} phan tu chu"
        print(f"  /{slug}: {n} lat nen{extra}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
