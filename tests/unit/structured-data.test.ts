import { describe, expect, it } from "vitest";
import {
  ORG_ID,
  articleLd,
  authoredProductLd,
  breadcrumbLd,
  organizationLd,
  productLd,
  websiteLd,
} from "@/lib/structured-data";
import { getProducts } from "@/lib/products";

/**
 * Du lieu co cau truc.
 *
 * Diem can canh KHONG phai "co sinh ra JSON khong" ma la co khai thua thu
 * minh khong biet khong: Google phat trang khai lech voi noi dung nguoi dung
 * thay, con may tra loi AI thi chep thang so lieu sai ra ngoai.
 */
describe("dữ liệu có cấu trúc", () => {
  it("pháp nhân: chỉ liệt kê trang mạng xã hội CÓ THẬT", () => {
    const org = organizationLd();
    expect(org["@type"]).toBe("Organization");
    expect(org["@id"]).toBe(ORG_ID);
    // TC Auto chua co Instagram — SOCIAL de href la null cho muc do.
    for (const link of org.sameAs as string[]) {
      expect(link).toMatch(/^https:\/\//);
    }
    const contact = (org.contactPoint as Record<string, string>[])[0];
    expect(contact.telephone).not.toContain(" ");
    expect(contact.areaServed).toBe("VN");
  });

  it("trang web trỏ về pháp nhân bằng @id, không chép lại", () => {
    const site = websiteLd();
    expect(site["@type"]).toBe("WebSite");
    expect((site.publisher as Record<string, string>)["@id"]).toBe(ORG_ID);
    expect(site.inLanguage).toBe("vi-VN");
  });

  describe("đường dẫn phân cấp", () => {
    it("ít hơn hai mục thì KHÔNG khai", () => {
      // Mot muc thi khong phai duong dan phan cap; khai ra chi lam nhieu.
      expect(breadcrumbLd([])).toBeNull();
      expect(breadcrumbLd([{ name: "Trang chủ", url: "/" }])).toBeNull();
    });

    it("đánh số từ 1 và giữ nguyên thứ tự truyền vào", () => {
      const crumb = breadcrumbLd([
        { name: "Trang chủ", url: "/" },
        { name: "Giải pháp", url: "/giai-phap" },
        { name: "PPF", url: "/giai-phap/ppf" },
      ])!;
      const items = crumb.itemListElement as { position: number; name: string }[];
      expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
      expect(items.map((i) => i.name)).toEqual(["Trang chủ", "Giải pháp", "PPF"]);
    });

    it("đường dẫn tương đối được đổi thành tuyệt đối", () => {
      const crumb = breadcrumbLd([
        { name: "Trang chủ", url: "/" },
        { name: "PPF", url: "/giai-phap/ppf" },
      ])!;
      for (const item of crumb.itemListElement as { item: string }[]) {
        expect(item.item).toMatch(/^https?:\/\//);
      }
    });
  });

  describe("sản phẩm", () => {
    const screens = getProducts().filter(
      (p) => p.category === "giai-phap/man-hinh",
    );

    it("KHÔNG khai giá hay đánh giá — ta không có số liệu đó", () => {
      for (const product of getProducts()) {
        const ld = productLd(product);
        expect(ld.offers, product.slug).toBeUndefined();
        expect(ld.aggregateRating, product.slug).toBeUndefined();
      }
    });

    it("thông số đi vào additionalProperty khi sản phẩm đã có", () => {
      const ld = productLd(screens[0]);
      expect((ld.additionalProperty as unknown[]).length).toBeGreaterThan(5);
    });

    it("sản phẩm chưa có thông số thì bỏ hẳn additionalProperty", () => {
      // Khai mot mang rong van la mot loi khai: no noi "san pham nay khong co
      // thong so nao", khac han voi "chung toi chua co so lieu".
      const film = getProducts().find((p) => p.slug === "nano-sun-blue")!;
      expect(productLd(film).additionalProperty).toBeUndefined();
    });

    it("thương hiệu suy từ TÊN chứ không từ danh mục", () => {
      // Danh muc "man-hinh" chua ca may Winca lan may Bravo; danh muc phim
      // chua ca 3M lan Nano Sun. Lay theo danh muc la gan nham thuong hieu.
      const brand = (slug: string) =>
        (productLd(getProducts().find((p) => p.slug === slug)!).brand as {
          name: string;
        }).name;
      expect(brand("s300-plus-qled-2k-dts")).toBe("Winca");
      expect(brand("3m-ceramic-crystalline")).toBe("3M");
      expect(brand("nano-sun-blue")).toBe("Nano Sun");
      // DEGO chi xuat hien tren trang tu soan, khong co trong products.json.
      expect(
        (
          authoredProductLd(
            { name: "DEGO ST6.2C", tagline: "", specs: [] },
            "/giai-phap/loa/dego",
          ).brand as { name: string }
        ).name,
      ).toBe("DEGO");
    });

    it("dòng trên trang tự soạn trỏ về chính trang đó", () => {
      const ld = authoredProductLd(
        {
          name: "Bravo B100",
          tagline: "Bản nhiều RAM",
          specs: [{ label: "RAM", value: "4 GB" }],
        },
        "/giai-phap/man-hinh/bravo",
      );
      expect((ld.brand as { name: string }).name).toBe("Bravo");
      expect(ld.url).toMatch(/\/giai-phap\/man-hinh\/bravo$/);
      expect((ld.additionalProperty as unknown[]).length).toBe(1);
    });

    it("dòng chưa có thông số thì không khai additionalProperty", () => {
      const ld = authoredProductLd(
        { name: "Bravo B100 PRO", tagline: "Bản cao nhất", specs: [] },
        "/giai-phap/man-hinh/bravo",
      );
      expect(ld.additionalProperty).toBeUndefined();
    });
  });

  describe("bài viết", () => {
    it("thiếu trường nào thì BỎ trường đó, không điền rỗng", () => {
      const ld = articleLd({
        title: "Tiêu đề",
        excerpt: null,
        url: "/bai-viet/a",
        image: null,
        publishedAt: null,
      });
      expect(ld.description).toBeUndefined();
      expect(ld.image).toBeUndefined();
      expect(ld.datePublished).toBeUndefined();
      expect((ld.author as Record<string, string>)["@id"]).toBe(ORG_ID);
    });

    it("có đủ trường thì khai đủ, đường dẫn tuyệt đối", () => {
      const ld = articleLd({
        title: "Tiêu đề",
        excerpt: "Tóm tắt",
        url: "/bai-viet/a",
        image: "/anh.webp",
        publishedAt: "2026-08-19",
      });
      expect(ld.description).toBe("Tóm tắt");
      expect(ld.image).toMatch(/^https?:\/\/.+\/anh\.webp$/);
      expect(ld.datePublished).toBe("2026-08-19");
    });
  });
});
