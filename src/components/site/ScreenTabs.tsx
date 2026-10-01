"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getBravoCards,
  SCREEN_BACKGROUND,
  SCREEN_GRID,
  SCREEN_GRID_COVER,
  SCREEN_TAB_BAR,
} from "@/lib/screen-tabs";

/**
 * Hai tab WINCA / BRAVO tren trang "Màn hình ô tô".
 *
 * Truoc day BRAVO la mot lien ket sang trang rieng. Khach yeu cau
 * (01/10/2026) no doi NGAY TAI CHO nhu mot tab that: bam BRAVO thi luoi san
 * pham doi, khong roi trang.
 *
 * Luoi Winca duoc VE CHET trong anh nen — chi 9 nut "XEM THÊM" la phan tu
 * that. Nen tab Bravo lam hai viec: che kin vung luoi bang dung mau nen cua
 * trang, roi ve ba the Bravo that len tren, dung hinh hoc do tu lat nen.
 *
 * Cac phan tu that cua tab Winca (nut XEM THÊM, phan trang) duoc an bang CSS
 * qua thuoc tinh `data-screen-tab` tren the <html> — chung la anh em o cay
 * khac nen khong voi toi bang props.
 */
const CARDS = getBravoCards();

export function ScreenTabs() {
  const [tab, setTab] = useState<"winca" | "bravo">("winca");

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.screenTab = tab;
    return () => {
      delete root.dataset.screenTab;
    };
  }, [tab]);

  return (
    <>
      {(["winca", "bravo"] as const).map((name, index) => (
        <button
          key={name}
          type="button"
          className="tc-screen-tab"
          data-on={tab === name ? "" : undefined}
          aria-pressed={tab === name}
          style={{
            left: index * SCREEN_TAB_BAR.half,
            top: SCREEN_TAB_BAR.y,
            width: SCREEN_TAB_BAR.half,
            height: SCREEN_TAB_BAR.height,
          }}
          onClick={() => setTab(name)}
        >
          <span className="tc-sr">
            {name === "winca" ? "Xem màn hình Winca" : "Xem màn hình Bravo"}
          </span>
        </button>
      ))}

      {tab === "bravo" ? (
        <div
          className="tc-screen-swap"
          style={{
            left: SCREEN_GRID_COVER.x,
            top: SCREEN_GRID_COVER.y,
            width: SCREEN_GRID_COVER.width,
            height: SCREEN_GRID_COVER.height,
            background: SCREEN_BACKGROUND,
          }}
          role="region"
          aria-label="Màn hình Bravo"
        >
          {CARDS.map((card, index) => (
            <Link
              key={card.id}
              href={card.href}
              prefetch={false}
              className="tc-screen-card"
              style={{
                left: SCREEN_GRID.columns[index] ?? SCREEN_GRID.columns[0],
                top: (SCREEN_GRID.rows[0] ?? 0) - SCREEN_GRID_COVER.y,
                width: SCREEN_GRID.width,
                height: SCREEN_GRID.height,
              }}
            >
              <span
                className="tc-screen-art"
                style={{ height: SCREEN_GRID.artHeight }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san */}
                <img src={card.image} alt="" loading="lazy" decoding="async" />
              </span>
              <strong>{card.name}</strong>
              <em>{card.tagline}</em>
              <span className="tc-screen-cta">XEM THÊM</span>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
