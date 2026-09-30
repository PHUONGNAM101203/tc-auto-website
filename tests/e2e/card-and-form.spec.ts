import { expect, test } from "@playwright/test";

/**
 * Hai cho khach chi ra ngay 30/09/2026 (anh 69):
 *   - the tai ung dung co tieu de dai bi nut "TẢI VỀ" DE LEN chu;
 *   - tren dien thoai, nut "GỬI" cua form bi CAT mat nua duoi.
 */

test.describe("thẻ tải ứng dụng", () => {
  const PAGE = "/cong-nghe/ung-dung/cap-nhat-va-loi";

  test("nút TẢI VỀ không đè lên tiêu đề", async ({ page }) => {
    await page.goto(PAGE);
    const foot = page.locator(".tc-appfoot").first();
    await foot.scrollIntoViewIfNeeded();
    await expect(foot).toBeVisible();

    const { title, button } = await foot.evaluate((el) => {
      const t = el.querySelector(".tc-appfoot-title")!.getBoundingClientRect();
      const b = el.querySelector(".tc-appfoot-btn")!.getBoundingClientRect();
      return {
        title: { top: t.top, bottom: t.bottom, w: t.width },
        button: { top: b.top, bottom: b.bottom, w: b.width },
      };
    });
    expect(button.top, "nút phải nằm HẲN dưới tiêu đề").toBeGreaterThanOrEqual(
      title.bottom,
    );
    expect(title.w).toBeGreaterThan(0);
    expect(button.w).toBeGreaterThan(0);
  });

  test("tiêu đề dài xuống hai dòng, không bị cắt chữ nào", async ({ page }) => {
    await page.goto(PAGE);
    const title = page.locator(".tc-appfoot-title").first();
    await title.scrollIntoViewIfNeeded();
    await expect(title).toHaveText(
      "[CẬP NHẬT] ES File Explorer File Manager",
    );
    // Cao hon mot dong -> da xuong dong. KHONG so scrollHeight voi chieu cao
    // o day: dau thanh cua tieu Viet tho ra ngoai hop dong mot vai pixel, nen
    // hai tri so luon lech du chu khong he bi cat. Dieu phai bao dam la khoi
    // chu khong bi CAT GON — tuc `overflow` khong duoc la `hidden`.
    const { h, lines, overflow } = await title.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        h: Math.round(el.getBoundingClientRect().height),
        lines: Math.round(
          el.getBoundingClientRect().height / parseFloat(cs.lineHeight),
        ),
        overflow: cs.overflow,
      };
    });
    expect(h).toBeGreaterThan(30);
    expect(lines, "tiêu đề phải xuống hai dòng").toBe(2);
    expect(overflow, "không được cắt gọn khối chữ").toBe("visible");
  });
});

test.describe("form liên hệ trên điện thoại", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("nút GỬI và các ô nhập KHÔNG bị cắt", async ({ page }) => {
    await page.goto("/");
    const form = page.locator(".tc-m-form");
    await form.scrollIntoViewIfNeeded();

    const rows = await form.evaluate((el) =>
      [...el.querySelectorAll("input:not([aria-hidden]), textarea, button")].map(
        (node) => {
          const r = node.getBoundingClientRect();
          return {
            tag: node.tagName,
            h: Math.round(r.height),
            sh: (node as HTMLElement).scrollHeight,
            w: Math.round(r.width),
          };
        },
      ),
    );

    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows) {
      // Khoi PROTOTYPE dat chieu cao CUNG (nut 25px, o nhap 28px) cho bo cuc
      // canvas; o ban dien thoai chung phai tu co dan theo padding.
      expect(row.h, `${row.tag} bị cắt`).toBeGreaterThanOrEqual(40);
      expect(
        row.sh - row.h,
        `${row.tag} có nội dung tràn ra ngoài`,
      ).toBeLessThanOrEqual(1);
    }
  });

  test("nút GỬI trải hết bề ngang form, nằm cân giữa", async ({ page }) => {
    await page.goto("/");
    const form = page.locator(".tc-m-form");
    await form.scrollIntoViewIfNeeded();
    const { fx, fw, bx, bw } = await form.evaluate((el) => {
      const f = el.getBoundingClientRect();
      const b = el.querySelector("button")!.getBoundingClientRect();
      return { fx: f.x, fw: f.width, bx: b.x, bw: b.width };
    });
    expect(Math.round(bx)).toBe(Math.round(fx));
    expect(Math.round(bw)).toBe(Math.round(fw));
  });
});
