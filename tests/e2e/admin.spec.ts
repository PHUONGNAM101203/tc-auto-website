import { expect, test } from "@playwright/test";

/**
 * Cac test nay chay duoc o CA HAI trang thai:
 *  - Chua cau hinh Supabase -> phai hien huong dan setup (khong bao gio 500)
 *  - Da cau hinh -> phai chuyen huong ve /admin/login khi chua dang nhap
 */
test.describe("khu quản trị", () => {
  const PROTECTED = [
    "/admin",
    "/admin/content",
    "/admin/leads",
    "/admin/media",
    "/admin/settings",
    "/admin/activity",
  ];

  for (const route of PROTECTED) {
    test(`${route} — không bao giờ lộ dữ liệu cho khách chưa đăng nhập`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);

      const url = page.url();
      const body = await page.locator("body").innerText();

      const isSetup = body.includes("Cần cấu hình Supabase");
      const isLogin = url.includes("/admin/login") || body.includes("Đăng nhập quản trị");
      expect(
        isSetup || isLogin,
        `phải hiện hướng dẫn setup hoặc màn đăng nhập, nhận được: ${body.slice(0, 160)}`,
      ).toBe(true);
    });
  }

  test("trang admin không cho search engine index", async ({ page }) => {
    await page.goto("/admin/login");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });

  test("API xuất CSV chặn người chưa có quyền", async ({ request }) => {
    const response = await request.get("/api/admin/leads/export");
    expect([401, 403, 307, 302]).toContain(response.status());

    if (response.status() === 403) {
      const body = await response.json();
      expect(body.error).toBeTruthy();
      // Tuyet doi khong duoc tra ve du lieu lead
      expect(JSON.stringify(body)).not.toContain("phone");
    }
  });

  test("màn đăng nhập hoặc setup luôn render được", async ({ page }) => {
    await page.goto("/admin/login");
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/Đăng nhập quản trị|Cần cấu hình Supabase/);
  });
});
