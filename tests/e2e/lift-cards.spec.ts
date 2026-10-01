import { expect, test } from "@playwright/test";

/**
 * Trang chu co HAI cum the noi len: bon tam muc "Trai nghiem" o tren va bon o
 * muc "Cong nghe" o duoi. Moi cum mot khoi bao rieng de ro chuot vao cum nay
 * khong lam mo cum kia.
 */
const TECH = '.tc-lift[data-group="home"]';
const LIFE = '.tc-lift[data-group="home-trai-nghiem"]';
const DEALER = '.tc-lift[data-group="dai-ly"]';

/**
 * Bon o muc "Công nghệ" tren trang chu: ro chuot vao o nao thi o do noi len.
 */
test.describe("bốn ô Công nghệ trên trang chủ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator(TECH).scrollIntoViewIfNeeded();
    // Cho anh bon o tai xong han roi moi do: do som thi kich thuoc con dang
    // thay doi va phep so sanh "o nao nhich len" khong con nghia.
    // Selector phai TRUYEN VAO: ham nay chay trong trinh duyet, hang so cua
    // tep test khong ton tai o do.
    await page.waitForFunction(
      (group) =>
        document.querySelectorAll(`${group} .tc-lift-card img`).length > 0 &&
        [
          ...document.querySelectorAll<HTMLImageElement>(
            `${group} .tc-lift-card img`,
          ),
        ].every((img) => img.complete && img.naturalWidth > 1),
      TECH,
    );
    await page.waitForTimeout(250);
  });

  /**
   * KHONG cho "toi khi het chuyen dong", va cung khong cho mot khoang co dinh.
   *
   * Cach cho-het-chuyen-dong tung duoc dung o day nhung no tu lua: neu may dang
   * ban (Playwright chay nhieu luong song song) thi ca hai lan do deu xay ra
   * TRUOC khi hieu ung kip bat dau, hai lan bang nhau, no ket luan "da dung"
   * trong khi the chua he nhich. Con cho mot khoang co dinh thi hut khi may cham.
   *
   * Nen o duoi dung `expect.poll`: doi cho den khi dat DUNG TRANG THAI CAN CO.
   * Chua toi thi thu lai, toi roi thi di tiep ngay.
   */

  /**
   * Do bang CHINH GIA TRI DICH CHUYEN cua o, khong do vi tri tren trang.
   *
   * Cach cu do `getBoundingClientRect().top` so voi khung chua. No dung, nhung
   * phu thuoc vao viec trang da nam yen chua: luc cac lat nen phia duoi con
   * dang tai thi trang con dan xuong, o truot ra khoi duoi con tro, trinh
   * duyet coi nhu het ro chuot va o ha xuong — phep so cho ket qua sai. Doc
   * thang `transform` thi trang co xe dich bao nhieu lan cung khong anh huong.
   */
  const shift = (page: import("@playwright/test").Page) =>
    page.$$eval(`${TECH} .tc-lift-card`, (els) =>
      els.map(
        (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42,
      ),
    );

  test("rê chuột vào ô nào thì đúng ô đó nổi lên", async ({ page }) => {
    const boxes = page.locator(`${TECH} .tc-lift-card`);
    await expect(boxes).toHaveCount(4);

    // Luc nghi bon o deu nam yen tren cung mot hang.
    expect(await shift(page), "lúc nghỉ không ô nào nổi").toEqual([0, 0, 0, 0]);

    // RO LAI o moi vong tham do — xem chu thich trong app-cards.spec.ts: neu
    // trang xe dich ngay sau khi `hover()` tinh xong toa do thi con tro nam
    // hut ra ngoai o va khong bao gio tu sua.
    const target = boxes.nth(2);
    await expect
      .poll(
        async () => {
          await target.hover();
          return (await shift(page))[2];
        },
        { message: "ô 2 phải nổi lên" },
      )
      .toBeLessThan(-6);

    // Dung o duoc tro vao di LEN. Ba o kia thi thiet ke cho LUN XUONG +2px cho
    // o dang tro noi bat — nen dieu phai kiem la chung KHONG NOI LEN, chu
    // khong phai chung dung yen.
    const after = await shift(page);
    expect(after[2], "ô 2 phải nổi").toBeLessThan(-6);
    for (const index of [0, 1, 3]) {
      expect(
        after[index],
        `ô ${index} không được nổi lên`,
      ).toBeGreaterThanOrEqual(0);
    }
  });

  test("ba ô còn lại mờ đi để ô đang trỏ nổi bật", async ({ page }) => {
    const opacity = () =>
      page.$$eval(`${TECH} .tc-lift-card`, (els) =>
        els.map((el) => Number(getComputedStyle(el).opacity)),
      );

    expect(await opacity()).toEqual([1, 1, 1, 1]);
    // Re chuot LAI moi vong doi: anh tai theo luot cuon co the lam bo cuc xe
    // dich vai pixel sau cu hover dau, the la con tro tuot ra ngoai o va trang
    // thai hover mat — cho mai khong thay. Xem cung kieu o cac spec khac.
    const hover = () => page.locator(`${TECH} .tc-lift-card`).first().hover();
    await hover();
    await expect
      .poll(
        async () => {
          await hover();
          return (await opacity())[1];
        },
        { message: "ô 1 phải mờ đi" },
      )
      .toBeLessThan(1);

    const after = await opacity();
    expect(after[0]).toBe(1);
    for (const index of [1, 2, 3]) {
      expect(after[index]).toBeLessThan(1);
    }
  });

  test("mỗi ô bấm được và dẫn tới trang công nghệ", async ({ page }) => {
    const hrefs = await page.$$eval(`${TECH} .tc-lift-card`, (els) =>
      els.map((el) => el.getAttribute("href")),
    );
    expect(hrefs).toEqual([
      "/cong-nghe/tien-phong-cong-nghe",
      "/cong-nghe/ung-dung",
      "/cong-nghe",
      "/cong-nghe",
    ]);

    await page.locator(`${TECH} .tc-lift-card`).first().click();
    await expect(page).toHaveURL("/cong-nghe/tien-phong-cong-nghe");
  });
});

/**
 * Hai the muc "Câu chuyện đồng hành" tren trang Dai ly — cung co che nhac len.
 */
test.describe("hai thẻ Câu chuyện đồng hành", () => {
  test("rê chuột vào thẻ nào thì thẻ đó nổi lên, thẻ kia mờ đi", async ({
    page,
  }) => {
    await page.goto("/dai-ly");
    await page.locator(DEALER).scrollIntoViewIfNeeded();
    await page.waitForFunction(
      (group) =>
        [
          ...document.querySelectorAll<HTMLImageElement>(
            `${group} .tc-lift-card img`,
          ),
        ].every((img) => img.complete && img.naturalWidth > 1),
      DEALER,
    );
    await page.waitForTimeout(300);

    const cards = page.locator(`${DEALER} .tc-lift-card`);
    await expect(cards).toHaveCount(2);

    // Cung ly do voi hai test tren: doc `transform` chu khong doc vi tri tren
    // trang, de trang co xe dich thi phep do van dung.
    const read = () =>
      page.$$eval(`${DEALER} .tc-lift-card`, (els) =>
        els.map((el) => ({
          shift: new DOMMatrixReadOnly(getComputedStyle(el).transform).m42,
          opacity: Number(getComputedStyle(el).opacity),
        })),
      );

    expect((await read()).map((r) => r.shift)).toEqual([0, 0]);

    const first = cards.first();
    await expect
      .poll(
        async () => {
          await first.hover();
          return (await read())[0].shift;
        },
        { message: "thẻ 0 phải nổi lên" },
      )
      .toBeLessThan(-6);
    const after = await read();

    expect(after[0].shift, "thẻ 0 phải nổi").toBeLessThan(-6);
    expect(after[1].shift, "thẻ 1 không được nổi lên").toBeGreaterThanOrEqual(
      0,
    );
    expect(after[0].opacity).toBe(1);
    expect(after[1].opacity).toBeLessThan(1);
  });
});

/**
 * Bon tam muc "Trai nghiem" tren trang chu nam SAT NHAU va chay het mep canvas.
 * Ro chuot thi chung PHONG TO tu tam chu khong nhac len — nhac len se ho ra nen
 * phia sau, ma nen do khong dung lai duoc (co mot lop sang mo phu ca dai).
 */
test.describe("bốn tấm Trải nghiệm — hover thì nổi lên", () => {
  test("có đủ bốn tấm và tấm nào cũng bấm sang được trang của nó", async ({
    page,
  }) => {
    await page.goto("/");
    const cards = page.locator(`${LIFE} .tc-lift-card`);
    await expect(cards).toHaveCount(4);
    const hrefs = await cards.evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    );
    expect(hrefs).toEqual([
      "/trai-nghiem/hanh-trinh",
      "/trai-nghiem/ban-sac-rieng",
      "/trai-nghiem/khoanh-khac",
      "/trai-nghiem/phong-cach-song",
    ]);
  });

  test("rê chuột thì tấm đó TO RA, không cần bấm", async ({ page }) => {
    await page.goto("/");
    const card = page.locator(`${LIFE} .tc-lift-card`).nth(1);
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Doc `transform` chu khong doc vi tri tren trang: ro chuot co the lam
    // trang cuon mot chut, va luc do vi tri tren khung nhin doi theo — phep so
    // sanh se sai trong khi the chang he xe dich.
    const read = () =>
      card.evaluate((el) => {
        const cs = getComputedStyle(el);
        const m = new DOMMatrixReadOnly(cs.transform);
        return { scale: m.a, origin: cs.transformOrigin };
      });

    const before = await read();
    expect(before.scale, "lúc nghỉ thì đúng cỡ gốc").toBeCloseTo(1, 2);

    await card.hover();
    await page.waitForTimeout(700);
    const after = await read();
    expect(after.scale, "rê chuột thì phải to ra").toBeGreaterThan(1.02);

    // Nen no LEN TREN: ngay duoi tam la chu ve chet trong nen, no xuong la de
    // len chu. Goc phong to phai nam o day tam.
    // `transform-origin` doc ra theo he toa do RIENG cua the (chua nhan ti le,
    // chua nhan zoom cua canvas), nen so voi `offsetHeight` chu khong so voi
    // kich thuoc do tren khung nhin.
    const own = await card.evaluate((el) => (el as HTMLElement).offsetHeight);
    const originY = Number(after.origin.split(" ")[1].replace("px", ""));
    expect(originY, "gốc phóng to phải ở đáy tấm").toBeCloseTo(own, 0);
  });

  test("các tấm cùng cụm mờ đi, cụm khác trên trang không đụng tới", async ({
    page,
  }) => {
    await page.goto("/");
    const group = page.locator(`${LIFE} .tc-lift-card`);
    await group.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await group.nth(1).hover();
    await page.waitForTimeout(600);

    const dimmed = await group.nth(0).evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(dimmed), "tấm cùng cụm phải mờ đi").toBeLessThan(0.9);

    // Cum bon o muc "Cong nghe" nam xa phia duoi — khong duoc mo theo.
    const other = page.locator(".tc-lift-card:not([data-grow])").first();
    const otherOpacity = await other.evaluate(
      (el) => getComputedStyle(el).opacity,
    );
    expect(Number(otherOpacity), "cụm khác phải giữ nguyên").toBe(1);
  });
});

/**
 * Hai nhom the moi tren trang Giai phap, khach yeu cau 01/10/2026:
 *   - hai the "MÀN HÌNH WINCA" / "MÀN HÌNH BRAVO": ro chuot thi noi len, bam
 *     WINCA sang thang trang man hinh, bam BRAVO sang tab Bravo;
 *   - ba the PPF xep doc: ro chuot thi noi len.
 */
test.describe("thẻ mới trên trang Giải pháp", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/giai-phap");
    // Anh the tai theo luot cuon, ma hai nhom nay nam sau (y 2964 va 4665) —
    // khong cuon qua thi cho mai khong thay chung tai xong.
    await page.evaluate(async () => {
      for (let y = 0; y < 6200; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
    });
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tc-lift-card img")].every(
        (img) => img.complete && img.naturalWidth > 1,
      ),
    );
  });

  test("hai thẻ màn hình dẫn đúng chỗ", async ({ page }) => {
    const winca = page.locator('.tc-lift-card[href="/giai-phap/man-hinh"]');
    const bravo = page.locator('.tc-lift-card[href="/giai-phap/man-hinh/bravo"]');
    await expect(winca).toHaveCount(1);
    await expect(bravo).toHaveCount(1);

    await bravo.click();
    await expect(page).toHaveURL(/\/giai-phap\/man-hinh\/bravo$/);
  });

  test("ba thẻ PPF đều dẫn sang trang PPF", async ({ page }) => {
    const ppf = page.locator('.tc-lift-card[href="/giai-phap/ppf"]');
    await expect(ppf).toHaveCount(3);
  });

  for (const [what, href] of [
    ["màn hình", "/giai-phap/man-hinh/bravo"],
    ["PPF", "/giai-phap/ppf"],
  ] as const) {
    test(`rê chuột vào thẻ ${what} thì nó nổi lên, thẻ cùng nhóm mờ đi`, async ({
      page,
    }) => {
      const card = page.locator(`.tc-lift-card[href="${href}"]`).first();
      await card.scrollIntoViewIfNeeded();

      // Cum the nay PHONG TO tu tam chu khong nhac len: chung ve de len chinh
      // cho cu trong anh nen, nhac len la ho nen ra. Nen do `scale` chu khong
      // do `translateY`.
      const scaleOf = () =>
        card.evaluate(
          (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11,
        );
      expect(await scaleOf()).toBe(1);

      await expect
        .poll(
          async () => {
            await card.hover();
            return scaleOf();
          },
          { message: "thẻ phải nổi lên" },
        )
        .toBeGreaterThan(1.01);
    });
  }
});

/**
 * Hai cum the tren trang Giai phap co ban @3x di KEM ban @2x.
 *
 * Phai la "di kem" chu khong phai "thay the": doi han sang @3x thi gate pixel
 * bao lech 1667 diem, vi nen @2x thu nho 2->1 con the @3x thu nho 3->1 va sai
 * so lay mau khac nhau. Giu ca hai thi ti le 1 van di duong @2x (lech 0) ma
 * man retina rong duoc ban net — do do net tu 0,56 len 0,84, dung tran cua
 * ban thiet ke.
 */
test.describe("thẻ nổi trang Giải pháp — hai độ phân giải", () => {
  const RETINA = [
    "giai-phap-man-hinh-winca",
    "giai-phap-man-hinh-bravo",
    "giai-phap-ppf-3m",
    "giai-phap-ppf-nano-sun",
    "giai-phap-ppf-5do",
  ];

  test("màn thường tỉ lệ 1 lấy bản @2x — đúng bản mà gate pixel nhìn thấy", async ({
    browser,
  }) => {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    await page.goto("/giai-phap");
    await page.evaluate(() => window.scrollTo(0, 4400));
    const used = await page.$$eval(".tc-lift-card img", (els) =>
      els.map((e) => (e as HTMLImageElement).currentSrc.split("/").pop()!.split("?")[0]),
    );
    for (const name of RETINA) {
      expect(used, `${name} phải dùng bản @2x`).toContain(`${name}.webp`);
    }
    await page.close();
  });

  test("màn retina rộng lấy bản @3x", async ({ browser }) => {
    const page = await browser.newPage({
      viewport: { width: 2560, height: 1000 },
      deviceScaleFactor: 2,
    });
    await page.goto("/giai-phap");
    await page.evaluate(() => window.scrollTo(0, 7000));
    await expect
      .poll(
        async () =>
          page.$$eval(".tc-lift-card img", (els) =>
            els.filter((e) =>
              (e as HTMLImageElement).currentSrc.includes("@3x.webp"),
            ).length,
          ),
        { message: "màn retina rộng phải lấy bản @3x" },
      )
      .toBe(RETINA.length);
    await page.close();
  });
});
