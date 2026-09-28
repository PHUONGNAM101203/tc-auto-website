import { expect, test } from "@playwright/test";

/**
 * Thiet ke ve mot mui ten "›" tren chong anh muc "Câu chuyện khởi nghiệp".
 * Mui ten do phai bam duoc va doi anh that.
 */
test.describe("slider ảnh Câu chuyện khởi nghiệp", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator(".tc-photoslider").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tc-photoslide")].every(
        (img) => img.complete && img.naturalWidth > 1,
      ),
    );
    await page.waitForTimeout(300);
  });

  const shown = (page: import("@playwright/test").Page) =>
    page.$$eval(".tc-photoslide[data-on]", (els) =>
      els.map((el) => el.getAttribute("src")!.split("/").pop()),
    );

  test("bấm mũi tên thì đổi sang ảnh khác", async ({ page }) => {
    const before = await shown(page);
    expect(before).toHaveLength(1);

    await page.locator(".tc-photoslider-arrow").click();
    await page.waitForTimeout(800);

    const after = await shown(page);
    expect(after).toHaveLength(1);
    expect(after[0]).not.toBe(before[0]);
  });

  test("chạy vòng: qua hết ảnh thì quay lại ảnh đầu", async ({ page }) => {
    const first = (await shown(page))[0];
    const count = await page.locator(".tc-photoslide").count();
    expect(count).toBeGreaterThanOrEqual(2);

    const seen = new Set<string>([first!]);
    for (let i = 1; i < count; i += 1) {
      await page.locator(".tc-photoslider-arrow").click();
      await page.waitForTimeout(800);
      seen.add((await shown(page))[0]!);
    }
    // Da di qua tat ca anh, khong lap lai giua chung.
    expect(seen.size).toBe(count);

    await page.locator(".tc-photoslider-arrow").click();
    await page.waitForTimeout(800);
    expect((await shown(page))[0]).toBe(first);
  });

  test("ảnh đầu phủ đúng chỗ tấm ảnh trong thiết kế", async ({ page }) => {
    const box = await page.locator(".tc-photoslider").evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const canvas = document.querySelector(".tc-canvas")!.getBoundingClientRect();
      const zoom = canvas.width / 1440;
      return {
        x: Math.round((rect.x - canvas.x) / zoom),
        width: Math.round(rect.width / zoom),
      };
    });
    expect(box.x).toBe(458);
    expect(box.width).toBe(876);
  });
});

/**
 * Mui ten "›" ben phai anh muc "Chân dung đại lý" tren trang Dai ly.
 */
test.describe("slider ảnh Chân dung đại lý", () => {
  test("bấm mũi tên thì đổi ảnh, chạy vòng không hết", async ({ page }) => {
    await page.goto("/dai-ly");
    await page.locator(".tc-photoslider").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tc-photoslide")].every(
        (img) => img.complete && img.naturalWidth > 1,
      ),
    );
    await page.waitForTimeout(300);

    const shown = () =>
      page.$$eval(".tc-photoslide[data-on]", (els) =>
        els.map((el) => el.getAttribute("src")!.split("/").pop()),
      );

    const count = await page.locator(".tc-photoslide").count();
    expect(count).toBeGreaterThanOrEqual(2);

    const first = (await shown())[0];
    await page.locator(".tc-photoslider-arrow").click();
    await page.waitForTimeout(800);
    expect((await shown())[0]).not.toBe(first);

    for (let i = 1; i < count; i += 1) {
      await page.locator(".tc-photoslider-arrow").click();
      await page.waitForTimeout(800);
    }
    expect((await shown())[0]).toBe(first);
  });
});

/**
 * Muc "Con người TC" tren trang Nhan su co CA HAI mui ten.
 */
test.describe("slider ảnh Con người TC", () => {
  test("bấm lùi và bấm tiến đều đổi ảnh, chạy vòng hai chiều", async ({ page }) => {
    await page.goto("/nhan-su");
    await page.locator(".tc-photoslider").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tc-photoslide")].every(
        (img) => img.complete && img.naturalWidth > 1,
      ),
    );
    await page.waitForTimeout(300);

    await expect(page.locator(".tc-photoslider-arrow")).toHaveCount(2);
    const shown = () =>
      page.$$eval(".tc-photoslide[data-on]", (els) =>
        els.map((el) => el.getAttribute("src")!.split("/").pop()),
      );

    const first = (await shown())[0];

    // Bam LUI tu anh dau -> phai nhay ve anh CUOI, khong chet cung.
    await page.locator('.tc-photoslider-arrow[data-dir="prev"]').click();
    await page.waitForTimeout(800);
    const back = (await shown())[0];
    expect(back).not.toBe(first);

    // Bam TIEN dua ve cho cu.
    await page.locator('.tc-photoslider-arrow:not([data-dir="prev"])').click();
    await page.waitForTimeout(800);
    expect((await shown())[0]).toBe(first);
  });
});
