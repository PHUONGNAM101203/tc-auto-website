import { describe, expect, it } from "vitest";
import {
  categoryOf,
  getProduct,
  getProductCategories,
  getProducts,
  getProductSlugs,
  otherProducts,
} from "@/lib/products";
import { getSubPageSlugs } from "@/lib/subpages";

/**
 * San pham man hinh o to — xem src/lib/products.ts.
 *
 * Bo thiet ke khong ve trang chi tiet cho san pham nao, nen noi dung o day
 * phai TACH TU frame danh muc chu khong duoc bia. Cac bai kiem duoi day giu
 * dung rang buoc do.
 */
describe("sản phẩm màn hình ô tô", () => {
  const all = getProducts();

  it("gom đủ sản phẩm của cả ba trang danh mục", () => {
    // 9 man hinh + 5 phim dan kinh + 3 PPF. "3M Ceramic Elite IM" khong nam o
    // day vi thiet ke da ve san trang rieng cho no.
    expect(all).toHaveLength(17);
    const perCategory = new Map<string, number>();
    for (const product of all) {
      perCategory.set(product.category, (perCategory.get(product.category) ?? 0) + 1);
    }
    expect(perCategory.get("giai-phap/man-hinh")).toBe(9);
    expect(perCategory.get("giai-phap/phim-dan-kinh")).toBe(5);
    expect(perCategory.get("giai-phap/ppf")).toBe(3);
  });

  it("không trùng với trang chi tiết mà thiết kế đã vẽ sẵn", () => {
    // "3M Ceramic Elite IM" co frame rieng trong bo thiet ke — dung dung them
    // mot ban do ta soan de len.
    for (const product of all) {
      expect(product.slug).not.toBe("3m-ceramic-elite-im");
    }
  });

  it("mỗi sản phẩm tra được về đúng danh mục của nó", () => {
    for (const product of all) {
      expect(categoryOf(product).slug).toBe(product.category);
    }
    expect(getProductCategories().length).toBe(3);
  });

  it("mã trang không trùng nhau và không đụng trang con nào sẵn có", () => {
    const slugs = getProductSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    const taken = new Set(getSubPageSlugs());
    for (const slug of slugs) {
      expect(taken.has(slug), `${slug} đã là một trang con`).toBe(false);
    }
  });

  it("mỗi sản phẩm đều nằm dưới trang danh mục của nó", () => {
    for (const product of all) {
      expect(product.route).toBe(`/${product.category}/${product.slug}`);
    }
  });

  it("tên và mô tả đều đọc được, không để trống", () => {
    for (const product of all) {
      expect(product.name.length, product.slug).toBeGreaterThan(3);
      expect(product.description.length, product.slug).toBeGreaterThan(40);
    }
  });

  it("mô tả KHÔNG dính chữ trên nút", () => {
    // Chu "XEM THÊM" nam ngay duoi mo ta trong cung dai chu cua the.
    for (const product of all) {
      expect(product.description.toUpperCase(), product.slug).not.toContain(
        "XEM THÊM",
      );
    }
  });

  it("ảnh cắt ở @3x của khung thẻ trong thiết kế", () => {
    // The rong 354 tren canvas 1440 -> 1062px o @3x. Be cao khac nhau tung
    // trang (anh the trang man hinh thap hon trang phim), nen chi chan hai dau.
    for (const product of all) {
      expect(product.imageWidth, product.slug).toBe(1062);
      expect(product.imageHeight, product.slug).toBeGreaterThan(560);
      expect(product.imageHeight, product.slug).toBeLessThan(760);
      expect(product.image).toMatch(/^\/products\/.+\.webp(\?v=[a-z0-9]+)?$/);
    }
  });

  it("tra được sản phẩm theo đường dẫn", () => {
    for (const product of all) {
      expect(getProduct(product.route.slice(1))?.slug).toBe(product.slug);
    }
    expect(getProduct("giai-phap/man-hinh/khong-co-that")).toBeNull();
  });

  it("dải “sản phẩm khác” chỉ lấy CÙNG danh mục, không tự trỏ về mình", () => {
    for (const product of all) {
      const rest = otherProducts(product.slug);
      expect(rest.length, product.slug).toBeGreaterThan(0);
      expect(rest.some((other) => other.slug === product.slug)).toBe(false);
      expect(new Set(rest.map((other) => other.slug)).size).toBe(rest.length);
      for (const other of rest) {
        expect(other.category, `${product.slug} kéo sang danh mục khác`).toBe(
          product.category,
        );
      }
    }
  });
});
