#!/usr/bin/env python3
"""
Chay OCR tren toan bo 31 frame trang con -> src/data/ocr/{key}.json

Chay: python3 tools/ocr/run-all.py
Bo qua trang da co ket qua, nen ngat giua chung roi chay lai van tiep tuc duoc.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
BIN = ROOT / "tools" / "ocr" / "ocrbin"
MANIFEST = ROOT / "tools" / "subpage-manifest.json"
OUT = ROOT / "src" / "data" / "ocr"


def main() -> int:
    if not BIN.is_file():
        print("Chua build binary. Chay: swiftc -O -o tools/ocr/ocrbin tools/ocr/OCR.swift", file=sys.stderr)
        return 1

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    source_root = Path(manifest["sourceRoot"])
    pages = [p for p in manifest["pages"] if not p.get("main")]

    OUT.mkdir(parents=True, exist_ok=True)
    started = time.time()

    for i, entry in enumerate(pages, 1):
        key = entry["slug"].replace("/", "__")
        target = OUT / f"{key}.json"
        if target.is_file():
            print(f"[{i}/{len(pages)}] bo qua (da co): {entry['slug']}", flush=True)
            continue

        source = source_root / entry["dir"] / entry["file"]
        at = time.time()
        result = subprocess.run(
            [str(BIN), str(source), "1440"], capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"[{i}/{len(pages)}] LOI {entry['slug']}: {result.stderr.strip()}", flush=True)
            continue

        blocks = json.loads(result.stdout)
        target.write_text(
            json.dumps(blocks, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
        )
        print(
            f"[{i}/{len(pages)}] {entry['slug']:<58} {len(blocks):>4} khoi  {time.time() - at:5.1f}s",
            flush=True,
        )

    print(f"\nXong sau {(time.time() - started) / 60:.1f} phut", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
