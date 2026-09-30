import data from "@/data/products.json";

/**
 * Trang chi tiet cho tung san pham MAN HINH O TO.
 *
 * ── Vi sao trang nay do chung ta dung ───────────────────────────────────────
 * Moi the tren /giai-phap/man-hinh co nut "XEM THÊM", nhung bo thiet ke khong
 * ve trang chi tiet cho san pham nao — ca bo chi co dung mot trang chi tiet mau
 * la "3M Ceramic Elite IM" ben muc Phim dan kinh. Khach da duyet (29/09/2026):
 * dung trang cho tung san pham theo dung mach cua trang mau do; neu sau nay co
 * thiet ke rieng thi lam lai theo thiet ke.
 *
 * ── Noi dung o dau ra ──────────────────────────────────────────────────────
 * Ten, mo ta va anh deu TACH TU CHINH FRAME THIET KE
 * (tools/brand/extract-products.py). Khong them mot chu nao.
 *
 * Thong so ky thuat (CPU, RAM, bo nho, bao hanh, gia) KHONG co trong thiet ke.
 * Trang noi thang la dang cho TC Auto cung cap, dung nhu cach hai trang tu soan
 * san co dang lam — xem src/lib/authored-pages.ts.
 */

export interface Product {
  readonly slug: string;
  readonly route: string;
  /** Trang danh muc chua san pham nay, vi du "giai-phap/man-hinh". */
  readonly category: string;
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
  /** Thu tu xuat hien tren trang danh muc — giu dung mach cua thiet ke. */
  readonly order: number;
}

export interface ProductCategory {
  readonly slug: string;
  readonly label: string;
  readonly title: string;
  readonly parent: string;
  readonly parentLabel: string;
}

const RAW = data as unknown as {
  readonly categories: readonly ProductCategory[];
  readonly products: readonly Product[];
};

/** Xep theo dung thu tu tren trang danh muc, khong theo bang chu cai. */
const PRODUCTS = [...RAW.products].sort((a, b) => a.order - b.order);

const BY_CATEGORY = new Map(RAW.categories.map((row) => [row.slug, row]));

export function getProducts(): readonly Product[] {
  return PRODUCTS;
}

export function getProductCategories(): readonly ProductCategory[] {
  return RAW.categories;
}

export function categoryOf(product: Product): ProductCategory {
  const category = BY_CATEGORY.get(product.category);
  if (!category) {
    throw new Error(`San pham ${product.slug} tro toi danh muc la: ${product.category}`);
  }
  return category;
}

export function getProductSlugs(): readonly string[] {
  return PRODUCTS.map((product) => product.route.slice(1));
}

export function getProduct(slug: string): Product | null {
  return PRODUCTS.find((product) => product.route === `/${slug}`) ?? null;
}

/**
 * Cac san pham khac CUNG MOT DANH MUC, de cuoi trang co dai "SẢN PHẨM KHÁC".
 *
 * Chi lay trong cung danh muc: dang xem mot man hinh o to ma duoi trang hien ra
 * phim dan kinh thi lac de. Giu nguyen vong: bat dau tu san pham ke tiep roi
 * chay vong lai.
 */
export function otherProducts(slug: string, limit = 4): readonly Product[] {
  const at = PRODUCTS.findIndex((product) => product.slug === slug);
  if (at < 0) {
    return [];
  }
  const family = PRODUCTS.filter(
    (product) => product.category === PRODUCTS[at].category,
  );
  const here = family.findIndex((product) => product.slug === slug);
  const rest = [...family.slice(here + 1), ...family.slice(0, here)];
  return rest.slice(0, limit);
}
