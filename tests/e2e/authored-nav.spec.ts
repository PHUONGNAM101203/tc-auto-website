import { expect, test } from "@playwright/test";

/**
 * Ba trang do doi ngu dung web soan (khong co frame trong bo thiet ke) truoc
 * day KHONG co thanh dieu huong nao — vao roi la cut duong, phai bam nut lui
 * cua trinh duyet moi ra duoc. Xem src/components/site/AuthoredPage.tsx.
 */
const AUTHORED = [
  "/cong-nghe/bao-hanh",
    "/nhan-su/nhan-su-tieu-bieu",
];

test.describe("trang tự soạn", () => {
  for (const path of AUTHORED) {
    test(`${path} có thanh điều hướng đi được sang mục khác`, async ({
      page,
    }) => {
      // Tu khi co `DocHeader`, trang tu soan dung DUNG header cua trang chu
      // khi man rong (khach yeu cau 02/10/2026: "menu header y chang"). Thanh
      // ba gach chi con o duoi 900px — nen phai thu nho cua so truoc khi doi
      // no, khong thi ca hai header cung hien.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      await expect(page.locator(".tc-m-bar")).toBeVisible();
      await page.locator(".tc-m-burger").click();

      // `.tc-m-navhead > a` chu khong phai moi the <a> trong ngan keo: tu khi
      // moi muc cha xoe duoc cay trang con, ngan keo chua 36 lien ket.
      const links = page.locator("#tc-m-drawer .tc-m-navhead > a");
      await expect(links, "phải có đủ 5 mục chính").toHaveCount(5);
      await links.first().click();
      await expect(page).toHaveURL(/\/trai-nghiem$/);
    });

    test(`${path} dùng đúng header của trang chủ khi màn rộng`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);

      await expect(page.locator(".tc-dochdr")).toBeVisible();
      await expect(
        page.locator(".tc-dochdr a.nv"),
        "đủ 5 mục như ngoài trang chủ",
      ).toHaveCount(5);
      await expect(page.locator(".tc-dochdr .search input")).toBeVisible();
      await expect(
        page.locator(".tc-docnav-m"),
        "thanh ba gạch phải tắt hẳn ở màn rộng",
      ).toBeHidden();
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
