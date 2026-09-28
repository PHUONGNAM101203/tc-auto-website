import raw from "@/data/subpage-text.json";

/**
 * Lop van ban cua trang con, trich bang Vision OCR tu chinh frame thiet ke.
 *
 * Trang con duoc dung tu anh, nen chu khong nam trong DOM. Lop nay lam ba viec:
 *   1. Trinh doc man hinh doc duoc noi dung (dat trong .tc-sr)
 *   2. Google index duoc trang
 *   3. O tim kiem noi bo tim ra trang con
 *
 * LUU Y: day la ket qua nhan dang, khong phai ban goc do nguoi nhap. Chu trong
 * logo cach dieu co the bi doc sai (vi du "3M" -> "ЗМ"). Vi vay noi dung nay
 * KHONG duoc ve de len thiet ke, va admin sua duoc de chinh lai cho chuan.
 */

export type TextKind = "h2" | "h3" | "p";

export interface TextBlock {
  readonly text: string;
  readonly kind: TextKind;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface PageText {
  readonly blocks: readonly TextBlock[];
  /** Toan bo van ban noi lien — dung cho index tim kiem. */
  readonly plain: string;
  readonly headings: readonly string[];
}

const TEXT = raw as Readonly<Record<string, PageText>>;

const EMPTY: PageText = { blocks: [], plain: "", headings: [] };

export function getPageText(slug: string): PageText {
  return TEXT[slug] ?? EMPTY;
}

export function hasPageText(slug: string): boolean {
  return (TEXT[slug]?.blocks.length ?? 0) > 0;
}

export function getAllPageText(): ReadonlyArray<readonly [string, PageText]> {
  return Object.entries(TEXT);
}
