#!/usr/bin/env python3
"""
Dong dau ma noi dung cho cac anh duoc goi THANG trong ma nguon (logo...).

Cac anh nam trong du lieu da duoc tools/stamp-slices.py lo. Rieng logo thi
component goi thang duong dan, ma /brand phuc vu voi `Cache-Control: immutable`
— sua logo ma ten tep khong doi thi may nguoi dung van hien ban cu mai.

Chay: python3 tools/stamp-assets.py
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
TARGET = ROOT / "src" / "data" / "asset-versions.json"

# Thu muc chua anh duoc goi thang trong ma nguon.
FOLDERS = ["brand"]


def main() -> int:
    versions: dict[str, str] = {}
    for folder in FOLDERS:
        for path in sorted((PUBLIC / folder).rglob("*")):
            if not path.is_file() or path.suffix.lower() not in {".png", ".svg", ".webp", ".ico"}:
                continue
            url = "/" + path.relative_to(PUBLIC).as_posix()
            versions[url] = hashlib.sha256(path.read_bytes()).hexdigest()[:8]

    TARGET.write_text(
        json.dumps(
            {
                "_doc": (
                    "Ma noi dung cua anh duoc goi thang trong ma nguon. Dung qua "
                    "src/lib/asset-version.ts de trinh duyet khong giu ban cu."
                ),
                "versions": versions,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  Da dong dau {len(versions)} anh tinh.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
