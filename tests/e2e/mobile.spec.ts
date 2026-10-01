import { expect, test } from "@playwright/test";

/**
 * Ban MOBILE: canvas 1440px bi an di, noi dung duoc dung lai tu cung mot nguon
 * du lieu nhung co dan theo be rong man hinh.
 */
// Khong dung devices["iPhone 13"]: preset do chay tren WebKit, may nay chua cai.
// Khai bao thang man hinh dien thoai de chay duoc tren Chromium.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test.describe("bản mobile", () => {
  const PAGES = ["/", "/trai-nghiem", "/giai-phap", "/cong-nghe", "/dai-ly", "/nhan-su"];

  for (const route of PAGES) {
    test(`${route} — ẩn canvas, hiện bản mobile, không tràn ngang`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(400);

      await expect(page.locator(".tc-canvas")).toBeHidden();
      await expect(page.locator(".tc-m")).toBeVisible();

      // Khong bao gio duoc cuon ngang tren dien thoai.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflow, "trang bị tràn ngang").toBe(false);

      // Chu than bai phai doc duoc — day la ly do ton tai cua ban mobile.
      const size = await page
        .locator(".tc-m-body")
        .first()
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
      expect(size).toBeGreaterThanOrEqual(14);
    });
  }

  test("tiêu đề băng hero không bị luật khác kéo nhỏ lại", async ({ page }) => {
    // Khach bao chu o bang dau trang "khá nhỏ" (01/10/2026). Do ra: 12,5px.
    // Thu pham la `.tc-m-hero-text p` — tua de cung la the <p>, ma luat do dung
    // SAU `.tc-m-hero-title` trong cung tep nen bang diem uu tien thi no thang.
    // Day la loai loi khong con dau vet trong ma nguon, chi do moi thay.
    for (const route of ["/", "/giai-phap", "/cong-nghe/ung-dung"]) {
      await page.goto(route);
      const title = page.locator(".tc-m-hero-title");
      await expect(title).toBeVisible();
      const [size, family] = await title.evaluate((el) => {
        const cs = getComputedStyle(el);
        return [parseFloat(cs.fontSize), cs.fontFamily];
      });
      expect(size, `${route}: tiêu đề hero phải lớn`).toBeGreaterThanOrEqual(28);
      expect(family, `${route}: phải là chữ Cormorant của thiết kế`).toContain(
        "Cormorant",
      );
    }
  });

  test("menu mở ra đủ các mục và đóng được", async ({ page }) => {
    await page.goto("/");
    const burger = page.locator(".tc-m-burger");
    await expect(burger).toBeVisible();

    await burger.click();
    // Chi dem muc cha — tung muc con xoe ra mot cay trang con rieng.
    const links = page.locator(".tc-m-drawer .tc-m-navhead > a");
    await expect(links).toHaveCount(5);

    await links.first().click();
    await expect(page).toHaveURL("/trai-nghiem");
    await expect(page.locator(".tc-m-drawer")).toBeHidden();
  });

  test("trang con hiện chữ thật chứ không phải ảnh thu nhỏ", async ({ page }) => {
    await page.goto("/cong-nghe/tien-phong-cong-nghe");
    await page.waitForTimeout(400);

    await expect(page.locator(".tc-canvas")).toBeHidden();
    const paragraphs = page.locator(".tc-m-article p");
    expect(await paragraphs.count()).toBeGreaterThan(0);

    const size = await paragraphs
      .first()
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(14);

    // Nhan cua nut khong duoc lot vao phan doc.
    const text = (await page.locator(".tc-m-article").innerText()).toUpperCase();
    expect(text).not.toContain("> TÌM HIỂU THÊM");
  });

  test("form liên hệ xếp dọc và không bị iOS phóng to khi gõ", async ({ page }) => {
    await page.goto("/");
    const input = page.locator(".tc-m-form input[name='name']");
    await expect(input).toBeVisible();

    const size = await input.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    // Duoi 16px la iOS tu phong to trang khi go — rat kho chiu.
    expect(size).toBeGreaterThanOrEqual(16);
  });
});

/**
 * Bang hero tren ban MOBILE.
 *
 * Ban desktop co bang anh tu chay; ban mobile truoc day chi hien MOT tam tinh
 * — khach bao thieu (30/09/2026). Tren dien thoai thi bang phai VUOT duoc bang
 * ngon tay, nen no dung mot dai cuon ngang that voi `scroll-snap` chu khong
 * phai `transform` nhu ban desktop.
 */
/** Trang chu co HAI bang anh: bang hero o dau va bang giua trang. */
const HERO_TRACK = ".tc-m-hero .tc-m-car-track";
const HERO_SLIDES = `${HERO_TRACK} > li`;
const HERO_DOTS = ".tc-m-hero .tc-m-car-dots button";

test.describe("băng hero bản mobile", () => {
  test("có đủ số tấm như bản desktop và có chấm chỉ mục", async ({ page }) => {
    await page.goto("/");
    const slides = page.locator(HERO_SLIDES);
    await expect(slides).toHaveCount(5);
    await expect(page.locator(HERO_DOTS)).toHaveCount(5);
  });

  test("tự chạy, không cần chạm", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(600);
    const at = () =>
      page.$eval(HERO_TRACK, (el) => Math.round(el.scrollLeft));
    const before = await at();
    await page.waitForTimeout(4200);
    expect(await at(), "băng hero mobile phải tự chạy").toBeGreaterThan(before);
  });

  test("vuốt được bằng ngón tay: dải là một khung cuộn ngang thật", async ({
    page,
  }) => {
    await page.goto("/");
    const how = await page.$eval(HERO_TRACK, (el) => {
      const cs = getComputedStyle(el);
      return { x: cs.overflowX, snap: cs.scrollSnapType };
    });
    expect(how.x).toMatch(/auto|scroll/);
    expect(how.snap).toContain("x");
  });

  test("bấm chấm nào thì nhảy tới tấm đó", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(400);
    // Cham vao dai truoc de dung tu chay: vach chi muc co hoat anh doi be
    // ngang, dang chay thi phep bam phai cho no dung yen.
    await page.locator(HERO_TRACK).hover();
    await page.waitForTimeout(400);
    await page.locator(HERO_DOTS).nth(3).click();
    await page.waitForTimeout(900);
    const at = await page.$eval(HERO_TRACK, (el) =>
      Math.round(el.scrollLeft / (el.scrollWidth / 5)),
    );
    expect(at).toBe(3);
  });
});

/**
 * Cac KHOI cua ban desktop duoc dua xuong ban mobile.
 *
 * Truoc day ban mobile chi co chu va mot vai o anh; bang anh, dai the, cac the
 * noi va danh sach san pham deu chi co tren desktop — khach bao thieu
 * (30/09/2026).
 */
test.describe("mobile có đủ các khối của desktop", () => {
  test("trang chủ: có băng ảnh giữa trang và các lưới thẻ", async ({ page }) => {
    await page.goto("/");
    // Mot bang hero + mot bang anh "Câu chuyện khởi nghiệp".
    await expect(page.locator(".tc-m-car")).toHaveCount(2);
    // Dai the Giai phap + hai cum the noi.
    await expect(page.locator(".tc-m-tiles")).toHaveCount(3);
    await expect(page.locator(".tc-m-tiles a")).toHaveCount(12);
  });

  for (const [route, cars] of [
    ["/dai-ly", 1],
    ["/nhan-su", 1],
  ] as const) {
    test(`${route}: băng ảnh giữa trang có mặt`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator(".tc-m-car")).toHaveCount(cars);
    });
  }

  test("thẻ nào đã có chữ trong ảnh thì KHÔNG in lại bên dưới", async ({
    page,
  }) => {
    // Anh cua bon tam "Trai nghiem" da chua san tieu de; in lai la doc hai lan.
    await page.goto("/");
    const texts = await page.$$eval(".tc-m-tiles a", (els) =>
      els.map((el) => (el.textContent ?? "").trim()),
    );
    const withCaption = texts.filter((t) => t.length > 0);
    // Chi cac the KHONG co chu trong anh moi duoc in chu: LOA la mot trong so do.
    expect(withCaption.length).toBeGreaterThan(0);
    expect(withCaption.length).toBeLessThan(texts.length);
  });

  test("các khối xếp đúng thứ tự dọc như bản desktop", async ({ page }) => {
    await page.goto("/");
    const tops = await page.$$eval(
      ".tc-m-sec, .tc-m-car, .tc-m-tiles",
      (els) => els.map((el) => Math.round(el.getBoundingClientRect().top + scrollY)),
    );
    const sorted = [...tops].sort((a, b) => a - b);
    expect(tops).toEqual(sorted);
  });

  for (const [route, count] of [
    ["/giai-phap/man-hinh", 9],
    ["/giai-phap/phim-dan-kinh", 5],
  ] as const) {
    test(`${route}: có đủ sản phẩm và bấm sang được`, async ({ page }) => {
      await page.goto(route);
      const items = page.locator(".tc-m-prods li");
      await expect(items).toHaveCount(count);

      // Anh tai theo luot cuon, nen phai cuon het danh sach roi moi do.
      await page.evaluate(async () => {
        const step = innerHeight / 2;
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          scrollTo(0, y);
          await new Promise((done) => setTimeout(done, 90));
        }
      });
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll<HTMLImageElement>(".tc-m-prods img")].every(
            (img) => img.complete && img.naturalWidth > 1,
          ),
        null,
        { timeout: 15_000 },
      );

      await page.locator(".tc-m-prods a").first().click();
      await expect(page.locator(".tc-prod-name")).toBeVisible();
    });
  }

  test("/giai-phap/ppf: có cả bốn thẻ 3M PPF lẫn ba dòng Nano", async ({
    page,
  }) => {
    await page.goto("/giai-phap/ppf");
    await expect(page.locator(".tc-m-prods li")).toHaveCount(7);
  });
});
