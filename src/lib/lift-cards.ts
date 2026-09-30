import data from "@/data/lift-cards.json";

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
