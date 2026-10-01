"use client";

import { useState } from "react";
import { useAutoplay } from "./useAutoplay";
import { offsetFrom, type Box, type CoverPhoto } from "@/lib/coverflow";

/**
 * Bang chuyen anh: bam tam nao thi tam do chay vao giua.
 *
 * ── Cach xep ───────────────────────────────────────────────────────────────
 * Cho giua do tu ban thiet ke. Cac tam khac dat le sang hai ben theo SO BAC,
 * moi bac lech `step` va nho di mot chut — tam cang xa giua cang nho va cang
 * mo. Dat theo bac chu khong dat tung cho cu the: nho vay chi can doi `step`
 * la ca dai gian ra hay thu lai.
 *
 * Bac duoc tinh CHAY VONG (xem offsetFrom): bam tam nao cung chi truot mot
 * buoc ngan nhat, khong bao gio keo ca dai tu dau nay sang dau kia.
 *
 * Thiet ke ve cac tam ngoai NGHIENG di cho co chieu sau. Khach yeu cau giu
 * dung kieu do: "vẫn theo phong cách chiều sâu như vậy nhé chứ không nằm hàng
 * ngang" (01/10/2026). Nen cac tam ngoai duoc xoay quanh truc doc bang CSS 3D,
 * cong voi nho dan va mo dan.
 *
 * Goc xoay giu O MUC VUA: 20 do du thay chieu sau ma chu tren bang hieu trong
 * anh chua bi meo den muc kho doc. Day chinh la ly do truoc day khong xoay —
 * nhung bo han chieu sau thi dai thanh mot hang phang, khong giong thiet ke.
 *
 * Dung chung cho hai cho: dai "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" (trang Giai phap) va
 * dai "BỘ SƯU TẬP" (trang Khoảnh khắc).
 */

/** Moi bac ra xa thi nho di bao nhieu. */
const SHRINK = 0.085;
/** Va mo di bao nhieu. */
const FADE = 0.28;
/** Goc xoay quanh truc doc cho moi bac, tinh bang do. */
const TILT = 20;
/** Do sau cua phoi canh. Cang nho thi hieu ung cang manh. */
const DEPTH = 1600;

interface CoverflowProps {
  readonly photos: readonly CoverPhoto[];
  /** Cho giua, theo he toa do canvas 1440px. */
  readonly centre: Box;
  /** Khoang cach giua hai bac, tinh tu tam den tam. */
  readonly step: number;
  readonly label: string;
}

export function Coverflow({ photos, centre, step, label }: CoverflowProps) {
  const [at, setAt] = useState(0);
  const { attach, hoverProps, nudge, playing } = useAutoplay<HTMLDivElement>(
    () => setAt((current) => (current + 1) % photos.length),
    photos.length > 1,
  );

  if (photos.length === 0) {
    return null;
  }

  const pick = (index: number) => {
    nudge();
    setAt(index);
  };

  return (
    <div
      ref={attach}
      {...hoverProps}
      data-playing={playing || undefined}
      className="tc-cover"
      style={{
        left: 0,
        top: centre.y,
        width: 1440,
        height: centre.height,
        perspective: `${DEPTH}px`,
      }}
      role="group"
      aria-roledescription="băng chuyền"
      aria-label={label}
    >
      {photos.map((photo, index) => {
        const off = offsetFrom(index, at, photos.length);
        const scale = 1 - Math.abs(off) * SHRINK;
        return (
          <button
            key={photo.id}
            type="button"
            className="tc-cover-card"
            data-on={off === 0 || undefined}
            style={{
              left: centre.x,
              width: centre.width,
              height: centre.height,
              // Xoay quanh truc doc cho co chieu sau; tam o giua khong xoay.
              // Thu tu phep bien doi co y nghia: tinh tien TRUOC roi moi xoay,
              // nho vay tam quay nam o chinh giua tam anh chu khong o giua dai.
              transform: `translateX(${off * step}px) rotateY(${-off * TILT}deg) scale(${scale})`,
              opacity: 1 - Math.abs(off) * FADE,
              // Tam o giua phai nam TREN cac tam khac.
              zIndex: photos.length - Math.abs(off),
            }}
            onClick={() => pick(index)}
            aria-label={
              off === 0 ? photo.alt : `${photo.alt} — bấm để xem ở giữa`
            }
            aria-current={off === 0 || undefined}
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
