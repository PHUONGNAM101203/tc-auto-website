import { expect, test } from "@playwright/test";

/**
 * Trang "Câu hỏi thường gặp" va tep /llms.txt.
 *
 * Hai thu nay phuc vu may tra loi bang AI: chung doc dang hoi-dap truoc het
 * khi tom tat mot doanh nghiep. Xem src/lib/faq.ts va src/app/llms.txt.
 */
test.describe("hỏi đáp và llms.txt", () => {
  test("trang hỏi đáp liệt kê đủ câu và khai FAQPage", async ({ page }) => {
    await page.goto("/cau-hoi-thuong-gap");
    const items = page.locator(".tc-faq-item");
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(8);

    // Cau nao cung phai co ca cau hoi lan cau tra loi.
    for (let i = 0; i < count; i += 1) {
      await expect(items.nth(i).locator("h2")).not.toBeEmpty();
      const answer = await items.nth(i).locator("p").textContent();
      expect((answer ?? "").trim().length).toBeGreaterThan(40);
    }

    const blobs = await page.$$eval(
      'script[type="application/ld+json"]',
      (els) => els.map((el) => JSON.parse(el.textContent ?? "{}")),
    );
    const faq = blobs.find((b) => b["@type"] === "FAQPage");
    expect(faq).toBeTruthy();
    // Mau khai phai KHOP so cau hien tren trang — Google phat trang khai lech.
    expect(faq.mainEntity).toHaveLength(count);
    for (const entry of faq.mainEntity) {
      expect(entry.acceptedAnswer.text.length).toBeGreaterThan(40);
    }
  });

  test("llms.txt nói đúng số mẫu và số câu hỏi", async ({ request, page }) => {
    const txt = await (await request.get("/llms.txt")).text();
    expect(txt).toContain("TC Auto Solutions");
    expect(txt).toContain("/sitemap.xml");
    expect(txt).toContain("/cau-hoi-thuong-gap");

    // Con so trong tep phai sinh TU DU LIEU, khong go tay — kiem bang cach so
    // voi so the that tren trang danh muc.
    await page.goto("/giai-phap/man-hinh/tat-ca");
    const models = await page.locator(".tc-cat-item").count();
    expect(txt).toContain(`Màn hình ô tô: ${models} mẫu`);

    await page.goto("/cau-hoi-thuong-gap");
    const faqs = await page.locator(".tc-faq-item").count();
    expect(txt).toContain(`): ${faqs} câu về sản`);
  });

  test("trang hỏi đáp có mặt trong sitemap", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("/cau-hoi-thuong-gap");
  });

  test("robots cho phép rõ các máy thu thập của trợ lý AI", async ({
    request,
  }) => {
    const txt = await (await request.get("/robots.txt")).text();
    for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      expect(txt, bot).toContain(bot);
    }
    // Nhung van phai chan khu quan tri cho TUNG con, khong chi cho `*`.
    const blocks = txt.split(/User-Agent:/i).filter((b) => b.includes("GPTBot"));
    expect(blocks[0]).toContain("/admin");
  });
});
