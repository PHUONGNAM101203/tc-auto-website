import { expect, test } from "@playwright/test";

/**
 * Nut "XEM THÊM" phai DAN sang trang bai viet.
 *
 * Khach noi lai ngay 01/10/2026: "ko phải bấm xem thêm là bấm nó dài ra mà
 * bấm nó ra trang bài viết ấy". Truoc do nut xo khoi chu dai ra tai cho.
 * Xem tools/brand/build-spot-articles.py va src/lib/spot-articles.ts.
 */
const WITH_ARTICLES = [
  "/trai-nghiem/phong-cach-song",
  "/trai-nghiem/hanh-trinh",
  "/giai-phap/du-an",
  "/dai-ly/ho-tro-tiep-thi",
  "/nhan-su/tuyen-dung/vi-tri-dang-tuyen",
];

test.describe("bài viết mở ra từ XEM THÊM", () => {
  test("nút nào có nội dung thật đều là LIÊN KẾT, không phải nút xổ chữ", async ({
    page,
  }) => {
    for (const path of WITH_ARTICLES) {
      await page.goto(path);
      const links = await page.locator("a.tc-readmore").count();
      expect(links, `${path} phải có nút dẫn sang bài viết`).toBeGreaterThan(0);
    }
  });

  test("bấm vào thì sang trang bài viết, có đủ tiêu đề và thân bài", async ({
    page,
  }) => {
    await page.goto("/trai-nghiem/phong-cach-song");
    const link = page.locator("a.tc-readmore").first();
    const href = await link.getAttribute("href");
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));

    await expect(page.locator("h1")).toHaveText(
      "CÓ NHỮNG KHOẢNG RIÊNG TƯ KHÔNG CẦN NÓI RA",
    );
    // Than bai phai day du — ke ca phan ban thiet ke lam MO DAN o cuoi the.
    const paras = await page.locator("main p").allTextContents();
    expect(paras.length).toBeGreaterThanOrEqual(5);
    expect(paras.join(" ")).toContain("Chỉ là cảm giác được ở một mình");
  });

  test("trang bài viết có đường dẫn phân cấp, thanh điều hướng và nút lên đầu", async ({
    page,
  }) => {
    await page.goto(
      "/trai-nghiem/phong-cach-song/co-nhung-khoang-rieng-tu-khong-can-noi-ra",
    );
    await expect(page.locator(".tc-doc-crumbs")).toBeVisible();
    await expect(page.locator(".tc-m-bar")).toBeVisible();
    await expect(page.locator(".tc-totop")).toHaveCount(1);

    // Quay lai duoc trang cha.
    await page.locator('.tc-doc-crumbs a[href="/trai-nghiem/phong-cach-song"]').click();
    await expect(page).toHaveURL(/\/trai-nghiem\/phong-cach-song$/);
  });

  test("bài viết khai dữ liệu có cấu trúc Article", async ({ page }) => {
    await page.goto(
      "/trai-nghiem/phong-cach-song/co-nhung-khoang-rieng-tu-khong-can-noi-ra",
    );
    const blobs = await page.$$eval(
      'script[type="application/ld+json"]',
      (els) => els.map((el) => JSON.parse(el.textContent ?? "{}")),
    );
    const article = blobs.find((b) => b["@type"] === "Article");
    expect(article).toBeTruthy();
    expect(article.headline).toBe("CÓ NHỮNG KHOẢNG RIÊNG TƯ KHÔNG CẦN NÓI RA");
    expect(article.datePublished).toBe("2026-08-19");
  });

  test("mỗi bài một đường dẫn riêng, không bài nào trùng", async ({
    request,
  }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const route of [
      "/trai-nghiem/phong-cach-song/co-nhung-khoang-rieng-tu-khong-can-noi-ra",
      "/giai-phap/du-an/tc-auto-hop-tac-voi-thanh-tien-auto",
      "/nhan-su/tuyen-dung/vi-tri-dang-tuyen/cong-ty-tnhh-tc-auto-tuyen-dung",
    ]) {
      expect(xml, route).toContain(route);
    }
  });

  test("chồng ảnh có MŨI TÊN nhìn thấy được", async ({ page }) => {
    // Mui ten von nam trong chong anh ve san; chong do bi xoa khoi nen nen
    // mui ten mat theo, nguoi dung khong biet cho do bam duoc (khách báo
    // 01/10/2026). Nay mui ten duoc ve that.
    await page.goto("/nhan-su");
    const arrow = page.locator(".tc-photoslider-arrow").last();
    await arrow.scrollIntoViewIfNeeded();
    await expect(arrow.locator("svg")).toBeVisible();
    const box = (await arrow.boundingBox())!;
    expect(box.width).toBeGreaterThan(8);
    expect(box.height).toBeGreaterThan(20);
  });
});
