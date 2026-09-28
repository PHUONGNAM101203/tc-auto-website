import { expect, test } from "@playwright/test";

/**
 * Ba the muc "Ứng dụng" tren trang Cong nghe.
 * Khung nam trong anh nen; chi RUOT the duoc tach ra, nho vay ro chuot vao the
 * nao thi ruot the do nhac len. Bam la vao thang trang cua muc do.
 */
test.describe("ba thẻ Ứng dụng", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cong-nghe");
    await page.locator(".tc-cards").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tc-card img")].every(
        (img) => img.complete && img.naturalWidth > 1,
      ),
    );
    await page.waitForTimeout(250);
  });

  test("rê chuột vào thẻ nào thì ruột thẻ đó nhấc lên", async ({ page }) => {
    const lifts = page.locator(".tc-card-lift");
    await expect(lifts).toHaveCount(3);

    const tops = () =>
      page.$$eval(".tc-card-lift", (els) =>
        els.map(
          (el) =>
            el.getBoundingClientRect().top -
            el.closest(".tc-cards")!.getBoundingClientRect().top,
        ),
      );

    const before = await tops();
    await page.locator(".tc-card").first().hover();
    // Doi DUNG TRANG THAI CAN CO thay vi doi mot khoang co dinh — khoang co
    // dinh hut khi may ban vi chay nhieu luong song song.
    await expect
      .poll(async () => (await tops())[0], {
        message: "ruột thẻ 0 phải nhấc lên",
      })
      .toBeLessThan(before[0] - 4);
    const after = await tops();

    expect(after[0]).toBeLessThan(before[0] - 4);
    expect(after[1]).toBeCloseTo(before[1], 0);
    expect(after[2]).toBeCloseTo(before[2], 0);
  });

  test("khung thẻ không xê dịch khi rê chuột", async ({ page }) => {
    const boxes = () =>
      page.$$eval(".tc-card", (els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          const base = el.closest(".tc-cards")!.getBoundingClientRect();
          return [
            Math.round(r.left - base.left),
            Math.round(r.top - base.top),
            Math.round(r.width),
          ];
        }),
      );

    const before = await boxes();
    await page.locator(".tc-card").nth(1).hover();
    await page.waitForTimeout(600);
    expect(await boxes()).toEqual(before);
  });

  test("bấm là vào thẳng trang, không mở bảng nào", async ({ page }) => {
    await page.locator(".tc-card").nth(1).click();
    await expect(page).toHaveURL("/cong-nghe/ung-dung/kho-ung-dung");
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
});
