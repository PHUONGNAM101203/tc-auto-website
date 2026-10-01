import { expect, test } from "@playwright/test";

/**
 * Muc luc dang cay tren dien thoai.
 *
 * Truoc day ca ngan keo lan khoi "Xem thêm trong mục này" deu la danh sach
 * PHANG mot cap. Khach hoi: bam mui ten thi xoe ca cay ra duoc khong — day la
 * ban dung do.
 */
test.use({ viewport: { width: 390, height: 844 } });

test.describe("cây mục lục — bản điện thoại", () => {
  test("ngăn kéo: năm mục cha đều có mũi tên, bấm là xoè trang con", async ({ page }) => {
    await page.goto("/cong-nghe");
    await page.click(".tc-m-burger");

    const toggles = page.locator(".tc-m-navtoggle");
    await expect(toggles).toHaveCount(5);

    const branch = page.locator("#tc-m-branch--cong-nghe");
    await expect(branch).toBeHidden();

    await toggles.nth(2).click();
    await expect(branch).toBeVisible();
    await expect(branch.locator("> .tc-m-tree > .tc-m-tree-item")).toHaveCount(2);

    // Bam lan nua thi dong lai.
    await toggles.nth(2).click();
    await expect(branch).toBeHidden();
  });

  test("chỉ một nhánh mở một lúc — ngăn kéo không dài quá màn hình", async ({ page }) => {
    await page.goto("/cong-nghe");
    await page.click(".tc-m-burger");
    const toggles = page.locator(".tc-m-navtoggle");
    await toggles.nth(0).click();
    await expect(page.locator('.tc-m-navtoggle[aria-expanded="true"]')).toHaveCount(1);
    await toggles.nth(3).click();
    await expect(page.locator('.tc-m-navtoggle[aria-expanded="true"]')).toHaveCount(1);
  });

  test("cấp thứ ba mở được ngay trong ngăn kéo", async ({ page }) => {
    await page.goto("/cong-nghe");
    await page.click(".tc-m-burger");
    await page.locator(".tc-m-navtoggle").nth(2).click();

    const branch = page.locator("#tc-m-branch--cong-nghe");
    const inner = branch.locator(".tc-m-tree-toggle").first();
    await expect(inner).toHaveAttribute("aria-expanded", "false");
    await inner.click();
    await expect(inner).toHaveAttribute("aria-expanded", "true");
    await expect(
      branch.locator('.tc-m-tree[data-level="1"] .tc-m-tree-link').first(),
    ).toBeVisible();
  });

  test("mũi tên và liên kết là hai vùng chạm riêng, cả hai đều đạt 44px", async ({
    page,
  }) => {
    await page.goto("/cong-nghe");
    await page.click(".tc-m-burger");
    const toggle = page.locator(".tc-m-navtoggle").nth(2);
    const box = await toggle.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);

    // Bam mui ten KHONG duoc chuyen trang.
    await toggle.click();
    await expect(page).toHaveURL(/\/cong-nghe$/);
  });

  test("khối Xem thêm trong mục này cũng xoè được cấp sâu hơn", async ({ page }) => {
    await page.goto("/nhan-su/tuyen-dung");
    const nav = page.locator(".tc-m-children");
    const toggle = nav.locator(".tc-m-tree-toggle").first();
    await expect(toggle).toHaveCount(1);

    const branch = nav.locator(".tc-m-tree-branch").first();
    await expect(branch).toBeHidden();
    await toggle.click();
    await expect(branch).toBeVisible();
    await expect(branch.locator(".tc-m-tree-link")).toHaveCount(1);
  });

  test("hàng không có trang con thì không sinh nút bấm giả", async ({ page }) => {
    await page.goto("/cong-nghe/ung-dung");
    const nav = page.locator(".tc-m-children");
    await expect(nav.locator(".tc-m-tree-link")).toHaveCount(2);
    await expect(nav.locator(".tc-m-tree-toggle")).toHaveCount(0);
    await expect(nav.locator(".tc-m-tree-leaf")).toHaveCount(2);
  });

  test("mọi liên kết trong cây đều dẫn tới trang có thật", async ({ page, request }) => {
    await page.goto("/cong-nghe");
    await page.click(".tc-m-burger");
    const hrefs = await page
      .locator(".tc-m-drawer .tc-m-tree-link")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(15);
    for (const href of hrefs) {
      expect((await request.get(href)).status(), href).toBe(200);
    }
  });
});
