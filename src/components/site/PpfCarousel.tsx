"use client";

import Link from "next/link";
import { useRef, useState, type TransitionEvent } from "react";
import { useAutoplay } from "./useAutoplay";
import {
  PPF_ARROWS,
  PPF_CARD,
  PPF_HREF,
  PPF_LAYOUT,
  PPF_LOOP_STEP,
  PPF_PITCH,
  PPF_VIEW,
  offsetAt,
  repeatedCards,
  stripOriginX,
} from "@/lib/ppf-cards";

/**
 * Dai the "3M PPF" — truot duoc ca hai chieu, chay vong khong het.
 *
 * Hai the giua giu nguyen anh cat tu ban thiet ke, ke ca chu, nen luc dung yen
 * man hinh trung khop tuyet doi. Hai the ngoai bi cat o mep canvas nen chu cua
 * chung duoc ve bang CSS theo dung co chu do tu the giua.
 */
const CARDS = repeatedCards();
const ORIGIN_X = stripOriginX();

interface State {
  readonly step: number;
  readonly animate: boolean;
}

export function PpfCarousel() {
  const [state, setState] = useState<State>({ step: 0, animate: true });

  /**
   * Bam trong dung khung hinh dai dang duoc dat lai thi khong truot duoc ngay
   * (hoat anh dang tat, doi vi tri se thanh cu nhay). Nho lai roi lam ngay sau
   * khi hoat anh bat lai.
   */
  const queued = useRef(0);

  const move = (delta: number) =>
    setState((current) => {
      if (!current.animate) {
        queued.current += delta;
        return current;
      }
      return { step: current.step + delta, animate: true };
    });

  /**
   * Chay tron mot vong thi dat lai ve nhip 0 — hai vi tri trung khit nhau nen
   * viec dat lai (voi hoat anh da tat) khong he lo ra.
   */
  const onSettled = (event: TransitionEvent<HTMLDivElement>) => {
    // Cac the con cung co hoat anh rieng va su kien cua chung NOI BOT len day;
    // khong loc thi dai bi dat lai ngay giua mot nhip truot — do la cu giat.
    if (event.target !== event.currentTarget || event.propertyName !== "transform") {
      return;
    }
    setState((current) => {
      // Phan du co dau: dai chay duoc ca hai chieu nen nhip co the am.
      const wrapped =
        ((current.step % PPF_LOOP_STEP) + PPF_LOOP_STEP) % PPF_LOOP_STEP;
      if (wrapped === current.step) {
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
      return { step: wrapped, animate: false };
    });
  };

  // Tu chay 5 giay mot nhip; dung khi re chuot, khi ngoai khung nhin, va mot
  // lat sau moi cu bam tay. Xem src/components/site/useAutoplay.ts.
  const { attach, hoverProps, nudge, playing } =
    useAutoplay<HTMLDivElement>(() => move(1));

  /** Bam tay: truot ngay VA bat dau khoang lang. */
  const moveByHand = (delta: number) => {
    nudge();
    move(delta);
  };

  return (
    <div
      ref={attach}
      {...hoverProps}
      data-playing={playing || undefined}
      className="tc-ppf"
      style={{
        left: `${PPF_VIEW.x}px`,
        top: `${PPF_VIEW.y}px`,
        width: `${PPF_VIEW.width}px`,
        height: `${PPF_VIEW.height}px`,
      }}
    >
      <div
        className="tc-ppf-strip"
        data-animate={state.animate ? "" : undefined}
        onTransitionEnd={onSettled}
        style={{ transform: `translate3d(${offsetAt(state.step)}px, 0, 0)` }}
      >
        {CARDS.map((card, index) => (
          <article
            key={card.key}
            className="tc-ppf-card"
            style={{
              left: `${ORIGIN_X + index * PPF_PITCH}px`,
              width: `${PPF_CARD.width}px`,
              height: `${PPF_CARD.height}px`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the cat san tu thiet ke */}
            <img src={card.src} alt="" width={PPF_CARD.width} height={PPF_CARD.height} />
            {card.labelInCss && (
              <div className="tc-ppf-text">
                <h3
                  style={{
                    left: `${PPF_LAYOUT.padding}px`,
                    right: `${PPF_LAYOUT.paddingRight}px`,
                    top: `${PPF_LAYOUT.title.top}px`,
                    fontSize: `${PPF_LAYOUT.title.fontSize}px`,
                    lineHeight: `${PPF_LAYOUT.title.lineHeight}px`,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    left: `${PPF_LAYOUT.padding}px`,
                    right: `${PPF_LAYOUT.paddingRight}px`,
                    top: `${PPF_LAYOUT.body.top}px`,
                    fontSize: `${PPF_LAYOUT.body.fontSize}px`,
                    lineHeight: `${PPF_LAYOUT.body.lineHeight}px`,
                  }}
                >
                  {card.body}
                </p>
              </div>
            )}
            <Link
              href={PPF_HREF}
              prefetch={false}
              className="tc-ppf-cta"
              aria-label={`Xem thêm về ${card.title}`}
              style={{
                left: `${PPF_LAYOUT.button.x}px`,
                top: `${PPF_LAYOUT.button.y}px`,
                width: `${PPF_LAYOUT.button.width}px`,
                height: `${PPF_LAYOUT.button.height}px`,
              }}
            >
              {card.labelInCss ? "XEM THÊM" : ""}
            </Link>
          </article>
        ))}
      </div>

      <button
        type="button"
        className="tc-ppf-arrow"
        aria-label="Thẻ trước"
        onClick={() => moveByHand(-1)}
        style={{
          left: `${PPF_ARROWS.prev.x - PPF_VIEW.x - 12}px`,
          top: `${PPF_ARROWS.prev.y - PPF_VIEW.y - 12}px`,
          width: `${PPF_ARROWS.prev.width + 24}px`,
          height: `${PPF_ARROWS.prev.height + 24}px`,
        }}
      />
      <button
        type="button"
        className="tc-ppf-arrow"
        aria-label="Thẻ tiếp theo"
        onClick={() => moveByHand(1)}
        style={{
          left: `${PPF_ARROWS.next.x - PPF_VIEW.x - 12}px`,
          top: `${PPF_ARROWS.next.y - PPF_VIEW.y - 12}px`,
          width: `${PPF_ARROWS.next.width + 24}px`,
          height: `${PPF_ARROWS.next.height + 24}px`,
        }}
      />
    </div>
  );
}
