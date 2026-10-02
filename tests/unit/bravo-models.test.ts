import { describe, expect, it } from "vitest";
import bravo from "@/data/bravo-models.json";
import { getAuthoredPages } from "@/lib/authored-pages";
import { getProduct, productsOfBrand } from "@/lib/products";
import { getProductSpecs } from "@/lib/product-specs";
import { getBravoCards, getBravoCopy } from "@/lib/screen-tabs";

/**
 * Ba dong man hinh Bravo.
 *
 * Truoc day day la mot TRANG RIENG `/giai-phap/man-hinh/bravo`. Khach yeu cau
 * bo trang do (02/10/2026): Bravo chi la mot TAB cua trang "Màn hình ô tô",
 * con tung dong thi co trang san pham cua rieng no — dung nhu chin dong Winca.
 * So lieu nay chuyen sang `src/data/bravo-models.json`.
 *
 * ── Vi sao rang buoc chat ───────────────────────────────────────────────────
 * Day la so lieu ban hang cua mot doanh nghiep that. Ten dong va thong so lay
 * tu trang chinh hang Winca Viet Nam; cho nao hang chua cong bo thi phai NOI
 * THANG chu khong duoc doan.
 */
describe("ba dòng Bravo", () => {
  const models = bravo.models;

  it("có đủ ba dòng, mỗi dòng có tên và mô tả thật", () => {
    expect(models.length).toBeGreaterThanOrEqual(3);
    for (const model of models) {
      expect(model.name.length).toBeGreaterThan(3);
      expect(model.tagline.length).toBeGreaterThan(5);
      expect(model.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("dòng nào chưa có thông số thì phải nói rõ, không để trống lửng", () => {
    for (const model of models) {
      if (model.specs.length === 0) {
        expect(
          model.note,
          `${model.name} không có thông số mà cũng không có ghi chú`,
        ).toBeTruthy();
      }
    }
  });

  it("mỗi thông số đều có đủ nhãn và giá trị", () => {
    for (const model of models) {
      for (const spec of model.specs) {
        expect(spec.label.length, model.name).toBeGreaterThan(2);
        expect(spec.value.length, `${model.name} — ${spec.label}`).toBeGreaterThan(1);
      }
    }
  });

  it("nói rõ số liệu lấy từ đâu", () => {
    // Nguoi doc va TC Auto deu phai kiem duoc nguon.
    expect(bravo.source).toMatch(/wincavn\.com/);
    expect(bravo.source).toMatch(/xác nhận/i);
  });

  it("những gì còn thiếu được liệt kê thẳng ra", () => {
    const pending = bravo.pending.items.join(" ").toLowerCase();
    expect(pending).toContain("giá bán");
    expect(pending).toContain("bảo hành");
  });

  it("mỗi dòng đều thành MỘT TRANG SẢN PHẨM thật, có thông số", () => {
    // Day la cho "hop ly" ma the Bravo dan toi, thay cho trang Bravo gop cu.
    for (const model of models) {
      // `getProduct` nhan duong dan day du, khong phai slug ngan.
      const product = getProduct(`giai-phap/man-hinh/${model.slug}`);
      expect(product, `${model.name} phải có trang sản phẩm`).not.toBeNull();
      expect(product!.brand).toBe("Bravo");
      expect(product!.category).toBe("giai-phap/man-hinh");
      expect(getProductSpecs(model.slug)?.specs.length ?? 0).toBe(model.specs.length);
    }
  });

  it("thẻ trên tab dẫn tới đúng trang sản phẩm của nó", () => {
    const cards = getBravoCards();
    expect(cards).toHaveLength(models.length);
    for (const card of cards) {
      expect(card.href).toBe(`/giai-phap/man-hinh/${card.id}`);
    }
  });

  it("lưới Winca KHÔNG được lẫn dòng Bravo", () => {
    const winca = productsOfBrand("giai-phap/man-hinh");
    expect(winca.length).toBeGreaterThan(0);
    for (const product of winca) {
      expect(product.brand).toBeUndefined();
    }
  });

  it("trang Bravo gộp cũ đã bị xoá hẳn", () => {
    const slugs = getAuthoredPages().map((page) => page.slug);
    expect(slugs).not.toContain("giai-phap/man-hinh/bravo");
  });

  it("phần chữ của trang cũ không bị vứt đi — nó lấp chỗ trống của tab", () => {
    // Luoi thiet ke co chin o ma Bravo chi co ba dong; khong co phan chu nay
    // thi con mot khoang trong cao hon 1500px.
    const copy = getBravoCopy();
    expect(copy.lead.length).toBeGreaterThan(40);
    expect(copy.blocks.length).toBeGreaterThanOrEqual(3);
    for (const block of copy.blocks) {
      expect(block.heading.length).toBeGreaterThan(3);
      expect(block.paragraphs.length).toBeGreaterThan(0);
    }
  });
});
