import { expect, test } from "@playwright/test";

/**
 * Dai the muc "Giải pháp" tren trang chu: chay vong MOT CHIEU sang trai va
 * khong bao gio het — dung nhu thiet ke, chi co mui ten phai.
 */
test.describe("dải thẻ Giải pháp", () => {
  const SLIDE_MS = 1300; // hoat anh 0,95s + le

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator(".tc-solutions").scrollIntoViewIfNeeded();
    // Chi cho BON the that dau tien: cac ban lap phia sau nam ngoai khung nhin
    // nen trinh duyet chua tai — dung y lazy-load. Chung dung chung URL nen khi
    // truot toi la co san trong bo nho dem, khong chop trang.
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tc-solution img")]
        .slice(0, 4)
        .every((img) => img.complete && img.naturalWidth > 1),
    );
    await page.waitForTimeout(250);
  });

  const offset = (page: import("@playwright/test").Page) =>
    page.$eval(".tc-solutions-strip", (strip) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(strip).transform);
      return Math.round(matrix.m41);
    });

  /** So the dang lo ra tron ven trong khung nhin. */
  const filled = (page: import("@playwright/test").Page) =>
    page.$eval(".tc-solutions", (view) => {
      const box = view.getBoundingClientRect();
      return [...view.querySelectorAll(".tc-solution")].filter((card) => {
        const rect = card.getBoundingClientRect();
        return (
          Number(getComputedStyle(card).opacity) > 0.9 &&
          rect.left >= box.left - 1 &&
          rect.right <= box.right + 1
        );
      }).length;
    });

  test("chỉ có mũi tên phải — đúng như thiết kế", async ({ page }) => {
    await expect(page.locator(".tc-solution-arrow")).toHaveCount(1);
    await expect(
      page.locator('.tc-solution-arrow[data-dir="next"]'),
    ).toBeVisible();
  });

  test("bấm mũi tên thì dải trượt sang trái đúng một thẻ", async ({ page }) => {
    expect(await offset(page)).toBe(0);
    const before = await page.$$eval(".tc-solution", (els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().left)),
    );

    await page.locator('.tc-solution-arrow[data-dir="next"]').click();
    await page.waitForTimeout(SLIDE_MS);

    const after = await page.$$eval(".tc-solution", (els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().left)),
    );
    // Moi the deu lui sang trai dung mot buoc, va buoc do bang nhau.
    const steps = before.map((left, i) => left - after[i]);
    expect(new Set(steps).size).toBe(1);
    expect(steps[0]).toBeGreaterThan(200);
  });

  test("bấm vào chính tấm ảnh cũng trượt một nhịp", async ({ page }) => {
    expect(await offset(page)).toBe(0);
    await page.locator(".tc-solution").nth(1).click();
    await page.waitForTimeout(SLIDE_MS);
    expect(await offset(page)).toBeLessThan(0);
  });

  test("thẻ thu về bên trái thì mờ dần chứ không bị cắt cụt", async ({
    page,
  }) => {
    const opacity = () =>
      page.$$eval(".tc-solution", (cards) =>
        cards.map((card) => Number(getComputedStyle(card).opacity)),
      );

    const start = await opacity();
    expect(start.slice(0, 4)).toEqual([1, 1, 1, 1]);

    await page.locator('.tc-solution-arrow[data-dir="next"]').click();
    await page.waitForTimeout(SLIDE_MS);

    const after = await opacity();
    // Dung mot the nua da mo han sau moi nhip.
    expect(after[0]).toBe(0);
    expect(after[1]).toBe(1);
  });

  test("chạy mãi không hết: qua trọn một vòng vẫn tiếp tục được", async ({
    page,
  }) => {
    const laps = 2;
    const cards = await page.locator(".tc-solution").count();
    const perLap = 4; // so the that, truoc khi lap lai

    for (let i = 0; i < perLap * laps; i += 1) {
      const before = await offset(page);
      await page.locator('.tc-solution-arrow[data-dir="next"]').click();

      // Doi DEN KHI dai thuc su truot xong roi moi dem.
      //
      // Truoc day cho nay ngu dung SLIDE_MS. May ban thi khoang do troi qua ma
      // hieu ung con dang chay, phep dem bat dung giua chung va bao khung nhin
      // bi trong — test chap chon vi the. Nhung CHI doi `filled >= 3` cung sai:
      // dieu kien do dung ngay tu truoc khi truot, vong lap ban lien mot loat
      // cu bam, va den cuoi dai khong ve duoc vi tri dau.
      //
      // Dieu kien dung la: do dich chuyen DA DOI so voi truoc khi bam, roi
      // DUNG YEN. Luc do mot nhip moi that su tron ven.
      await expect
        .poll(() => offset(page), { message: `nhịp ${i + 1} phải chạy` })
        .not.toBe(before);
      let last = Number.NaN;
      await expect
        .poll(
          async () => {
            const now = await offset(page);
            const stable = now === last;
            last = now;
            return stable;
          },
          { message: `nhịp ${i + 1} phải dừng hẳn`, intervals: [120] },
        )
        .toBe(true);

      // Khung nhin khong bao gio bi trong.
      expect(await filled(page), `sau nhịp ${i + 1}`).toBeGreaterThanOrEqual(3);
    }

    // Ve dung vi tri dau — vong lai lien mach chu khong truot mai ra vo cuc.
    expect(await offset(page)).toBe(0);
    expect(cards).toBeGreaterThan(perLap);
  });
});
