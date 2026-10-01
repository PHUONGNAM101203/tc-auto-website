import { expect, test, type Page } from "@playwright/test";

/**
 * Moi bang anh tren site phai TU CHAY.
 *
 * Khach chot nhip (30/09/2026): bang hero o dau trang 3 giay, moi bang phia
 * duoi 5 giay. Bang duoi vua co chu vua co nut nen can lau hon de doc va bam
 * kip.
 *
 * Re chuot vao thi phai dung lai — dang xem hoac sap bam ma anh tu doi la hong
 * y. Vua bam tay xong cung phai ngung mot lat, khong giat anh khoi tay nguoi
 * dang xem.
 *
 * ── Do NHIP chu khong do "co doi khong" ─────────────────────────────────────
 * Bai kiem dau tien o day chi cho mot khoang roi xem anh co khac di khong. No
 * xanh ca khi nhip van la nhip cu, vi thoi gian tai trang cong vao la du. Muon
 * rang buoc that thi phai do KHOANG CACH GIUA HAI LAN DOI: bat dau bam gio tu
 * lan doi thu nhat, dung khi den lan thu hai.
 */
const HERO_MS = 3000;
const BELOW_MS = 5000;
/** Do sai lech cho phep: may cham, khung hinh tre, tai anh. */
const SLACK_MS = 900;

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

function expectPace(ms: number, want: number, what: string) {
  expect(ms, `${what} phải tự lướt`).toBeLessThan(want + SLACK_MS);
  expect(ms, `${what} lướt quá nhanh, không kịp xem`).toBeGreaterThan(
    want - SLACK_MS,
  );
}

/** Bo qua lan doi dau — no co the roi vao giua mot nhip dang chay. */
async function pace(
  page: Page,
  read: () => Promise<string | undefined>,
  want: number,
) {
  await msUntilChange(page, read, want * 2);
  return msUntilChange(page, read, want * 2);
}

const heroShown = (page: Page) =>
  page
    .$$eval(".tc-hero-slide.is-on", (els) =>
      els.map((el) => (el as HTMLImageElement).currentSrc.split("/").pop()),
    )
    .then((all) => all[0]);

const photoShown = (page: Page) =>
  page
    .$$eval(".tc-deck-card[data-front]", (els) =>
      els.map((el) =>
        el.querySelector("img")!.getAttribute("src")!.split("/").pop(),
      ),
    )
    .then((all) => all[0]);

/**
 * Doc vi tri DICH cua dai, lay tu style noi tuyen chu khong phai
 * `getComputedStyle`.
 *
 * Trong luc dai dang truot, gia tri tinh toan doi TUNG KHUNG HINH — do kieu do
 * thi "lan doi thu hai" chi cach lan dau mot phan mười giay, va bai kiem se bao
 * nham la "luot qua nhanh". Style noi tuyen thi nhay thang toi dich.
 */
const stripOffset = (page: Page, selector: string) =>
  page
    .$eval(selector, (el) => (el as HTMLElement).style.transform)
    .catch(() => undefined);

async function settle(page: Page, selector: string) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
}

test.describe("băng hero trang chủ — 3 giây", () => {
  test("nhịp giữa hai lần đổi vào khoảng 3 giây", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);
    expectPace(await pace(page, () => heroShown(page), HERO_MS), HERO_MS, "băng hero");
  });

  test("rê chuột vào thì dừng lại để còn đọc và bấm được", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);
    await page.locator(".tc-hero").hover();
    const waited = await msUntilChange(
      page,
      () => heroShown(page),
      HERO_MS + SLACK_MS,
    );
    expect(waited, "rê chuột thì phải đứng yên").toBe(Number.POSITIVE_INFINITY);
  });

  test("mũi tên không sinh thêm khung nào khi rê chuột hay bấm", async ({ page }) => {
    // Khach bao mui ten "bi de border khi hover vao va bam" (01/10/2026). Co
    // HAI thu phai cung sach thi moi het: o nen do CSS to khi :hover (da bo), va
    // mieng chep de trong chinh anh hero (xem verify:hero). Bai nay giu phan CSS.
    await page.goto("/");
    await page.waitForTimeout(300);

    const arrow = page.locator(".tc-hero-arrow").first();
    const bare = async (when: string) => {
      const box = await arrow.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          bg: cs.backgroundColor,
          border: parseFloat(cs.borderTopWidth),
          shadow: cs.boxShadow,
          // `outlineWidth` chu khong phai cai can doc: voi `outline: none`
          // Chrome van tra ve be rong mac dinh (2.25px) vi be rong DUNG moi
          // bang 0. Kieu net moi la cai noi len co ve hay khong.
          outline: cs.outlineStyle,
        };
      });
      expect(box.bg, `${when}: không được tô nền`).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
      expect(box.border, `${when}: không được có viền`).toBe(0);
      expect(box.shadow, `${when}: không được có bóng đổ`).toBe("none");
      expect(box.outline, `${when}: không được có viền ngoài`).toBe("none");
    };

    await bare("lúc nghỉ");
    await arrow.hover();
    await page.waitForTimeout(350);
    await bare("khi rê chuột");
    await arrow.click();
    await page.waitForTimeout(350);
    await bare("sau khi bấm");
  });
});

test.describe("các băng phía dưới — 5 giây", () => {
  // Ba trang co bang anh: trang chu, Dai ly va Nhan su.
  for (const route of ["/", "/dai-ly", "/nhan-su"]) {
    test(`băng ảnh ${route} — nhịp vào khoảng 5 giây`, async ({ page }) => {
      await page.goto(route);
      await settle(page, ".tc-deck");
      await page.waitForFunction(() =>
        [...document.querySelectorAll<HTMLImageElement>(".tc-deck img")].every(
          (img) => img.complete && img.naturalWidth > 1,
        ),
      );
      expectPace(
        await pace(page, () => photoShown(page), BELOW_MS),
        BELOW_MS,
        `băng ảnh ${route}`,
      );
    });
  }

  // Ba dai THE (Giai phap, PPF, Kho ung dung) KHONG tu chay — khach chot
  // 30/09/2026: "mấy chỗ như này thì ko cần auto đâu nhé". Chung la de doc,
  // co ten - mo ta - nut bam; chu troi di giua chung thi mat cho.
  for (const [what, page_, box, track] of [
    ["dải thẻ Giải pháp", "/", ".tc-solutions", ".tc-solutions-strip"],
    ["dải thẻ PPF", "/giai-phap/ppf", ".tc-ppf", ".tc-ppf-strip"],
  ] as const) {
    test(`${what} — KHÔNG tự chạy, chỉ đổi khi bấm`, async ({ page }) => {
      await page.goto(page_);
      await settle(page, box);
      const before = await stripOffset(page, track);
      await page.waitForTimeout(BELOW_MS + SLACK_MS);
      expect(
        await stripOffset(page, track),
        `${what} phải đứng yên`,
      ).toBe(before);
    });
  }

  test("dải thẻ PPF — bấm mũi tên thì trượt", async ({ page }) => {
    await page.goto("/giai-phap/ppf");
    await settle(page, ".tc-ppf");
    const before = await stripOffset(page, ".tc-ppf-strip");
    await page.locator(".tc-ppf-arrow").last().click();
    await page.waitForTimeout(900);
    expect(await stripOffset(page, ".tc-ppf-strip")).not.toBe(before);
  });

  for (const [what, box] of [
    ["băng ảnh", ".tc-deck"],
  ] as const) {
    test(`${what} — rê chuột vào thì dừng`, async ({ page }) => {
      await page.goto("/");
      await settle(page, box);

      // Re lai MOI VONG cho chu khong re mot lan roi doi: khi may dang ban,
      // cu re dau tien co the roi vao luc dai con dang dich, va chuot khong
      // nam tren dai nua. Day la kieu chap chon da gap o cac bai kiem re chuot
      // khac trong du an.
      const target = page.locator(box).first();
      let stopped = false;
      for (let round = 0; round < 25 && !stopped; round += 1) {
        await target.hover({ trial: false }).catch(() => undefined);
        await page.waitForTimeout(120);
        stopped = (await target.getAttribute("data-playing")) === null;
      }
      expect(stopped, `${what} phải dừng khi rê chuột`).toBe(true);
    });
  }

  test("bấm mũi tên thì tạm ngưng tự lướt, không giật ảnh khỏi tay người xem", async ({
    page,
  }) => {
    await page.goto("/");
    await settle(page, ".tc-deck");
    await page.locator(".tc-photoslider-arrow").first().click();
    await page.waitForTimeout(900);
    await page.mouse.move(5, 5);

    const waited = await msUntilChange(
      page,
      () => photoShown(page),
      BELOW_MS + SLACK_MS,
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
    expect(await page.locator(".tc-deck[data-playing]").count()).toBe(0);

    await settle(page, ".tc-deck");
    expect(
      await page.locator(".tc-deck[data-playing]").count(),
      "cuộn tới thì phải bắt đầu chạy",
    ).toBeGreaterThan(0);
  });
});
