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

    // Do bang CHINH GIA TRI DICH CHUYEN cua the, khong do vi tri tren trang.
    //
    // Cach cu lay `getBoundingClientRect().top` so voi khung chua. No dung,
    // nhung phu thuoc vao viec trang da nam yen chua: luc cac lat nen phia
    // duoi con dang tai thi trang con dan xuong, phan tu truot ra khoi duoi
    // con tro, trinh duyet coi nhu het ro chuot va the ha xuong — phep so cho
    // ket qua sai. Doc thang `transform` thi bao nhieu lan trang xe dich cung
    // khong anh huong.
    const shift = () =>
      page.$$eval(".tc-card-lift", (els) =>
        els.map(
          (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42,
        ),
      );

    expect(await shift(), "lúc nghỉ không thẻ nào nhấc").toEqual([0, 0, 0]);

    // RO LAI o moi vong tham do, khong ro mot lan roi thoi.
    //
    // `hover()` tinh toa do tam the RO̲I moi dua chuot toi. Neu ngay sau do
    // trang xe dich (lat nen phia duoi vua tai xong) thi con tro nam hut ra
    // ngoai the, ma chuot khong di chuyen nua nen khong bao gio tu sua —
    // transform dung yen o 0 cho den het gio. Ro lai moi vong thi mot lan xe
    // dich khong lam hong ca phep do.
    const card = page.locator(".tc-card").first();
    // Giu lai ket qua doc duoc NGAY TRONG vong doi, khong doc lai sau do.
    //
    // Doc lai sau khi `poll` xong la mot cua so ho: giua hai lan doc, chi can
    // trang xe dich mot nhip (lat nen phia duoi vua tai xong) la con tro tuot
    // ra khoi the, the ha xuong, va phep do thanh 0 du vua moi thay no nhac.
    // Day la cho da lam test nay do that thuong — chay rieng thi qua, chay ca
    // bo thi thinh thoang truot.
    let seen: number[] = [];
    await expect
      .poll(
        async () => {
          await card.hover();
          seen = await shift();
          return seen[0];
        },
        { message: "ruột thẻ 0 phải nhấc lên" },
      )
      .toBeLessThan(-4);

    // Dung the duoc tro vao nhac len; hai the kia dung yen.
    expect(seen[0], "thẻ 0 phải nhấc").toBeLessThan(-4);
    expect(seen[1], "thẻ 1 không được nhấc").toBe(0);
    expect(seen[2], "thẻ 2 không được nhấc").toBe(0);
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

/**
 * Ba the muc "Ứng dụng" tren trang Cong nghe.
 *
 * Bam the nao thi di THANG sang trang cua the do. Ro chuot thi the noi len,
 * chi vay thoi.
 *
 * Truoc day bam the ben canh thi ruot cua no chay vao khung giua nhu mot bang
 * chuyen, va chi the dang o giua moi dan sang trang. Khach bo han cach do
 * (02/10/2026): "bấm cái nào nó vào cái đấy luôn không cần ra giữa nữa mà chỉ
 * có khi hover nó nổi lên thôi".
 */
test.describe("ba thẻ Ứng dụng", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cong-nghe");
    await page.locator(".tc-cards").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  });

  test("bấm thẻ nào thì đi THẲNG sang trang của thẻ đó", async ({ page }) => {
    const cards = page.locator(".tc-card");
    await expect(cards).toHaveCount(3);

    for (let index = 0; index < 3; index += 1) {
      await page.goto("/cong-nghe");
      await page.locator(".tc-cards").scrollIntoViewIfNeeded();
      const card = page.locator(".tc-card").nth(index);
      const href = await card.getAttribute("href");
      await card.click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
    }
  });

  test("thẻ nào cũng là liên kết — không còn nút đổi chỗ", async ({ page }) => {
    const tags = await page.$$eval(".tc-card", (els) => els.map((el) => el.tagName));
    expect(tags).toEqual(["A", "A", "A"]);
  });

  test("ba thẻ dẫn tới ba trang KHÁC NHAU", async ({ page }) => {
    // Hoi truoc "Hiệu suất" khong co trang rieng nen no tro ve trang "Ứng
    // dụng" — ma trang do mo ra lai thay tieu de "KHO ỨNG DỤNG", nguoi dung
    // tuong bam nham (khach bao 30/09/2026). Nay moi the mot dich.
    const hrefs = await page.$$eval(".tc-card", (els) =>
      els.map((el) => el.getAttribute("href")),
    );
    expect(new Set(hrefs).size).toBe(3);
  });

  test("ảnh thẻ phủ KÍN khung — không còn hình vuông trong hình vuông", async ({
    page,
  }) => {
    // Khung bo tron ve chet trong anh nen; truoc day anh the cat thut vao
    // trong no 24px moi ben nen lo ra hai hinh vuong long nhau.
    for (const gap of await page.$$eval(".tc-card", (els) =>
      els.map((el) => {
        const box = el.getBoundingClientRect();
        const img = el.querySelector("img")!.getBoundingClientRect();
        return Math.round(
          Math.max(
            img.left - box.left,
            box.right - img.right,
            img.top - box.top,
            box.bottom - img.bottom,
          ),
        );
      }),
    )) {
      expect(gap).toBeLessThanOrEqual(1);
    }
  });

  test("rê chuột vào thẻ nào thì đúng thẻ đó nổi lên", async ({ page }) => {
    const card = page.locator(".tc-card").first();
    const lift = card.locator(".tc-card-lift");
    const at = () => lift.evaluate((el) => getComputedStyle(el).transform);

    const rest = await at();
    await card.hover();
    await expect.poll(async () => (await at()) !== rest).toBe(true);
  });
});
