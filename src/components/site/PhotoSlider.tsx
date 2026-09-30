"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAutoplay } from "./useAutoplay";
import { DECK_STEP, type PhotoSlider as Slider } from "@/lib/photo-sliders";

/**
 * Thoi gian mot the bay tu tang nay sang tang khac. Phai KHOP voi
 * `--tc-deck-ms` trong overlay.css.
 */
const SLIDE_MS = 520;

/**
 * Chong anh xoe ra phia sau, giong ban thiet ke.
 *
 * ── Truoc day sai o dau ────────────────────────────────────────────────────
 * Ban thiet ke ve mot chong ba (hoac bon) tam anh xoe len phia tren ben phai.
 * Chi co tam TREN CUNG la phan tu that; may tam phia sau nam trong anh nen —
 * tuc la chung dung yen mai mai, va noi dung cua chung khong lien quan gi den
 * anh dang xem. Khach goi dung ten: "ảnh bịa". Nay ca chong deu la anh that.
 *
 * ── Cach chuyen ────────────────────────────────────────────────────────────
 * `order[d]` = tam nao dang nam o tang thu `d`, tang 0 la tren cung. Bam mui
 * ten thi tam tren cung xuong day chong; bam thang vao mot tam thi tam do len
 * dau. Huong di co san trong hinh hoc: cac tang phia sau nam o BEN PHAI va
 * CAO HON, nen "ra sau" tu no la truot sang phai, "len dau" la truot sang
 * trai — dung nhu khach mo ta, ma khong can viet rieng hieu ung nao.
 *
 * `z-index` khong noi suy duoc nen no doi mot nhat giua duong bay (do tre
 * trong `transition`), luc hai the da di qua nhau.
 */
function Deck({ slider }: { slider: Slider }) {
  const count = slider.slides.length;
  const [order, setOrder] = useState<readonly number[]>(() =>
    slider.slides.map((_, i) => i),
  );
  /** Dang co the bay: chan cu bam moi de hai cu khong chong len nhau. */
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Cu bam trong luc dang bay — nho lai, lam ngay sau. */
  const queued = useRef<number | null>(null);
  const bringRef = useRef<((depth: number) => void) | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  /**
   * Dua tam o tang `depth` len tren cung.
   *
   * `depth = 0` mang y nghia rieng: tam tren cung KHONG the len dau them nua,
   * nen cu do duoc hieu la "cho no xuong day" — chinh la nut mui ten.
   */
  const bring = useCallback(
    (depth: number) => {
      if (count < 2) {
        return;
      }
      if (busy.current) {
        queued.current = depth;
        return;
      }

      setOrder((current) => {
        if (depth === 0) {
          const [front, ...rest] = current;
          return [...rest, front];
        }
        const picked = current[depth];
        return [picked, ...current.filter((_, i) => i !== depth)];
      });

      const reduce =
        typeof matchMedia === "function" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        return;
      }

      busy.current = true;
      timer.current = setTimeout(() => {
        timer.current = null;
        busy.current = false;
        const next = queued.current;
        queued.current = null;
        if (next !== null) {
          // Goi qua ref: goi thang `bring` la dung lai ban cu cua ham, ban do
          // con giu `order` cua nhip truoc nen cu bam duoc nho lai nhay sai.
          bringRef.current?.(next);
        }
      }, SLIDE_MS);
    },
    [count],
  );

  useEffect(() => {
    bringRef.current = bring;
  }, [bring]);

  // Tu chay 5 giay mot nhip; dung khi re chuot, khi ngoai khung nhin, va mot
  // lat sau moi cu bam tay. Xem src/components/site/useAutoplay.ts.
  const { attach, hoverProps, nudge, playing } = useAutoplay<HTMLDivElement>(
    () => bringRef.current?.(0),
    count > 1,
  );

  const byHand = (depth: number) => {
    nudge();
    bring(depth);
  };

  /** Tang cua tung tam, tra cuu nguoc tu `order`. */
  const depthOf = (slide: number) => order.indexOf(slide);

  return (
    <>
      <div
        ref={attach}
        {...hoverProps}
        className="tc-deck"
        data-playing={playing || undefined}
        style={{
          left: slider.box.x,
          top: slider.box.y,
          width: slider.box.width,
          height: slider.box.height,
        }}
        role="group"
        aria-roledescription="băng chuyền"
        aria-label={slider.label}
      >
        {slider.slides.map((src, slide) => {
          const depth = depthOf(slide);
          const front = depth === 0;
          const step = slider.deck ?? DECK_STEP;
          return (
            <button
              key={src}
              type="button"
              className="tc-deck-card"
              data-front={front || undefined}
              style={{
                transform: `translate(${step.x * depth}px, ${step.y * depth}px)`,
                zIndex: count - depth,
                opacity: front ? 1 : Math.max(0.18, 1 - step.fade * depth),
              }}
              // Tam tren cung bam vao thi xuong day; tam phia sau bam vao thi
              // len dau. Chinh la hai cu khach mo ta.
              onClick={() => byHand(depth)}
              aria-label={
                front
                  ? `${slider.label} — xem ảnh tiếp theo`
                  : `${slider.label} — xem ảnh thứ ${slide + 1}`
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- anh cat
                  san tu ban thiet ke o ti le goc, khong qua image optimizer */}
              <img
                src={src}
                alt={front ? slider.label : ""}
                aria-hidden={front ? undefined : true}
                width={slider.box.width}
                height={slider.box.height}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </button>
          );
        })}
      </div>

      {/* Mui ten dat theo toa do CANVAS chu khong long trong khung anh: trong
          thiet ke chung nam sat hai mep va tho ra mot chut khoi tam anh. */}
      {slider.prev ? (
        <button
          type="button"
          className="tc-photoslider-arrow"
          data-dir="prev"
          onClick={() => byHand(count - 1)}
          {...hoverProps}
          style={{
            left: slider.prev.x,
            top: slider.prev.y,
            width: slider.prev.width,
            height: slider.prev.height,
          }}
          aria-label={`${slider.label} — xem ảnh trước`}
        />
      ) : null}

      <button
        type="button"
        className="tc-photoslider-arrow"
        onClick={() => byHand(0)}
        {...hoverProps}
        style={{
          left: slider.arrow.x,
          top: slider.arrow.y,
          width: slider.arrow.width,
          height: slider.arrow.height,
        }}
        aria-label={`${slider.label} — xem ảnh tiếp theo`}
      />
    </>
  );
}

export function PhotoSliders({ sliders }: { sliders: readonly Slider[] }) {
  if (sliders.length === 0) {
    return null;
  }
  return (
    <>
      {sliders.map((slider) => (
        <Deck key={slider.id} slider={slider} />
      ))}
    </>
  );
}
