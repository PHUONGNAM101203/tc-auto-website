#!/usr/bin/env python3
"""
Tim ban DO PHAN GIAI CAO HON cua nhung anh dang mo, tren chinh tcauto.vn.

── Vi sao ─────────────────────────────────────────────────────────────────
15 anh tren site thieu net 1,6-2,0 lan so voi muc can cho man retina rong
(xem danh sach `SOURCE_LIMITED` trong tools/fidelity/check-sharpness.mjs).
Bo tai nguyen cua khach khong co ban to hon. Nhung tcauto.vn — trang hien tai
cua chinh TC Auto — co thu vien media hon 2300 anh, trong do nhieu tam la
ANH GOC cua nhung tam da bi thu nho khi dua vao thiet ke.

Khach chon huong nay (02/10/2026) thay vi nang net bang AI: anh that cua
cong ty, khong doan them mot diem anh nao.

── Cach so khop ───────────────────────────────────────────────────────────
Ten tep ben do bi bam (`tcauto-vn-xznKZbRKm8.jpg`) nen khong doi chieu duoc
theo ten. So theo NOI DUNG:
  1. loc ung vien theo TI LE KHUNG HINH (±2%) va phai to hon han (>1,15 lan);
  2. tai ban nho ve, dua ca hai ve thang do xam 64 diem roi tinh he so tuong
     quan Pearson;
  3. chi nhan khi >= 0.90 — duoi muc do la hai buc khac nhau.

Chi xu ly duoc nhung tam GIU NGUYEN KHUNG HINH. Tam nao da bi cat trong
thiet ke (ti le 1,68 / 1,81 / 2,33) thi phep loc theo ti le khong dung, bo
cong cu nay bao ra de xu ly tay.

── Toc do ────────────────────────────────────────────────────────────────
TUAN TU, nghi 0,8 giay moi luot. Phien lam viec ngay 02/10/2026 da lam nghen
tcauto.vn bang vai tram ket noi song song va bi tuong lua khoa IP — chinh
viec do khien khach yeu cau dung lop chan cao du lieu cho site moi (xem
docs/SECURITY.md). Khong lap lai tren may chu cua chinh khach.

Chay:
    python3 tools/brand/find-sharper-photos.py            # chi do va bao cao
    python3 tools/brand/find-sharper-photos.py --apply    # tai ve va thay

CAN MANG — khong duoc dua vao `npm run parse:*`.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
CACHE = ROOT / "tools" / "fidelity" / "out" / "_photos"
API = "https://tcauto.vn/wp-json/wp/v2/media"
AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
)

#: Nghi giua hai luot goi. Giu nguyen, dung ha xuong.
PAUSE = 0.8

#: Ti le khung hinh lech toi da de con coi la cung mot buc.
ASPECT_TOLERANCE = 0.02

#: Ung vien phai to hon bao nhieu lan moi dang thay.
MIN_GAIN = 1.15

#: Nguong tuong quan de nhan la cung mot buc anh.
#
#: 0.70 chu khong phai 0.90. Ban goc ben tcauto.vn thuong rong hon mot chut so
#: voi ban da dua vao thiet ke (khung cat khac nhau), nen he so tuong quan tut
#: xuong du van la MOT buc. Da doi chieu bang mat tren ca bon tam le ky ket:
#: 0.94 / 0.82 / 0.78 deu dung la cung buc, con 0.54 thi la mot dai ly khac
#: han (Tan Binh Auto). Moi gia tri khac trong lan chay 02/10/2026 deu duoi
#: 0.51, nen 0.70 tach sach hai nhom.
#:
#: Ha them nua thi bat dau nhan bua — van phai nhin lai bang mat truoc khi
#: dung `--apply`.
MATCH_THRESHOLD = 0.70

#: Anh dang mo, kem noi dat tren dia.
TARGETS = [
    "loa",
    "cau-chuyen-khoi-nghiep-2",
    "cau-chuyen-khoi-nghiep-3",
    "chan-dung-dai-ly-2",
    "chan-dung-dai-ly-3",
    "con-nguoi-tc-2",
    "con-nguoi-tc-3",
    "con-nguoi-tc-4",
    "le-ky-ket-thanh-tien-auto",
    "le-ky-ket-toyota-phu-tai-duc",
    "le-ky-ket-otua-thanh-nien",
    "le-ky-ket-tan-nat",
    "song-tron-bien",
    "song-tron-noi-that",
    "song-tron-xe-co",
]


def fetch(url: str, out: Path | None = None) -> bytes | None:
    """Mot luot goi, co nghi. `out` co thi ghi thang ra tep."""
    command = ["curl", "-sL", "--max-time", "45", "-A", AGENT, url]
    if out is not None:
        command += ["-o", str(out)]
    result = subprocess.run(command, capture_output=True)
    time.sleep(PAUSE)
    if out is not None:
        return b"" if out.is_file() and out.stat().st_size > 500 else None
    return result.stdout or None


def media_list() -> list[dict]:
    """Toan bo thu vien anh, kem kich thuoc. 25 luot goi."""
    cache = CACHE / "_media.json"
    if cache.is_file():
        return json.loads(cache.read_text(encoding="utf-8"))

    items: list[dict] = []
    for page in range(1, 30):
        raw = fetch(
            f"{API}?per_page=100&page={page}&media_type=image"
            "&_fields=source_url,media_details"
        )
        try:
            data = json.loads(raw or b"[]")
        except Exception:
            break
        if not isinstance(data, list) or not data:
            break
        for item in data:
            details = item.get("media_details") or {}
            if details.get("width"):
                items.append(
                    {
                        "url": item["source_url"],
                        "w": details["width"],
                        "h": details["height"],
                    }
                )
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(items), encoding="utf-8")
    return items


def cache_name(url: str) -> str:
    """Ten tep dem, ON DINH giua cac lan chay.

    Ban dau dung `hash(url)` cua Python. Sai: ham do duoc NGAU NHIEN HOA theo
    tung tien trinh (PYTHONHASHSEED), nen moi lan chay lai la mot ten khac —
    bo dem khong bao gio trung, va cong cu tai lai tu dau. Da sap bay that
    (02/10/2026): chay lan hai tai them gan 50 tep ma khong xong duoc mot muc
    tieu nao, trong khi dang co gang KHONG lam nang may chu cua khach.
    """
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:20]
    return digest + Path(url).suffix


def fingerprint(path: Path) -> np.ndarray | None:
    """Thang do xam 64 diem, da chuan hoa — de so hai buc bang tuong quan."""
    try:
        with Image.open(path) as image:
            small = image.convert("L").resize((8, 8), Image.Resampling.LANCZOS)
    except Exception:
        return None
    flat = np.asarray(small, dtype=float).ravel()
    spread = flat.std()
    if spread < 1e-6:
        return None
    return (flat - flat.mean()) / spread


def find_target(name: str) -> Path | None:
    hits = sorted(ROOT.glob(f"public/**/{name}.webp"))
    return hits[0] if hits else None


def main() -> int:
    apply = "--apply" in sys.argv
    CACHE.mkdir(parents=True, exist_ok=True)

    print("  Lay danh muc anh cua tcauto.vn…")
    library = media_list()
    print(f"  {len(library)} anh trong thu vien.\n")

    replaced = skipped = 0
    for name in TARGETS:
        path = find_target(name)
        if path is None:
            print(f"  {name}: khong tim thay tep tren dia")
            continue
        with Image.open(path) as image:
            width, height = image.size
        aspect = width / height
        mine = fingerprint(path)
        if mine is None:
            print(f"  {name}: khong doc duoc")
            continue

        pool = [
            item
            for item in library
            if item["h"]
            and abs(item["w"] / item["h"] - aspect) / aspect <= ASPECT_TOLERANCE
            and item["w"] >= width * MIN_GAIN
        ]
        if not pool:
            print(f"  {name} ({width}px): khong co ung vien cung ti le va to hon")
            skipped += 1
            continue

        best: tuple[float, dict, Path] | None = None
        for item in sorted(pool, key=lambda c: -c["w"]):
            cached = CACHE / cache_name(item["url"])
            if not cached.is_file() or cached.stat().st_size < 500:
                if fetch(item["url"], cached) is None:
                    continue
            theirs = fingerprint(cached)
            if theirs is None:
                continue
            score = float(np.dot(mine, theirs) / mine.size)
            if best is None or score > best[0]:
                best = (score, item, cached)

        if best is None or best[0] < MATCH_THRESHOLD:
            got = f"{best[0]:.2f}" if best else "khong co"
            print(f"  {name} ({width}px): {len(pool)} ung vien, khop cao nhat {got} — BO QUA")
            skipped += 1
            continue

        score, item, cached = best
        print(f"  {name}: {width}px → {item['w']}px  (khop {score:.2f})")
        print(f"      {item['url']}")
        if apply:
            with Image.open(cached) as image:
                image.convert("RGB").save(path, "WEBP", quality=88, method=6)
            replaced += 1

    print()
    if apply:
        print(f"  Da thay {replaced} anh. Chay `python3 tools/stamp-slices.py` roi dung lai.")
    else:
        print(f"  Chi do, chua thay gi. Them --apply de thay that.")
    print(f"  {skipped} tam khong tim duoc ban to hon — can khach xuat lai tu tep goc.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
