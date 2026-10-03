#!/usr/bin/env python3
"""
MOT noi duy nhat khai cho de bo thiet ke goc nam o dau.

── Vi sao can tep nay ─────────────────────────────────────────────────────
Truoc day moi bo trich anh tu ghi cung mot duong dan tuyet doi, kieu
`Path("/Users/phuongnam/Downloads/[TC] Website/Website_TC")`. Muoi hai tep lam
vay. Ngay 03/10/2026 khach don toan bo tai nguyen vao `~/Documents/TC-Auto/`
va xoa thu muc cu trong `~/Downloads` — ca muoi hai bo deu gay cung luc, va
loi chi lo ra khi chay lai chuoi dung, tuc la rat lau sau.

Nay chi co MOT danh sach o day. Doi cho de bo thiet ke thi them mot dong.

── Thu tu tim ─────────────────────────────────────────────────────────────
Uu tien thu muc nam CANH kho ma nguon (`~/Documents/TC-Auto`): do la cho
khach dang giu ban that. `~/Downloads` van giu lai cuoi danh sach de may nao
con ban cu thi khong phai sua gi.

── Chu Viet trong ten thu muc ─────────────────────────────────────────────
macOS luu ten tep o dang TACH DAU (NFD), con chuoi viet trong ma nguon thuong
o dang GHEP (NFC). Hai chuoi trong giong het nhau nhung khong bang nhau khi so
byte. Moi ham o day deu thu ca hai dang.
"""
from __future__ import annotations

import unicodedata
from pathlib import Path

HOME = Path.home()

#: Noi co the chua bo thiet ke. Xep theo do uu tien.
BASES: tuple[Path, ...] = (
    HOME / "Documents" / "TC-Auto",
    HOME / "Downloads",
)


def _forms(name: str) -> set[str]:
    return {unicodedata.normalize(form, name) for form in ("NFC", "NFD")}


def find_dir(*names: str) -> Path | None:
    """Thu muc dau tien ton tai, thu lan luot tung ten o tung goc."""
    for base in BASES:
        for name in names:
            for form in _forms(name):
                path = base / form
                if path.is_dir():
                    return path
    return None


def require_dir(*names: str) -> Path:
    found = find_dir(*names)
    if found is None:
        tried = "\n  ".join(
            f"{base / name}" for base in BASES for name in names
        )
        raise SystemExit(
            "Khong tim thay thu muc thiet ke. Da thu:\n  " + tried + "\n"
            "Sua danh sach BASES trong tools/brand/design_root.py neu bo tai "
            "nguyen da chuyen cho."
        )
    return found


def design_root() -> Path:
    """Thu muc chua sau trang thiet ke (`1. Page_Home`, `2.Page_...`).

    Bo tai nguyen co hai cach xep: `Website_TC` nam ngay goc, hoac nam trong
    `[TC] Website/Website_TC`. Chap nhan ca hai.
    """
    direct = find_dir("Website_TC")
    if direct is not None:
        return direct
    outer = require_dir("[TC] Website")
    inner = outer / "Website_TC"
    if not inner.is_dir():
        raise SystemExit(f"Khong tim thay {inner}")
    return inner


def design_system() -> Path:
    """Tep `Design System 3.png` — bang mau, logo va bieu tuong."""
    for base in BASES:
        for middle in ("Design system", "[TC] Website/Design system", ""):
            for form in _forms("Design System 3.png"):
                path = base / middle / form if middle else base / form
                if path.is_file():
                    return path
    raise SystemExit(
        "Khong tim thay Design System 3.png trong:\n  "
        + "\n  ".join(str(b) for b in BASES)
    )


def asset_roots() -> tuple[Path, ...]:
    """Cac thu muc chua anh roi cua khach, xep theo do moi."""
    names = (
        "Tài nguyên Web 2",
        "Tài nguyên Web",
        "[TC] Website/Tài nguyên Web",
    )
    out: list[Path] = []
    # Loc trung theo duong dan DA GIAI: hai dang Unicode (NFC/NFD) cua cung
    # mot ten tro ve cung mot thu muc, nhung `Path` coi chung la hai.
    seen: set[str] = set()
    for base in BASES:
        for name in names:
            for form in _forms(name):
                path = base / form
                if not path.is_dir():
                    continue
                # Chuan hoa ve MOT dang truoc khi so: `resolve()` khong
                # chuyen NFD sang NFC, nen hai dang cua cung mot thu muc van
                # ra hai chuoi khac nhau.
                key = unicodedata.normalize("NFC", str(path.resolve()))
                if key in seen:
                    continue
                seen.add(key)
                out.append(path)
    return tuple(out)


def resolve_root(value: str | Path) -> Path:
    """Giai mot duong dan ghi trong tep du lieu thanh duong dan CO THAT.

    Cac tep du lieu (vi du tools/subpage-manifest.json) tung ghi duong dan
    TUYET DOI tro vao `~/Downloads`. Ngay 03/10/2026 khach don het tai nguyen
    sang `~/Documents/TC-Auto/` va xoa cho cu — moi duong dan do chet cung
    luc, ma loi chi lo ra khi chay lai chuoi dung.

    Nay: con duong dan nao ton tai thi dung luon; khong thi lay phan DUOI
    cung cua no (mot hoac hai doan ten) va tim lai trong BASES.
    """
    path = Path(value)
    if path.is_dir():
        return path
    parts = path.parts
    names: list[str] = []
    if parts:
        names.append(parts[-1])
    if len(parts) >= 2:
        names.insert(0, str(Path(parts[-2]) / parts[-1]))
    found = find_dir(*names)
    if found is not None:
        return found
    return require_dir(*names)
