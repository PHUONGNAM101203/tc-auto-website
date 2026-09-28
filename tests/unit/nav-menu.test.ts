import { describe, expect, it } from "vitest";
import { NAV_SUBMENU, submenuFor } from "@/lib/nav-menu";
import { getAllSubPages } from "@/lib/subpages";

/**
 * Menu xo xuong phai khop VOI TRANG CO THAT. Neu ai do doi ten mot trang con
 * ma quen sua o day thi menu se tro vao 404 — test nay bat duoc ngay.
 */
describe("menu xổ xuống", () => {
  const routes = new Set(getAllSubPages().map((page) => page.route));

  it("mọi liên kết trong menu đều trỏ tới trang có thật", () => {
    for (const [section, entries] of Object.entries(NAV_SUBMENU)) {
      for (const entry of entries) {
        expect(routes.has(entry.href), `${section} → ${entry.href}`).toBe(true);
      }
    }
  });

  it("không bỏ sót trang con cấp một nào", () => {
    // Trang cap mot = slug co dung mot dau gach. Trang sau nua la bai viet,
    // khong dua len menu.
    const level1 = getAllSubPages().filter(
      (page) => page.slug.split("/").length === 2,
    );
    const inMenu = new Set(
      Object.values(NAV_SUBMENU).flatMap((entries) =>
        entries.map((e) => e.href),
      ),
    );
    for (const page of level1) {
      expect(inMenu.has(page.route), `thiếu ${page.route}`).toBe(true);
    }
  });

  it("giữ đúng thứ tự nhà thiết kế đánh số, không phải thứ tự chữ cái", () => {
    expect(submenuFor("/trai-nghiem").map((e) => e.label)).toEqual([
      "HÀNH TRÌNH",
      "BẢN SẮC RIÊNG",
      "KHOẢNH KHẮC",
      "PHONG CÁCH SỐNG",
    ]);
    // Theo chu cai thi "Các dự án" phai dung dau — thiet ke thi no dung cuoi.
    expect(submenuFor("/giai-phap").map((e) => e.label)).toEqual([
      "MÀN HÌNH",
      "PHIM DÁN KÍNH",
      "PPF",
      "LOA NỘI THẤT",
      "CÁC DỰ ÁN",
    ]);
  });

  it("tra theo đường dẫn của trang con cũng ra menu của mục cha", () => {
    expect(submenuFor("/trai-nghiem/khoanh-khac")).toBe(
      submenuFor("/trai-nghiem"),
    );
  });

  it("đường dẫn lạ thì trả về danh sách rỗng, không ném lỗi", () => {
    expect(submenuFor("/khong-ton-tai")).toEqual([]);
    expect(submenuFor("/")).toEqual([]);
  });
});
