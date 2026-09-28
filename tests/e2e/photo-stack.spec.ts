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
    // GHI LAI dinh thay vi bat dung khoanh khac.
    //
    // Lan dau test nay lay mau giua luc hoat anh chay, ma cua so do chi 520ms:
    // may ban thi mau dau tien roi vao luc da chay xong, x quay ve 0 va test
    // rot oan. Gio cai mot bo ghi chay theo tung khung hinh, ghi lai do dich
    // xa nhat — khong the truot mat nua.
    await page.evaluate(() => {
      const img = document.querySelector(".tc-photoslider .tc-photoslide");
      const w = window as unknown as { __peak: number };
      w.__peak = 0;
      const tick = () => {
        const x =
          Number(getComputedStyle(img!).transform.split(",").slice(-2)[0]) || 0;
        w.__peak = Math.max(w.__peak, x);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    await page
      .locator(".tc-photoslider-arrow:not([data-dir='prev'])")
      .first()
      .click();

    // Dau hieu `data-leaving` do React dat ngay khi bam va giu suot nhip truot,
    // nen doi no la chac chan.
    await expect
      .poll(async () => (await state(page))[0].leaving, {
        message: "tấm đầu phải được đánh dấu là đang rời đi",
      })
      .toBe("1");

    // Cho tron nhip roi doc dinh da ghi.
    await expect.poll(async () => (await state(page))[1].opacity).toBe(1);
    const peak = await page.evaluate(
      () => (window as unknown as { __peak: number }).__peak,
    );
    expect(peak, "tấm đầu phải trượt sang phải").toBeGreaterThan(10);

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
    await expect.poll(async () => (await state(page))[0].x).toBeLessThan(-10);
  });
});
