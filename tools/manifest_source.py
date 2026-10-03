#!/usr/bin/env python3
"""
Chon bo khung thiet ke dung cho tung trang.

Du an co HAI bo khung @3x va chung KHONG cung mot doi:

- `sourceRoot`     — bo moi nhat. Dung cho 31 TRANG CON, vi trang con duoc
                     dung THANG tu PNG nen doi thiet ke la dung lai duoc ngay.
- `mainSourceRoot` — bo cu, tuong ung voi ban export prototype HTML dang dung.
                     Dung cho 6 TRANG CHINH, vi chu va nut o do la phan tu that
                     sinh ra tu prototype chu khong phai anh.

Lay nham bo cho trang chinh la hong am tham: anh nen @3x se theo thiet ke moi
trong khi chu van theo prototype cu — man retina hien mot dang, man thuong mot
neo. Gate pixel chay o ti le 1 nen KHONG bat duoc chuyen do.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "brand"))
from design_root import resolve_root  # noqa: E402


def main_root(manifest: dict) -> Path:
    """Bo khung cho 6 trang chinh."""
    return resolve_root(manifest.get("mainSourceRoot") or manifest["sourceRoot"])


def sub_root(manifest: dict) -> Path:
    """Bo khung cho 31 trang con."""
    return resolve_root(manifest["sourceRoot"])


def root_for(manifest: dict, entry: dict) -> Path:
    """Bo khung dung cho MOT muc trong manifest."""
    return main_root(manifest) if entry.get("main") else sub_root(manifest)


def source_of(manifest: dict, entry: dict) -> Path:
    """Duong dan day du toi tep PNG khung cua muc nay."""
    return root_for(manifest, entry) / entry["dir"] / entry["file"]


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))
