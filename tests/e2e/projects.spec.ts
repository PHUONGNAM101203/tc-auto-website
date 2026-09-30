import { expect, test } from "@playwright/test";

/**
 * Dai anh "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" o cuoi trang Giai phap.
 *
 * Thiet ke ve chet mot dai nam tam nghieng dan ra hai ben — y la mot bang
 * chuyen. Khach muon bam vao tam nao thi tam do chay vao giua (30/09/2026).
 */
test.describe("dải ảnh dự án", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/giai-phap");
    await page.locator(".tc-proj").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tc-proj img")].every(
        (img) => img.complete && img.naturalWidth > 1,
      ),
    );
    await page.waitForTimeout(400);
  });

  test("có bốn tấm, một tấm nằm giữa", async ({ page }) => {
    await expect(page.locator(".tc-proj-card")).toHaveCount(4);
    await expect(page.locator(".tc-proj-card[data-on]")).toHaveCount(1);
  });

  test("bấm tấm bên cạnh thì chính tấm đó chạy vào giữa", async ({ page }) => {
    const side = page.locator(".tc-proj-card:not([data-on])").first();
    const label = await side.getAttribute("aria-label");
    await side.click();
    await page.waitForTimeout(900);

    const middle = page.locator(".tc-proj-card[data-on]");
    await expect(middle).toHaveCount(1);
    const now = await middle.getAttribute("aria-label");
    // Nhan doi khi vao giua: bo phan "— bấm để xem ở giữa".
    expect(label).toContain(now!.split(" — ")[0]);
  });

  test("tấm giữa TO NHẤT và rõ nhất", async ({ page }) => {
    const read = () =>
      page.$$eval(".tc-proj-card", (els) =>
        els.map((el) => {
          const cs = getComputedStyle(el);
          return {
            on: el.hasAttribute("data-on"),
            scale: new DOMMatrixReadOnly(cs.transform).a,
            opacity: Number(cs.opacity),
          };
        }),
      );
    const cards = await read();
    const middle = cards.find((c) => c.on)!;
    for (const other of cards.filter((c) => !c.on)) {
      expect(other.scale).toBeLessThan(middle.scale);
      expect(other.opacity).toBeLessThanOrEqual(middle.opacity);
    }
  });

  test("dải đã được xoá khỏi ảnh nền, không lộ bản vẽ sẵn phía sau", async ({
    page,
  }) => {
    // Nen quanh dai la TRANG THUAN; neu chua xoa thi phia sau con nam tam anh.
    const strip = await page.evaluate(() => {
      const box = document.querySelector(".tc-proj")!.getBoundingClientRect();
      return { top: Math.round(box.top), height: Math.round(box.height) };
    });
    expect(strip.height).toBeGreaterThan(100);
  });

  test("tự chạy, và dừng khi rê chuột", async ({ page }) => {
    const at = () =>
      page.$eval(".tc-proj-card[data-on]", (el) =>
        el.getAttribute("aria-label"),
      );
    const before = await at();
    await page.waitForTimeout(6000);
    expect(await at(), "dải phải tự chạy").not.toBe(before);

    const strip = page.locator(".tc-proj");
    let stopped = false;
    for (let round = 0; round < 25 && !stopped; round += 1) {
      await strip.hover().catch(() => undefined);
      await page.waitForTimeout(120);
      stopped = (await strip.getAttribute("data-playing")) === null;
    }
    expect(stopped, "rê chuột thì phải dừng").toBe(true);
  });
});
