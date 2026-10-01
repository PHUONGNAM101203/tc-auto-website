"use client";

import Link from "next/link";
import { useState } from "react";

export interface MobileScreenItem {
  readonly id: string;
  readonly name: string;
  readonly image: string;
  readonly href: string;
}

/**
 * Hai tab WINCA / BRAVO tren trang "Màn hình ô tô", BAN DIEN THOAI.
 *
 * Ban desktop ve hai tab len thanh da co san trong anh nen; o day khong co anh
 * nen nao nen phai tu ve. Logic thi giong het: bam la doi luoi ngay tai cho,
 * khong roi trang.
 *
 * Luoi xep 2 cot theo yeu cau cua khach (01/10/2026). O be ngang 390px, moi o
 * rong khoang 170px — khong du cho mot doan mo ta, nen the chi mang ANH va
 * TEN. Muon doc chi tiet thi bam vao, do la viec cua trang san pham.
 */
export function MobileScreenTabs({
  winca,
  bravo,
}: {
  readonly winca: readonly MobileScreenItem[];
  readonly bravo: readonly MobileScreenItem[];
}) {
  const [tab, setTab] = useState<"winca" | "bravo">("winca");
  const items = tab === "winca" ? winca : bravo;

  return (
    <section className="tc-m-sec" aria-label="Màn hình ô tô">
      <div className="tc-m-tabs" role="tablist" aria-label="Chọn thương hiệu">
        {(["winca", "bravo"] as const).map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            aria-controls="tc-m-screens"
            className="tc-m-tab"
            data-on={tab === name ? "" : undefined}
            onClick={() => setTab(name)}
          >
            {name === "winca" ? "WINCA" : "BRAVO"}
          </button>
        ))}
      </div>

      <ul className="tc-m-prods tc-m-prods-2" id="tc-m-screens">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} prefetch={false}>
              {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san */}
              <img src={item.image} alt="" loading="lazy" decoding="async" />
              <strong>{item.name}</strong>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
