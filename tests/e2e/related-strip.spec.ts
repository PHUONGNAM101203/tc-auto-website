import { expect, test } from "@playwright/test";

const ARTICLE = "/trai-nghiem/phong-cach-song/doi-mau-doi-dien-mao";

/**
 * Dai the "CÁC BÀI VIẾT KHÁC" tu cuon ngang.
 * Xem src/components/site/RelatedStrip.tsx.
 */
test.describe("dải bài viết khác", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ARTICLE);
    await page.locator(".tc-related").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [
        ...document.querySelectorAll<HTMLImageElement>(".tc-related-shot"),
      ].every((img) => img.complete && img.naturalWidth > 1),
    );
  });

  test("dải TỰ CUỘN ngang, không đứng yên", async ({ page }) => {
    const shift = () =>
      page.$eval(".tc-related-track", (el) =>
        Math.round(new DOMMatrixReadOnly(getComputedStyle(el).transform).m41),
      );

    // Ghi lai theo TUNG KHUNG HINH: cuon that thi di qua nhieu vi tri.
    await page.evaluate(() => {
      const w = window as unknown as { __run: number[] };
      w.__run = [];
      const tick = () => {
        const el = document.querySelector(".tc-related-track");
        if (el) {
          w.__run.push(
            Math.round(
              new DOMMatrixReadOnly(getComputedStyle(el).transform).m41,
            ),
          );
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.waitForTimeout(1200);
    const seen = await page.evaluate(
      () => (window as unknown as { __run: number[] }).__run,
    );
    expect(new Set(seen).size, "dải phải đi qua nhiều vị trí").toBeGreaterThan(
      5,
    );
    expect(await shift()).toBeLessThan(0);
  });

  test("rê chuột vào thì dừng lại để còn đọc và bấm được", async ({ page }) => {
    await page.locator(".tc-related").hover();
    await page.waitForTimeout(300);
    const a = await page.$eval(".tc-related-track", (el) =>
      Math.round(new DOMMatrixReadOnly(getComputedStyle(el).transform).m41),
    );
    await page.waitForTimeout(600);
    const b = await page.$eval(".tc-related-track", (el) =>
      Math.round(new DOMMatrixReadOnly(getComputedStyle(el).transform).m41),
    );
    expect(b, "rê chuột thì phải đứng yên").toBe(a);
  });

  test("dải phủ KÍN ảnh nền bên dưới, không lộ dải cũ", async ({ page }) => {
    // Dai khong xoa gi khoi anh nen ma phu len — nen mau phai dac, khong thi
    // ba the ve san lo ra phia sau.
    const opaque = await page.$eval(".tc-related", (el) => {
      const bg = getComputedStyle(el).backgroundColor;
      return bg !== "rgba(0, 0, 0, 0)" && !bg.includes("0)");
    });
    expect(opaque).toBe(true);
  });

  test("có đủ ảnh để chạy vòng mà không hở khoảng trống", async ({ page }) => {
    const { count, total, view } = await page.evaluate(() => {
      const box = document.querySelector(".tc-related")!;
      const track = document.querySelector(".tc-related-track")!;
      return {
        count: track.querySelectorAll(".tc-related-card").length,
        total: track.getBoundingClientRect().width,
        view: box.getBoundingClientRect().width,
      };
    });
    expect(count).toBeGreaterThanOrEqual(6);
    // Phai dai hon khung nhin, khong thi luc dich trai se ho mep phai.
    expect(total).toBeGreaterThan(view);
  });

  test("mọi ảnh trong dải đều tải được", async ({ page }) => {
    const broken = await page.$$eval(".tc-related-shot", (els) =>
      els
        .filter((img) => !(img as HTMLImageElement).naturalWidth)
        .map((img) => (img as HTMLImageElement).src),
    );
    expect(broken).toEqual([]);
  });
});
