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
   * Do bang CHINH GIA TRI DICH CHUYEN cua o, khong do vi tri tren trang.
   *
   * Cach cu do `getBoundingClientRect().top` so voi khung chua. No dung, nhung
   * phu thuoc vao viec trang da nam yen chua: luc cac lat nen phia duoi con
   * dang tai thi trang con dan xuong, o truot ra khoi duoi con tro, trinh
   * duyet coi nhu het ro chuot va o ha xuong — phep so cho ket qua sai. Doc
   * thang `transform` thi trang co xe dich bao nhieu lan cung khong anh huong.
   */
  const shift = (page: import("@playwright/test").Page) =>
    page.$$eval(".tc-lift-card", (els) =>
      els.map(
        (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42,
      ),
    );

  test("rê chuột vào ô nào thì đúng ô đó nổi lên", async ({ page }) => {
    const boxes = page.locator(".tc-lift-card");
    await expect(boxes).toHaveCount(4);

    // Luc nghi bon o deu nam yen tren cung mot hang.
    expect(await shift(page), "lúc nghỉ không ô nào nổi").toEqual([0, 0, 0, 0]);

    // RO LAI o moi vong tham do — xem chu thich trong app-cards.spec.ts: neu
    // trang xe dich ngay sau khi `hover()` tinh xong toa do thi con tro nam
    // hut ra ngoai o va khong bao gio tu sua.
    const target = boxes.nth(2);
    await expect
      .poll(
        async () => {
          await target.hover();
          return (await shift(page))[2];
        },
        { message: "ô 2 phải nổi lên" },
      )
      .toBeLessThan(-6);

    // Dung o duoc tro vao di LEN. Ba o kia thi thiet ke cho LUN XUONG +2px cho
    // o dang tro noi bat — nen dieu phai kiem la chung KHONG NOI LEN, chu
    // khong phai chung dung yen.
    const after = await shift(page);
    expect(after[2], "ô 2 phải nổi").toBeLessThan(-6);
    for (const index of [0, 1, 3]) {
      expect(
        after[index],
        `ô ${index} không được nổi lên`,
      ).toBeGreaterThanOrEqual(0);
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

    // Cung ly do voi hai test tren: doc `transform` chu khong doc vi tri tren
    // trang, de trang co xe dich thi phep do van dung.
    const read = () =>
      page.$$eval(".tc-lift-card", (els) =>
        els.map((el) => ({
          shift: new DOMMatrixReadOnly(getComputedStyle(el).transform).m42,
          opacity: Number(getComputedStyle(el).opacity),
        })),
      );

    expect((await read()).map((r) => r.shift)).toEqual([0, 0]);

    const first = cards.first();
    await expect
      .poll(
        async () => {
          await first.hover();
          return (await read())[0].shift;
        },
        { message: "thẻ 0 phải nổi lên" },
      )
      .toBeLessThan(-6);
    const after = await read();

    expect(after[0].shift, "thẻ 0 phải nổi").toBeLessThan(-6);
    expect(after[1].shift, "thẻ 1 không được nổi lên").toBeGreaterThanOrEqual(
      0,
    );
    expect(after[0].opacity).toBe(1);
    expect(after[1].opacity).toBeLessThan(1);
  });
});
