import { expect, test } from "@playwright/test";

/**
 * Bat bien ve kha nang tiep can, kiem tren CA HAI be ngang.
 *
 * Ba thu nay de hong ma khong ai thay cho den khi co nguoi dung trinh doc man
 * hinh hoac ngon tay to: lien ket khong co ten, vung cham qua nho, va trang
 * tran ngang. Do duoc truoc khi sua: 7 lien ket khong ten tren trang chu ban
 * dien thoai (the anh co chu nam trong anh), va so dien thoai o chan trang
 * chi cao 20px.
 */
const ROUTES = [
  "/",
  "/giai-phap",
  "/dai-ly",
  "/nhan-su",
  "/giai-phap/man-hinh",
  "/giai-phap/man-hinh/tat-ca",
  "/cau-hoi-thuong-gap",
  "/giai-phap/loa/dego",
  "/giai-phap/man-hinh/s300-plus-qled-2k-dts",
];

async function survey(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  return page.evaluate(() => {
    const seen = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const all = [...document.querySelectorAll("a[href], button")].filter(seen);
    const de = document.documentElement;
    return {
      unnamed: all
        .filter(
          (el) =>
            !(el.getAttribute("aria-label") || el.textContent || "").trim(),
        )
        .map((el) => `${el.tagName}.${(el.className || "").toString().slice(0, 24)}`),
      tiny: all
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return Math.min(r.width, r.height) < 24;
        })
        .map(
          (el) =>
            `${el.tagName} "${(el.textContent || "").trim().slice(0, 18)}"`,
        ),
      overflow: de.scrollWidth - de.clientWidth,
      h1: document.querySelectorAll("h1").length,
      imgNoAlt: [...document.querySelectorAll("img")].filter(
        (img) => img.getAttribute("alt") === null,
      ).length,
    };
  });
}

for (const width of [390, 1440]) {
  test.describe(`bề ngang ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("không link nào thiếu tên", async ({ page }) => {
      for (const route of ROUTES) {
        await page.goto(route);
        const r = await survey(page);
        expect(r.unnamed, `${route} — link thiếu tên`).toEqual([]);
      }
    });

    test("vùng chạm đủ to trên điện thoại", async ({ page }) => {
      // CHI ap o be ngang dien thoai. O be ngang desktop, phan lon dieu khien
      // nam tren canvas 1440px khoa lech 0 pixel so voi thiet ke — noi chung
      // ra la doi thiet ke. Va o do nguoi dung dung chuot, khuyen nghi 24px
      // von danh cho ngon tay.
      test.skip(width !== 390, "chỉ kiểm ở bề ngang điện thoại");
      for (const route of ROUTES) {
        await page.goto(route);
        const r = await survey(page);
        expect(r.tiny, `${route} — vùng chạm dưới 24px`).toEqual([]);
      }
    });

    test("không trang nào tràn ngang, mỗi trang đúng một h1", async ({
      page,
    }) => {
      for (const route of ROUTES) {
        await page.goto(route);
        const r = await survey(page);
        expect(r.overflow, `${route} tràn ngang`).toBeLessThanOrEqual(1);
        expect(r.h1, `${route} phải có đúng một h1`).toBe(1);
        expect(r.imgNoAlt, `${route} — ảnh thiếu alt`).toBe(0);
      }
    });
  });
}
