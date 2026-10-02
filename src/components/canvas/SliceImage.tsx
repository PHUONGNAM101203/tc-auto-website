import type { CSSProperties } from "react";
import { assetUrl } from "@/lib/asset-url";
import { sliceSizes, sliceSrcSet } from "@/lib/slice-srcset";
import type { SliceSpec } from "@/lib/types";

/** Anh 1x1 trong suot — giu cho the <img> khong hien bieu tuong anh hong. */
const BLANK =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

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
 * `srcSet` khai bang MO TA `w` chu khong phai `x`. Canvas 1440px duoc phong to
 * theo be rong cua so, ma mo ta `x` thi trinh duyet chi nhin mat do diem anh
 * cua man hinh, khong biet gi ve phan phong to do — man retina rong hon 1440px
 * se lay ban thieu do phan giai roi keo gian, lam moi thu ve chet trong anh
 * nen bi mo. Xem src/lib/slice-srcset.ts.
 */
export function SliceImage({ slice, index, alt }: SliceImageProps) {
  const eager = index === 0;
  const srcSet = sliceSrcSet(slice.srcSet);
  const sizes = sliceSizes();
  const src = assetUrl(slice.src);

  return (
    <div
      data-reveal-group=""
      style={{ "--slice-h": `${slice.displayHeight}px` } as CSSProperties}
    >
      {/* `<picture>` voi `media` CHU KHONG phai mot the <img> tran.
          Duoi 900px ca canvas bi `display: none` (xem mobile.css), nhung the
          <img> co `loading="eager"` thi VAN TAI — `display:none` khong chan
          duoc anh eager, chi chan anh lazy. Do duoc: tren dien thoai, trang
          chu tai 2,98MB con may ban la 2,61MB, nang hon dung vi nhung lat nen
          khong bao gio duoc nhin thay.

          Voi `<picture>`, duoi 900px khong co `<source>` nao khop nen trinh
          duyet dung `src` cua <img> — la anh rong 1x1. Khong mot byte nao bi
          tai. Tren may ban thi `<source>` khop va anh tai ngay nhu cu, nen
          phan tu LCP khong cham di.

          eslint-disable-next-line @next/next/no-img-element -- WebP cat san tu
          frame Figma, hien thi dung 1440px. Qua next/image se re-encode va lam
          sai lech pixel so voi thiet ke (xem tools/fidelity/compare.mjs). */}
      <picture>
        {eager ? (
          <source media="(min-width: 900px)" srcSet={srcSet} sizes={sizes} type="image/webp" />
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- ly do nhu tren */}
        <img
          className="sl"
          src={BLANK}
          sizes={eager ? undefined : sizes}
          data-src={eager ? undefined : src}
          data-srcset={eager ? undefined : srcSet}
          alt={alt}
          width={1440}
          height={slice.displayHeight}
          decoding="async"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "low"}
        />
      </picture>

      {/* Khong co JavaScript thi van thay du anh. */}
      {!eager && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element -- ly do nhu tren */}
          <img className="sl is-in is-settled" src={src} srcSet={srcSet} sizes={sizes} alt={alt} width={1440} height={slice.displayHeight} />
        </noscript>
      )}
    </div>
  );
}
