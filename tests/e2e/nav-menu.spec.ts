import { expect, test } from "@playwright/test";

/**
 * Menu con xo xuong khi ro chuot, va thanh truot danh dau muc dang xem.
 * Xem src/components/site/SiteNav.tsx.
 */
test.describe("menu điều hướng", () => {
  test("rê chuột vào mục cha thì xổ menu con, rời ra thì đóng", async ({
    page,
  }) => {
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

  test("trang chủ không sáng mục nào nên không có thanh trượt", async ({
    page,
  }) => {
    // Frame goc danh dau nham "TRẢI NGHIỆM" o trang chu — da ghi trong
    // src/lib/design-deviations.ts la CO Y bo danh dau.
    await page.goto("/");
    await expect(page.locator(".tc-navpill")).toHaveCount(0);
  });

  test("chỉ MỘT khung, và nó dừng ở mục đang xem", async ({ page }) => {
    // Khach chot: dung mot lop thoi — chinh cai luot theo chuot cung la cai
    // dung lai o muc dang xem (30/09/2026).
    await page.goto("/trai-nghiem");
    const pill = page.locator(".tc-navpill");
    await expect(pill, "chỉ được có một khung").toHaveCount(1);
    await expect(pill).toHaveAttribute("data-resting", "true");

    // Khung phai nam dung tren muc dang xem.
    const [pillBox, itemBox] = await Promise.all([
      pill.boundingBox(),
      page.locator('.hdr a.nv[href="/trai-nghiem"]').boundingBox(),
    ]);
    expect(Math.abs(pillBox!.x - itemBox!.x), "khung lệch khỏi mục đang xem").
      toBeLessThan(2);

    const look = await pill.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, ring: cs.boxShadow };
    });
    expect(look.bg, "đứng yên vẫn phải thấy khung").not.toMatch(/rgba\(0, 0, 0, 0\)/);
    expect(look.ring).not.toBe("none");
  });

  test("rê chuột thì CHÍNH khung đó chạy theo, không mọc thêm cái nào", async ({
    page,
  }) => {
    await page.goto("/trai-nghiem");
    const pill = page.locator(".tc-navpill");
    const before = await pill.evaluate((el) => el.getBoundingClientRect().x);

    await page.locator('.hdr a.nv[href="/nhan-su"]').hover();
    await page.waitForTimeout(700);

    await expect(pill, "vẫn chỉ một khung").toHaveCount(1);
    const after = await pill.evaluate((el) => el.getBoundingClientRect().x);
    expect(after, "khung phải chạy theo chuột").toBeGreaterThan(before);
    await expect(pill).not.toHaveAttribute("data-resting", "true");
  });

  test("bỏ chuột ra thì khung quay về mục đang xem", async ({ page }) => {
    await page.goto("/trai-nghiem");
    const pill = page.locator(".tc-navpill");
    const home = await pill.evaluate((el) => el.getBoundingClientRect().x);

    await page.locator('.hdr a.nv[href="/nhan-su"]').hover();
    await page.waitForTimeout(700);
    await page.mouse.move(20, 700);
    await page.waitForTimeout(900);

    const back = await pill.evaluate((el) => el.getBoundingClientRect().x);
    expect(Math.round(back)).toBe(Math.round(home));
  });

  test("chuyển tab thì thanh trượt LƯỚT sang, không nhảy cóc", async ({
    page,
  }) => {
    await page.goto("/giai-phap");
    await expect(page.locator(".tc-navpill")).toHaveCount(1);

    // Ghi lai vi tri thanh truot theo TUNG KHUNG HINH. Truot that thi phai di
    // qua nhieu vi tri trung gian; nhay coc thi chi co diem dau va diem cuoi.
    const track = async (to: string) => {
      await page.evaluate(() => {
        const w = window as unknown as { __pillTrack: number[] };
        w.__pillTrack = [];
        const tick = () => {
          const el = document.querySelector(".tc-navpill");
          if (el) {
            w.__pillTrack.push(Math.round(el.getBoundingClientRect().x));
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await page.locator(`.hdr a.nv[href="${to}"]`).click();
      await expect(page).toHaveURL(to);
      // Cho thanh truot xuat hien lai roi DUNG HAN, thay vi cho cung mot khoang.
      // Cho cung 900ms thi khi may dang tai nang, ca khoang do troi qua trong
      // luc trang con dang chuyen — bo ghi khong bat duoc khung hinh nao va bai
      // kiem do oan.
      await expect(page.locator(".tc-navpill")).toHaveCount(1);
      // Dung khi thanh truot DA DI CHUYEN va sau do dung yen 12 khung hinh.
      //
      // Chi doi "dung yen" thoi thi chua du: sau khi doi trang, thanh truot
      // nam yen mot lat o cho cu truoc khi bat dau lươt, va 12 khung hinh dau
      // tien deu giong nhau — bai kiem se thoat som roi bao "nhay coc" oan.
      //
      // Het gio ma van chua nhuc nhich thi cu de chay tiep: loi se do dung
      // cho — o cau expect ben duoi, kem con so dem duoc.
      await page
        .waitForFunction(
          () => {
            const seen = (window as unknown as { __pillTrack: number[] })
              .__pillTrack;
            const tail = seen.slice(-12);
            return (
              new Set(seen).size > 1 &&
              tail.length === 12 &&
              new Set(tail).size === 1
            );
          },
          undefined,
          { timeout: 5000 },
        )
        .catch(() => undefined);
      const seen = await page.evaluate(
        () => (window as unknown as { __pillTrack: number[] }).__pillTrack,
      );
      return new Set(seen).size;
    };

    // Kiem NHIEU lan chuyen lien tiep, khong chi mot.
    //
    // Loi cu chi lo ra tu lan chuyen THU HAI tro di: lan dau thoat vi font
    // chua tai xong, cac lan sau `document.fonts.ready` xong ngay va nem thanh
    // truot thang toi dich truoc khi cu truot kip chay.
    expect(await track("/cong-nghe"), "lần 1").toBeGreaterThan(5);
    expect(await track("/nhan-su"), "lần 2").toBeGreaterThan(5);
    expect(await track("/trai-nghiem"), "lần 3").toBeGreaterThan(5);
  });

  test("đang ở trang con nào thì mục đó có gạch chân sẵn", async ({ page }) => {
    await page.goto("/nhan-su/van-hoa-tc");
    await page.locator('.hdr a.nv[href="/nhan-su"]').hover();

    const here = page.locator(".tc-submenu-item[data-here]");
    await expect(here).toHaveCount(1);
    await expect(here).toHaveText("VĂN HOÁ TC");
    await expect(here).toHaveAttribute("aria-current", "page");
  });

  test("đang đọc bài trong mục con thì mục con đó vẫn sáng", async ({
    page,
  }) => {
    // Trang sau nua cua muc con — nguoi dung van dang "trong" muc do.
    await page.goto("/nhan-su/van-hoa-tc/cau-chuyen-khoi-nghiep");
    await page.locator('.hdr a.nv[href="/nhan-su"]').hover();
    await expect(page.locator(".tc-submenu-item[data-here]")).toHaveText(
      "VĂN HOÁ TC",
    );
  });

  test("ở TRANG CHÍNH thì không mục con nào được đánh dấu", async ({
    page,
  }) => {
    await page.goto("/nhan-su");
    await page.locator('.hdr a.nv[href="/nhan-su"]').hover();
    await expect(page.locator(".tc-submenu-item[data-here]")).toHaveCount(0);
  });
});
