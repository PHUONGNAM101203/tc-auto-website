import { describe, expect, it } from "vitest";
import { getProductSpecs, countProductSpecs } from "@/lib/product-specs";
import { getProducts } from "@/lib/products";

/**
 * Thong so ky thuat cua man hinh Winca, chep tu trang chinh hang theo yeu cau
 * cua khach (30/09/2026).
 *
 * Diem can canh o day la TINH TRUNG THUC cua so lieu: khoa phai tro dung san
 * pham co that, moi muc phai kem duong dan nguon, va khong duoc de dong trong.
 */
describe("thông số kỹ thuật sản phẩm", () => {
  const products = getProducts();
  const screens = products.filter((p) => p.category === "giai-phap/man-hinh");

  it("mọi màn hình Winca đều đã có thông số", () => {
    const missing = screens
      .filter((p) => !getProductSpecs(p.slug))
      .map((p) => p.slug);
    expect(missing).toEqual([]);
    expect(countProductSpecs()).toBe(screens.length);
  });

  it("khoá nào cũng trỏ đúng một sản phẩm có thật", () => {
    // Go nham slug thi bang tro vao hu khong ma khong ai biet.
    for (const product of products) {
      const specs = getProductSpecs(product.slug);
      if (specs) {
        expect(product.category).toBe("giai-phap/man-hinh");
      }
    }
  });

  it("mỗi sản phẩm đều ghi đường dẫn nguồn của hãng", () => {
    for (const product of screens) {
      const specs = getProductSpecs(product.slug)!;
      expect(specs.source, product.slug).toMatch(
        /^https:\/\/wincavn\.com\/[\w-]+$/,
      );
    }
  });

  it("không dòng nào để trống nhãn hay giá trị", () => {
    for (const product of screens) {
      const specs = getProductSpecs(product.slug)!;
      expect(specs.specs.length, product.slug).toBeGreaterThanOrEqual(8);
      for (const row of specs.specs) {
        expect(row.label.trim().length, product.slug).toBeGreaterThan(0);
        expect(row.value.trim().length, product.slug).toBeGreaterThan(0);
      }
      // Cung mot nhan khong duoc xuat hien hai lan trong mot bang.
      const labels = specs.specs.map((r) => r.label);
      expect(new Set(labels).size, product.slug).toBe(labels.length);
    }
  });

  it("bản PRO nào cũng phải có dòng camera 360", () => {
    // Do la thu phan biet ban PRO voi ban thuong; thieu la chep sot.
    for (const product of screens.filter((p) => /pro|360/.test(p.slug))) {
      const specs = getProductSpecs(product.slug)!;
      expect(
        specs.specs.some((r) => r.label.includes("360")),
        product.slug,
      ).toBe(true);
    }
  });
});
