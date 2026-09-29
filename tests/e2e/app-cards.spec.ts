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
    await expect
      .poll(
        async () => {
          await card.hover();
          return (await shift())[0];
        },
        { message: "ruột thẻ 0 phải nhấc lên" },
      )
      .toBeLessThan(-4);

    // Dung the duoc tro vao nhac len; hai the kia dung yen.
    const after = await shift();
    expect(after[0], "thẻ 0 phải nhấc").toBeLessThan(-4);
    expect(after[1], "thẻ 1 không được nhấc").toBe(0);
    expect(after[2], "thẻ 2 không được nhấc").toBe(0);
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
