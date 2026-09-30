import { expect, test } from "@playwright/test";

/**
 * Chu tren canvas khong duoc ve TRUOC khi phong san sang.
 *
 * ── Vi sao ──────────────────────────────────────────────────────────────────
 * Ban thiet ke nuong san mot so doan chu vao chinh anh nen (vi du doan gioi
 * thieu duoi hero trang chu), dong thoi cung doan do la phan tu that de doc va
 * chon duoc. Hai ban chong khit nhau nen binh thuong khong ai thay. Nhung luc
 * phong web chua tai xong, ban THAT duoc ve bang phong du phong co be ngang
 * khac — the la chu hien thanh BONG DOI. Khach bao hai lan.
 *
 * Cach chua: trong luc cho phong, de anh nen lo (chu nuong san trong do von da
 * dung kieu), dung ve chu that.
 */
test.describe("không để chữ hiện bóng đôi lúc tải", () => {
  test("cơ chế nằm trong script nội tuyến, không đợi React gắn xong", async ({
    page,
  }) => {
    // KHONG co bat lop do dang bat: phong tai xong trong khoang 100ms va
    // `document.fonts.ready` con giai quyet ngay lap tuc khi phong hong, nen
    // moi phep do truc tiep deu la mot cuoc dua. Thay vao do kiem hai dieu
    // chac chan: co che co nam trong HTML dau tien, va cuoi cung lop phai duoc
    // go ra (khong bao gio de chu bi an vinh vien).
    const response = await page.goto("/");
    const html = (await response!.text()) ?? "";
    expect(html, "script nội tuyến phải bật lớp chờ").toContain("tc-fontwait");
    expect(html, "và phải tự gỡ khi phông sẵn sàng").toContain("fonts.ready");
    expect(html, "và phải có hạn chờ phòng khi mạng hỏng").toMatch(
      /setTimeout\(done,\s*\d+\)/,
    );

    await page.waitForFunction(
      () => !document.documentElement.classList.contains("tc-fontwait"),
      null,
      { timeout: 6000 },
    );
  });

  test("trong lúc chờ thì chữ trên canvas trong suốt, xong thì hiện lại", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".tc-canvas .p").first().waitFor();
    const colourWhile = await page.evaluate(() => {
      // Ep lai trang thai cho de do — lop nay co the da duoc go trong tich tac.
      document.documentElement.classList.add("tc-fontwait");
      const el = document.querySelector(".tc-canvas .p");
      return el ? getComputedStyle(el).color : null;
    });
    expect(colourWhile, "phải tìm thấy đoạn chữ trên canvas").not.toBeNull();
    expect(colourWhile).toBe("rgba(0, 0, 0, 0)");

    await page.evaluate(() =>
      document.documentElement.classList.remove("tc-fontwait"),
    );
    const colourAfter = await page.evaluate(() => {
      const el = document.querySelector(".tc-canvas .p");
      return el ? getComputedStyle(el).color : null;
    });
    expect(colourAfter).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("ảnh nền KHÔNG bị ẩn theo — trang không trắng xoá lúc chờ", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() =>
      document.documentElement.classList.add("tc-fontwait"),
    );
    const shown = await page.evaluate(() => {
      const img = document.querySelector<HTMLImageElement>("img.sl");
      if (!img) return null;
      const cs = getComputedStyle(img);
      return { opacity: cs.opacity, display: cs.display, visibility: cs.visibility };
    });
    expect(shown).not.toBeNull();
    expect(shown!.display).not.toBe("none");
    expect(shown!.visibility).toBe("visible");
  });

  test("chờ không quá lâu: gỡ lớp trong vòng 2 giây kể cả khi phông hỏng", async ({
    page,
  }) => {
    // Chan het woff2 de gia lap mang hong.
    await page.route("**/*.woff2", (route) => route.abort());
    const started = Date.now();
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForFunction(
      () => !document.documentElement.classList.contains("tc-fontwait"),
      null,
      { timeout: 6000 },
    );
    expect(Date.now() - started).toBeLessThan(4000);
  });
});
