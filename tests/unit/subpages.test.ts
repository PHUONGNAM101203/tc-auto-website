import { describe, expect, it } from "vitest";
import { countDetected, getHotspots } from "@/lib/hotspots";
import { getAuthoredSlugs } from "@/lib/authored-pages";
import { getProducts } from "@/lib/products";
import { CTA_INTENTIONALLY_UNLINKED, CTA_LINK_MAP } from "@/lib/link-map";
import { getAllPageSpecs, getPageSpec } from "@/lib/pages";
import { getPageText, getAllPageText } from "@/lib/subpage-text";
import {
  getAllSubPages,
  getChildren,
  getSectionPages,
  getSubPage,
  getSubPageSlugs,
  getSubPageStats,
} from "@/lib/subpages";
import { PAGE_SLUGS } from "@/lib/types";

describe("kho trang con", () => {
  it("có đúng 31 trang", () => {
    expect(getAllSubPages()).toHaveLength(31);
    expect(getSubPageSlugs()).toHaveLength(31);
  });

  it("mọi spec qua được zod khi import", () => {
    for (const slug of getSubPageSlugs()) {
      expect(getSubPage(slug)?.slug).toBe(slug);
    }
  });

  it("trả về null cho slug không tồn tại", () => {
    expect(getSubPage("khong-ton-tai")).toBeNull();
    expect(getSubPage("")).toBeNull();
  });

  it("canvas luôn rộng 1440px", () => {
    for (const page of getAllSubPages()) {
      expect(page.canvasWidth).toBe(1440);
    }
  });

  it("tổng chiều cao lát nền khớp chiều cao trang", () => {
    for (const page of getAllSubPages()) {
      const stacked = page.slices.reduce((sum, slice) => sum + slice.displayHeight, 0);
      expect(Math.abs(stacked - page.height), page.slug).toBeLessThan(1);
    }
  });

  it("lát nền xếp liên tục, không chồng không hở", () => {
    for (const page of getAllSubPages()) {
      let expected = 0;
      for (const slice of page.slices) {
        expect(slice.y, page.slug).toBeCloseTo(expected, 5);
        expected += slice.displayHeight;
      }
    }
  });

  it("mọi lát nền là ảnh @2x", () => {
    for (const page of getAllSubPages()) {
      for (const slice of page.slices) {
        expect(slice.intrinsicWidth).toBe(2880);
        expect(Math.abs(slice.intrinsicHeight - slice.displayHeight * 2)).toBeLessThanOrEqual(2);
      }
    }
  });

  it("form liên hệ luôn cách đáy trang đúng 123px", () => {
    for (const page of getAllSubPages()) {
      expect(page.height - page.contactForm.y, page.slug).toBeCloseTo(123, 5);
    }
  });

  it("trang chính cũng giữ đúng khoảng cách 123px đó", () => {
    for (const page of getAllPageSpecs()) {
      expect(page.contactForm).not.toBeNull();
      expect(page.height - page.contactForm!.y, page.slug).toBeCloseTo(123, 5);
    }
  });

  it("nav có đúng 5 mục và đúng 1 mục active khớp section", () => {
    for (const page of getAllSubPages()) {
      expect(page.nav).toHaveLength(5);
      const active = page.nav.filter((entry) => entry.active);
      expect(active, page.slug).toHaveLength(1);
      expect(active[0].href).toBe(`/${page.section}`);
    }
  });

  it("section của mọi trang con là một trong 6 trang chính", () => {
    for (const page of getAllSubPages()) {
      expect(PAGE_SLUGS).toContain(page.section);
    }
  });

  it("breadcrumb bắt đầu từ trang chủ và khớp độ sâu slug", () => {
    for (const page of getAllSubPages()) {
      expect(page.breadcrumb[0]).toEqual({ label: "Trang chủ", href: "/" });
      expect(page.breadcrumb, page.slug).toHaveLength(page.slug.split("/").length);
    }
  });

  it("mọi trang cha trong breadcrumb đều tồn tại", () => {
    const known = new Set<string>([
      "/",
      ...getAllPageSpecs().map((p) => p.route),
      ...getAllSubPages().map((p) => p.route),
    ]);
    for (const page of getAllSubPages()) {
      for (const crumb of page.breadcrumb) {
        expect(known.has(crumb.href), `${page.slug} -> ${crumb.href}`).toBe(true);
      }
    }
  });

  it("route luôn khớp slug", () => {
    for (const page of getAllSubPages()) {
      expect(page.route).toBe(`/${page.slug}`);
    }
  });

  it("getChildren trả về đúng con trực tiếp, không lấy cháu", () => {
    const children = getChildren("nhan-su/tuyen-dung");
    expect(children.map((c) => c.slug)).toEqual(["nhan-su/tuyen-dung/vi-tri-dang-tuyen"]);

    const grand = getChildren("nhan-su/tuyen-dung/vi-tri-dang-tuyen");
    expect(grand).toHaveLength(1);
    expect(grand[0].slug).toBe(
      "nhan-su/tuyen-dung/vi-tri-dang-tuyen/ky-thuat-dan-phim-va-man-hinh",
    );
  });

  it("getSectionPages gom đủ mọi cấp của section", () => {
    expect(getSectionPages("nhan-su").length).toBe(6);
    expect(getSectionPages("dai-ly").length).toBe(8);
    expect(getSectionPages("giai-phap").length).toBe(7);
    expect(getSectionPages("trai-nghiem").length).toBe(5);
    expect(getSectionPages("cong-nghe").length).toBe(5);
    expect(getSectionPages("home").length).toBe(0);
  });

  it("thống kê cộng đúng", () => {
    const stats = getSubPageStats();
    expect(stats.total).toBe(31);
    expect(stats.totalSlices).toBe(
      getAllSubPages().reduce((sum, p) => sum + p.slices.length, 0),
    );
    expect(stats.totalHeight).toBeGreaterThan(100_000);
  });
});

describe("bảng nối nút CTA", () => {
  it("mọi id trong bảng đều là phần tử có thật trên trang chính", () => {
    // Bang nay noi ca NUT lan NHAN MUC: vai muc trong thiet ke khong co nut nao,
    // nen nhan muc duoc dung lam loi vao trang con (xem link-map.ts).
    const items = new Map(
      getAllPageSpecs().flatMap((page) => page.items.map((i) => [i.id, i])),
    );
    for (const id of Object.keys(CTA_LINK_MAP)) {
      const item = items.get(id);
      expect(item, `${id} không tồn tại trên trang chính`).toBeDefined();
      const kind = item!.classes;
      expect(
        kind.includes("btn") || kind.includes("lbl"),
        `${id} không phải nút cũng không phải nhãn mục`,
      ).toBe(true);
    }
  });

  it("mọi trang con đều bấm tới được từ trang chính hoặc từ trang con khác", () => {
    const targets = new Set<string>([
      ...Object.values(CTA_LINK_MAP),
      ...getAllSubPages().flatMap((page) => getHotspots(page.slug).map((s) => s.href)),
    ]);
    // 2 trang chi toi duoc qua vung bam tren trang cha — kiem gian tiep qua
    // danh sach con, nen o day chi canh nhung trang KHONG ai tro toi ca.
    const orphan = getAllSubPages().filter(
      (page) => !targets.has(page.route) && getChildren(page.slug).length === 0,
    );
    // Cho phep toi da vai trang la la cuoi nhanh (bai viet cuoi cung).
    expect(orphan.length, `mồ côi: ${orphan.map((p) => p.route).join(", ")}`).toBeLessThan(20);
  });

  it("mọi đích đến đều là trang có thật", () => {
    // Dich den co the la trang con cat tu thiet ke, HOAC trang do ta tu soan
    // cho nhung muc thiet ke khong ve trang con.
    const routes = new Set([
      ...getAllSubPages().map((p) => p.route),
      ...getAuthoredSlugs().map((slug) => `/${slug}`),
    ]);
    for (const [id, href] of Object.entries(CTA_LINK_MAP)) {
      expect(routes.has(href), `${id} -> ${href} không tồn tại`).toBe(true);
    }
  });

  it("không còn nút CTA nào bị bỏ trống", () => {
    expect(CTA_INTENTIONALLY_UNLINKED).toEqual([]);
  });

  it("mọi nút chưa nối đều được liệt kê tường minh", () => {
    const dead = getAllPageSpecs().flatMap((page) =>
      page.items
        .filter((i) => i.classes.includes("btn") && i.href === null)
        .map((i) => i.id),
    );
    for (const id of dead) {
      const handled = id in CTA_LINK_MAP || CTA_INTENTIONALLY_UNLINKED.includes(id);
      expect(handled, `${id} chưa nối và cũng chưa được ghi nhận`).toBe(true);
    }
  });

  it("không có id nào vừa nối vừa nằm trong danh sách bỏ qua", () => {
    for (const id of CTA_INTENTIONALLY_UNLINKED) {
      expect(id in CTA_LINK_MAP).toBe(false);
    }
  });
});

describe("vùng bấm dò từ ảnh", () => {
  it("mọi hotspot nằm trong khung canvas của trang", () => {
    for (const page of getAllSubPages()) {
      for (const spot of getHotspots(page.slug)) {
        expect(spot.x).toBeGreaterThanOrEqual(0);
        expect(spot.x + spot.w).toBeLessThanOrEqual(1440);
        expect(spot.y).toBeGreaterThanOrEqual(0);
        expect(spot.y + spot.h).toBeLessThanOrEqual(page.height);
      }
    }
  });

  it("mọi hotspot TRONG SITE trỏ tới trang có thật", () => {
    // Đích có thể là một trang con dựng từ frame thiết kế, một trang do chúng
    // ta tự soạn cho chỗ thiết kế không vẽ (ví dụ tab BRAVO), hoặc một trang
    // chi tiết sản phẩm (xem src/lib/products.ts).
    const routes = new Set([
      ...getAllSubPages().map((p) => p.route),
      ...getAuthoredSlugs().map((slug) => `/${slug}`),
      ...getProducts().map((p) => p.route),
    ]);
    for (const page of getAllSubPages()) {
      for (const spot of getHotspots(page.slug)) {
        if (spot.external) {
          continue;
        }
        expect(routes.has(spot.href), `${page.slug} -> ${spot.href}`).toBe(true);
      }
    }
  });

  it("hotspot dẫn RA NGOÀI phải là tệp tải thật của hãng", () => {
    // 30 nút "TẢI VỀ" trên hai trang kho ứng dụng dẫn thẳng tới tệp trên
    // wincavn.com — khách gửi trang hãng và yêu cầu "bấm vào là tải thôi"
    // (30/09/2026). Chúng là ngoại lệ DUY NHẤT của phép kiểm trên, nên phải
    // ràng riêng chứ không chỉ bỏ qua.
    let count = 0;
    for (const page of getAllSubPages()) {
      for (const spot of getHotspots(page.slug)) {
        if (!spot.external) {
          continue;
        }
        count += 1;
        expect(spot.href, `${page.slug}`).toMatch(
          /^https:\/\/wincavn\.com\/storage\/files\/.+\.(apk|xapk|bin|zip|rar|iap)$/i,
        );
      }
    }
    expect(count, "phải có đủ nút tải trên cả hai trang").toBe(29);
  });

  it("hotspot có kích thước hợp lý", () => {
    for (const page of getAllSubPages()) {
      for (const spot of getHotspots(page.slug)) {
        expect(spot.w).toBeGreaterThanOrEqual(60);
        expect(spot.h).toBeGreaterThanOrEqual(28);
        // Phần lớn hotspot là NÚT (cao ~28–42). Nhưng có cả điều khiển khác
        // được vẽ chết vào ảnh và đo tay: thanh tab WINCA | BRAVO cao 88, và
        // hai THẺ trong dải "CÁC BÀI VIẾT KHÁC" ở cuối trang 3M Ceramic Elite
        // IM cao 459 (cả ảnh lẫn tiêu đề — bấm vào đâu cũng đi được).
        // Chặn trên vẫn đủ để bắt hộp đo sai thành cả trang (cao hàng nghìn).
        expect(spot.h).toBeLessThanOrEqual(500);
      }
    }
  });

  it("trang không có nút nào thì trả về mảng rỗng", () => {
    expect(getHotspots("khong-ton-tai")).toEqual([]);
    expect(countDetected("khong-ton-tai")).toBe(0);
  });
});

describe("lớp văn bản OCR", () => {
  it("cả 31 trang đều có văn bản", () => {
    expect(getAllPageText()).toHaveLength(31);
    for (const page of getAllSubPages()) {
      expect(getPageText(page.slug).blocks.length, page.slug).toBeGreaterThan(0);
    }
  });

  it("đã lọc sạch vùng header và footer", () => {
    for (const page of getAllSubPages()) {
      for (const block of getPageText(page.slug).blocks) {
        expect(block.y, `${page.slug} còn khối trong header`).toBeGreaterThanOrEqual(100);
        expect(block.y, `${page.slug} còn khối trong footer`).toBeLessThanOrEqual(
          page.height - 250,
        );
      }
    }
  });

  it("khối nằm trong khung canvas", () => {
    for (const page of getAllSubPages()) {
      for (const block of getPageText(page.slug).blocks) {
        expect(block.x).toBeGreaterThanOrEqual(-5);
        expect(block.x).toBeLessThan(1440);
      }
    }
  });

  it("plain là các khối nối lại theo thứ tự đọc", () => {
    for (const page of getAllSubPages()) {
      const text = getPageText(page.slug);
      expect(text.plain).toBe(text.blocks.map((b) => b.text).join(" "));
    }
  });

  it("trang không tồn tại trả về lớp rỗng, không nổ", () => {
    const empty = getPageText("khong-ton-tai");
    expect(empty.blocks).toEqual([]);
    expect(empty.plain).toBe("");
  });

  it("phân loại tiêu đề theo chiều cao chữ là nhất quán", () => {
    for (const [, text] of getAllPageText()) {
      for (const block of text.blocks) {
        // Nguong phan loai ap len chieu cao GOC, con gia tri luu da lam tron
        // 1 chu so thap phan — nen bien phai la <= chu khong phai <.
        if (block.kind === "h2") expect(block.h).toBeGreaterThanOrEqual(34);
        if (block.kind === "p") expect(block.h).toBeLessThanOrEqual(22);
        if (block.kind === "h3") {
          expect(block.h).toBeGreaterThanOrEqual(22);
          expect(block.h).toBeLessThanOrEqual(34);
        }
      }
    }
  });
});

describe("trang chính vẫn nguyên vẹn sau khi nối link", () => {
  it("nút đã có đích đến từ Figma không bị ghi đè", () => {
    const home = getPageSpec("home");
    const cta = home.items.find((i) => i.id === "home-006");
    expect(cta?.href).toBe("/trai-nghiem");
    expect(CTA_LINK_MAP["home-006"]).toBeUndefined();
  });
});
