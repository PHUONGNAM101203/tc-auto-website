import { expect, test } from "@playwright/test";

/**
 * Lien ket trong long trang con, tren BAN DIEN THOAI.
 *
 * Tren desktop moi lien ket la mot vung bam trong suot dat theo toa do canvas
 * 1440px; duoi 900px canvas bi an han nen tren dien thoai khong con cai nao.
 * Do duoc truoc khi sua: trang "Kho ứng dụng" co 15 tep tai tren desktop va 0
 * tren dien thoai. Xem src/lib/mobile-links.ts.
 */
test.use({ viewport: { width: 390, height: 844 } });

test.describe("liên kết trong trang — bản điện thoại", () => {
  test("mười lăm tệp tải của Kho ứng dụng đều bấm được", async ({ page }) => {
    await page.goto("/cong-nghe/ung-dung/kho-ung-dung");
    const links = page.locator('.tc-m-links a[href*="wincavn.com"]');
    await expect(links).toHaveCount(15);
    for (const rel of await links.evaluateAll((els) =>
      els.map((e) => e.getAttribute("rel")),
    )) {
      expect(rel).toContain("noopener");
    }
  });

  test("bài viết mở ra từ XEM THÊM cũng có mặt trên điện thoại", async ({
    page,
  }) => {
    await page.goto("/trai-nghiem/phong-cach-song");
    const links = page.locator('.tc-m-links a[href^="/trai-nghiem/"]');
    await expect(links).toHaveCount(6);
    await links.first().click();
    await expect(page).toHaveURL(/\/trai-nghiem\/phong-cach-song\/.+/);
  });

  test("liên kết trùng nhau được gộp, không liệt kê sáu dòng y hệt", async ({
    page,
  }) => {
    // Sau the tren trang Loa deu tro ve cung mot trang DEGO va deu khong co
    // tieu de rieng — liet ke ca sau la sau dong y het nhau.
    await page.goto("/giai-phap/loa");
    await expect(page.locator('.tc-m-links a[href="/giai-phap/loa/dego"]')).toHaveCount(1);
  });

  test("trang sản phẩm có thanh điều hướng và nút lên đầu trang", async ({
    page,
  }) => {
    // Truoc day 17 trang san pham khong co thanh nao — vao roi la cut duong.
    await page.goto("/giai-phap/man-hinh/s300-plus-qled-2k-dts");
    await expect(page.locator(".tc-m-bar")).toBeVisible();
    await expect(page.locator(".tc-totop")).toHaveCount(1);
    await page.locator(".tc-m-burger").click();
    await expect(page.locator("#tc-m-drawer .tc-m-navhead > a")).toHaveCount(5);
  });

  test("không trang nào tràn ngang", async ({ page }) => {
    for (const route of [
      "/",
      "/giai-phap",
      "/giai-phap/man-hinh",
      "/giai-phap/man-hinh/tat-ca",
      "/giai-phap/loa/dego",
      "/cong-nghe/ung-dung/kho-ung-dung",
    ]) {
      await page.goto(route);
      const over = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(over, route).toBeLessThanOrEqual(1);
    }
  });
});
