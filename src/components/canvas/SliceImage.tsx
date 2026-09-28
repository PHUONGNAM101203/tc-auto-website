import type { CSSProperties } from "react";
import { assetUrl } from "@/lib/asset-url";
import type { SliceSpec } from "@/lib/types";

/** Anh 1x1 trong suot — giu cho the <img> khong hien bieu tuong anh hong. */
const BLANK =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function toSrcSet(slice: SliceSpec): string {
  return slice.srcSet
    .map((variant) => `${assetUrl(variant.src)} ${variant.scale}x`)
    .join(", ");
}

interface SliceImageProps {
  readonly slice: SliceSpec;
  readonly index: number;
  readonly alt: string;
}

/**
 * Mot lat anh nen cua canvas.
 *
 * Lat DAU TIEN tai ngay (nam trong khung nhin dau). Cac lat sau de trong `src`
 * va chi duoc gan khi nguoi dung cuon gan toi — MotionLayer lo viec do. Lam vay
 * vi `loading="lazy"` cua trinh duyet co nguong rat rong: Chromium van tai truoc
 * 6-7 lat ngay khi vao trang, dung y "luot toi dau tai toi do".
 *
 * `srcSet` cho man thuong tai ban @2x, man retina tai ban @3x — dung do phan giai
 * goc cua thiet ke.
 */
export function SliceImage({ slice, index, alt }: SliceImageProps) {
  const eager = index === 0;
  const srcSet = toSrcSet(slice);
  const src = assetUrl(slice.src);

  return (
    <div
      data-reveal-group=""
      style={{ "--slice-h": `${slice.displayHeight}px` } as CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- WebP cat san tu frame
          Figma, hien thi dung 1440px. Qua next/image se re-encode va lam sai lech
          pixel so voi thiet ke (xem tools/fidelity/compare.mjs). */}
      <img
        className="sl"
        src={eager ? src : BLANK}
        srcSet={eager ? srcSet : undefined}
        data-src={eager ? undefined : src}
        data-srcset={eager ? undefined : srcSet}
        alt={alt}
        width={1440}
        height={slice.displayHeight}
        decoding="async"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "low"}
      />

      {/* Khong co JavaScript thi van thay du anh. */}
      {!eager && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element -- ly do nhu tren */}
          <img className="sl is-in is-settled" src={src} srcSet={srcSet} alt={alt} width={1440} height={slice.displayHeight} />
        </noscript>
      )}
    </div>
  );
}
