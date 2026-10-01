import { expect, test } from "@playwright/test";

/**
 * Du lieu co cau truc (JSON-LD).
 *
 * Khach yeu cau chuan hoa SEO/GEO/AIO/AEO theo huong dan hien hanh cua Google
 * (30/09/2026). Truoc do ca site khong co mot mau JSON-LD nao.
 *
 * Phep kiem quan trong nhat o day: mau khai bao phai KHOP voi thu nguoi dung
 * nhin thay. Google phat trang khai mot dang ma hien mot neo.
 * Xem src/lib/structured-data.ts.
 */
const read = (page: import("@playwright/test").Page) =>
  page.$$eval('script[type="application/ld+json"]', (els) =>
    els.map((el) => JSON.parse(el.textContent ?? "{}")),
  );

const PAGES = [
  "/",
  "/giai-phap",
  "/trai-nghiem/hanh-trinh",
  "/giai-phap/man-hinh/s300-plus-qled-2k-dts",
  "/cong-nghe/bao-hanh",
];

test.describe("dữ liệu có cấu trúc", () => {
  test("trang nào cũng khai pháp nhân và trang web, đúng MỘT lần", async ({
    page,
  }) => {
    for (const path of PAGES) {
      await page.goto(path);
      const types = (await read(page)).map((j) => j["@type"]);
      expect(types.filter((t) => t === "Organization"), path).toHaveLength(1);
      expect(types.filter((t) => t === "WebSite"), path).toHaveLength(1);
    }
  });

  test("mọi mẫu đều là JSON hợp lệ và có @context schema.org", async ({
    page,
  }) => {
    for (const path of PAGES) {
      await page.goto(path);
      for (const blob of await read(page)) {
        expect(blob["@context"], path).toBe("https://schema.org");
        expect(blob["@type"], path).toBeTruthy();
      }
    }
  });

  test("pháp nhân chỉ liệt kê trang mạng xã hội CÓ THẬT", async ({ page }) => {
    await page.goto("/");
    const org = (await read(page)).find((j) => j["@type"] === "Organization")!;
    // TC Auto chua co Instagram — khai bia mot duong dan la gui nguoi dung
    // sang tai khoan cua hang khac.
    expect(org.sameAs).toBeDefined();
    for (const link of org.sameAs as string[]) {
      expect(link).toMatch(/^https:\/\/(www\.facebook\.com|zalo\.me)\//);
    }
    expect(org.contactPoint[0].telephone).toBeTruthy();
  });

  test("đường dẫn phân cấp khai KHỚP với đường dẫn hiện trên trang", async ({
    page,
  }) => {
    for (const path of [
      "/trai-nghiem/hanh-trinh",
      "/giai-phap/man-hinh/s300-plus-qled-2k-dts",
      "/cong-nghe/bao-hanh",
    ]) {
      await page.goto(path);
      const crumb = (await read(page)).find(
        (j) => j["@type"] === "BreadcrumbList",
      );
      expect(crumb, `${path} phải có đường dẫn phân cấp`).toBeTruthy();

      const declared = (crumb!.itemListElement as { name: string }[]).map(
        (i) => i.name,
      );
      const shown = await page.$$eval(
        'nav[aria-label="Đường dẫn"] a, nav[aria-label="Đường dẫn"] li, nav[aria-label="Đường dẫn"] span[aria-current]',
        (els) =>
          els
            .map((el) => el.textContent?.trim() ?? "")
            .filter((t) => t.length > 0 && t !== "›"),
      );
      // Khai bao phai la mot phan cua thu hien ra (the <li> co the boc the <a>
      // nen danh sach hien ra co the dai hon do lap).
      for (const name of declared) {
        expect(shown.join(" | "), `${path} — "${name}"`).toContain(name);
      }
      // Thu tu phai tang dan, bat dau tu 1.
      const positions = (crumb!.itemListElement as { position: number }[]).map(
        (i) => i.position,
      );
      expect(positions).toEqual(positions.map((_, i) => i + 1));
    }
  });

  test("sản phẩm khai đủ thông số, KHÔNG khai giá bịa", async ({ page }) => {
    await page.goto("/giai-phap/man-hinh/s300-plus-qled-2k-dts");
    const product = (await read(page)).find((j) => j["@type"] === "Product")!;
    expect(product.name).toBe("S300+ QLED 2K DTS");
    expect(product.brand.name).toBe("Winca");
    expect((product.additionalProperty as unknown[]).length).toBeGreaterThan(8);
    // Khong co bang gia nen khong duoc khai `offers`; Google phat trang khai
    // gia khac voi gia hien tren trang — ma o day khong hien gia nao ca.
    expect(product.offers, "không được khai giá khi chưa có bảng giá").toBeUndefined();
    expect(product.aggregateRating, "không được khai đánh giá bịa").toBeUndefined();
  });

  test("sitemap liệt kê đủ cả trang sản phẩm và trang tự soạn", async ({
    request,
  }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("/giai-phap/man-hinh/s300-plus-qled-2k-dts");
    expect(xml).toContain("/cong-nghe/bao-hanh");
    expect(xml).toContain("/nhan-su/nhan-su-tieu-bieu");
    // 6 trang chinh + 31 trang con + 17 san pham + 4 trang tu soan.
    const count = (xml.match(/<url>/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(58);
  });

  test("robots.txt chặn khu quản trị và chỉ tới sitemap", async ({ request }) => {
    const txt = await (await request.get("/robots.txt")).text();
    expect(txt).toContain("/admin");
    expect(txt).toContain("/api/");
    expect(txt).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/i);
  });
});
