"use client";

import { useEffect, useState } from "react";

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

  // Theo doi tam nao dang o giua khung nhin, de to dung cham chi muc.
  useEffect(() => {
    if (!track) {
      return;
    }
    const onScroll = () => {
      const step = track.scrollWidth / slides.length;
      setAt(Math.round(track.scrollLeft / step) % slides.length);
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
        {slides.map((slide) => (
          <li key={slide.key}>
            {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san
                tu ban thiet ke, khong qua image optimizer */}
            <img src={slide.src} alt={slide.alt} loading="lazy" decoding="async" />
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
