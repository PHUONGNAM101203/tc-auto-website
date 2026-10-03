#!/usr/bin/env python3
"""
Tim mot anh roi trong CAC bo tai nguyen, chon ban to nhat.

Vi sao can cho nay:

1. Khach da gui ba dot tai nguyen. Co tep chi co o dot moi (vi du sau anh
   `Vector 7/8/9`, `Rectangle 182/183/185` cua muc Trai nghiem), co tep chi con
   o dot cu. Tro cung mot duong dan la thieu ben nay hoac ben kia.

2. Dot moi nhat ("Tài nguyên Web 2") duoc xuat o DUNG 512px CHIEU CAO cho 402
   tren 412 tep, bat ke anh goc to nho ra sao. Nho vay cac chi tiet nho (nut,
   mui ten, bieu tuong) net hon han — co cai tu 24x65 len 186x512. Nhung 126
   tep anh lon lai NHO DI: `Rectangle 189.png` tut tu 2880x1960 xuong 753x512.
   Lay bo moi de dan la nhieu anh mo di chu khong net them.

   Nen quy tac o day la: tim khap ca ba bo, chon ban co NHIEU DIEM ANH NHAT.

3. macOS luu dau tieng Viet o dang TACH ROI (NFD) con chuoi trong ma nguon
   thuong o dang GHEP (NFC). Hai chuoi trong giong het nhau nhung khong bang
   nhau khi so byte, nen phai thu ca hai dang.
"""
from __future__ import annotations

import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from design_root import asset_roots  # noqa: E402

#: Xep theo do moi. Thu tu khong quyet dinh ket qua — kich thuoc moi quyet
#: dinh — nhung giup tim thay som va bao cao cho de doc.
#:
#: Danh sach do `design_root.asset_roots()` dung: no tim trong CA
#: `~/Documents/TC-Auto` lan `~/Downloads`. Truoc day o day ghi cung
#: `~/Downloads`, va khi khach don tai nguyen sang cho khac (03/10/2026) thi
#: moi bo trich deu gay.
ROOTS: tuple[Path, ...] = asset_roots()

_area_cache: dict[Path, int] = {}


def _area(path: Path) -> int:
    """So diem anh. Doc mot lan roi nho, vi ham nay bi goi nhieu lan."""
    if path not in _area_cache:
        try:
            from PIL import Image

            with Image.open(path) as im:
                _area_cache[path] = im.width * im.height
        except Exception:
            _area_cache[path] = 0
    return _area_cache[path]


def _candidates(relative: str | Path) -> list[Path]:
    rel = str(relative)
    forms = {unicodedata.normalize(form, rel) for form in ("NFC", "NFD")}
    found: list[Path] = []
    for root in ROOTS:
        for form in forms:
            path = root / form
            if path.is_file() and path not in found:
                found.append(path)
    return found


def find(relative: str | Path) -> Path | None:
    """Duong dan toi ban TO NHAT cua anh nay, hoac None neu khong bo nao co."""
    found = _candidates(relative)
    if not found:
        return None
    return max(found, key=_area)


def require(relative: str | Path) -> Path:
    """Nhu `find` nhung nem loi neu thieu — dung khi anh do bat buoc phai co."""
    path = find(relative)
    if path is None:
        roots = "\n  ".join(str(r) for r in ROOTS)
        raise FileNotFoundError(f"Khong tim thay '{relative}' trong bo nao:\n  {roots}")
    return path
