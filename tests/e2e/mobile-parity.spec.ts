import { expect, test } from "@playwright/test";

/**
 * Moi khoi TUONG TAC cua ban desktop deu phai co mat tren dien thoai.
 *
 * Ra soat ngay 01/10/2026 bang cach doi chieu lop phan tu cua ban 1440px voi
 * ban 390px tren ca 6 trang chinh lan 31 trang con. Sau cho chi co tren
 * desktop:
 *   - dai "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" (/giai-phap)
 *   - bang "BỘ SƯU TẬP" (/trai-nghiem/khoanh-khac)
 *   - dai "CÁC BÀI VIẾT KHÁC" (cuoi trang bai viet)
 *   - trac nghiem phong cach (/trai-nghiem/ban-sac-rieng)
 *   - o tim dai ly (/dai-ly/mang-luoi-dai-ly)
 * Ba cai dau la bang chuyen co chieu sau, hai cai sau dat tuyet doi len dung
 * cho ve san trong anh nen — ca nam deu dung toa do canvas 1440px, ma duoi
 * 900px canvas bi an han.
 */
test.use({ viewport: { width: 390, height: 844 } });

test.describe("mobile có đủ các khối tương tác của desktop", () => {
  test("dải CÁC DỰ ÁN có mặt, đủ bốn tấm, và không in tiêu đề hai lần", async ({
    page,
  }) => {
    await page.goto("/giai-phap");
    const strip = page.locator(".tc-m .tc-m-car").first();
    await expect(strip).toBeVisible();
    await expect(strip.locator("img")).toHaveCount(4);

    const headings = await page
      .locator(".tc-m h2, .tc-m .tc-m-label")
      .evaluateAll((els) =>
        els.map((e) =>
          (e.textContent ?? "")
            .trim()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase(),
        ),
      );
    expect(new Set(headings).size, "không được in tiêu đề nào hai lần").toBe(
      headings.length,
    );
  });

  test("băng BỘ SƯU TẬP có mặt, đủ ba tấm", async ({ page }) => {
    await page.goto("/trai-nghiem/khoanh-khac");
    const strip = page.locator(".tc-m .tc-m-car").first();
    await expect(strip).toBeVisible();
    await expect(strip.locator("img")).toHaveCount(3);
  });

  test("dải CÁC BÀI VIẾT KHÁC có mặt, đủ ba tấm", async ({ page }) => {
    await page.goto("/trai-nghiem/phong-cach-song/doi-mau-doi-dien-mao");
    const strip = page.locator(".tc-m .tc-m-car").first();
    await expect(strip).toBeVisible();
    await expect(strip.locator("img")).toHaveCount(3);
  });

  test("dải nằm đúng chỗ của nó trong mạch bài, không phải cứ nhét xuống cuối", async ({
    page,
  }) => {
    // Dai duoc TRON vao giua cac doan chu theo do cao tren canvas. Tren trang
    // Khoảnh khắc thi do cao cua no (1761) lon hon moi doan chu (cao nhat
    // 1704) nen no dung cuoi — nhung phai dung SAU tieu de "SỐNG TRỌN TỪNG
    // HÀNH TRÌNH" (1561) chu khong phai truoc, va phai nam TRONG bai chu khong
    // bi day ra ngoai khoi lien he.
    await page.goto("/trai-nghiem/khoanh-khac");
    const order = await page.evaluate(() => {
      const kids = [...document.querySelectorAll(".tc-m-article > *")];
      return {
        strip: kids.findIndex((el) => el.querySelector(".tc-m-car")),
        heading: kids.findIndex((el) =>
          (el.textContent ?? "").includes("SỐNG TRỌN TỪNG HÀNH TRÌNH"),
        ),
        total: kids.length,
      };
    });
    expect(order.strip, "dải phải nằm trong bài").toBeGreaterThanOrEqual(0);
    expect(order.heading, "không tìm thấy tiêu đề để so").toBeGreaterThanOrEqual(0);
    expect(order.strip).toBeGreaterThan(order.heading);

    // Hien tai CA HAI dai deu tinh co nam cuoi trang cua chung, nen nhin DOM
    // thi "tron theo do cao" va "nhet xuong cuoi" cho ra ket qua y het nhau.
    // Phep tron duoc kiem bang du lieu dung san o tests/unit/mobile-order.test.ts.
  });

  test("trắc nghiệm làm được trọn vẹn trên điện thoại", async ({ page }) => {
    await page.goto("/trai-nghiem/ban-sac-rieng");
    const quiz = page.locator(".tc-quiz-m");
    await expect(quiz).toBeVisible();

    for (let step = 1; step <= 5; step += 1) {
      await expect(quiz.locator(".tc-quiz-count")).toHaveText(`Câu ${step} / 5`);
      await quiz.locator("label").first().click();
      await quiz.locator(".tc-quiz-next").click();
    }
    await expect(quiz.locator(".tc-quiz-result")).toBeVisible();
    await expect(quiz.locator(".tc-quiz-cta")).toBeVisible();
  });

  test("ô chọn và nút của trắc nghiệm đều đạt 44px", async ({ page }) => {
    await page.goto("/trai-nghiem/ban-sac-rieng");
    const quiz = page.locator(".tc-quiz-m");
    for (const target of [quiz.locator("label").first(), quiz.locator(".tc-quiz-next")]) {
      const box = await target.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("tìm được đại lý trên điện thoại", async ({ page }) => {
    await page.goto("/dai-ly/mang-luoi-dai-ly");
    const form = page.locator(".tc-dealer-m");
    await expect(form).toBeVisible();

    await form.locator("select").first().selectOption({ index: 1 });
    await form.locator("select").nth(1).selectOption({ index: 1 });
    await form.locator(".tc-field-submit").click();

    const panel = form.locator(".tc-dealer-panel");
    await expect(panel).toBeVisible();
    const links = panel.locator("a");
    expect(await links.count()).toBeGreaterThan(0);
    for (const href of await links.evaluateAll((els) =>
      els.map((e) => e.getAttribute("href") ?? ""),
    )) {
      expect(href).toContain("google.com/maps");
    }
  });

  test("ba ô của form tìm đại lý đều đạt 44px", async ({ page }) => {
    await page.goto("/dai-ly/mang-luoi-dai-ly");
    const form = page.locator(".tc-dealer-m");
    for (const sel of [".tc-field", ".tc-field-submit"]) {
      for (const box of await form.locator(sel).evaluateAll((els) =>
        els.map((e) => e.getBoundingClientRect().height),
      )) {
        expect(box).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
