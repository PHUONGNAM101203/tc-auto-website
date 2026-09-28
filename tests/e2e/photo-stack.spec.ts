import { expect, test } from "@playwright/test";

/**
 * Bang chuyen chong the: bam mui ten thi tam tren cung LUOT SANG PHAI roi moi
 * chuyen ra sau chong — khong phai mo cheo tai cho.
 * Xem src/components/site/PhotoSlider.tsx.
 */
test.describe("băng chuyền chồng thẻ", () => {
  const state = (page: import("@playwright/test").Page) =>
    page.evaluate(() => {
      const box = document.querySelector(".tc-photoslider");
      if (!box) {
        return [];
      }
      return [...box.querySelectorAll(".tc-photoslide")].map((img) => ({
        on: img.hasAttribute("data-on"),
        leaving: img.getAttribute("data-leaving"),
        // Phan tinh tien ngang cua ma tran transform.
        x: Number(getComputedStyle(img).transform.split(",").slice(-2)[0]) || 0,
        opacity: Number(getComputedStyle(img).opacity),
      }));
    });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator(".tc-photoslider").first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tc-photoslide")].every(
        (img) => img.complete && img.naturalWidth > 1,
      ),
    );
    await page.waitForTimeout(300);
  });

  test("lúc nghỉ chỉ tấm đầu hiện, đúng vị trí gốc", async ({ page }) => {
    const rows = await state(page);
    expect(rows.length).toBeGreaterThan(1);
    expect(rows[0].on).toBe(true);
    // Tam dau cat tu chinh ban thiet ke nen phai o dung goc, khong bien dang.
    expect(rows[0].x).toBe(0);
    expect(rows[0].opacity).toBe(1);
    for (const row of rows.slice(1)) {
      expect(row.opacity).toBe(0);
    }
  });

  test("bấm mũi tên thì tấm trên cùng lướt sang phải rồi ra sau chồng", async ({
    page,
  }) => {
    await page.locator(".tc-photoslider-arrow:not([data-dir='prev'])").first().click();

    // Giua chung: tam cu mang dau hieu dang roi di va DA dich sang phai.
    await expect
      .poll(async () => (await state(page))[0].x, {
        message: "tấm đầu phải trượt sang phải",
      })
      .toBeGreaterThan(10);
    const mid = await state(page);
    expect(mid[0].leaving).toBe("1");
    expect(mid[0].opacity).toBeLessThan(1);

    // Xong: tam thu hai len hang, tam cu ve sau chong.
    await expect.poll(async () => (await state(page))[1].opacity).toBe(1);
    // Tam cu con truot NGUOC ve cho trong chong them mot nhip nua. Luc do do
    // mo cua no da bang 0 nen khong ai thay, nhung phai cho no ve han roi moi
    // chot — khong thi test bat dung giua duong ve.
    await expect.poll(async () => (await state(page))[0].x).toBe(0);
    const done = await state(page);
    expect(done[1].on).toBe(true);
    expect(done[0].opacity).toBe(0);
    expect(done[0].leaving).toBeNull();
  });

  test("bấm mũi tên lùi thì lướt sang trái", async ({ page }) => {
    const prev = page.locator(".tc-photoslider-arrow[data-dir='prev']").first();
    if ((await prev.count()) === 0) {
      test.skip(true, "slider này không có mũi tên lùi trong thiết kế");
    }
    await prev.click();
    await expect
      .poll(async () => (await state(page))[0].x)
      .toBeLessThan(-10);
  });
});
