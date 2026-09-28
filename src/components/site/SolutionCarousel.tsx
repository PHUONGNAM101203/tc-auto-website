"use client";

import { useRef, useState, type TransitionEvent } from "react";
import {
  LOOP_STEP,
  SOLUTION_ARROW,
  SOLUTION_CARD,
  SOLUTION_PITCH,
  SOLUTION_VIEW,
  cardOpacity,
  offsetAt,
  repeatedCards,
} from "@/lib/solution-cards";

/**
 * Dai the muc "Giải pháp" tren trang chu — chay vong khong bao gio het.
 *
 * Thiet ke ve chet dai the vao anh va de the thu 4 tho ra khoi mep canvas kem
 * mot mui ten trang: y la "con nua, keo di". Dai the da duoc tach thanh phan tu
 * that (tools/brand/extract-solution-cards.py) de mui ten do bam duoc.
 *
 * Ba the dau giu nguyen anh cat tu ban thiet ke — ke ca chu — nen luc dung yen
 * man hinh trung khop tuyet doi. Rieng the thu 4 bi cat trong thiet ke nen chu
 * cua no duoc ve bang CSS.
 *
 * Bam vao mui ten HAY bat ky the nao cung day dai di mot nhip = mot the. Dai
 * chi chay MOT CHIEU sang trai (dung nhu thiet ke: chi co mui ten phai) va chay
 * mai khong het: het luot thi vong lai tu dau. The ra khoi mep trai mo dan roi
 * khuat han.
 */

/** Dai the lap lai san — tinh mot lan, khong doi theo trang thai. */
const CARDS = repeatedCards();

interface State {
  /** Nhip hien tai. Bang LOOP_STEP nghia la vua chay tron mot vong. */
  readonly step: number;
  /** Tat hoat anh dung mot khung hinh de dat lai ve dau cho lien mach. */
  readonly animate: boolean;
}

export function SolutionCarousel() {
  const [state, setState] = useState<State>({ step: 0, animate: true });
  const offset = offsetAt(state.step);

  /**
   * Bam trong DUNG khung hinh dai dang duoc dat lai thi khong the truot ngay:
   * luc do hoat anh dang tat, doi vi tri se thanh mot cu nhay. Nho lai cu bam
   * do roi lam ngay sau khi hoat anh bat lai — nguoi dung bam bao nhieu cai
   * cung an, khong cai nao roi.
   */
  const queued = useRef(0);

  const advance = () =>
    setState((current) => {
      if (!current.animate) {
        queued.current += 1;
        return current;
      }
      return { step: current.step + 1, animate: true };
    });

  /**
   * Chay tron mot vong thi dat lai ve nhip 0. Vi tri nhip LOOP_STEP va nhip 0
   * trung khit nhau nen viec dat lai — voi hoat anh da tat — khong he lo ra.
   * Bat lai hoat anh o khung hinh ke tiep de nhip sau van truot binh thuong.
   */
  const onSettled = (event: TransitionEvent<HTMLDivElement>) => {
    // Moi the cung co hoat anh do mo rieng, va su kien cua chung NOI BOT len
    // day. Khong loc thi dai bi dat lai ngay giua chung mot nhip truot — dung
    // cai giat ma nguoi dung thay.
    if (event.target !== event.currentTarget || event.propertyName !== "transform") {
      return;
    }
    setState((current) => {
      if (current.step < LOOP_STEP) {
        return current;
      }
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setState((next) => {
            const waiting = queued.current;
            queued.current = 0;
            return { step: next.step + waiting, animate: true };
          }),
        ),
      );
      // Lay PHAN DU chu khong dat ve 0: bam nhanh thi nhip da vuot qua mot
      // vong tu luc nao. Hai vi tri trung khit nhau nen mat khong thay.
      return { step: current.step % LOOP_STEP, animate: false };
    });
  };

  return (
    <div
      className="tc-solutions"
      style={{
        left: SOLUTION_VIEW.x,
        top: SOLUTION_VIEW.y,
        width: SOLUTION_VIEW.width,
        height: SOLUTION_VIEW.height,
      }}
      role="group"
      aria-roledescription="băng chuyền"
      aria-label="Giải pháp"
    >
      <div
        className="tc-solutions-strip"
        data-animate={state.animate || undefined}
        style={{ transform: `translate3d(${-offset}px, 0, 0)` }}
        onTransitionEnd={onSettled}
      >
        {CARDS.map((card, index) => (
          <button
            key={card.key}
            type="button"
            className="tc-solution"
            style={{
              left: index * SOLUTION_PITCH,
              width: SOLUTION_CARD.width,
              height: SOLUTION_CARD.height,
              opacity: cardOpacity(index, offset),
            }}
            onClick={advance}
            aria-label={`${card.title} — ${card.subtitle}. Bấm để xem giải pháp tiếp theo`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- anh the cat san
                tu ban thiet ke, khong qua image optimizer */}
            <img
              src={card.src}
              alt={card.labelInCss ? "" : `${card.title} — ${card.subtitle}`}
              width={SOLUTION_CARD.width}
              height={SOLUTION_CARD.height}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            {card.labelInCss ? (
              <span className="tc-solution-label">
                <strong>{card.title}</strong>
                <em>{card.subtitle}</em>
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="tc-solution-arrow"
        data-dir="next"
        onClick={advance}
        style={{
          left: SOLUTION_ARROW.x - SOLUTION_VIEW.x,
          top: SOLUTION_ARROW.y - SOLUTION_VIEW.y,
          width: SOLUTION_ARROW.width,
          height: SOLUTION_ARROW.height,
        }}
        aria-label="Xem thêm giải pháp"
      />
    </div>
  );
}
