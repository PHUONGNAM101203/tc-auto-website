"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getBravoCards,
  getBravoCopy,
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
const COPY = getBravoCopy();

function ScreenTabsInner() {
  // `?tab=bravo` mo thang sang tab Bravo. The noi "MÀN HÌNH BRAVO" tren trang
  // Giai phap dan toi day — truoc no tro sang mot trang Bravo rieng, ma trang
  // do khach da yeu cau bo (02/10/2026).
  //
  // SUY ra chu khong chot vao `useState`: trang nay duoc dung san tu truoc nen
  // o lan ve dau tien `useSearchParams()` con rong, gia tri khoi tao se luon
  // la "winca" va tab khong bao gio mo dung. Giu rieng lua chon cua nguoi
  // dung; chua bam thi theo dia chi.
  const fromUrl = useSearchParams().get("tab") === "bravo" ? "bravo" : "winca";
  const [picked, setPicked] = useState<"winca" | "bravo" | null>(null);
  const tab = picked ?? fromUrl;
  const setTab = setPicked;

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
          {/* Luoi thiet ke co CHIN o, ma Bravo chi co ba dong — de khong thi
              con mot khoang trong cao hon 1500px. Phan chu duoi day chinh la
              noi dung cua trang Bravo cu, dua vao day thay vi bo di. */}
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

          <div
            className="tc-screen-copy"
            style={{ top: (SCREEN_GRID.rows[1] ?? 0) - SCREEN_GRID_COVER.y }}
          >
            <p className="tc-screen-lead">{COPY.lead}</p>
            <div className="tc-screen-cols">
              {COPY.blocks.map((block) => (
                <section key={block.heading}>
                  <h3>{block.heading}</h3>
                  {block.paragraphs.map((text) => (
                    <p key={text.slice(0, 24)}>{text}</p>
                  ))}
                </section>
              ))}
            </div>
            <p className="tc-screen-pending">
              <strong>{COPY.pending.heading}:</strong>{" "}
              {COPY.pending.items.join(" · ")}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * Vo boc Suspense — Next BAT BUOC khi dung `useSearchParams` trong mot trang
 * duoc dung san. Khong co no thi `next build` dung han: "useSearchParams()
 * should be wrapped in a suspense boundary".
 *
 * `fallback` de trong: luc chua co dia chi thi tab Winca dang hien, ma luoi
 * Winca von ve chet trong anh nen — nguoi xem khong thay gi nhap nhay.
 */
export function ScreenTabs() {
  return (
    <Suspense fallback={null}>
      <ScreenTabsInner />
    </Suspense>
  );
}
