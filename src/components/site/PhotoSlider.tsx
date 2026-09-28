"use client";

import { useState } from "react";
import { nextSlide, prevSlide, type PhotoSlider as Slider } from "@/lib/photo-sliders";

/**
 * Mot tam anh trong ban thiet ke co ve san mui ten "›" — day la lop lam cho mui
 * ten do bam duoc.
 *
 * Slide dau la anh CAT TU chinh ban thiet ke, dat dung cho anh goc, nen o trang
 * thai ban dau man hinh khong doi mot pixel nao. Cac slide sau lay tu bo tai
 * nguyen roi va GIU kenh trong suot, nho vay cac lop anh phia sau (van nam
 * trong anh nen) khong bi che. Bam mui ten thi chuyen anh, chay vong khong het.
 */
function Slide({ slider }: { slider: Slider }) {
  const [index, setIndex] = useState(0);

  return (
    <>
      <div
        className="tc-photoslider"
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
        {slider.slides.map((src, slideIndex) => (
          /* eslint-disable-next-line @next/next/no-img-element -- anh cat san tu
             ban thiet ke o ti le goc, khong qua image optimizer */
          <img
            key={src}
            src={src}
            alt={slideIndex === index ? slider.label : ""}
            aria-hidden={slideIndex === index ? undefined : true}
            className="tc-photoslide"
            data-on={slideIndex === index || undefined}
            width={slider.box.width}
            height={slider.box.height}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ))}
      </div>

      {/* Mui ten dat theo toa do CANVAS chu khong long trong khung anh: trong
          thiet ke chung nam sat hai mep va tho ra mot chut khoi tam anh. */}
      {slider.prev ? (
        <button
          type="button"
          className="tc-photoslider-arrow"
          data-dir="prev"
          onClick={() => setIndex((current) => prevSlide(current, slider.slides.length))}
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
        onClick={() => setIndex((current) => nextSlide(current, slider.slides.length))}
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
        <Slide key={slider.id} slider={slider} />
      ))}
    </>
  );
}
