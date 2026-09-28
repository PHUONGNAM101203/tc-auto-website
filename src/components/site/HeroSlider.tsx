"use client";

import { useEffect, useState } from "react";
import {
  getHeroSlides,
  HERO_CONTROLS,
  HERO_REGION,
  heroSliderEnabled,
} from "@/lib/hero-slides";

/**
 * Bang hero tren trang chu.
 *
 * Toa do cua mui ten va vach chi muc do truc tiep tu frame thiet ke:
 *   mui ten trai  x 32..42     mui ten phai x 1398..1412   (y 432..465)
 *   vach chi muc  x 640..799, y 826, cao 2px
 *   5 vach: vach dang chon rong 86px, cac vach khac 11px, cach nhau 8px
 *
 * Khi chi co MOT slide, component khong ve gi ca — khong tao nut bam gia.
 */
const AUTOPLAY_MS = 7000;

/** Anh 1x1 trong suot cho slide chua den luot tai. */
const BLANK =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

interface State {
  readonly index: number;
  /**
   * Slide da duoc phep tai anh. Moi anh hero nang 0,15MB (@2x) den 0,4MB (@3x);
   * tai ca 5 anh ngay khi vao trang la pha hong viec tai theo luot cuon.
   * Luon mo san slide dang xem VA slide ke tiep, de bam tiep khong phai cho.
   */
  readonly armed: ReadonlySet<number>;
}

/** Gom index va armed vao MOT state: chung luon phai doi cung nhau. */
function advance(state: State, target: number, count: number): State {
  const index = ((target % count) + count) % count;
  const after = (index + 1) % count;
  if (state.index === index && state.armed.has(index) && state.armed.has(after)) {
    return state;
  }
  const armed =
    state.armed.has(index) && state.armed.has(after)
      ? state.armed
      : new Set([...state.armed, index, after]);
  return { index, armed };
}

export function HeroSlider() {
  const slides = getHeroSlides();
  const enabled = heroSliderEnabled();
  const count = slides.length;

  const [state, setState] = useState<State>(() => ({
    index: 0,
    armed: new Set([0, 1]),
  }));
  const [paused, setPaused] = useState(false);

  // Khong dung useCallback: du an bat React Compiler, no tu lo phan ghi nho.
  const go = (target: number) =>
    setState((current) => advance(current, target, count));

  // Tu chay, dung lai khi nguoi dung dua chuot vao hoac khi da bat "giam chuyen dong".
  useEffect(() => {
    if (!enabled || paused) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = setInterval(
      () => setState((current) => advance(current, current.index + 1, count)),
      AUTOPLAY_MS,
    );
    return () => clearInterval(timer);
  }, [enabled, paused, count]);

  if (!enabled) {
    return null;
  }

  const { prev, next, indicator } = HERO_CONTROLS;
  const { index, armed } = state;

  return (
    <div
      className="tc-hero"
      style={{
        left: HERO_REGION.x,
        top: HERO_REGION.y,
        width: HERO_REGION.width,
        height: HERO_REGION.height,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="băng ảnh"
      aria-label="Ảnh giới thiệu TC Auto"
    >
      {slides.map((slide, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- anh nen cat san, xem CanvasSlices
        <img
          key={slide.id}
          className={`tc-hero-slide${i === index ? " is-on" : ""}`}
          src={armed.has(i) ? slide.src : BLANK}
          srcSet={
            armed.has(i)
              ? slide.srcSet.map((v) => `${v.src} ${v.scale}x`).join(", ")
              : undefined
          }
          alt={i === index ? slide.alt : ""}
          width={HERO_REGION.width}
          height={HERO_REGION.height}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          aria-hidden={i !== index}
        />
      ))}

      {/* Slide 1 co san mui ten ve trong anh, cac slide khac thi khong —
          nen ve ky hieu that, dat dung vi tri va do day net cua ban thiet ke. */}
      <button
        type="button"
        className="tc-hero-arrow"
        style={{ left: prev.x, top: prev.y, width: prev.width, height: prev.height }}
        onClick={() => go(index - 1)}
        aria-label="Ảnh trước"
      >
        <Chevron direction="left" />
      </button>
      <button
        type="button"
        className="tc-hero-arrow"
        style={{ left: next.x, top: next.y, width: next.width, height: next.height }}
        onClick={() => go(index + 1)}
        aria-label="Ảnh tiếp theo"
      >
        <Chevron direction="right" />
      </button>

      <div
        className="tc-hero-dots"
        style={{ left: indicator.x, top: indicator.y, gap: indicator.gap }}
        role="tablist"
        aria-label="Chọn ảnh"
      >
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Ảnh ${i + 1} trên ${count}`}
            className={`tc-hero-dot${i === index ? " is-on" : ""}`}
            style={{ width: i === index ? indicator.activeWidth : indicator.dashWidth }}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}

/** Chevron ‹ › — do day net va ti le lay tu ban thiet ke. */
function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 12 34" aria-hidden="true" focusable="false">
      <path
        d={direction === "left" ? "M10 2 L2 17 L10 32" : "M2 2 L10 17 L2 32"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
