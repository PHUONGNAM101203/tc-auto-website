#!/usr/bin/env python3
"""
Kiem MA BAM trong duong dan anh co khop NOI DUNG that cua tep khong.

── Vi sao can cua nay ─────────────────────────────────────────────────────
Thu muc anh duoc phuc vu voi `Cache-Control: immutable, max-age=31536000` —
trinh duyet KHONG BAO GIO hoi lai may chu. Thu duy nhat bao cho no biet anh da
doi la ?v=<hash> trong duong dan.

Da sap bay mot lan (01/10/2026): sua mau anh nen bang tay roi build luon, nen
tools/stamp-slices.py khong chay lai. Noi dung anh doi ma ?v= thi khong — may
chu phuc vu anh moi o DUNG duong dan cu, nen may nao da cache ban cu thi giu
mai. Khach thay chu trang tren nen trang va tuong chua lam.

Gate nay bat dung truong hop do: no tinh lai hash cua tung tep va so voi ?v=
dang khai.

Chay: python3 tools/fidelity/check-asset-stamps.py
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PUBLIC = ROOT / "public"
DATA = ROOT / "src" / "data"
SRC = ROOT / "src"

#: `asset("/brand/x.webp")` trong ma nguon. Xem src/lib/asset-version.ts.
ASSET_CALL = re.compile(r'\basset\(\s*"(/[^"]+)"')
VERSIONS = ROOT / "src" / "data" / "asset-versions.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:8]


def walk(node, out: list[str]) -> None:
    if isinstance(node, dict):
        for value in node.values():
            walk(value, out)
    elif isinstance(node, list):
        for value in node:
            walk(value, out)
    elif isinstance(node, str) and node.startswith("/"):
        out.append(node)


def main() -> int:
    stale: list[tuple[str, str, str, str]] = []
    missing: list[tuple[str, str]] = []
    checked = 0

    for spec in sorted(DATA.rglob("*.json")):
        try:
            data = json.loads(spec.read_text(encoding="utf-8"))
        except Exception:
            continue
        urls: list[str] = []
        walk(data, urls)
        for url in urls:
            base = url.split("?", 1)[0]
            path = PUBLIC / base.lstrip("/")
            if not path.is_file():
                continue
            checked += 1
            want = digest(path)
            if "?v=" not in url:
                missing.append((str(spec.relative_to(ROOT)), url))
            elif url.split("?v=", 1)[1] != want:
                stale.append(
                    (str(spec.relative_to(ROOT)), base, url.split("?v=", 1)[1], want)
                )

    # Anh goi tu MA NGUON qua `asset()` khong nam trong src/data, nen vong
    # lap tren khong thay. Ma `asset()` tra ve duong dan TRAN khi thieu khoa —
    # khong bao loi, khong canh bao, va /brand lai phuc vu `immutable`. Dung
    # cai bay ma chu thich dau tep nay canh bao, chi la o mot cua khac: dai
    # header cua `DocHeader` da nam duoi dang khong dau dung mot lan.
    stamped = json.loads(VERSIONS.read_text(encoding="utf-8"))["versions"]
    for source in sorted(SRC.rglob("*.ts")) + sorted(SRC.rglob("*.tsx")):
        for url in ASSET_CALL.findall(source.read_text(encoding="utf-8")):
            path = PUBLIC / url.lstrip("/")
            if not path.is_file():
                missing.append((str(source.relative_to(ROOT)), f"{url} (khong co tep)"))
                continue
            checked += 1
            have = stamped.get(url)
            if have is None:
                missing.append((str(source.relative_to(ROOT)), url))
            elif have != digest(path):
                stale.append(
                    (str(source.relative_to(ROOT)), url, have, digest(path))
                )

    print(f"  Da so {checked} duong dan anh trong src/data va cac loi goi asset().")
    if not stale and not missing:
        print("  Ma bam nao cung khop noi dung tep.")
        return 0

    if stale:
        print(f"\n  {len(stale)} duong dan co MA BAM CU — trinh duyet se giu ban cu:")
        for spec, base, have, want in stale[:20]:
            print(f"    {base}  khai ?v={have}  nhung tep la {want}   ({spec})")
    if missing:
        print(f"\n  {len(missing)} duong dan THIEU ma bam:")
        for spec, url in missing[:20]:
            print(f"    {url}   ({spec})")
    print(
        "\n  Chay `python3 tools/stamp-slices.py` (anh trong src/data) hoac"
        "\n  `python3 tools/stamp-assets.py` (anh goi qua asset()) de dong dau lai."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
