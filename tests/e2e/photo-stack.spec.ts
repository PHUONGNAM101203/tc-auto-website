import { expect, test } from "@playwright/test";

/**
 * Chong anh xoe.
 *
 * Khach chot (30/09/2026): bam mui ten thi tam tren cung xuong day chong (di
 * SANG PHAI, vi cac tang phia sau nam ben phai va cao hon); bam thang vao mot
 * tam phia sau thi tam do len dau (di SANG TRAI). Va quan trong nhat: may tam
 * phia sau phai la ANH THAT chu khong phai hinh ve san trong anh nen.
 * Xem src/components/site/PhotoSlider.tsx.
 */
const DECKS = [
  { path: "/", label: "Câu chuyện khởi nghiệp", count: 3 },
  { path: "/dai-ly", label: "Chân dung đại lý", count: 3 },
  { path: "/nhan-su", label: "Con người TC", count: 4 },
];

/** Tam nao dang o tang nao, kem vi tri va do mo. */
const layers = (page: import("@playwright/test").Page) =>
  page.$$eval(".tc-deck .tc-deck-card", (els) =>
    els.map((el) => {
      const img = el.querySelector("img")!;
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return {
        src: img.getAttribute("src")!.split("/").pop()!.split("?")[0],
        front: el.hasAttribute("data-front"),
        x: Math.round(m.m41),
        y: Math.round(m.m42),
        z: Number(getComputedStyle(el).zIndex),
        loaded: img.complete && img.naturalWidth > 1,
      };
    }),
  );

for (const deck of DECKS) {
  test.describe(`chồng ảnh ${deck.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(deck.path);
      await page.locator(".tc-deck").first().scrollIntoViewIfNeeded();
      await page.waitForFunction(() =>
        [...document.querySelectorAll<HTMLImageElement>(".tc-deck img")].every(
          (img) => img.complete && img.naturalWidth > 1,
        ),
      );
      // Re chuot vao chong de DUNG nhip tu chay: khong ghim thi nhip 5 giay
      // co the xen vao giua luc do va luc bam, ket qua nhay mot tam.
      await page.locator(".tc-deck").first().hover();
      await page.waitForTimeout(400);
    });

    test("mọi tấm trong chồng đều là ẢNH THẬT, không tấm nào trùng nhau", async ({
      page,
    }) => {
      const rows = await layers(page);
      expect(rows).toHaveLength(deck.count);
      expect(rows.every((r) => r.loaded), "ảnh nào cũng phải tải được").toBe(
        true,
      );
      // Truoc day may tam phia sau nam trong anh nen — tuc la chi co MOT tam
      // that. Nay phai du so tam, va moi tam mot anh khac nhau.
      expect(new Set(rows.map((r) => r.src)).size).toBe(deck.count);
    });

    test("lúc nghỉ: tấm trên cùng đúng vị trí gốc, các tấm sau xoè lên phải", async ({
      page,
    }) => {
      const rows = await layers(page);
      const front = rows.find((r) => r.front)!;
      // Tam tren cung cat tu chinh ban thiet ke nen phai o dung goc.
      expect(front.x).toBe(0);
      expect(front.y).toBe(0);

      const behind = rows.filter((r) => !r.front);
      expect(behind).toHaveLength(deck.count - 1);
      for (const card of behind) {
        expect(card.x, "tấm sau phải lệch sang phải").toBeGreaterThan(0);
        expect(card.y, "và lên trên").toBeLessThan(0);
        expect(card.z, "và nằm dưới tấm trên cùng").toBeLessThan(front.z);
      }
    });

    test("bấm mũi tên: tấm trên cùng xuống đáy chồng, đi sang PHẢI", async ({
      page,
    }) => {
      const before = await layers(page);
      const front = before.find((r) => r.front)!;

      await page.locator(".tc-photoslider-arrow").last().click();
      await page.waitForTimeout(900);

      const after = await layers(page);
      const moved = after.find((r) => r.src === front.src)!;
      expect(moved.front, "tấm cũ không còn ở trên cùng").toBe(false);
      expect(moved.x, "nó phải đi sang phải").toBeGreaterThan(front.x);
      // Xuong DAY chong chu khong phai lui mot tang.
      expect(moved.x).toBe(Math.max(...after.map((r) => r.x)));
    });

    test("bấm thẳng vào một tấm phía sau: tấm đó lên đầu, đi sang TRÁI", async ({
      page,
    }) => {
      const before = await layers(page);
      const front = before.find((r) => r.front)!;
      // Tam ngay SAU tam tren cung: dai lo ra cua no la khoang giua mep phai
      // tam tren cung va mep phai cua chinh no, va o dai do no la tam nam
      // tren cung — nen bam vao day khong the nham sang tam khac.
      const pick = before
        .filter((r) => !r.front)
        .reduce((a, b) => (a.x <= b.x ? a : b));

      const box = (await page.locator(".tc-deck").first().boundingBox())!;
      await page.mouse.click(
        box.x + box.width + pick.x / 2,
        box.y + box.height / 2,
      );
      await page.waitForTimeout(900);

      const after = await layers(page);
      const now = after.find((r) => r.src === pick.src)!;
      expect(now.front, "tấm vừa bấm phải lên đầu").toBe(true);
      expect(now.x, "và đi sang trái để về vị trí gốc").toBeLessThan(pick.x);
      expect(now.x).toBe(0);
      // Tam cu nhuong cho, khong bien mat.
      expect(after.find((r) => r.src === front.src)!.front).toBe(false);
    });
  });
}
