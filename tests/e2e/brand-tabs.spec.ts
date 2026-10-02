import { expect, test } from "@playwright/test";

/**
 * Ba tab 5DO / 3M / NANO SUN tren trang "Bộ sưu tập thương hiệu".
 *
 * Thiet ke ve san thanh ba o, o 3M dang sang — y la mot bo loc. Nhung ba o do
 * khong bam duoc, va duoi chung la NAM bai viet giong het nhau voi tieu de
 * con de nguyen chu "TÊN BÀI VIẾT". Khach hoi thang: "hình như 3 cái tab này
 * bạn chưa phát triển đúng không" (02/10/2026).
 */
const PAGE = "/dai-ly/gallery-by-brand";

test.describe("ba tab thương hiệu", () => {
  test("ba tab đều bấm được và đổi nội dung ngay tại chỗ", async ({ page }) => {
    await page.goto(PAGE);
    const tabs = page.locator(".tc-brand-tab");
    await expect(tabs).toHaveCount(3);

    // 3M mo san — dung o ma thiet ke ve sang.
    await expect(tabs.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".tc-brand-grid li")).toHaveCount(2);

    await tabs.nth(2).click();
    await expect(page.locator(".tc-brand-grid li")).toHaveCount(6);
    await expect(page).toHaveURL(new RegExp(`${PAGE}$`));
  });

  test("tab 5DO nói thẳng là đang cập nhật, không hiện bừa", async ({ page }) => {
    // Ca bo thiet ke lan du lieu deu khong co mot san pham 5DO nao, du ten
    // hang co trong "PHIM CÁCH NHIỆT · 3M | 5DO".
    await page.goto(PAGE);
    await page.locator(".tc-brand-tab").nth(0).click();
    await expect(page.locator(".tc-brand-grid")).toHaveCount(0);

    const empty = page.locator(".tc-brand-empty");
    await expect(empty).toBeVisible();
    await expect(empty.locator('a[href^="tel:"]')).toHaveCount(1);
    await expect(empty.locator('a[href^="mailto:"]')).toHaveCount(1);
  });

  test("mọi thẻ đều dẫn tới trang sản phẩm có thật", async ({ page, request }) => {
    await page.goto(PAGE);
    for (const index of [1, 2]) {
      await page.locator(".tc-brand-tab").nth(index).click();
      for (const href of await page
        .locator(".tc-brand-grid a")
        .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""))) {
        expect((await request.get(href)).status(), href).toBe(200);
      }
    }
  });

  test("tab không tự vẽ thêm khung đè lên thanh vẽ sẵn", async ({ page }) => {
    // Cung quy tac da chot cho thanh menu: mot dau hieu duy nhat.
    await page.goto(PAGE);
    const box = await page.locator(".tc-brand-tab").nth(1).evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        background: style.backgroundColor,
        border: parseFloat(style.borderTopWidth),
      };
    });
    expect(box.background).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(box.border).toBe(0);
  });
});
