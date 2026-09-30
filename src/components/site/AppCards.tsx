"use client";

import Link from "next/link";
import { useState } from "react";
import { useAutoplay } from "./useAutoplay";
import type { AppCard } from "@/lib/app-cards";

/**
 * Ba the muc "Ứng dụng" tren trang Cong nghe.
 *
 * KHUNG cua tung the nam trong anh nen, dung vi tri thiet ke ve — ba khung
 * dung yen: hai ben nho, giua to. Chi RUOT (anh minh hoa + tieu de + phu de)
 * duoc tach ra thanh anh rieng, va chinh no moi doi cho.
 *
 * ── Bam thi sao ────────────────────────────────────────────────────────────
 * Bam vao the BEN CANH thi ruot cua no chay vao khung giua, ruot dang o giua
 * doi ra cho no — dung y "slider vao giua qua lai" ma khach muon. Bam vao the
 * DANG O GIUA moi la di sang trang cua muc do.
 *
 * Truoc day bam the nao cung di thang sang trang. Rieng "Hiệu suất" thi khong
 * co trang rieng trong bo thiet ke nen no tro ve trang "Ứng dụng" — ma trang
 * do mo ra lai thay tieu de "KHO ỨNG DỤNG", nen nguoi dung tuong bam nham
 * (khach bao 30/09/2026).
 */
export function AppCards({ cards }: { cards: readonly AppCard[] }) {
  // `order[i]` = the nao dang nam o khung thu i. Khung giua la khung to nhat.
  const [order, setOrder] = useState(() => cards.map((_, index) => index));
  const middle = cards.reduce(
    (big, card, index) =>
      card.content.width > cards[big].content.width ? index : big,
    0,
  );

  const { attach, hoverProps, nudge, playing } = useAutoplay<HTMLDivElement>(
    () =>
      setOrder((now) => {
        // Xoay vong: the o khung ke tiep duoc dua vao giua.
        const next = [...now];
        const from = (middle + 1) % next.length;
        [next[middle], next[from]] = [next[from], next[middle]];
        return next;
      }),
    cards.length > 1,
  );

  if (cards.length === 0) {
    return null;
  }

  const bring = (slot: number) => {
    nudge();
    setOrder((now) => {
      const next = [...now];
      [next[middle], next[slot]] = [next[slot], next[middle]];
      return next;
    });
  };

  return (
    <div
      ref={attach}
      {...hoverProps}
      data-playing={playing || undefined}
      className="tc-cards"
    >
      {order.map((cardIndex, slot) => {
        const card = cards[cardIndex];
        const frame = cards[slot].content;
        const inMiddle = slot === middle;
        const style = {
          left: frame.x,
          top: frame.y,
          width: frame.width,
          height: frame.height,
        };
        const art = (
          /* Lop boc rieng de nhac ruot the len khi ro chuot. */
          <span className="tc-card-lift">
            {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san tu
                ban thiet ke o ti le @3x, khong qua image optimizer */}
            <img
              src={card.src}
              alt=""
              width={frame.width}
              height={frame.height}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </span>
        );

        return inMiddle ? (
          <Link
            key={card.id}
            href={card.href}
            prefetch={false}
            className="tc-card"
            data-on=""
            style={style}
            aria-label={card.title}
          >
            {art}
          </Link>
        ) : (
          <button
            key={card.id}
            type="button"
            className="tc-card"
            style={style}
            onClick={() => bring(slot)}
            aria-label={`${card.title} — bấm để xem ở giữa`}
          >
            {art}
          </button>
        );
      })}
    </div>
  );
}
