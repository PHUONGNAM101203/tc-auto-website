import { expect, test, type Page } from "@playwright/test";

/**
 * Khach yeu cau moi bang anh phai TU LUOT, "kieu 3-4s mot lan":
 * bang hero tren trang chu, va cac bang anh tren cac trang khac.
 *
 * Nguoi dung re chuot vao thi phai dung lai — dang xem hoac sap bam ma anh tu
 * doi la hong y.
 *
 * ── Do NHIP chu khong do "co doi khong" ─────────────────────────────────────
 * Bai kiem dau tien o day chi cho mot khoang roi xem anh co khac di khong. No
 * xanh ca khi nhip van la 4500ms, vi thoi gian tai trang cong vao la du. Muon
 * rang buoc that thi phai do KHOANG CACH GIUA HAI LAN DOI: bat dau bam gio tu
 * lan doi thu nhat, dung khi den lan thu hai.
 */
const STEP_MS = 3500;
/**
 * Do sai lech cho phep. Phai NHO HON hieu so voi nhip cu (4500 - 3500 = 1000),
 * khong thi bai kiem van xanh ca khi nhip chua duoc rut xuong.
 */
const SLACK_MS = 800;

/** Doc gia tri hien tai; lap den khi no khac di; tra ve so mili giay da cho. */
async function msUntilChange(
  page: Page,
  read: () => Promise<string | undefined>,
  budget: number,
): Promise<number> {
  const from = await read();
  const started = Date.now();
  while (Date.now() - started < budget) {
    await page.waitForTimeout(100);
    if ((await read()) !== from) {
      return Date.now() - started;
    }
  }
  return Number.POSITIVE_INFINITY;
}

/** Mot nhip phai nam trong khoang mong doi — khong nhanh qua, khong cham qua. */
function expectPace(ms: number, what: string) {
  expect(ms, `${what} phải tự lướt`).toBeLessThan(STEP_MS + SLACK_MS);
  expect(ms, `${what} lướt quá nhanh, không kịp xem`).toBeGreaterThan(
    STEP_MS - SLACK_MS,
  );
}

const heroShown = (page: Page) =>
  page
    .$$eval(".tc-hero-slide.is-on", (els) =>
      els.map((el) => (el as HTMLImageElement).currentSrc.split("/").pop()),
    )
    .then((all) => all[0]);

const photoShown = (page: Page) =>
  page
    .$$eval(".tc-photoslide[data-on]", (els) =>
      els.map((el) => el.getAttribute("src")!.split("/").pop()),
    )
    .then((all) => all[0]);

async function settlePhotos(page: Page) {
  await page.locator(".tc-photoslider").first().scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [...document.querySelectorAll<HTMLImageElement>(".tc-photoslide")].every(
      (img) => img.complete && img.naturalWidth > 1,
    ),
  );
  await page.waitForTimeout(300);
}

test.describe("băng hero trang chủ tự lướt", () => {
  test("nhịp giữa hai lần đổi vào khoảng 3,5 giây", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);
    // Bo qua lan doi dau — no co the roi vao giua nhip dang chay.
    await msUntilChange(page, () => heroShown(page), STEP_MS * 2);
    expectPace(
      await msUntilChange(page, () => heroShown(page), STEP_MS * 2),
      "băng hero",
    );
  });

  test("rê chuột vào thì dừng lại để còn đọc và bấm được", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);
    await page.locator(".tc-hero").hover();
    const waited = await msUntilChange(
      page,
      () => heroShown(page),
      STEP_MS + SLACK_MS,
    );
    expect(waited, "rê chuột thì phải đứng yên").toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});

test.describe("băng ảnh các trang khác tự lướt", () => {
  // Ba trang co bang anh: trang chu, Dai ly va Nhan su.
  for (const route of ["/", "/dai-ly", "/nhan-su"]) {
    test(`${route} — nhịp vào khoảng 3,5 giây`, async ({ page }) => {
      await page.goto(route);
      await settlePhotos(page);
      await msUntilChange(page, () => photoShown(page), STEP_MS * 2);
      expectPace(
        await msUntilChange(page, () => photoShown(page), STEP_MS * 2),
        `băng ảnh ${route}`,
      );
    });
  }

  test("rê chuột vào thì dừng lại", async ({ page }) => {
    await page.goto("/");
    await settlePhotos(page);
    await page.locator(".tc-photoslider").first().hover();
    const waited = await msUntilChange(
      page,
      () => photoShown(page),
      STEP_MS + SLACK_MS,
    );
    expect(waited, "rê chuột thì phải đứng yên").toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  test("bấm mũi tên thì tạm ngưng tự lướt, không giật ảnh khỏi tay người xem", async ({
    page,
  }) => {
    await page.goto("/");
    await settlePhotos(page);
    // Bam roi dua chuot ra cho khac: khong con re chuot nua, nhung vua bam thi
    // bang anh phai dung yen mot lat cho nguoi ta con xem.
    await page.locator(".tc-photoslider-arrow").first().click();
    await page.waitForTimeout(900);
    await page.mouse.move(5, 5);

    const waited = await msUntilChange(
      page,
      () => photoShown(page),
      STEP_MS + SLACK_MS,
    );
    expect(waited, "vừa bấm thì phải tạm ngưng tự lướt").toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  test("ngoài khung nhìn thì KHÔNG chạy, đỡ tốn pin và dữ liệu", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(500);
    // Bang anh nam duoi sau trong trang; o dau trang no chua tung xuat hien.
    expect(
      await page.locator(".tc-photoslider[data-playing]").count(),
    ).toBe(0);

    await settlePhotos(page);
    expect(
      await page.locator(".tc-photoslider[data-playing]").count(),
      "cuộn tới thì phải bắt đầu chạy",
    ).toBeGreaterThan(0);
  });
});
