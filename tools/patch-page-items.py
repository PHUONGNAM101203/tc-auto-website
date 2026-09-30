#!/usr/bin/env python3
"""
Va lai PHAN TU cua 6 trang chinh khi ban thiet ke doi ma prototype chua kip doi.

Khac voi `patch-from-design.py` — cai do va lai VUNG ANH — cho nay va lai
`items` trong `src/data/pages/{slug}.json`: doi toa do, bo phan tu khong con
trong thiet ke.

Vi sao phai co: 6 trang chinh duoc sinh tu `TC-Auto-Website-Prototype.html`,
con nha thiet ke thi cap nhat truc tiep tren bo khung PNG. Khi hai ben lech
nhau, sua tay tep JSON se bi `parse-prototype.py` ghi de ngay lan chay sau.
Khai bao o day thi moi lan chay lai deu duoc ap lai.

BO MUC NAO O DAY khi da co ban export prototype moi — luc do prototype tu dung
roi, giu lai la va len chinh no.

Chay NGAY SAU `parse-prototype.py`, TRUOC `add-retina-main.py`.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "src" / "data" / "pages"

#: Moi muc phai co `why` — khong co ly do thi khong biet bao gio duoc go.
PATCHES: list[dict] = [
    # Truoc day o day co mot muc bo tieu de phu "NGHIEN CUU & PHAT TRIEN" cung
    # mot nut "TIM HIEU THEM" o muc "Tien phong cong nghe" trang Cong nghe, vi
    # ban thiet ke 28/09 da gop hai khoi lam mot.
    #
    # Khach yeu cau GIU tieu de do (30/09/2026): ho lam viec theo ban thiet ke
    # co tieu de. Bo muc va di thi ca ba ben cung khop nhau — prototype ma gate
    # doi chieu cung la ban con tieu de — nen muc ngoai le trong
    # design-deviations.ts cung khong can nua.
]


def apply(patch: dict) -> int:
    path = PAGES / f"{patch['slug']}.json"
    spec = json.loads(path.read_text(encoding="utf-8"))
    by_id = {item["id"]: item for item in spec["items"]}

    changed = 0
    for item_id in patch.get("remove", []):
        if item_id not in by_id:
            print(f"    bo qua {item_id}: khong con trong spec (prototype da doi?)")
            continue
        spec["items"] = [i for i in spec["items"] if i["id"] != item_id]
        print(f"    bo   {item_id}")
        changed += 1

    for item_id, delta in patch.get("move", {}).items():
        item = by_id.get(item_id)
        if item is None:
            print(f"    bo qua {item_id}: khong con trong spec (prototype da doi?)")
            continue
        old = item["y"]
        item["y"] = round(old + delta, 1)
        print(f"    doi  {item_id}: y {old} -> {item['y']}")
        changed += 1

    if changed:
        path.write_text(json.dumps(spec, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return changed


def main() -> int:
    if not PATCHES:
        print("  Khong con mieng va nao — prototype da khop thiet ke.")
        return 0
    total = 0
    for patch in PATCHES:
        print(f"  {patch['slug']}:")
        total += apply(patch)
    print(f"\n  Da va {total} phan tu tren {len(PATCHES)} trang.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
