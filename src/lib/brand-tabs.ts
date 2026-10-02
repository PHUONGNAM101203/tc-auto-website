import { getProducts, type Product } from "./products";

/**
 * Ba tab 5DO / 3M / NANO SUN tren trang "Bộ sưu tập thương hiệu".
 *
 * Thiet ke ve san mot thanh ba o, o 3M dang sang — y la mot bo loc. Nhung ba
 * o do khong bam duoc: duoi chung la NAM bai viet ve chet trong anh, va ca
 * nam deu cung mot noi dung, tieu de con de nguyen chu "TÊN BÀI VIẾT". Khach
 * hoi thang: "hình như 3 cái tab này bạn chưa phát triển đúng không"
 * (02/10/2026).
 *
 * ── Lay noi dung o dau ────────────────────────────────────────────────────
 * Bo thiet ke khong co anh bo suu tap rieng cho tung hang. Nhung site DA CO
 * san pham that cua hai trong ba hang, kem anh va trang chi tiet — nen tab
 * hien dung nhung thu do. KHONG tu bia ra bai viet nao.
 *
 * 5DO thi chua co gi: ca bo thiet ke lan du lieu deu khong co mot san pham
 * 5DO nao, du ten hang xuat hien trong "PHIM CÁCH NHIỆT · 3M | 5DO". Tab do
 * noi thang la dang cap nhat chu khong hien bua.
 */
export interface BrandTab {
  readonly id: string;
  readonly label: string;
  readonly items: readonly Product[];
}

/** Ba hang, dung thu tu thiet ke ve tren thanh. */
const ORDER = [
  { id: "5do", label: "5DO", match: /^5do\b/i },
  { id: "3m", label: "3M", match: /^3m\b/i },
  { id: "nano-sun", label: "NANO SUN", match: /^nano\s/i },
] as const;

/** Thanh tab ve san: y 883..968, ba o bang nhau. */
export const BRAND_TAB_BAR = { y: 883, height: 85, columns: 3 } as const;

/**
 * Vung bi che khi doi tab — nam bai viet ve chet.
 *
 * Bien do bang cach tim nhung hang hoan toan la mau nen: dai yen tinh
 * 970..1073 o tren va 3384..3481 o duoi. Lay diem giua cua moi dai.
 */
export const BRAND_CONTENT = { y: 1020, height: 3430 - 1020 } as const;

/** Mau nen cua trang, do thang tu lat nen. */
export const BRAND_BACKGROUND = "#03111c";

export function getBrandTabs(): readonly BrandTab[] {
  const products = getProducts();
  return ORDER.map((brand) => ({
    id: brand.id,
    label: brand.label,
    items: products.filter((product) => brand.match.test(product.name)),
  }));
}

/** Tab mo san: o thiet ke dang sang la 3M. */
export const BRAND_DEFAULT = "3m";
