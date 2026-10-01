import { expect, test } from "@playwright/test";

/**
 * Danh muc man hinh co bo loc.
 *
 * Khach yeu cau (01/10/2026): dua NHIEU san pham cua hang len cho da dang, va
 * co bo loc rieng cho cac loai man hinh "cho kieu dung khach muon tim".
 * Xem src/components/site/ScreenCatalogue.tsx.
 */
const PAGE = "/giai-phap/man-hinh/tat-ca";

test.describe("danh mục màn hình", () => {
  test("liệt kê đủ mẫu, mẫu nào cũng có thông số và nguồn hãng", async ({
    page,
  }) => {
    await page.goto(PAGE);
    const items = page.locator(".tc-cat-item");
    const total = await items.count();
    expect(total).toBeGreaterThanOrEqual(19);

    for (let i = 0; i < total; i += 1) {
      const card = items.nth(i);
      await expect(card.locator("dl > div")).toHaveCount(6);
      // Moi mau phai dan ve trang hang de kiem lai so lieu.
      await expect(card.locator('a[href^="https://wincavn.com/"]')).toHaveCount(1);
    }
  });

  test("lọc theo hãng, kích thước và tính năng — cộng dồn được", async ({
    page,
  }) => {
    await page.goto(PAGE);
    const items = page.locator(".tc-cat-item");
    const all = await items.count();

    await page.getByRole("button", { name: "Bravo", exact: true }).click();
    const bravo = await items.count();
    expect(bravo).toBeGreaterThan(0);
    expect(bravo).toBeLessThan(all);
    for (const text of await items.locator(".tc-cat-brand").allTextContents()) {
      expect(text).toContain("Bravo");
    }

    // Bam lai chinh muc dang chon thi bo chon.
    await page.getByRole("button", { name: "Bravo", exact: true }).click();
    expect(await items.count()).toBe(all);

    // Hai tieu chi cong don chu khong thay the nhau.
    await page.getByRole("button", { name: "Camera 360" }).click();
    const only360 = await items.count();
    await page.getByRole("button", { name: "13 inch" }).click();
    const both = await items.count();
    expect(both).toBeLessThanOrEqual(only360);
    expect(both).toBeGreaterThan(0);
  });

  test("lọc ra rỗng thì nói rõ, không để trang trắng", async ({ page }) => {
    await page.goto(PAGE);
    // Bravo khong co mau 13 inch nao.
    await page.getByRole("button", { name: "Bravo", exact: true }).click();
    await page.getByRole("button", { name: "13 inch" }).click();
    await expect(page.locator(".tc-cat-item")).toHaveCount(0);
    await expect(page.locator(".tc-cat-empty")).toBeVisible();
  });

  test("số đếm phản ánh đúng số thẻ đang hiện", async ({ page }) => {
    await page.goto(PAGE);
    const count = page.locator(".tc-cat-count");
    await expect(count).toContainText("19 / 19");
    await page.getByRole("button", { name: "Bravo", exact: true }).click();
    const shown = await page.locator(".tc-cat-item").count();
    await expect(count).toContainText(`${shown} / 19`);
  });

  test("khai ItemList và đường dẫn phân cấp", async ({ page }) => {
    await page.goto(PAGE);
    const blobs = await page.$$eval(
      'script[type="application/ld+json"]',
      (els) => els.map((el) => JSON.parse(el.textContent ?? "{}")),
    );
    const list = blobs.find((b) => b["@type"] === "ItemList");
    expect(list).toBeTruthy();
    expect(list.numberOfItems).toBeGreaterThanOrEqual(19);
    expect(blobs.some((b) => b["@type"] === "BreadcrumbList")).toBe(true);
  });

  test("mẫu nào có trang riêng thì bấm vào mở được", async ({ page }) => {
    await page.goto(PAGE);
    const link = page
      .locator('.tc-cat-item h3 a[href^="/giai-phap/man-hinh/"]')
      .first();
    const href = await link.getAttribute("href");
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  test("có lối vào từ trang Màn hình ô tô", async ({ page }) => {
    await page.goto("/giai-phap/man-hinh");
    await expect(page.locator(`a[href="${PAGE}"]`).first()).toHaveCount(1);
  });
});
