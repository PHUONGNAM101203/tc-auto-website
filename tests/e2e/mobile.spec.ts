import { expect, test } from "@playwright/test";

/**
 * Ban MOBILE: canvas 1440px bi an di, noi dung duoc dung lai tu cung mot nguon
 * du lieu nhung co dan theo be rong man hinh.
 */
// Khong dung devices["iPhone 13"]: preset do chay tren WebKit, may nay chua cai.
// Khai bao thang man hinh dien thoai de chay duoc tren Chromium.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test.describe("bản mobile", () => {
  const PAGES = ["/", "/trai-nghiem", "/giai-phap", "/cong-nghe", "/dai-ly", "/nhan-su"];

  for (const route of PAGES) {
    test(`${route} — ẩn canvas, hiện bản mobile, không tràn ngang`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(400);

      await expect(page.locator(".tc-canvas")).toBeHidden();
      await expect(page.locator(".tc-m")).toBeVisible();

      // Khong bao gio duoc cuon ngang tren dien thoai.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflow, "trang bị tràn ngang").toBe(false);

      // Chu than bai phai doc duoc — day la ly do ton tai cua ban mobile.
      const size = await page
        .locator(".tc-m-body")
        .first()
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
      expect(size).toBeGreaterThanOrEqual(14);
    });
  }

  test("menu mở ra đủ các mục và đóng được", async ({ page }) => {
    await page.goto("/");
    const burger = page.locator(".tc-m-burger");
    await expect(burger).toBeVisible();

    await burger.click();
    const links = page.locator(".tc-m-drawer a");
    await expect(links).toHaveCount(5);

    await links.first().click();
    await expect(page).toHaveURL("/trai-nghiem");
    await expect(page.locator(".tc-m-drawer")).toBeHidden();
  });

  test("trang con hiện chữ thật chứ không phải ảnh thu nhỏ", async ({ page }) => {
    await page.goto("/cong-nghe/tien-phong-cong-nghe");
    await page.waitForTimeout(400);

    await expect(page.locator(".tc-canvas")).toBeHidden();
    const paragraphs = page.locator(".tc-m-article p");
    expect(await paragraphs.count()).toBeGreaterThan(0);

    const size = await paragraphs
      .first()
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(14);

    // Nhan cua nut khong duoc lot vao phan doc.
    const text = (await page.locator(".tc-m-article").innerText()).toUpperCase();
    expect(text).not.toContain("> TÌM HIỂU THÊM");
  });

  test("form liên hệ xếp dọc và không bị iOS phóng to khi gõ", async ({ page }) => {
    await page.goto("/");
    const input = page.locator(".tc-m-form input[name='name']");
    await expect(input).toBeVisible();

    const size = await input.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    // Duoi 16px la iOS tu phong to trang khi go — rat kho chiu.
    expect(size).toBeGreaterThanOrEqual(16);
  });
});
