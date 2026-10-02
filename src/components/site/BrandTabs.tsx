"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BRAND_BACKGROUND,
  BRAND_CONTENT,
  BRAND_DEFAULT,
  BRAND_TAB_BAR,
  getBrandTabs,
} from "@/lib/brand-tabs";

/**
 * Ba tab 5DO / 3M / NANO SUN tren trang "Bộ sưu tập thương hiệu".
 *
 * Thanh ba o duoc ve chet trong anh nen, o 3M dang sang — nhung truoc day
 * khong o nao bam duoc. Khach hoi thang (02/10/2026).
 *
 * Cung cach lam nhu ScreenTabs: nut trong suot dat dung len thanh ve san, va
 * khi doi tab thi che kin vung noi dung cu roi ve lai bang phan tu that.
 * O tab 3M — tab ma thiet ke ve san — van che va ve lai, de ba tab giong nhau
 * mot kieu; neu khong thi 3M hien bai viet con hai tab kia hien luoi san pham,
 * va do dung la cai le lac ma khach da chi ra o the LOA.
 */
const TABS = getBrandTabs();

export function BrandTabs() {
  const [tab, setTab] = useState<string>(BRAND_DEFAULT);
  const active = TABS.find((entry) => entry.id === tab) ?? TABS[0];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.brandTab = tab;
    return () => {
      delete root.dataset.brandTab;
    };
  }, [tab]);

  const width = 1440 / BRAND_TAB_BAR.columns;

  return (
    <>
      {TABS.map((entry, index) => (
        <button
          key={entry.id}
          type="button"
          className="tc-brand-tab"
          data-on={entry.id === tab ? "" : undefined}
          aria-pressed={entry.id === tab}
          style={{
            left: index * width,
            top: BRAND_TAB_BAR.y,
            width,
            height: BRAND_TAB_BAR.height,
          }}
          onClick={() => setTab(entry.id)}
        >
          <span className="tc-sr">Xem bộ sưu tập {entry.label}</span>
        </button>
      ))}

      <div
        className="tc-brand-panel"
        style={{
          left: 0,
          top: BRAND_CONTENT.y,
          width: 1440,
          height: BRAND_CONTENT.height,
          background: BRAND_BACKGROUND,
        }}
        role="region"
        aria-label={`Bộ sưu tập ${active.label}`}
      >
        {active.items.length > 0 ? (
          <ul className="tc-brand-grid">
            {active.items.map((item) => (
              <li key={item.slug}>
                <Link href={item.route} prefetch={false}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san */}
                  <img
                    src={item.image}
                    alt=""
                    width={item.imageWidth}
                    height={item.imageHeight}
                    loading="lazy"
                    decoding="async"
                  />
                  <strong>{item.name}</strong>
                  <em>{item.description}</em>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          /* 5DO: ca bo thiet ke lan du lieu deu khong co mot san pham nao, du
             ten hang co trong "PHIM CÁCH NHIỆT · 3M | 5DO". Noi thang chu
             khong hien bua. */
          <p className="tc-brand-empty">
            Bộ sưu tập {active.label} đang được cập nhật. Gọi{" "}
            <a href="tel:+84936176996">093&nbsp;617&nbsp;6996</a> hoặc nhắn{" "}
            <a href="mailto:infor@tcautosolutions.vn">infor@tcautosolutions.vn</a>{" "}
            để TC Auto gửi bảng giá và mẫu phim {active.label}.
          </p>
        )}
      </div>
    </>
  );
}
