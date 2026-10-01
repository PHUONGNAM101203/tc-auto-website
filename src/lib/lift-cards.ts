import data from "@/data/lift-cards.json";
import { assetUrl } from "./asset-url";

/**
 * Cac THE ANH duoc tach khoi anh nen de ro chuot vao la the do noi len.
 *
 * Gom bon o muc "Công nghệ" tren trang chu va hai the muc "Câu chuyện đồng
 * hành" tren trang Dai ly. Anh cua tung the giu nguyen 100% tu ban thiet ke;
 * cho chung vua roi da duoc dung lai nen — xem
 * tools/brand/extract-lift-cards.py.
 */

export interface LiftCard {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly href: string;
  readonly src: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /**
   * Cum the ma the nay thuoc ve. Ro chuot vao mot the thi cac the CUNG CUM mo
   * di; cac cum khac tren cung trang khong lien quan.
   */
  readonly group: string;
  /**
   * Ro chuot thi PHONG TO tu tam thay vi nhac len.
   *
   * Dung cho cum the nam SAT NHAU va chay het mep canvas: nhac len se ho ra
   * nen phia sau, ma nen do khong dung lai duoc (co mot lop sang mo phu ca
   * dai). Phong to thi the luon phu kin dung cho cu.
   */
  readonly grow?: boolean;
  /**
   * Tieu de da nam SAN TRONG anh the.
   *
   * Ban mobile xep the thanh luoi va in tieu de duoi anh; the nao da co chu
   * trong anh thi phai bo qua, neu khong nguoi doc thay hai lan.
   */
  readonly captionInImage?: boolean;
  /**
   * Cac ban do phan giai khac nhau cua CHINH tam anh nay.
   *
   * Ban dau tien luon la ban @2x — do la ban ma gate pixel nhin thay o ti le
   * 1. Dung @3x lam ban duy nhat thi gate bao lech 1667 diem: nen @2x thu nho
   * 2->1 con the @3x thu nho 3->1, sai so lay mau khac nhau nen the hoi khac
   * nen du noi dung y het.
   */
  readonly srcSet?: readonly { readonly src: string; readonly width: number }[];
}

/**
 * Mo ta do phan giai bang `w`, khong phai `x` — cung ly do nhu lat anh nen:
 * canvas 1440px duoc PHONG TO cho vua be ngang cua so, ma mo ta `x` thi trinh
 * duyet chi nhin mat do diem anh cua man hinh chu khong biet gi ve phep phong
 * do. Xem src/lib/slice-srcset.ts.
 */
export function liftSrcSet(card: LiftCard): string | undefined {
  if (!card.srcSet || card.srcSet.length < 2) {
    return undefined;
  }
  return card.srcSet.map((v) => `${assetUrl(v.src)} ${v.width}w`).join(", ");
}

/**
 * Be rong bo tri cua the, viet theo `vw`.
 *
 * The rong `card.width` tren canvas 1440px, ma canvas luon phu het be ngang
 * cua so — nen be rong that cua no la `card.width / 1440` cua mot man hinh.
 * Viet duoc bang don vi tinh nen `sizes` doc duoc (sizes khong doc duoc bien
 * CSS: no duoc phan tich truoc khi style duoc tinh).
 */
export function liftSizes(card: LiftCard): string {
  return `${((card.width / 1440) * 100).toFixed(3)}vw`;
}

const PAGES = (data as unknown as { pages: Record<string, readonly LiftCard[]> }).pages;

export function getLiftCards(slug: string): readonly LiftCard[] {
  return PAGES[slug] ?? [];
}

/** Cac the cua trang, gom theo cum de moi cum co vung ro chuot rieng. */
export function getLiftGroups(
  slug: string,
): readonly (readonly LiftCard[])[] {
  const byGroup = new Map<string, LiftCard[]>();
  for (const card of getLiftCards(slug)) {
    byGroup.set(card.group, [...(byGroup.get(card.group) ?? []), card]);
  }
  return [...byGroup.values()];
}
