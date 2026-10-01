import { expect, test } from "@playwright/test";

/**
 * `/index` khong duoc phep di toi route catch-all.
 *
 * Next luu trang da dung san cua `/` vao `.next/server/app/index.html`. Duong
 * dan `/index` bam vao CUNG MOT TEP do, ma no khong nam trong
 * generateStaticParams nen bi coi la 404 — va cai 404 do duoc GHI DE len chinh
 * tep cua trang chu. Da tai hien 100%: `/` 200, doi qua 60 giay cho revalidate
 * het han, goi `/index` dung mot lan, `/` thanh 404 va `.meta` ghi status 404.
 *
 * Chi mot con bot go nham la trang chu sap cho den lan deploy sau. Da chan
 * bang `redirects()` trong next.config.ts — bai nay giu cho no khong bi go.
 */
test.describe("đường dẫn /index không được đụng tới bộ đệm của trang chủ", () => {
  test("/index chuyển hướng vĩnh viễn về /", async ({ request }) => {
    const response = await request.get("/index", { maxRedirects: 0 });
    expect(response.status(), "phải là chuyển hướng vĩnh viễn").toBe(308);
    expect(response.headers()["location"]).toMatch(/\/$/);
  });

  test("mọi cấp đều được chặn, không riêng gốc", async ({ request }) => {
    // `/giai-phap/index` đâm vào tệp đệm của `/giai-phap` y như vậy.
    for (const path of ["/giai-phap/index", "/cong-nghe/ung-dung/index"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} phải chuyển hướng`).toBe(308);
      expect(response.headers()["location"]).toBe(path.replace(/\/index$/, ""));
    }
  });

  test("trang chủ vẫn sống sau khi có người gọi /index", async ({ request }) => {
    expect((await request.get("/")).status()).toBe(200);
    await request.get("/index");
    expect((await request.get("/")).status(), "trang chủ phải còn nguyên").toBe(200);
  });
});
