import { expect, test } from "@playwright/test";

/**
 * Hai tab WINCA / BRAVO tren trang "Màn hình ô tô".
 *
 * Truoc day BRAVO la mot LIEN KET sang trang rieng. Khach bao hai lan rang y
 * khong phai vay: bam BRAVO thi luoi san pham doi NGAY TAI CHO nhu mot tab
 * that, khong roi trang (01/10/2026).
 *
 * Luoi Winca duoc ve chet trong anh nen — chi 9 nut "XEM THÊM" la phan tu
 * that. Nen tab Bravo che kin vung luoi roi ve ba the that len tren.
 */
const PAGE = "/giai-phap/man-hinh";

test.describe("tab WINCA / BRAVO — bản desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("bấm BRAVO thì đổi lưới ngay tại chỗ, KHÔNG rời trang", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator(".tc-screen-tab")).toHaveCount(2);
    await expect(page.locator(".tc-screen-card")).toHaveCount(0);

    await page.locator(".tc-screen-tab").nth(1).click();

    await expect(page).toHaveURL(new RegExp(`${PAGE}$`));
    await expect(page.locator(".tc-screen-card")).toHaveCount(3);
  });

  test("bấm lại WINCA thì lưới cũ trở về", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator(".tc-screen-tab").nth(1).click();
    await expect(page.locator(".tc-screen-card")).toHaveCount(3);

    await page.locator(".tc-screen-tab").nth(0).click();
    await expect(page.locator(".tc-screen-card")).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`${PAGE}$`));
  });

  test("ở tab Bravo thì nút XEM THÊM và phân trang của Winca phải tắt", async ({
    page,
  }) => {
    // Chung tro toi san pham Winca — de lai la bam vao ra nham san pham.
    await page.goto(PAGE);
    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect(page.locator(".tc-readmore").first()).toBeVisible();

    await page.locator(".tc-screen-tab").nth(1).click();
    await expect(page.locator(".tc-readmore:visible")).toHaveCount(0);
    await expect(page.locator(".tc-pager:visible")).toHaveCount(0);
  });

  test("ba thẻ Bravo đều có ảnh tải được và dẫn tới trang thông số", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator(".tc-screen-tab").nth(1).click();

    const cards = page.locator(".tc-screen-card");
    for (let index = 0; index < 3; index += 1) {
      const card = cards.nth(index);
      await expect(card).toHaveAttribute("href", "/giai-phap/man-hinh/bravo");
      const loaded = await card
        .locator("img")
        .evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 1);
      expect(loaded, `thẻ ${index + 1} phải tải được ảnh`).toBe(true);
    }
  });

  test("ảnh trong thẻ không tràn ra đè lên chữ", async ({ page }) => {
    // Anh hang cao hon khung (chung goi ca ten dong lan day o thong so). Hoi
    // dau `place-items: center` cho chung tran xuong de len ten va mo ta, roi
    // `padding` lam anh cao hon khung dung hai lan padding.
    //
    // Do bang `expect.poll` chu khong do mot phat: trong mot nhip ngan luc anh
    // duoc hoan doi, hop anh bi lech vai pixel so voi khung du chieu cao hai
    // ben deu dung 241px. Do mot phat thi cu vai lan lai bao sai oan mot lan.
    await page.goto(PAGE);
    await page.locator(".tc-screen-tab").nth(1).click();
    const card = page.locator(".tc-screen-card").first();

    await expect
      .poll(
        async () =>
          card.evaluate((el) => {
            const art = el.querySelector(".tc-screen-art")!.getBoundingClientRect();
            const img = el.querySelector("img")!.getBoundingClientRect();
            return Math.round(img.bottom - art.bottom);
          }),
        { message: "ảnh không được tràn xuống dưới khung" },
      )
      .toBeLessThanOrEqual(1);
  });

  test("trang Bravo riêng vẫn còn — thẻ dẫn tới đó để xem thông số", async ({
    request,
  }) => {
    expect((await request.get("/giai-phap/man-hinh/bravo")).status()).toBe(200);
  });
});

test.describe("tab WINCA / BRAVO — bản điện thoại", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("lưới xếp ĐÚNG HAI CỘT", async ({ page }) => {
    await page.goto(PAGE);
    const columns = await page
      .locator(".tc-m-prods-2")
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(2);
  });

  test("bấm BRAVO đổi lưới tại chỗ, không rời trang", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator(".tc-m-prods-2 li")).toHaveCount(9);

    await page.locator(".tc-m-tab").nth(1).click();
    await expect(page.locator(".tc-m-prods-2 li")).toHaveCount(3);
    await expect(page).toHaveURL(new RegExp(`${PAGE}$`));
  });

  test("hai tab đều đạt 44px và khai đúng trạng thái cho máy đọc", async ({ page }) => {
    await page.goto(PAGE);
    const tabs = page.locator(".tc-m-tab");
    await expect(tabs).toHaveCount(2);
    for (const height of await tabs.evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect().height),
    )) {
      expect(height).toBeGreaterThanOrEqual(44);
    }
    await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "false");
  });
});
