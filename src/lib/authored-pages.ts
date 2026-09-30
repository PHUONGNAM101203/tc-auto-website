import data from "@/data/authored-pages.json";
import type { PageSlug } from "./types";

/**
 * Trang do CHUNG TA soan — khong co frame trong bo thiet ke.
 *
 * Hai muc "Bảo hành" va "Không gian trải nghiệm" tren trang Cong nghe co nut
 * "KHÁM PHÁ NGAY" nhung thiet ke khong ve trang con nao cho chung. Thay vi de
 * nut chet, trang duoc dung o day bang dung bo nhan dien (navy, Cormorant
 * Infant / Unbounded / Montserrat).
 *
 * Khac voi 31 trang con kia: trang nay KHONG dung canvas 1440px ma co dan theo
 * be rong man hinh — nen doc tot tren dien thoai.
 */

export interface AuthoredBlock {
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

/** Mot dong san pham va cac thong so cong bo duoc. */
export interface AuthoredProduct {
  readonly name: string;
  readonly tagline: string;
  readonly specs: readonly { readonly label: string; readonly value: string }[];
  /** Noi thang khi hang chua cong bo thong so — dung doan. */
  readonly note?: string;
}

export interface AuthoredProducts {
  readonly heading: string;
  readonly intro: string;
  readonly items: readonly AuthoredProduct[];
  /** Noi ro so lieu lay tu dau, de nguoi doc va TC Auto cung kiem duoc. */
  readonly source: string;
}

export interface AuthoredPage {
  readonly slug: string;
  readonly section: PageSlug;
  readonly parent: string;
  /** Ten hien tren duong dan phan cap — moi trang co cha khac nhau. */
  readonly parentLabel: string;
  readonly label: string;
  readonly title: string;
  readonly heading: string;
  readonly lead: string;
  readonly blocks: readonly AuthoredBlock[];
  /** Chi mot so trang co: danh sach dong san pham kem thong so. */
  readonly products?: AuthoredProducts;
  /** Nhung gi con cho TC Auto cung cap — noi thang thay vi bia ra. */
  readonly pending: { readonly heading: string; readonly items: readonly string[] };
  readonly cta: { readonly label: string; readonly href: string };
}

const PAGES = (data as unknown as { pages: readonly AuthoredPage[] }).pages;

export function getAuthoredPage(slug: string): AuthoredPage | null {
  return PAGES.find((page) => page.slug === slug) ?? null;
}

export function getAuthoredPages(): readonly AuthoredPage[] {
  return PAGES;
}

export function getAuthoredSlugs(): readonly string[] {
  return PAGES.map((page) => page.slug);
}
