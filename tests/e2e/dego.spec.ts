import { expect, test } from "@playwright/test";

/**
 * Trang "Loa DEGO".
 *
 * Ban thiet ke de ten mau "Loa ..." cho nam trong sau the tren trang Loa nội
 * thất, va dan nham ca sau doan mo ta — ca sau deu la chu cua phim 3M. Khach
 * yeu cau tra cuu trang hang DEGO va lam cho xong (01/10/2026).
 * Xem src/data/authored-pages.json (slug giai-phap/loa/dego).
 */
test.describe("loa DEGO", () => {
  test("trang liệt kê đủ sáu bộ loa, bộ nào cũng có thông số", async ({
    page,
  }) => {
    await page.goto("/giai-phap/loa/dego");
    const kits = page.locator(".tc-doc-products li");
    await expect(kits).toHaveCount(6);

    const names = await kits.locator("h3").allTextContents();
    expect(names).toEqual([
      "DEGO ST6.2C",
      "DEGO ST6.3C",
      "DEGO ST8.3C",
      "DEGO AS6.2C",
      "DEGO AU6.2C",
      "DEGO PO6.2C",
    ]);

    for (let i = 0; i < 6; i += 1) {
      const rows = kits.nth(i).locator("dl > div");
      await expect(rows, names[i]).toHaveCount(5);
    }
  });

  test("ghi rõ nguồn số liệu và phần còn thiếu", async ({ page }) => {
    await page.goto("/giai-phap/loa/dego");
    await expect(page.locator(".tc-doc-source")).toContainText("degoaudio.de");
    // Hang khong cong bo cong suat dinh — phai noi thang chu khong doan.
    await expect(page.locator(".tc-doc-source")).toContainText("không công bố");
    await expect(page.locator(".tc-doc-pending")).toBeVisible();
  });

  test("sáu nút trên trang Loa nội thất đều dẫn sang đây", async ({ page }) => {
    await page.goto("/giai-phap/loa");
    const links = page.locator('a.tc-readmore[href="/giai-phap/loa/dego"]');
    await expect(links).toHaveCount(6);
    // Khong con nut nao xo chu tai cho tren trang nay.
    await expect(page.locator("button.tc-readmore")).toHaveCount(0);
  });

  test("XEM THÊM dưới mục DEGO trên trang Giải pháp bấm được", async ({
    page,
  }) => {
    await page.goto("/giai-phap");
    const spot = page.locator('a[href="/giai-phap/loa/dego"]');
    await expect(spot).toHaveCount(1);
    await spot.click();
    await expect(page).toHaveURL(/\/giai-phap\/loa\/dego$/);
    await expect(page.locator("h1")).toContainText("Âm thanh chuẩn mực");
  });

  test("khai dữ liệu có cấu trúc cho từng bộ loa", async ({ page }) => {
    await page.goto("/giai-phap/loa/dego");
    const blobs = await page.$$eval(
      'script[type="application/ld+json"]',
      (els) => els.map((el) => JSON.parse(el.textContent ?? "{}")),
    );
    const products = blobs.filter((b) => b["@type"] === "Product");
    expect(products).toHaveLength(6);
    for (const product of products) {
      expect(product.brand.name).toBe("DEGO");
      expect(product.additionalProperty.length).toBe(5);
    }
  });
});
