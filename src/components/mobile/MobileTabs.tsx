"use client";

import Link from "next/link";
import { useState } from "react";

export interface MobileTabItem {
  readonly id: string;
  readonly name: string;
  readonly image: string;
  /**
   * Ban hep 360px. O luoi hai cot moi o chi rong 169px, ma anh goc rong 1062.
   * Xem tools/brand/make-mobile-products.py.
   */
  readonly mobileImage?: string;
  readonly href: string;
}

export interface MobileTabGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly MobileTabItem[];
  /** Hien khi nhom nay rong — thay vi de mot khoang trang. */
  readonly empty?: React.ReactNode;
}

/**
 * Bo TAB cho ban dien thoai: mot hang nut, duoi la luoi hai cot.
 *
 * Dung o hai cho, va phai la MOT component chu khong phai hai:
 *   - "Màn hình ô tô"           WINCA / BRAVO
 *   - "Bộ sưu tập thương hiệu"  5DO / 3M / NANO SUN
 *
 * Ban desktop ve tab len thanh da co san trong anh nen; o day khong co anh nen
 * nao (canvas bi an duoi 900px) nen phai tu ve. Logic thi giong het: bam la
 * doi luoi ngay tai cho, khong roi trang.
 *
 * Luoi xep 2 cot theo yeu cau cua khach (01/10/2026). O be ngang 390px, moi o
 * rong khoang 170px — khong du cho mot doan mo ta, nen the chi mang ANH va
 * TEN. Muon doc chi tiet thi bam vao, do la viec cua trang san pham.
 */
export function MobileTabs({
  groups,
  label,
  initial,
}: {
  readonly groups: readonly MobileTabGroup[];
  /** Ten cho trinh doc man hinh, vi du "Màn hình ô tô". */
  readonly label: string;
  /** Tab mo san. Khong khai thi lay nhom dau tien. */
  readonly initial?: string;
}) {
  const [tab, setTab] = useState(initial ?? groups[0]?.id ?? "");
  const active = groups.find((group) => group.id === tab) ?? groups[0];

  if (!active) {
    return null;
  }

  return (
    <section className="tc-m-sec" aria-label={label}>
      <div className="tc-m-tabs" role="tablist" aria-label={`Chọn mục — ${label}`}>
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            role="tab"
            aria-selected={group.id === tab}
            aria-controls="tc-m-tabpanel"
            className="tc-m-tab"
            data-on={group.id === tab ? "" : undefined}
            onClick={() => setTab(group.id)}
          >
            {group.label}
          </button>
        ))}
      </div>

      {active.items.length > 0 ? (
        <ul className="tc-m-prods tc-m-prods-2" id="tc-m-tabpanel">
          {active.items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} prefetch={false}>
                {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san */}
                <img
                  src={item.mobileImage ?? item.image}
                  srcSet={
                    item.mobileImage
                      ? `${item.mobileImage} 360w, ${item.image} 1062w`
                      : undefined
                  }
                  /* Luoi hai cot: moi o chiem nua be ngang, tru le va khe giua. */
                  sizes={item.mobileImage ? "calc((100vw - 52px) / 2)" : undefined}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <strong>{item.name}</strong>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="tc-m-tabempty" id="tc-m-tabpanel">
          {active.empty}
        </div>
      )}
    </section>
  );
}
