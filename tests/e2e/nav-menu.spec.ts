import { expect, test } from "@playwright/test";

/**
 * Menu con xo xuong khi ro chuot, va thanh truot danh dau muc dang xem.
 * Xem src/components/site/SiteNav.tsx.
 */
test.describe("menu điều hướng", () => {
  test("rê chuột vào mục cha thì xổ menu con, rời ra thì đóng", async ({ page }) => {
    await page.goto("/");

    const parent = page.locator('.hdr a.nv[href="/trai-nghiem"]');
    const submenu = page
      .locator(".tc-submenu")
      .filter({ has: page.locator('a[href="/trai-nghiem/hanh-trinh"]') });

    // Nhan roi: co trong DOM (de trinh thu thap doc duoc) nhung khong hien.
    await expect(submenu).toHaveCount(1);
    await expect(submenu).toBeHidden();

    await parent.hover();
    await expect(submenu).toBeVisible();

    // Dung 4 muc, dung thu tu nha thiet ke — khong phai thu tu chu cai.
    await expect(submenu.locator("a")).toHaveText([
      "HÀNH TRÌNH",
      "BẢN SẮC RIÊNG",
      "KHOẢNH KHẮC",
      "PHONG CÁCH SỐNG",
    ]);

    // Mui ten doi tu "›" sang "⌄" khi dang xo.
    await expect(parent.locator("i")).toHaveText("⌄");

    // Ro sang cho khac thi dong lai.
    await page.locator(".hdr .logo").hover();
    await expect(submenu).toBeHidden();
  });

  test("con trỏ đi từ nhãn xuống bảng thì menu không tắt giữa chừng", async ({
    page,
  }) => {
    await page.goto("/");
    const submenu = page
      .locator(".tc-submenu")
      .filter({ has: page.locator('a[href="/giai-phap/ppf"]') });

    await page.locator('.hdr a.nv[href="/giai-phap"]').hover();
    await expect(submenu).toBeVisible();

    // Bam duoc that su — day la cho de hong nhat: neu co khe ho giua nhan va
    // bang thi con tro roi ra ngoai va menu tat truoc khi kip bam.
    await submenu.locator('a[href="/giai-phap/ppf"]').click();
    await expect(page).toHaveURL("/giai-phap/ppf");
  });

  test("bấm Escape thì đóng menu", async ({ page }) => {
    await page.goto("/");
    const submenu = page
      .locator(".tc-submenu")
      .filter({ has: page.locator('a[href="/nhan-su/tuyen-dung"]') });

    await page.locator('.hdr a.nv[href="/nhan-su"]').hover();
    await expect(submenu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(submenu).toBeHidden();
  });

  test("thanh trượt nằm đúng trên mục đang xem", async ({ page }) => {
    await page.goto("/giai-phap");

    const pill = page.locator(".tc-navpill");
    await expect(pill).toHaveCount(1);

    const [pillBox, linkBox] = await Promise.all([
      pill.boundingBox(),
      page.locator('.hdr a.nv[href="/giai-phap"]').boundingBox(),
    ]);
    expect(pillBox).not.toBeNull();
    expect(linkBox).not.toBeNull();
    // Trum khit len muc dang xem (sai so 1px cho phep lam tron cua `zoom`).
    expect(Math.abs(pillBox!.x - linkBox!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(pillBox!.width - linkBox!.width)).toBeLessThanOrEqual(1);
  });

  test("trang chủ không sáng mục nào nên không có thanh trượt", async ({ page }) => {
    // Frame goc danh dau nham "TRẢI NGHIỆM" o trang chu — da ghi trong
    // src/lib/design-deviations.ts la CO Y bo danh dau.
    await page.goto("/");
    await expect(page.locator(".tc-navpill")).toHaveCount(0);
  });
});
