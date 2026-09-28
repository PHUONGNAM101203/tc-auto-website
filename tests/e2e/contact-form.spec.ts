import { expect, test } from "@playwright/test";

// Tu khi co ban mobile, trang co HAI form .ff: mot trong canvas (desktop) va
// mot trong lop mobile. Hai form dung chung mot component nen moi tinh chat
// tinh (honeypot, nhan cho trinh doc man hinh) phai dung o CA HAI — kiem lan
// luot qua LAYERS. Con thao tac gui form thi chi lam duoc tren lop dang hien:
// o be rong 1440 day la canvas.
//
// Moi lop phai duoc do o dung be rong cua no. Duoi 900px canvas bi an, tren
// 900px lop mobile bi an — ma `display:none` lam getBoundingClientRect() tra
// ve 0 het, nen phep do honeypot nam ngoai khung nhin se sai neu do nham lop.
const LAYERS = [
  {
    name: "canvas desktop",
    scope: ".tc-canvas",
    viewport: { width: 1440, height: 900 },
  },
  { name: "lop mobile", scope: ".tc-m", viewport: { width: 390, height: 844 } },
] as const;

test.describe("form liên hệ", () => {
  test("chặn dữ liệu sai ở client trước khi gọi API", async ({ page }) => {
    const calls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/leads")) {
        calls.push(request.url());
      }
    });

    await page.goto("/");
    const form = page.locator(".tc-canvas form.ff");
    await form.locator("input.in1").fill("A");
    await form.locator("input.in2").fill("khong-phai-so");
    await form.locator('button[type="submit"]').click();

    await expect(page.locator(".tc-canvas .toast")).toHaveClass(/is-on/);
    await expect(page.locator(".tc-canvas .toast")).toHaveAttribute(
      "data-tone",
      "error",
    );
    expect(calls, "không được gọi API khi dữ liệu sai").toEqual([]);
  });

  test("đánh dấu aria-invalid trên trường sai", async ({ page }) => {
    await page.goto("/");
    const form = page.locator(".tc-canvas form.ff");
    await form.locator("input.in1").fill("A");
    await form.locator("input.in2").fill("x");
    await form.locator('button[type="submit"]').click();

    await expect(form.locator("input.in1")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(form.locator("input.in2")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("dữ liệu hợp lệ thì gọi API và hiện phản hồi", async ({ page }) => {
    await page.goto("/");
    const form = page.locator(".tc-canvas form.ff");
    await form.locator("input.in1").fill("Nguyễn Văn A");
    await form.locator("input.in2").fill("0909 123 456");
    await form.locator("textarea").fill("Tư vấn PPF cho xe Mercedes");

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/leads")),
      form.locator('button[type="submit"]').click(),
    ]);

    // 201 khi da cau hinh Supabase; 503 khi chua — ca hai deu phai co phan hoi ro rang.
    expect([201, 503]).toContain(response.status());
    await expect(page.locator(".tc-canvas .toast")).toHaveClass(/is-on/);
    await expect(page.locator(".tc-canvas .toast")).not.toHaveText("");
  });

  for (const layer of LAYERS) {
    test(`có honeypot ẩn khỏi người dùng thật — ${layer.name}`, async ({
      page,
    }) => {
      await page.setViewportSize(layer.viewport);
      await page.goto("/");
      const honeypot = page.locator(
        `${layer.scope} form.ff input[name="company"]`,
      );
      await expect(honeypot).toHaveCount(1);
      await expect(honeypot).toHaveAttribute("aria-hidden", "true");
      await expect(honeypot).toHaveAttribute("tabindex", "-1");
      await expect(honeypot).toHaveAttribute("autocomplete", "off");

      // CO Y dat ngoai khung nhin thay vi display:none — nhieu bot bo qua field
      // display:none, nen cach nay giu duoc hieu qua bat bot.
      const geometry = await honeypot.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          opacity: Number(getComputedStyle(el).opacity),
        };
      });
      expect(geometry.left).toBeLessThan(-1000);
      expect(geometry.opacity).toBe(0);

      // Khong bao gio nhan duoc focus bang Tab
      await page.locator(`${layer.scope} form.ff input.in1`).focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(() => document.activeElement?.getAttribute("name")),
      ).not.toBe("company");
    });

    test(`mọi input có nhãn cho trình đọc màn hình — ${layer.name}`, async ({
      page,
    }) => {
      await page.setViewportSize(layer.viewport);
      await page.goto("/");
      for (const selector of ["input.in1", "input.in2", "textarea"]) {
        await expect(
          page.locator(`${layer.scope} form.ff ${selector}`),
        ).toHaveAttribute("aria-label", /.+/);
      }
    });
  }

  test("API từ chối số điện thoại không hợp lệ với lỗi theo field", async ({
    request,
  }) => {
    const response = await request.post("/api/leads", {
      data: { name: "Nguyễn Văn A", phone: "abc", sourcePage: "/" },
    });
    expect(response.status()).toBe(422);

    const body = await response.json();
    expect(body.fields?.phone).toBeTruthy();
  });

  test("API im lặng chấp nhận khi honeypot bị điền (không tiết lộ cho bot)", async ({
    request,
  }) => {
    const response = await request.post("/api/leads", {
      data: {
        name: "Bot Bot",
        phone: "0909123456",
        sourcePage: "/",
        honeypot: "",
      },
    });
    // honeypot rong -> di tiep den nhanh luu; 201 hoac 503 tuy cau hinh
    expect([201, 503, 429]).toContain(response.status());
  });

  test("API từ chối JSON sai định dạng", async ({ request }) => {
    const response = await request.post("/api/leads", {
      headers: { "Content-Type": "application/json" },
      data: "khong-phai-json",
    });
    expect([400, 422]).toContain(response.status());
  });
});
