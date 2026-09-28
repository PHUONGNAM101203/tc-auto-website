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
}

const PAGES = (data as unknown as { pages: Record<string, readonly LiftCard[]> }).pages;

export function getLiftCards(slug: string): readonly LiftCard[] {
  return PAGES[slug] ?? [];
}
