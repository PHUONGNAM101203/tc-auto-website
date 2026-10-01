import { expect, test } from "@playwright/test";

/**
 * Ba trang do doi ngu dung web soan (khong co frame trong bo thiet ke) truoc
 * day KHONG co thanh dieu huong nao — vao roi la cut duong, phai bam nut lui
 * cua trinh duyet moi ra duoc. Xem src/components/site/AuthoredPage.tsx.
 */
const AUTHORED = [
  "/cong-nghe/bao-hanh",
  "/giai-phap/man-hinh/bravo",
  "/nhan-su/nhan-su-tieu-bieu",
];

test.describe("trang tự soạn", () => {
  for (const path of AUTHORED) {
    test(`${path} có thanh điều hướng đi được sang mục khác`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.locator(".tc-m-bar")).toBeVisible();
      await page.locator(".tc-m-burger").click();

      const links = page.locator("#tc-m-drawer a");
      await expect(links, "phải có đủ 5 mục chính").toHaveCount(5);
      await links.first().click();
      await expect(page).toHaveURL(/\/trai-nghiem$/);
    });
  }

  test("nút KHÁM PHÁ NGAY trên Nhân sự TC dẫn đi đúng chỗ", async ({ page }) => {
    await page.goto("/nhan-su/nhan-su-tc");

    const overview = page.locator('.tc-canvas a[href="/nhan-su/van-hoa-tc"]').last();
    await expect(overview, "nút dưới TỔNG QUAN NHÂN SỰ").toHaveCount(1);

    const featured = page.locator('.tc-canvas a[href="/nhan-su/nhan-su-tieu-bieu"]');
    await expect(featured, "nút dưới NHÂN SỰ TIÊU BIỂU THÁNG").toHaveCount(1);
    await featured.click();
    await expect(page).toHaveURL(/\/nhan-su\/nhan-su-tieu-bieu$/);
    await expect(page.locator("h1")).toContainText("xứng đáng được ghi nhận");
  });

  test("có nút lên đầu trang", async ({ page }) => {
    await page.goto("/nhan-su/nhan-su-tieu-bieu");
    await expect(page.locator(".tc-totop")).toHaveCount(1);
  });
});
