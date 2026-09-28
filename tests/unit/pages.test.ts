import { describe, expect, it } from "vitest";
import { getAllPageSpecs, getPageIndex, getPageSpec, isPageSlug, slugFromRoute } from "@/lib/pages";
import { PAGE_SLUGS } from "@/lib/types";

describe("page spec registry", () => {
  it("có đúng 6 trang", () => {
    expect(getAllPageSpecs()).toHaveLength(6);
    expect(PAGE_SLUGS).toHaveLength(6);
  });

  it("mọi page spec qua được zod schema khi import", () => {
    // parsePageSpec chay o thoi diem import — den duoc day nghia la da hop le.
    for (const slug of PAGE_SLUGS) {
      expect(getPageSpec(slug).slug).toBe(slug);
    }
  });

  it("canvas luôn rộng 1440px", () => {
    for (const page of getAllPageSpecs()) {
      expect(page.canvasWidth).toBe(1440);
    }
  });

  it("tổng chiều cao các lát nền khớp chiều cao trang (sai số dưới 1px)", () => {
    for (const page of getAllPageSpecs()) {
      const stacked = page.slices.reduce((sum, slice) => sum + slice.displayHeight, 0);
      expect(Math.abs(stacked - page.height)).toBeLessThan(1);
    }
  });

  it("các lát nền xếp liên tục, không chồng và không hở", () => {
    for (const page of getAllPageSpecs()) {
      let expected = 0;
      for (const slice of page.slices) {
        expect(slice.y).toBeCloseTo(expected, 5);
        expected += slice.displayHeight;
      }
    }
  });

  it("mọi lát nền là ảnh @2x (rộng 2880px)", () => {
    for (const page of getAllPageSpecs()) {
      for (const slice of page.slices) {
        expect(slice.intrinsicWidth).toBe(2880);
        // Chieu cao goc = 2x chieu cao hien thi
        expect(Math.abs(slice.intrinsicHeight - slice.displayHeight * 2)).toBeLessThanOrEqual(2);
      }
    }
  });

  it("id phần tử là duy nhất trong từng trang", () => {
    for (const page of getAllPageSpecs()) {
      const ids = page.items.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("mọi phần tử nằm trong khung canvas", () => {
    for (const page of getAllPageSpecs()) {
      for (const item of page.items) {
        expect(item.x).toBeGreaterThanOrEqual(0);
        expect(item.x).toBeLessThan(page.canvasWidth);
        expect(item.y).toBeGreaterThanOrEqual(0);
        expect(item.y).toBeLessThan(page.height);
      }
    }
  });

  it("mọi liên kết nội bộ trỏ tới route tồn tại", () => {
    const routes = new Set(getAllPageSpecs().map((page) => page.route));
    for (const page of getAllPageSpecs()) {
      for (const item of page.items) {
        if (item.href?.startsWith("/")) {
          expect(routes.has(item.href)).toBe(true);
        }
      }
    }
  });

  it("nav của mọi trang trỏ tới route tồn tại", () => {
    const routes = new Set(getAllPageSpecs().map((page) => page.route));
    for (const page of getAllPageSpecs()) {
      expect(page.nav).toHaveLength(5);
      for (const entry of page.nav) {
        expect(routes.has(entry.href)).toBe(true);
      }
    }
  });

  it("trang chủ KHÔNG có mục nav nào sáng", () => {
    // Frame Home.png goc danh dau "TRẢI NGHIỆM" — day la loi cua ban thiet ke
    // (header bi copy tu frame khac). Da co y bo, ghi trong design-deviations.ts.
    expect(getPageSpec("home").nav.filter((entry) => entry.active)).toHaveLength(0);
  });

  it("5 trang còn lại mỗi trang có đúng một mục nav sáng, khớp chính trang đó", () => {
    for (const page of getAllPageSpecs()) {
      if (page.slug === "home") continue;
      const active = page.nav.filter((entry) => entry.active);
      expect(active, page.slug).toHaveLength(1);
      expect(active[0].href).toBe(page.route);
    }
  });

  it("mọi trang đều có form liên hệ", () => {
    for (const page of getAllPageSpecs()) {
      expect(page.contactForm).not.toBeNull();
      expect(page.contactForm!.y).toBeLessThan(page.height);
    }
  });

  it("isPageSlug nhận diện đúng", () => {
    expect(isPageSlug("home")).toBe(true);
    expect(isPageSlug("giai-phap")).toBe(true);
    expect(isPageSlug("khong-ton-tai")).toBe(false);
    expect(isPageSlug("")).toBe(false);
  });

  it("slugFromRoute map hai chiều đúng", () => {
    expect(slugFromRoute("/")).toBe("home");
    expect(slugFromRoute("/giai-phap")).toBe("giai-phap");
    expect(slugFromRoute("/giai-phap/")).toBe("giai-phap");
    expect(slugFromRoute("/khong-ton-tai")).toBeNull();
  });

  it("getPageIndex trả về đủ số liệu tổng hợp", () => {
    const index = getPageIndex();
    expect(index).toHaveLength(6);
    for (const entry of index) {
      expect(entry.items).toBeGreaterThan(0);
      expect(entry.slices).toBeGreaterThan(0);
    }
    // Tong 120 phan tu, 30 lat nen
    expect(index.reduce((sum, entry) => sum + entry.items, 0)).toBe(120);
    expect(index.reduce((sum, entry) => sum + entry.slices, 0)).toBe(30);
  });
});
