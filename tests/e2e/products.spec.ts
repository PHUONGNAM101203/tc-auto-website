import { expect, test } from "@playwright/test";
import products from "../../src/data/products.json";

/**
 * Trang chi tiet san pham man hinh o to.
 *
 * Bo thiet ke khong ve trang cho san pham nao — cac trang nay do ta dung theo
 * mach cua trang chi tiet mau "3M Ceramic Elite IM". Xem src/lib/products.ts.
 */
type Row = { slug: string; name: string; route: string; category: string };
const LIST = (products as { products: Row[] }).products;
/** Cac trang danh muc co san pham, va so san pham cua tung trang. */
const BY_CATEGORY = new Map<string, Row[]>();
for (const row of LIST) {
  BY_CATEGORY.set(row.category, [...(BY_CATEGORY.get(row.category) ?? []), row]);
}

test.describe("trang chi tiết sản phẩm", () => {
  for (const [category, rows] of BY_CATEGORY) {
    test(`/${category} — mỗi sản phẩm có đúng một nút dẫn tới nó`, async ({
      page,
    }) => {
      await page.goto(`/${category}`);
      const hrefs = await page.$$eval("a.tc-readmore", (els) =>
        els.map((el) => el.getAttribute("href")),
      );
      const routes = new Set(rows.map((row) => row.route));
      const toProduct = hrefs.filter((href) => href && routes.has(href));
      expect(toProduct.length, `phải có ${rows.length} nút`).toBe(rows.length);
      // Moi nut tro toi MOT san pham khac nhau — khong hai nut cung mot dich.
      expect(new Set(toProduct).size).toBe(rows.length);
    });
  }

  for (const product of LIST) {
    test(`${product.slug} — mở được, đúng tên, ảnh tải được`, async ({ page }) => {
      const response = await page.goto(product.route);
      expect(response?.status()).toBe(200);
      await expect(page.locator(".tc-prod-name")).toHaveText(product.name);

      const broken = await page.$$eval("main img", (els) =>
        els
          .filter((img) => !(img as HTMLImageElement).naturalWidth)
          .map((img) => (img as HTMLImageElement).src),
      );
      expect(broken).toEqual([]);
    });
  }

  test("có đường dẫn phân cấp quay lại được danh mục", async ({ page }) => {
    await page.goto(LIST[0].route);
    await page.locator(`.tc-doc-crumbs a[href="/${LIST[0].category}"]`).click();
    await expect(page).toHaveURL(`/${LIST[0].category}`);
  });

  test("dải “sản phẩm khác” dẫn sang sản phẩm khác, không tự trỏ về mình", async ({
    page,
  }) => {
    await page.goto(LIST[0].route);
    const hrefs = await page.$$eval(".tc-prod-more a", (els) =>
      els.map((el) => el.getAttribute("href")),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs).not.toContain(LIST[0].route);
    // Chi lay san pham CUNG danh muc.
    for (const href of hrefs) {
      expect(href).toContain(`/${LIST[0].category}/`);
    }
    await page.locator(".tc-prod-more a").first().click();
    await expect(page.locator(".tc-prod-name")).toBeVisible();
  });

  test("nói thẳng những gì thiết kế chưa có, không bịa thông số", async ({
    page,
  }) => {
    await page.goto(LIST[0].route);
    const note = page.locator(".tc-doc-pending");
    await expect(note).toBeVisible();
    await expect(note).toContainText("Đang chờ TC Auto cung cấp");
  });
});

/**
 * Dai "CÁC BÀI VIẾT KHÁC" o cuoi trang 3M Ceramic Elite IM duoc VE CHET vao anh
 * nen, nen hai the trong do khong bam duoc. Hai the do la hai san pham that
 * ("3M Ceramic Hồng Ngoại" va "3M Ceramic Crystalline") — nay da co trang rieng
 * nen phai dan sang do.
 */
test.describe("dải bài viết khác trên trang 3M Ceramic Elite IM", () => {
  const PAGE = "/giai-phap/phim-dan-kinh/3m-ceramic-elite-im";
  const TARGETS = [
    "/giai-phap/phim-dan-kinh/3m-ceramic-hong-ngoai",
    "/giai-phap/phim-dan-kinh/3m-ceramic-crystalline",
  ];

  for (const href of TARGETS) {
    test(`bấm được và dẫn tới ${href}`, async ({ page }) => {
      await page.goto(PAGE);
      // Khoanh trong `.tc-canvas`: ban dien thoai cung liet ke chinh cac
      // lien ket nay (src/lib/mobile-links.ts) va chung van nam trong DOM.
      const link = page.locator(`.tc-canvas a[href="${href}"]`).first();
      await expect(link).toHaveCount(1);
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(page).toHaveURL(href);
      await expect(page.locator(".tc-prod-name")).toBeVisible();
    });
  }

  test("vùng bấm phủ đúng tấm ảnh, không đè lên nhau", async ({ page }) => {
    await page.goto(PAGE);
    const boxes = await page.$$eval(
      TARGETS.map((href) => `.tc-canvas a[href="${href}"]`).join(", "),
      (els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, right: r.right, w: r.width };
        }),
    );
    expect(boxes).toHaveLength(2);
    const [left, right] = boxes.sort((a, b) => a.x - b.x);
    expect(left.right, "hai vùng bấm không được chồng nhau").toBeLessThan(right.x);
    expect(left.w).toBeGreaterThan(200);
    expect(right.w).toBeGreaterThan(200);
  });
});
