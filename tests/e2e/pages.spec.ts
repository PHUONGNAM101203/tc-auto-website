import { expect, test } from "@playwright/test";

const PAGES = [
  { route: "/", title: "Trang chủ", height: 3566, slices: 4 },
  { route: "/trai-nghiem", title: "Trải nghiệm", height: 3464, slices: 4 },
  { route: "/giai-phap", title: "Giải pháp", height: 5977, slices: 7 },
  { route: "/cong-nghe", title: "Công nghệ", height: 4087, slices: 5 },
  { route: "/dai-ly", title: "Đại lý", height: 4577, slices: 6 },
  { route: "/nhan-su", title: "Nhân sự", height: 3374, slices: 4 },
] as const;

test.describe("6 trang chính", () => {
  for (const page of PAGES) {
    test(`${page.route} — hình học canvas đúng bản Figma`, async ({
      page: browser,
    }) => {
      await browser.goto(page.route);

      const canvas = browser.locator(".tc-canvas");
      await expect(canvas).toHaveCount(1);

      // Canvas rong dung 1440px (so sanh co sai so: CSS `zoom` lam tron duoi pixel,
      // vi du 3566px -> "3565.99px"; do chinh xac thuc su da duoc chung minh boi
      // test so pixel trong tools/fidelity/compare.mjs — lech 0 pixel)
      const box = await browser.evaluate(() => {
        const canvasEl = document.querySelector<HTMLElement>(".tc-canvas")!;
        const sectionEl = document.querySelector<HTMLElement>(".pg")!;
        return {
          canvasWidth: Number.parseFloat(getComputedStyle(canvasEl).width),
          sectionHeight: Number.parseFloat(getComputedStyle(sectionEl).height),
        };
      });
      expect(box.canvasWidth).toBeCloseTo(1440, 1);
      expect(box.sectionHeight).toBeCloseTo(page.height, 1);

      // Du so lat nen
      await expect(browser.locator(".sl")).toHaveCount(page.slices);

      // Nav luon du 5 muc. Trang chu CO Y khong sang muc nao (frame goc danh dau
      // "TRẢI NGHIỆM" — loi thiet ke, xem src/lib/design-deviations.ts).
      await expect(browser.locator(".hdr .nv")).toHaveCount(5);
      await expect(
        browser.locator('.hdr .nv[aria-current="page"]'),
      ).toHaveCount(page.route === "/" ? 0 : 1);

      // Form lien he ton tai. Noi ro `.tc-canvas`: lop mobile cung dung chinh
      // component do nen ca trang co HAI form.ff — o day dang do canvas.
      await expect(browser.locator(".tc-canvas form.ff")).toHaveCount(1);
    });
  }

  test("mọi ảnh nền tải được sau khi cuộn hết trang", async ({ page }) => {
    // Cuon qua 6 trang dai la viec nang -> noi thoi gian cho rieng test nay.
    test.slow();

    for (const target of PAGES) {
      await page.goto(target.route);

      // Cuon cham de IntersectionObserver kip bat; cuon bang rAF thi qua nhanh.
      await page.evaluate(async () => {
        const step = Math.floor(innerHeight * 0.8);
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          scrollTo(0, y);
          await new Promise((done) => setTimeout(done, 110));
        }
        scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((done) => setTimeout(done, 400));
      });

      // Cho den khi khong con anh nao chua duoc gan nguon.
      await page.waitForFunction(
        () => document.querySelectorAll("img[data-src]").length === 0,
        {
          timeout: 20_000,
        },
      );

      // Roi cho tung anh tai xong that su.
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll<HTMLImageElement>("img.sl")].every(
            (img) => img.complete && img.naturalWidth > 1,
          ),
        { timeout: 20_000 },
      );

      const report = await page.evaluate(() => {
        const images = [
          ...document.querySelectorAll<HTMLImageElement>("img.sl"),
        ];
        return {
          total: images.length,
          // naturalWidth === 1 nghia la con dang la anh placeholder 1x1,
          // chua phai lat nen that — kiem tra > 1 chu khong phai > 0.
          unloaded: images
            .filter((img) => img.naturalWidth <= 1)
            .map((img) => img.src),
        };
      });

      expect(report.total, target.route).toBe(target.slices);
      expect(report.unloaded, `ảnh chưa tải ở ${target.route}`).toEqual([]);
    }
  });

  test("canvas co giãn theo bề rộng khung nhìn, không tràn ngang", async ({
    page,
  }) => {
    for (const width of [1920, 1440, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");

      const overflow = await page.evaluate(() => {
        const d = document.documentElement;
        return {
          zoom: Number(d.style.getPropertyValue("--tc-zoom")),
          scrollWidth: d.scrollWidth,
          clientWidth: d.clientWidth,
        };
      });

      expect(overflow.zoom).toBeGreaterThan(0);
      expect(overflow.zoom).toBeCloseTo(Math.max(width, 320) / 1440, 2);
      // Khong co thanh cuon ngang
      expect(overflow.scrollWidth).toBeLessThanOrEqual(
        overflow.clientWidth + 1,
      );
    }
  });

  test("điều hướng giữa các trang giữ nguyên header", async ({ page }) => {
    await page.goto("/");
    await page.locator('.hdr .nv[href="/giai-phap"]').click();
    await expect(page).toHaveURL("/giai-phap");
    await expect(page.locator('.hdr .nv[href="/giai-phap"]')).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.locator(".hdr .logo").click();
    await expect(page).toHaveURL("/");
  });

  test("nút CTA dẫn tới trang đúng", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator('a.btn[href="/nhan-su"]').first();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL("/nhan-su");
  });

  test("metadata và ngôn ngữ đúng", async ({ page }) => {
    await page.goto("/giai-phap");
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page).toHaveTitle(/Giải pháp \| TC Auto Solutions/);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /PPF|cách nhiệt/);
  });
});
