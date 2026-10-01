import data from "@/data/product-specs.json";

/**
 * Thong so ky thuat cua man hinh Winca.
 *
 * Bo thiet ke KHONG co thong so nao — cac trang san pham truoc day chi co ten,
 * mot doan mo ta va mot anh. Khach gui trang chinh hang va yeu cau lay cho
 * chuan (30/09/2026), nen bang nay chep tu wincavn.com, moi san pham kem
 * duong dan nguon de kiem lai duoc.
 *
 * Nguyen tac: cho nao trang hang khong noi thi KHONG co dong do. Khong suy
 * dien tu may cung dong, khong "lam tron cho hop ly".
 */

export interface Spec {
  readonly label: string;
  readonly value: string;
}

export interface ProductSpecs {
  /** Trang cua hang, de nguoi doc va TC Auto cung kiem duoc. */
  readonly source: string;
  readonly specs: readonly Spec[];
}

const RAW = (data as unknown as {
  products: Readonly<Record<string, ProductSpecs>>;
}).products;

export function getProductSpecs(slug: string): ProductSpecs | null {
  return RAW[slug] ?? null;
}

/** So san pham da co thong so — dung cho test. */
export function countProductSpecs(): number {
  return Object.keys(RAW).length;
}
