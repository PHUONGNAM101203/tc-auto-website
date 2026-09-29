import { assetUrl } from "./asset-url";
import type { SliceVariant } from "./types";

/** Be ngang he toa do canvas cua ban thiet ke. */
export const CANVAS_WIDTH = 1440;

/**
 * Khai do phan giai cho lat anh nen bang MO TA `w`, khong phai `x`.
 *
 * Canvas rong 1440px nhung duoc PHONG TO cho vua be ngang cua so
 * (`--tc-zoom = beRongCuaSo / 1440`). Voi mo ta `x`, trinh duyet chon anh CHI
 * theo mat do diem anh cua man hinh — no khong he biet canvas dang phong to.
 *
 * Tren man retina rong 2000px: canvas phong 1,39 lan nen can
 * 1440 x 1,39 x 2 = 4000 diem anh, nhung trinh duyet van lay ban "2x" (2880px)
 * roi keo gian ra. Moi thu VE CHET trong anh nen — chan trang, o tim kiem cua
 * trang Cong nghe, chu tren the — deu mo di. Man 1440px thi khong sao, nen loi
 * nay de lot khi kiem tren may co man vua.
 *
 * Doi sang `w` + `sizes="100vw"` thi trinh duyet tinh tu BE RONG THUC TE da bo
 * tri (da gom ca zoom) nhan voi mat do diem anh, roi chon ban nho nhat du dung.
 */
export function sliceSrcSet(variants: readonly SliceVariant[]): string {
  return variants
    .map((variant) => `${assetUrl(variant.src)} ${CANVAS_WIDTH * variant.scale}w`)
    .join(", ");
}

/**
 * Lat nen luon rong dung bang canvas, ma canvas luon phu het be ngang cua so —
 * nen be rong bo tri cua no chinh la `100vw`.
 */
export function sliceSizes(): string {
  return "100vw";
}
