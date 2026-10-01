import { expect, test } from "@playwright/test";

/**
 * Dai anh "BỘ SƯU TẬP" tren trang Khoảnh khắc.
 *
 * Thiet ke ve chet ba tam anh le ra hai ben kem mui ten "‹ ›" — y la mot bang
 * chuyen. Khach yeu cau no TU CHAY va bam vao tam nao thi tam do chay vao giua
 * (30/09/2026). Truoc do ca dai nam trong anh nen nen dung yen.
 * Xem tools/brand/extract-gallery.py va src/components/site/Coverflow.tsx.
 */
const PAGE = "/trai-nghiem/khoanh-khac";

const cards = (page: import("@playwright/test").Page) =>
  page.$$eval(".tc-cover .tc-cover-card", (els) =>
    els.map((el) => {
      const img = el.querySelector("img")!;
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return {
        src: img.getAttribute("src")!.split("/").pop()!.split("?")[0],
        centre: el.hasAttribute("data-on"),
        x: Math.round(m.m41),
        loaded: img.complete && img.naturalWidth > 1,
      };
    }),
  );

test.describe("dải BỘ SƯU TẬP", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await page.locator(".tc-cover").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tc-cover img")].every(
        (img) => img.complete && img.naturalWidth > 1,
      ),
    );
    // Ghim chuot de dung nhip tu chay truoc khi do.
    await page.locator(".tc-cover").hover();
    await page.waitForTimeout(400);
  });

  test("ba tấm đều là ảnh thật và tải được", async ({ page }) => {
    const rows = await cards(page);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.loaded)).toBe(true);
    expect(new Set(rows.map((r) => r.src)).size).toBe(3);
  });

  test("lúc nghỉ: một tấm ở giữa, hai tấm kia lệch sang hai bên", async ({
    page,
  }) => {
    const rows = await cards(page);
    const mid = rows.filter((r) => r.centre);
    expect(mid).toHaveLength(1);
    expect(mid[0].x).toBe(0);
    expect(rows.some((r) => r.x > 0), "phải có tấm lệch phải").toBe(true);
    expect(rows.some((r) => r.x < 0), "và tấm lệch trái").toBe(true);
  });

  test("bấm tấm bên cạnh thì nó chạy vào giữa", async ({ page }) => {
    const before = await cards(page);
    const side = before.find((r) => r.x > 0)!;
    const index = before.findIndex((r) => r.src === side.src);

    await page.locator(".tc-cover .tc-cover-card").nth(index).click({
      position: { x: 40, y: 200 },
    });
    await page.waitForTimeout(900);

    const after = await cards(page);
    const now = after.find((r) => r.src === side.src)!;
    expect(now.centre, "tấm vừa bấm phải vào giữa").toBe(true);
    expect(now.x).toBe(0);
  });

  test("TỰ CHẠY khi không ai đụng vào", async ({ page }) => {
    // Bo chuot ra khoi dai thi nhip tu chay tiep tuc.
    await page.mouse.move(10, 10);

    // Doi `data-playing` xuat hien ROI moi bam gio. Truoc day bai nay bam gio
    // ngay sau khi roi chuot, nen han 12 giay phai gom ca do tre cua
    // onMouseLeave lan cua IntersectionObserver; chay mot minh thi du, chay
    // song song 5 luong thi thinh thoang hut mot nhip 5 giay va bao sai oan.
    await expect(page.locator(".tc-cover")).toHaveAttribute("data-playing", "true");

    const first = (await cards(page)).find((r) => r.centre)!.src;
    await expect
      .poll(async () => (await cards(page)).find((r) => r.centre)!.src, {
        timeout: 20_000,
        message: "dải phải tự đổi ảnh",
      })
      .not.toBe(first);
  });

  test("dải vẽ sẵn đã bị xoá khỏi ảnh nền", async ({ page }) => {
    // Doc thang lat nen ra canvas roi do do tan mau o dai giua vung anh cu.
    // Con tam anh nao sot lai thi do tan mau vot len ngay; nen tron thi rat
    // deu. Cung nguon (localhost) nen canvas khong bi "nhiem" va doc duoc.
    const spread = await page.evaluate(async () => {
      const shot = [...document.querySelectorAll<HTMLImageElement>("img")].find(
        (img) => img.currentSrc.includes("khoanh-khac-2"),
      );
      if (!shot) {
        return -1;
      }
      const img = new Image();
      img.src = shot.currentSrc;
      await img.decode();

      // Lat 2 bat dau o y = 1800 cua he toa do canvas; dai anh cu nam
      // 1761..2346, nen phan trong lat nay la 0..546.
      const scale = img.naturalWidth / 1440;
      const c = document.createElement("canvas");
      c.width = 300;
      c.height = 120;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(
        img,
        Math.round(300 * scale),
        0,
        Math.round(600 * scale),
        Math.round(400 * scale),
        0,
        0,
        300,
        120,
      );
      const data = ctx.getImageData(0, 0, 300, 120).data;
      let sum = 0;
      let sumSq = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
        sum += v;
        sumSq += v * v;
        n += 1;
      }
      return Math.sqrt(sumSq / n - (sum / n) ** 2);
    });

    expect(spread, "phải đọc được lát nền").toBeGreaterThanOrEqual(0);
    // Do thuc te sau khi xoa: khoang 1. Con tam anh thi vot len hang chuc.
    expect(spread, "nền phải trơn — không còn ảnh vẽ sẵn").toBeLessThan(6);
  });
});
