import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/trai-nghiem", "/giai-phap", "/cong-nghe", "/dai-ly", "/nhan-su"];

/** Cuon cham het trang giong nguoi dung that de kich hoat moi reveal. */
async function scrollThrough(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    const step = Math.floor(innerHeight * 0.7);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((done) => setTimeout(done, 110));
    }
    scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((done) => setTimeout(done, 400));
  });
  await page.waitForTimeout(1400);
}

test.describe("lớp hiệu ứng", () => {
  for (const route of ROUTES) {
    test(`${route} — mọi hiệu ứng kết thúc đúng trạng thái thiết kế`, async ({ page }) => {
      await page.goto(route);
      await scrollThrough(page);

      // DOI cho moi hieu ung chay xong thay vi cho mot khoang co dinh.
      // Khoang co dinh 1400ms du khi may ranh, nhung chay ca bo thi may ban
      // va vai phan tu chua kip ket thuc — test do that thuong vi the.
      const read = () => page.evaluate(() => {
        const all = [
          ...document.querySelectorAll<HTMLElement>("[data-rv]"),
          ...document.querySelectorAll<HTMLElement>(".sl"),
          ...document.querySelectorAll<HTMLElement>(".hero-line"),
        ];
        return {
          total: all.length,
          notRevealed: all.filter((el) => !el.classList.contains("is-in")).length,
          transparent: all.filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
          shifted: all.filter((el) => {
            const t = getComputedStyle(el).transform;
            return t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)";
          }).length,
          clipped: all.filter((el) => {
            const c = getComputedStyle(el).clipPath;
            return c !== "none" && c !== "inset(0px)";
          }).length,
        };
      });

      let state = await read();
      await expect
        .poll(
          async () => {
            state = await read();
            return (
              state.notRevealed +
              state.transparent +
              state.shifted +
              state.clipped
            );
          },
          { timeout: 15_000, message: "hiệu ứng phải kết thúc hẳn" },
        )
        .toBe(0);

      expect(state.total).toBeGreaterThan(0);
      // Day la bat bien quan trong nhat: hieu ung KHONG duoc lam mat noi dung.
      expect(state.notRevealed, "phần tử chưa được reveal").toBe(0);
      expect(state.transparent, "phần tử còn trong suốt").toBe(0);
      expect(state.shifted, "phần tử còn bị dịch vị trí").toBe(0);
      expect(state.clipped, "phần tử còn bị cắt").toBe(0);
    });
  }

  test("màn chờ tải trang tự ẩn", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".tc-boot")).toHaveAttribute("data-done", "true", {
      timeout: 5000,
    });
  });

  test("tôn trọng prefers-reduced-motion: hiện ngay không cần cuộn", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForTimeout(800);

    const state = await page.evaluate(() => {
      const all = [
        ...document.querySelectorAll<HTMLElement>("[data-rv]"),
        ...document.querySelectorAll<HTMLElement>(".hero-line"),
      ];
      return {
        total: all.length,
        transparent: all.filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
        // Con tro vong tron va thanh tien do phai bi tat han
        cursorHidden: getComputedStyle(document.querySelector(".tc-cursor")!).display === "none",
        progressHidden:
          getComputedStyle(document.querySelector(".tc-progress")!).display === "none",
      };
    });

    expect(state.total).toBeGreaterThan(0);
    expect(state.transparent).toBe(0);
    expect(state.cursorHidden).toBe(true);
    expect(state.progressHidden).toBe(true);

    await context.close();
  });

  test("thanh tiến độ cuộn phản ánh vị trí cuộn", async ({ page }) => {
    await page.goto("/");
    const at = (selector: string) =>
      page.evaluate((s) => {
        const t = getComputedStyle(document.querySelector(s)!).transform;
        const match = /matrix\(([\d.]+)/.exec(t);
        return match ? Number(match[1]) : 1;
      }, selector);

    expect(await at(".tc-progress")).toBeLessThan(0.05);

    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    expect(await at(".tc-progress")).toBeGreaterThan(0.9);
  });
});
