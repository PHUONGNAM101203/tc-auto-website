import { describe, expect, it } from "vitest";
import { getAuthoredPage, getAuthoredPages } from "@/lib/authored-pages";

/**
 * Danh sach dong san pham tren trang tu soan (hien chi trang Bravo dung).
 *
 * ── Vi sao rang buoc chat ───────────────────────────────────────────────────
 * Day la so lieu ban hang cua mot doanh nghiep that. Ten dong va thong so lay
 * tu trang chinh hang Winca Viet Nam; cho nao hang chua cong bo thi phai NOI
 * THANG chu khong duoc doan. Cac bai kiem duoi day giu dung nguyen tac do.
 */
describe("danh sách dòng sản phẩm trên trang tự soạn", () => {
  const bravo = getAuthoredPage("giai-phap/man-hinh/bravo");

  it("trang Bravo có danh sách dòng sản phẩm", () => {
    expect(bravo).not.toBeNull();
    expect(bravo!.products).toBeDefined();
    expect(bravo!.products!.items.length).toBeGreaterThanOrEqual(3);
  });

  it("dòng nào chưa có thông số thì phải nói rõ, không để trống lửng", () => {
    for (const product of bravo!.products!.items) {
      expect(product.name.length).toBeGreaterThan(3);
      expect(product.tagline.length).toBeGreaterThan(5);
      if (product.specs.length === 0) {
        expect(
          product.note,
          `${product.name} không có thông số mà cũng không có ghi chú`,
        ).toBeTruthy();
      }
    }
  });

  it("mỗi thông số đều có đủ nhãn và giá trị", () => {
    for (const product of bravo!.products!.items) {
      for (const spec of product.specs) {
        expect(spec.label.length, product.name).toBeGreaterThan(2);
        expect(spec.value.length, `${product.name} — ${spec.label}`).toBeGreaterThan(1);
      }
    }
  });

  it("nói rõ số liệu lấy từ đâu", () => {
    // Nguoi doc va TC Auto deu phai kiem duoc nguon.
    expect(bravo!.products!.source).toMatch(/wincavn\.com/);
    expect(bravo!.products!.source).toMatch(/xác nhận/i);
  });

  it("những gì còn thiếu được liệt kê thẳng ra", () => {
    const pending = bravo!.pending.items.join(" ").toLowerCase();
    expect(pending).toContain("giá bán");
    expect(pending).toContain("bảo hành");
  });

  it("các trang tự soạn khác không bắt buộc có danh sách này", () => {
    const others = getAuthoredPages().filter(
      (page) => page.slug !== "giai-phap/man-hinh/bravo",
    );
    expect(others.length).toBeGreaterThan(0);
    // Chi kiem rang khong trang nao co danh sach HONG (co ma rong).
    for (const page of others) {
      if (page.products) {
        expect(page.products.items.length).toBeGreaterThan(0);
      }
    }
  });
});
