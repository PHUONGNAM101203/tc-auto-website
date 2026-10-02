"use client";

import { useEffect, useState } from "react";

/** Anh 1x1 trong suot cho tam chua den luot tai. */
const BLANK =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Bang anh cho ban MOBILE.
 *
 * ── Vi sao khong dung lai bang cua ban desktop ─────────────────────────────
 * Ban desktop dat tung tam tuyet doi theo he toa do canvas 1440px roi truot
 * bang `transform`. Tren dien thoai khong co canvas do, va quan trong hon la
 * nguoi dung mong VUOT duoc bang ngon tay. Nen o day dung mot dai cuon ngang
 * that voi `scroll-snap`: vuot la viec cua trinh duyet, muot va dung quan tinh
 * cua he dieu hanh, khong can mot dong JavaScript nao.
 *
 * Tu chay chi la mot `scrollTo` dinh ky de len tren cai do. Cham tay vao la
 * dung — nguoi dung dang tu xem thi dung keo di.
 */
export interface MobileSlide {
  readonly key: string;
  readonly src: string;
  /**
   * Cac ban do phan giai khac nhau, mo ta bang `w`.
   *
   * Khong co no thi dai hero lay ban @2x rong 2880px cho mot khung chi rong
   * 350px — gap BON lan muc can, va hai tam hero chiem gan nua tong luong tai
   * cua trang chu ban dien thoai. Xem tools/brand/make-mobile-hero.py.
   */
  readonly srcSet?: string;
  readonly alt: string;
  readonly href?: string;
  readonly caption?: string;
}

export function MobileCarousel({
  slides,
  label,
  everyMs,
  ratio,
}: {
  readonly slides: readonly MobileSlide[];
  readonly label: string;
  /** Nhip tu chay. Bang hero 3 giay, cac bang khac 5 giay. */
  readonly everyMs: number;
  /** Ti le khung anh, de cho anh khong nhay khi tai xong. */
  readonly ratio: string;
}) {
  const [track, setTrack] = useState<HTMLUListElement | null>(null);
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  /**
   * Tam XA NHAT nguoi dung da xem toi. Moi tam tu day tro ve truoc duoc tai.
   *
   * `loading="lazy"` KHONG giup gi o day: no do khoang cach theo chieu DOC, ma
   * ca nam tam deu nam trong mot dai cuon NGANG — voi trinh duyet thi chung
   * deu "gan khung nhin" nen tai het ngay lap tuc. Do duoc: tren dien thoai
   * trang chu keo ve ca nam anh hero (~1MB) trong khi ban may ban chi lay hai.
   *
   * Giu mot CON SO chu khong phai mot tap hop, va suy ra lam gi tai luc ve chu
   * khong dat trong effect: dat state trong effect lam React ve lai day chuyen
   * (eslint bat duoc), va o day hoan toan khong can — "da xem toi dau" la mot
   * ham thuan cua `at`.
   */
  const [seen, setSeen] = useState(1);
  /** Luon mo san tam ke tiep, de vuot sang khong phai cho. */
  const reach = Math.min(Math.max(seen, at + 1), slides.length - 1);

  // Theo doi tam nao dang o giua khung nhin, de to dung cham chi muc.
  useEffect(() => {
    if (!track) {
      return;
    }
    const onScroll = () => {
      const step = track.scrollWidth / slides.length;
      const now = Math.round(track.scrollLeft / step) % slides.length;
      setAt(now);
      setSeen((far) => Math.max(far, now + 1));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [track, slides.length]);

  useEffect(() => {
    if (!track || held || slides.length < 2) {
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const beat = setInterval(() => {
      const step = track.scrollWidth / slides.length;
      const next = (Math.round(track.scrollLeft / step) + 1) % slides.length;
      track.scrollTo({ left: next * step, behavior: "smooth" });
    }, everyMs);
    return () => clearInterval(beat);
  }, [track, held, slides.length, everyMs]);

  if (slides.length === 0) {
    return null;
  }

  const go = (index: number) => {
    if (!track) {
      return;
    }
    track.scrollTo({
      left: index * (track.scrollWidth / slides.length),
      behavior: "smooth",
    });
  };

  return (
    <div
      className="tc-m-car"
      role="group"
      aria-roledescription="băng ảnh"
      aria-label={label}
    >
      <ul
        ref={setTrack}
        className="tc-m-car-track"
        style={{ ["--tc-m-ratio" as string]: ratio }}
        // Cham tay vao thi dung tu chay; bo tay ra mot lat sau moi chay lai.
        onPointerDown={() => setHeld(true)}
        onPointerUp={() => setHeld(false)}
        onPointerCancel={() => setHeld(false)}
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
      >
        {slides.map((slide, index) => (
          <li key={slide.key}>
            {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san
                tu ban thiet ke, khong qua image optimizer */}
            <img
              src={index <= reach ? slide.src : BLANK}
              srcSet={index <= reach ? slide.srcSet : undefined}
              /* Dai chiem het be ngang man hinh, tru 40px le hai ben. */
              sizes={slide.srcSet ? "calc(100vw - 40px)" : undefined}
              alt={index <= reach ? slide.alt : ""}
              loading="lazy"
              decoding="async"
            />
            {slide.caption ? <span>{slide.caption}</span> : null}
          </li>
        ))}
      </ul>

      {slides.length > 1 ? (
        <div className="tc-m-car-dots" role="tablist" aria-label={`Chọn ảnh — ${label}`}>
          {slides.map((slide, index) => (
            <button
              key={slide.key}
              type="button"
              role="tab"
              aria-selected={index === at}
              aria-label={`Ảnh ${index + 1} trên ${slides.length}`}
              data-on={index === at || undefined}
              onClick={() => go(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
