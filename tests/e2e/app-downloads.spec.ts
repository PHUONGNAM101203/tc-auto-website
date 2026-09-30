import { expect, test } from "@playwright/test";

/**
 * Nut "TẢI VỀ" tren hai trang kho ung dung.
 *
 * Khach gui trang cua hang (wincavn.com/file-download) va yeu cau "bấm vào là
 * tải thôi" (30/09/2026). Truoc do 30 cai nut do deu la hinh ve chet trong
 * anh, bam khong an.
 * Xem tools/brand/link-app-downloads.py va src/lib/hotspots.ts.
 */
const PAGES = [
  "/cong-nghe/ung-dung/kho-ung-dung",
  "/cong-nghe/ung-dung/cap-nhat-va-loi",
];

for (const path of PAGES) {
  test.describe(`nút tải về — ${path}`, () => {
    test("đủ 15 nút, nút nào cũng có tệp tải thật", async ({ page }) => {
      await page.goto(path);
      const links = page.locator('a[target="_blank"][href*="wincavn.com"]');
      await expect(links).toHaveCount(15);

      const rows = await links.evaluateAll((els) =>
        els.map((el) => ({
          href: el.getAttribute("href")!,
          rel: el.getAttribute("rel"),
          label: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "",
        })),
      );
      for (const row of rows) {
        expect(row.href, "phải là tệp tải, không phải trang").toMatch(
          /\.(apk|xapk|bin|zip|rar|iap)$/i,
        );
        // `rel` bat buoc di kem `target="_blank"`: khong co thi trang dich
        // voi tay sang duoc `window.opener` cua ta.
        expect(row.rel).toContain("noopener");
        expect(row.label.length).toBeGreaterThan(0);
      }
      // Moi app mot tep khac nhau — khong cai nao bi gan nham sang app khac.
      expect(new Set(rows.map((r) => r.href)).size).toBe(15);
    });

    test("nút nằm đúng trên hình nút vẽ trong ảnh", async ({ page }) => {
      await page.goto(path);
      const boxes = await page
        .locator('a[target="_blank"][href*="wincavn.com"]')
        .evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { w: Math.round(r.width), h: Math.round(r.height) };
          }),
        );
      // Nut ve chet rong 158 cao 32 trong he toa do canvas 1440; o be ngang
      // 1280 cua trinh duyet kiem thu, canvas thu 0,889 lan.
      for (const box of boxes) {
        expect(box.w).toBeGreaterThan(100);
        expect(box.h).toBeGreaterThan(20);
      }
    });
  });
}

test("thẻ được vẽ lại cũng tải được, và không để lại ô bấm trống", async ({
  page,
}) => {
  await page.goto("/cong-nghe/ung-dung/cap-nhat-va-loi");
  const btn = page.locator("a.tc-appfoot-btn");
  await expect(btn).toHaveCount(1);
  await expect(btn).toHaveAttribute("target", "_blank");
  await expect(btn).toHaveAttribute("href", /ES\+File\+Explorer/);

  // Vung bam cu cua nut nay (sinh theo vi tri TRUOC khi ve lai) phai da bi
  // go: khong thi o do la mot o bam duoc ma khong co gi de bam.
  const stale = await page.evaluate(() => {
    const foot = document.querySelector(".tc-appfoot")!.getBoundingClientRect();
    return [...document.querySelectorAll('a.tc-hotspot[target="_blank"]')].filter(
      (el) => {
        const r = el.getBoundingClientRect();
        return r.top < foot.bottom && r.bottom > foot.top && r.left < foot.right && r.right > foot.left;
      },
    ).length;
  });
  expect(stale, "không được còn ô bấm cũ chồng lên thẻ đã vẽ lại").toBe(0);
});
