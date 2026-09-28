import data from "@/data/app-cards.json";

/**
 * Ba the o muc "Ứng dụng" tren trang Cong nghe.
 *
 * Thiet ke ve chet ba the vao anh nen, the giua to hon hai the ben.
 *
 * KHUNG cua tung the nam trong anh nen, dung vi tri va kich thuoc thiet ke ve.
 * Chi RUOT (anh minh hoa + tieu de + phu de) duoc tach ra — nho vay ro chuot
 * vao the nao thi ruot the do nhac len duoc, con khung thi khong xe dich.
 *
 * Hinh hoc do tools/brand/extract-cards.py sinh ra tu chinh ban thiet ke.
 */

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface AppCard {
  readonly id: string;
  readonly title: string;
  readonly src: string;
  /** Khung the — nam trong anh nen, khong bao gio di chuyen. */
  readonly frame: Box;
  /** Ruot the — phan duoc tach ra va doi cho. */
  readonly content: Box;
  /** Trang cua muc do. Bam vao the la vao thang day. */
  readonly href: string;
}

const CARDS = (data as unknown as { cards: readonly AppCard[] }).cards;

export function getAppCards(slug: string): readonly AppCard[] {
  return slug === "cong-nghe" ? CARDS : [];
}
