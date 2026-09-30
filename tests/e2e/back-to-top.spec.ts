import { expect, test } from "@playwright/test";

/**
 * Nut "len dau trang".
 *
 * Khach khong dung header dinh (sticky) vi header nam TRONG anh nen canvas —
 * dinh no lai la phai tach khoi anh, lech pixel ngay. Nen thay bang mot nut
 * noi o goc duoi: cuon xuong sau thi bam mot cai la ve lai cho co menu.
 * Xem src/components/site/BackToTop.tsx.
 */
const PAGES = ["/", "/giai-phap", "/nhan-su", "/trai-nghiem/hanh-trinh"];

test.describe("nút lên đầu trang", () => {
  test("ở đầu trang thì KHÔNG hiện, cuộn xuống mới hiện", async ({ page }) => {
    await page.goto("/");
    const btn = page.locator(".tc-totop");
    await expect(btn).toHaveCount(1);
    await expect(btn, "đang ở đầu trang thì không cần nút").toBeHidden();

    await page.evaluate(() => window.scrollTo(0, 2200));
    await expect(btn, "cuộn xuống thì nút phải hiện ra").toBeVisible();
  });

  test("bấm thì về đầu trang và thấy được menu", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.locator(".tc-totop").click();
    await page.waitForFunction(() => window.scrollY < 4, null, { timeout: 4000 });

    // Ve den noi thi menu phai nam trong khung nhin — do moi la muc dich.
    const nav = page.locator(".hdr a.nv").first();
    await expect(nav).toBeInViewport();
    await expect(page.locator(".tc-totop")).toBeHidden();
  });

  test("bàn phím dùng được: tab tới, Enter là về đầu", async ({ page }) => {
    await page.goto("/giai-phap");
    await page.evaluate(() => window.scrollTo(0, 2500));
    const btn = page.locator(".tc-totop");
    await btn.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => window.scrollY < 4, null, { timeout: 4000 });
    // Sau khi ve dau, con tro ban phim phai o tren header — khong thi nguoi
    // dung ban phim quay lai vi tri cu, bam Tab la roi xuong cuoi trang.
    const onHeader = await page.evaluate(
      () => !!document.activeElement?.closest(".hdr, .tc-m-top"),
    );
    expect(onHeader, "con trỏ phải nhảy lên header").toBe(true);
  });

  test("có mặt ở mọi trang, cả trang chính lẫn trang con", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator(".tc-totop"), path).toHaveCount(1);
    }
  });

  test("không đè lên nội dung: nút nằm ngoài luồng, góc dưới phải", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 2200));
    const box = (await page.locator(".tc-totop").boundingBox())!;
    const size = page.viewportSize()!;
    expect(box.x + box.width, "phải sát mép phải").toBeGreaterThan(
      size.width - 90,
    );
    expect(box.y + box.height, "phải sát mép dưới").toBeGreaterThan(
      size.height - 90,
    );
    // Du to de bam tren dien thoai (khuyen nghi 44px cua Apple/Google).
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  });

  test("trên điện thoại cũng có và bấm được", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 1800));
    const btn = page.locator(".tc-totop");
    await expect(btn).toBeVisible();
    await btn.click();
    await page.waitForFunction(() => window.scrollY < 4, null, { timeout: 4000 });
  });
});
