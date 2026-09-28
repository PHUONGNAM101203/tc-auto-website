#!/usr/bin/env python3
"""
Dong dau ma noi dung vao duong dan anh lat nen.

Vi sao: /slices duoc phuc vu voi `Cache-Control: immutable` — trinh duyet giu
mai khong hoi lai. Nhung ten tep KHONG doi khi ta sua anh (vi du xoa bo phan
trang ve san khoi anh). Hau qua: may nguoi dung van hien anh CU, con dieu khien
that thi ve de len — nhin ra canh bi ghi de.

Cach chua: gan ?v=<8 ky tu dau cua ma bam noi dung> vao moi duong dan. Noi dung
doi thi duong dan doi, trinh duyet tai lai; noi dung khong doi thi van dung cache.

Chay SAU cung, sau moi buoc co sua anh lat:
    python3 tools/stamp-slices.py
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
# Moi tep du lieu deu duoc quet: page spec, the, slider, anh mobile...
DATA_DIR = ROOT / "src" / "data"

# CO Y khong dung danh sach ten khoa.
#
# Truoc day cho nay la PATH_KEYS = {"src", "image", "cover", "coverUrl"} va no
# da bo sot 42 duong dan: khoa `hero` (28 anh mobile trang con), khoa `art` (4
# anh PPF), va `slides` — khoa nay chua mot DANH SACH CHUOI nen vong lap khong
# he cham toi. Anh khong dong dau ma thu muc lai duoc phuc vu `immutable` thi
# nguoi dung giu ban cu vinh vien; them mot khoa moi la lai sot tiep.
#
# Gio quy tac la: BAT KY chuoi nao bat dau bang "/" va TRO TOI MOT TEP CO THAT
# trong /public deu duoc dong dau. Duong dan tuyen (vi du "/giai-phap/loa")
# khong ung voi tep nao nen tu dong bi bo qua.

_cache: dict[str, str] = {}


def stamp(url: str) -> str:
    """Tra ve url kem ?v=<hash>. Bo dau cu neu co."""
    base = url.split("?", 1)[0]
    if base in _cache:
        digest = _cache[base]
    else:
        path = PUBLIC / base.lstrip("/")
        if not path.is_file():
            return base
        digest = hashlib.sha256(path.read_bytes()).hexdigest()[:8]
        _cache[base] = digest
    return f"{base}?v={digest}"


def is_asset(value) -> bool:
    """Chuoi nay co tro toi mot tep co that trong /public khong?"""
    if not isinstance(value, str) or not value.startswith("/"):
        return False
    return (PUBLIC / value.split("?", 1)[0].lstrip("/")).is_file()


def walk(node):
    """Dong dau moi duong dan tro toi mot tep co that trong /public."""
    changed = 0
    if isinstance(node, dict):
        for key, value in node.items():
            if is_asset(value):
                stamped = stamp(value)
                if stamped != value:
                    node[key] = stamped
                    changed += 1
            else:
                changed += walk(value)
    elif isinstance(node, list):
        # Danh sach chuoi (vi du `slides`) phai sua TAI CHO — day la cho da bo
        # sot 10 anh slider.
        for index, item in enumerate(node):
            if is_asset(item):
                stamped = stamp(item)
                if stamped != item:
                    node[index] = stamped
                    changed += 1
            else:
                changed += walk(item)
    return changed


def main() -> int:
    total = 0
    files = 0
    for path in sorted(DATA_DIR.rglob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        changed = walk(data)
        if changed:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
            )
            total += changed
            files += 1
    print(f"  Da dong dau {total} duong dan anh trong {files} tep dac ta.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
