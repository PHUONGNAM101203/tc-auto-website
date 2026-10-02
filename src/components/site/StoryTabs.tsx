"use client";

import Link from "next/link";
import { useState } from "react";
import {
  STORY_BACKGROUND,
  STORY_CONTENT,
  STORY_DEFAULT,
  STORY_TABS,
  STORY_TAB_BAR,
  STORY_VALUES,
} from "@/lib/story-tabs";

/**
 * Hai tab tren trang "Câu chuyện đồng hành".
 *
 * Thiet ke ve chet thanh hai o nhung khong o nao bam duoc, va chi co noi dung
 * cho o thu nhat. Khach chi dung o thu hai (02/10/2026).
 *
 * Cung cach lam nhu ScreenTabs va BrandTabs: nut TRONG SUOT dat dung len thanh
 * ve san, va khi doi tab thi che kin vung noi dung cu roi ve lai bang phan tu
 * that. Khac mot cho: o day tab MAC DINH khong che gi ca — noi dung cua no da
 * nam san trong anh nen, che roi ve lai la lam hong chinh cai dang dung.
 *
 * Noi dung tab thu hai lay tu /dai-ly/ho-tro-tiep-thi — xem story-tabs.ts.
 */
export function StoryTabs() {
  const [tab, setTab] = useState<string>(STORY_DEFAULT);
  const width = 1440 / STORY_TAB_BAR.columns;

  // Chi ve dau hieu "dang chon" SAU KHI nguoi dung bam sang tab khac.
  //
  // O trang thai mac dinh, anh nen da ve san o thu nhat dang sang — ve them
  // mot vet nua la hai lop chong nhau, va cua kiem pixel bao lech ngay o
  // trang thai ma nguoi dung thay dau tien. Khi da chuyen tab thi moi can lam
  // mo o cu di va danh dau o moi.
  const switched = tab !== STORY_DEFAULT;

  return (
    <>
      {STORY_TABS.map((entry, index) => (
        <button
          key={entry.id}
          type="button"
          className="tc-story-tab"
          data-on={switched && entry.id === tab ? "" : undefined}
          data-off={switched && entry.id !== tab ? "" : undefined}
          aria-pressed={entry.id === tab}
          style={{
            left: index * width,
            top: STORY_TAB_BAR.y,
            width,
            height: STORY_TAB_BAR.height,
          }}
          onClick={() => setTab(entry.id)}
        >
          <span className="tc-sr">{entry.label}</span>
        </button>
      ))}

      {tab !== STORY_DEFAULT && (
        <div
          className="tc-story-panel"
          style={{
            left: 0,
            top: STORY_CONTENT.y,
            width: 1440,
            height: STORY_CONTENT.height,
            background: STORY_BACKGROUND,
          }}
          role="region"
          aria-label="Giá trị cùng đạt được"
        >
          <ul className="tc-story-grid">
            {STORY_VALUES.map((value) => (
              <li key={value.id}>
                <Link href={value.href} prefetch={false}>
                  <strong>{value.title}</strong>
                  <em>{value.lead}</em>
                  <span>{value.body}</span>
                  <i aria-hidden="true">Xem chi tiết ›</i>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
