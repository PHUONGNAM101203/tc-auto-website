"use client";

import { useState } from "react";
import { useAutoplay } from "./useAutoplay";
import {
  offsetFrom,
  PROJECT_CENTRE,
  type ProjectPhoto,
} from "@/lib/projects";

/**
 * Dai anh "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" — bam tam nao thi tam do chay vao giua.
 *
 * ── Cach xep ───────────────────────────────────────────────────────────────
 * Cho giua do tu ban thiet ke (x 503..919, y 5424..5704). Cac tam khac dat le
 * sang hai ben theo SO BAC, moi bac lech `STEP` va nho di mot chut — tam cang
 * xa giua cang nho va cang mo. Dat theo bac chu khong dat tung cho cu the:
 * nho vay chi can doi `STEP` la ca dai gian ra hay thu lai.
 *
 * Bac duoc tinh CHAY VONG (xem offsetFrom): bam tam nao cung chi truot mot
 * buoc ngan nhat, khong bao gio keo ca dai tu dau nay sang dau kia.
 *
 * Thiet ke ve cac tam ngoai bi NGHIENG di. Khong dung lai duoc dieu do: anh
 * goc trong bo tai nguyen la anh phang, ma lam nghieng bang CSS 3D thi chu
 * tren bang hieu trong anh bi meo. Nen o day chung chi nho dan va mo dan.
 */

/** Khoang cach giua hai bac, tinh tu tam den tam. */
const STEP = 426;
/** Moi bac ra xa thi nho di bao nhieu. */
const SHRINK = 0.085;
/** Va mo di bao nhieu. */
const FADE = 0.28;

export function ProjectCoverflow({
  photos,
}: {
  readonly photos: readonly ProjectPhoto[];
}) {
  const [centre, setCentre] = useState(0);
  const { attach, hoverProps, nudge, playing } = useAutoplay<HTMLDivElement>(
    () => setCentre((at) => (at + 1) % photos.length),
    photos.length > 1,
  );

  if (photos.length === 0) {
    return null;
  }

  const pick = (index: number) => {
    nudge();
    setCentre(index);
  };

  return (
    <div
      ref={attach}
      {...hoverProps}
      data-playing={playing || undefined}
      className="tc-proj"
      style={{
        left: 0,
        top: PROJECT_CENTRE.y,
        width: 1440,
        height: PROJECT_CENTRE.height,
      }}
      role="group"
      aria-roledescription="băng chuyền"
      aria-label="Các dự án đã triển khai"
    >
      {photos.map((photo, index) => {
        const step = offsetFrom(index, centre, photos.length);
        const scale = 1 - Math.abs(step) * SHRINK;
        return (
          <button
            key={photo.id}
            type="button"
            className="tc-proj-card"
            data-on={step === 0 || undefined}
            style={{
              left: PROJECT_CENTRE.x,
              width: PROJECT_CENTRE.width,
              height: PROJECT_CENTRE.height,
              transform: `translateX(${step * STEP}px) scale(${scale})`,
              opacity: 1 - Math.abs(step) * FADE,
              // Tam o giua phai nam TREN cac tam khac.
              zIndex: photos.length - Math.abs(step),
            }}
            onClick={() => pick(index)}
            aria-label={
              step === 0 ? photo.alt : `${photo.alt} — bấm để xem ở giữa`
            }
            aria-current={step === 0 || undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san
                tu bo tai nguyen o ti le goc, khong qua image optimizer */}
            <img
              src={photo.src}
              alt=""
              width={photo.width}
              height={photo.height}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </button>
        );
      })}
    </div>
  );
}
