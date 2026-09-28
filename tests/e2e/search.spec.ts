import { expect, test } from "@playwright/test";

test.describe("tìm kiếm toàn site", () => {
  test("gõ không dấu vẫn tìm ra nội dung có dấu", async ({ page }) => {
    await page.goto("/");
    const input = page.locator(".search input");

    await input.fill("phim cach nhiet");
    const pop = page.locator(".tc-search-pop");
    await expect(pop).toHaveClass(/is-on/);

    const hits = page.locator(".tc-search-hit");
    await expect(hits.first()).toBeVisible();
    await expect(hits.first()).toContainText("Giải pháp");
  });

  test("chọn kết quả thì điều hướng và cuộn tới phần tử", async ({ page }) => {
    await page.goto("/");
    await page.locator(".search input").fill("tuyen dung");
    await page.locator(".tc-search-hit").first().click();

    // Trang chinh nhay theo id phan tu (#nhan-su-013); trang con la anh nen
    // nhay theo toa do y trong canvas (#y642).
    await expect(page).toHaveURL(/\/nhan-su(\/[a-z-]+)*#(nhan-su-\d{3}|y\d+)/);
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  });

  test("điều hướng bằng bàn phím", async ({ page }) => {
    await page.goto("/");
    const input = page.locator(".search input");
    await input.fill("giai phap");
    await expect(page.locator(".tc-search-hit").first()).toBeVisible();

    await input.press("ArrowDown");
    await expect(page.locator('.tc-search-hit[aria-selected="true"]')).toHaveCount(1);

    await input.press("Enter");
    await expect(page).toHaveURL(/#/);
  });

  test("Escape đóng popover", async ({ page }) => {
    await page.goto("/");
    const input = page.locator(".search input");
    await input.fill("ppf");
    await expect(page.locator(".tc-search-pop")).toHaveClass(/is-on/);

    await input.press("Escape");
    await expect(page.locator(".tc-search-pop")).not.toHaveClass(/is-on/);
  });

  test("không có kết quả thì báo rõ ràng", async ({ page }) => {
    await page.goto("/");
    await page.locator(".search input").fill("zzzkhongtontaiabc");
    await expect(page.locator(".tc-search-empty")).toContainText("Không tìm thấy");
  });

  test("truy vấn dưới 2 ký tự không gọi API", async ({ page }) => {
    const calls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/search")) {
        calls.push(request.url());
      }
    });

    await page.goto("/");
    await page.locator(".search input").fill("a");
    await page.waitForTimeout(500);
    expect(calls).toEqual([]);
  });

  test("API trả JSON đúng cấu trúc", async ({ request }) => {
    const response = await request.get("/api/search?q=ppf");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.hits)).toBe(true);
    expect(body.hits.length).toBeGreaterThan(0);
    for (const hit of body.hits) {
      expect(hit).toMatchObject({
        pageTitle: expect.any(String),
        slug: expect.any(String),
        route: expect.stringMatching(/^\//),
        itemId: expect.any(String),
        snippet: expect.any(String),
        score: expect.any(Number),
      });
    }
  });

  test("API từ chối truy vấn quá dài", async ({ request }) => {
    const response = await request.get(`/api/search?q=${"x".repeat(200)}`);
    expect(response.status()).toBe(400);
  });
});
