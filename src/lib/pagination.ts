import boxes from "@/data/detected-pagination.json";
import listings from "@/data/listings.json";

/**
 * Phan trang cua cac trang danh sach.
 *
 * So trang duoc TINH TU DU LIEU, khong ghi cung. Thiet ke ve san "1 2 3 …"
 * nhung do chi la hinh minh hoa — thuc te moi danh sach hien chi co du noi dung
 * cho MOT trang. Khi khach bo sung bai, chi can tang `itemsAvailable` trong
 * src/data/listings.json la so trang tu tang.
 *
 * Bo phan trang ve san trong anh da duoc xoa di (tools/scrub-slices.py) de o day
 * ve lai bang phan tu that — neu khong thi so trang trong anh se mau thuan voi
 * so trang thuc.
 */

export interface PaginationBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Listing {
  readonly itemsAvailable: number;
  readonly perPage: number;
}

const BOXES = boxes as Readonly<Record<string, PaginationBox>>;
const LISTINGS = (listings as { listings: Readonly<Record<string, Listing>> }).listings;

/** So trang toi da hien thi so; nhieu hon thi rut gon bang "…" */
export const MAX_VISIBLE = 3;

export interface PaginationModel {
  readonly box: PaginationBox;
  readonly pageCount: number;
  /** Cac so trang duoc hien; null la dau "…" */
  readonly pages: readonly (number | null)[];
  readonly itemsAvailable: number;
  readonly perPage: number;
}

export function getPagination(slug: string): PaginationModel | null {
  const box = BOXES[slug];
  const listing = LISTINGS[slug];
  if (!box || !listing) {
    return null;
  }

  const perPage = Math.max(1, listing.perPage);
  const pageCount = Math.max(1, Math.ceil(listing.itemsAvailable / perPage));

  return {
    box,
    pageCount,
    pages: buildPageList(pageCount),
    itemsAvailable: listing.itemsAvailable,
    perPage,
  };
}

/** 1..3 thi hien het; nhieu hon thi hien 3 so dau roi "…" */
export function buildPageList(pageCount: number): readonly (number | null)[] {
  if (pageCount <= MAX_VISIBLE) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  return [...Array.from({ length: MAX_VISIBLE }, (_, i) => i + 1), null];
}

export function hasPagination(slug: string): boolean {
  return slug in BOXES && slug in LISTINGS;
}
