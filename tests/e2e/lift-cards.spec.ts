import { expect, test } from "@playwright/test";

/**
 * Bon o muc "Công nghệ" tren trang chu: ro chuot vao o nao thi o do noi len.
 */
test.describe("bốn ô Công nghệ trên trang chủ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator(".tc-lift").scrollIntoViewIfNeeded();
    // Cho anh bon o tai xong han roi moi do: do som thi kich thuoc con dang
    // thay doi va phep so sanh "o nao nhich len" khong con nghia.
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".tc-lift-card img").length > 0 &&
        [
          ...document.querySelectorAll<HTMLImageElement>(".tc-lift-card img"),
        ].every((img) => img.complete && img.naturalWidth > 1),
    );
    await page.waitForTimeout(250);
  });

  /**
   * KHONG cho "toi khi het chuyen dong", va cung khong cho mot khoang co dinh.
   *
   * Cach cho-het-chuyen-dong tung duoc dung o day nhung no tu lua: neu may dang
   * ban (Playwright chay nhieu luong song song) thi ca hai lan do deu xay ra
   * TRUOC khi hieu ung kip bat dau, hai lan bang nhau, no ket luan "da dung"
   * trong khi the chua he nhich. Con cho mot khoang co dinh thi hut khi may cham.
   *
   * Nen o duoi dung `expect.poll`: doi cho den khi dat DUNG TRANG THAI CAN CO.
   * Chua toi thi thu lai, toi roi thi di tiep ngay.
   */

  /**
   * Do do cao cua tung o SO VOI khung chua, khong phai so voi man hinh:
   * `hover()` tu cuon trang vao tam nhin nen moi toa do tuyet doi deu doi.
   */
  const tops = (page: import("@playwright/test").Page) =>
    page.$$eval(".tc-lift-card", (els) => {
      const base = els[0].parentElement!.getBoundingClientRect().top;
      return els.map((el) => el.getBoundingClientRect().top - base);
    });

  test("rê chuột vào ô nào thì đúng ô đó nổi lên", async ({ page }) => {
    const boxes = page.locator(".tc-lift-card");
    await expect(boxes).toHaveCount(4);

    const before = await tops(page);
    // Bon o von nam cung mot hang.
    expect(new Set(before.map((t) => Math.round(t))).size).toBe(1);

    await boxes.nth(2).hover();
    await expect
      .poll(async () => (await tops(page))[2], { message: "ô 2 phải nổi lên" })
      .toBeLessThan(before[2] - 6);
    const after = await tops(page);

    // Dung o duoc tro vao di len; ba o kia khong di len.
    expect(after[2]).toBeLessThan(before[2] - 6);
    for (const index of [0, 1, 3]) {
      expect(
        after[index],
        `ô ${index} không được nổi lên`,
      ).toBeGreaterThanOrEqual(before[index] - 1);
    }
  });

  test("ba ô còn lại mờ đi để ô đang trỏ nổi bật", async ({ page }) => {
    const opacity = () =>
      page.$$eval(".tc-lift-card", (els) =>
        els.map((el) => Number(getComputedStyle(el).opacity)),
      );

    expect(await opacity()).toEqual([1, 1, 1, 1]);
    await page.locator(".tc-lift-card").first().hover();
    await expect
      .poll(async () => (await opacity())[1], { message: "ô 1 phải mờ đi" })
      .toBeLessThan(1);

    const after = await opacity();
    expect(after[0]).toBe(1);
    for (const index of [1, 2, 3]) {
      expect(after[index]).toBeLessThan(1);
    }
  });

  test("mỗi ô bấm được và dẫn tới trang công nghệ", async ({ page }) => {
    const hrefs = await page.$$eval(".tc-lift-card", (els) =>
      els.map((el) => el.getAttribute("href")),
    );
    expect(hrefs).toEqual([
      "/cong-nghe/tien-phong-cong-nghe",
      "/cong-nghe/ung-dung",
      "/cong-nghe",
      "/cong-nghe",
    ]);

    await page.locator(".tc-lift-card").first().click();
    await expect(page).toHaveURL("/cong-nghe/tien-phong-cong-nghe");
  });
});

/**
 * Hai the muc "Câu chuyện đồng hành" tren trang Dai ly — cung co che nhac len.
 */
test.describe("hai thẻ Câu chuyện đồng hành", () => {
  test("rê chuột vào thẻ nào thì thẻ đó nổi lên, thẻ kia mờ đi", async ({
    page,
  }) => {
    await page.goto("/dai-ly");
    await page.locator(".tc-lift").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [
        ...document.querySelectorAll<HTMLImageElement>(".tc-lift-card img"),
      ].every((img) => img.complete && img.naturalWidth > 1),
    );
    await page.waitForTimeout(300);

    const cards = page.locator(".tc-lift-card");
    await expect(cards).toHaveCount(2);

    const read = () =>
      page.$$eval(".tc-lift-card", (els) => {
        const base = els[0].parentElement!.getBoundingClientRect().top;
        return els.map((el) => ({
          top: el.getBoundingClientRect().top - base,
          opacity: Number(getComputedStyle(el).opacity),
        }));
      });

    const before = await read();
    expect(before[0].top).toBeCloseTo(before[1].top, 0);

    await cards.first().hover();
    await expect
      .poll(async () => (await read())[0].top, {
        message: "thẻ 0 phải nổi lên",
      })
      .toBeLessThan(before[0].top - 6);
    const after = await read();

    expect(after[0].top).toBeLessThan(before[0].top - 6);
    expect(after[0].opacity).toBe(1);
    expect(after[1].opacity).toBeLessThan(1);
  });
});
