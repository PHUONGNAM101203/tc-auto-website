import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

interface IndexRow {
  slug: string;
  route: string;
  title: string;
  section: string;
  isArticle: boolean;
  height: number;
  slices: number;
}

const INDEX: IndexRow[] = JSON.parse(
  readFileSync("src/data/subpages/index.json", "utf8"),
);

test.describe("31 trang con", () => {
  test("mọi route phản hồi 200 và đúng hình học thiết kế", async ({ page }) => {
    for (const row of INDEX) {
      const response = await page.goto(row.route);
      expect(response?.status(), row.route).toBe(200);

      const box = await page.evaluate(() => {
        const canvas = document.querySelector<HTMLElement>(".tc-canvas");
        const section = document.querySelector<HTMLElement>(".pg");
        return {
          hasCanvas: Boolean(canvas),
          ghost: canvas?.classList.contains("tc-ghost") ?? false,
          width: canvas ? Number.parseFloat(getComputedStyle(canvas).width) : 0,
          height: section
            ? Number.parseFloat(getComputedStyle(section).height)
            : 0,
          slices: document.querySelectorAll(".sl").length,
          navItems: document.querySelectorAll(".hdr .nv").length,
          // Lop mobile dung chung component form nen ca trang co HAI form.ff;
          // o day dang do canvas desktop.
          forms: document.querySelectorAll(".tc-canvas form.ff").length,
        };
      });

      expect(box.hasCanvas, row.route).toBe(true);
      expect(box.ghost, `${row.route} thiếu lớp ghost`).toBe(true);
      expect(box.width).toBeCloseTo(1440, 1);
      expect(box.height, row.route).toBeCloseTo(row.height, 1);
      expect(box.slices, row.route).toBe(row.slices);
      expect(box.navItems).toBe(5);
      expect(box.forms).toBe(1);
    }
  });

  test("mục nav đang xem khớp section của trang", async ({ page }) => {
    for (const row of INDEX.slice(0, 8)) {
      await page.goto(row.route);
      const current = page.locator('.hdr .nv[aria-current="page"]');
      await expect(current, row.route).toHaveCount(1);
      await expect(current).toHaveAttribute("href", `/${row.section}`);
    }
  });

  test("lớp ghost trong suốt khi nhàn rỗi, hiện ra khi gõ", async ({
    page,
  }) => {
    await page.goto("/giai-phap/ppf");

    const input = page.locator(".tc-canvas form.ff input.in1");
    // Nhan roi: trong suot de khong de len thiet ke da ve san trong anh
    await expect(input).toHaveCSS("color", "rgba(0, 0, 0, 0)");

    await input.fill("Nguyễn Văn A");
    // Da go: phai doc duoc
    await expect(input).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
    await expect(input).toHaveCSS("background-color", "rgb(10, 37, 57)");
  });

  test("ô tìm kiếm trang con GIỐNG HỆT trang chính", async ({ page }) => {
    // Truoc day o tim kiem cua trang con NUONG trong anh nen, con o tren chi
    // la mot o trong suot chi hien khi focus — moi trang mot kieu. Khach yeu
    // cau dong bo (30/09/2026), nen nay ca hai deu ve that.
    const look = async (route: string) => {
      await page.goto(route);
      await page.waitForTimeout(400);
      return page.$eval(".search", (el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          bg: cs.backgroundColor,
          radius: cs.borderRadius,
          shadow: cs.boxShadow,
          x: Math.round(r.x),
          w: Math.round(r.width),
        };
      });
    };
    const main = await look("/cong-nghe");
    const sub = await look("/nhan-su/tuyen-dung");
    expect(sub).toEqual(main);
    // Va phai NHIN THAY duoc ngay, khong cho den luc focus moi hien.
    expect(sub.bg).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("chữ trên nav trang con là chữ THẬT, đọc và chọn được", async ({
    page,
  }) => {
    // Truoc day chu nav nuong trong anh; lop tren trong suot nen may tim kiem
    // va trinh doc man hinh khong thay gi.
    await page.goto("/nhan-su/tuyen-dung");
    const colours = await page.$$eval(".hdr a.nv", (els) =>
      els.map((el) => getComputedStyle(el).color),
    );
    expect(colours.length).toBeGreaterThan(3);
    for (const colour of colours) {
      expect(colour).not.toBe("rgba(0, 0, 0, 0)");
    }
  });

  test("khung đánh dấu trên nav LƯỚT được ở trang con", async ({ page }) => {
    await page.goto("/nhan-su/tuyen-dung");
    const pill = page.locator(".tc-navpill");
    await expect(pill).toHaveCount(1);
    const before = await pill.evaluate((el) => el.getBoundingClientRect().x);

    await page.locator('.hdr a.nv[href="/trai-nghiem"]').hover();
    await page.waitForTimeout(700);
    const after = await pill.evaluate((el) => el.getBoundingClientRect().x);
    expect(after, "khung phải chạy theo chuột").toBeLessThan(before);
  });

  test("có lớp văn bản cho trình đọc màn hình và SEO", async ({ page }) => {
    for (const row of INDEX.slice(0, 6)) {
      await page.goto(row.route);
      const readable = await page.evaluate(() => {
        // Co NHIEU khoi .tc-sr (breadcrumb, danh sach trang con, lop van ban).
        // Chi do dung lop van ban.
        const layer = document.querySelector("[data-text-layer]");
        return {
          h1: document.querySelectorAll("[data-text-layer] h1").length,
          headings: document.querySelectorAll(
            "[data-text-layer] h2, [data-text-layer] h3",
          ).length,
          chars: layer?.textContent?.length ?? 0,
        };
      });
      expect(readable.h1, row.route).toBe(1);
      expect(readable.headings, row.route).toBeGreaterThan(0);
      expect(readable.chars, row.route).toBeGreaterThan(200);
    }
  });

  test("lớp văn bản ẩn khỏi mắt thường, không phá thiết kế", async ({
    page,
  }) => {
    await page.goto("/nhan-su/van-hoa-tc/cau-chuyen-khoi-nghiep");
    const box = await page.locator("[data-text-layer]").boundingBox();
    expect(box!.width).toBeLessThanOrEqual(1);
    expect(box!.height).toBeLessThanOrEqual(1);
  });

  test("nút CTA trên trang chính dẫn tới trang con", async ({ page }) => {
    await page.goto("/trai-nghiem");
    const cta = page.locator('a.btn[href="/trai-nghiem/hanh-trinh"]');
    await expect(cta).toHaveCount(1);
    await cta.click();
    await expect(page).toHaveURL("/trai-nghiem/hanh-trinh");
    await expect(page.locator(".tc-canvas.tc-ghost")).toHaveCount(1);
  });

  test("vùng bấm dẫn sâu vào trang con", async ({ page }) => {
    await page.goto("/nhan-su/tuyen-dung");
    const hotspot = page.locator("a.tc-hotspot").first();
    await expect(hotspot).toHaveCount(1);
    await hotspot.click();
    await expect(page).toHaveURL("/nhan-su/tuyen-dung/vi-tri-dang-tuyen");
  });

  test("tìm kiếm ra được trang con và cuộn tới đúng đoạn", async ({ page }) => {
    await page.goto("/");
    await page.locator(".search input").fill("kho ung dung");
    const hit = page.locator(".tc-search-hit").first();
    await expect(hit).toBeVisible();
    await hit.click();

    await expect(page).toHaveURL(/\/cong-nghe\/ung-dung/);
    await page.waitForTimeout(900);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  });

  test("gửi form liên hệ được từ trang con", async ({ page }) => {
    await page.goto("/dai-ly/gallery-by-brand");
    const form = page.locator(".tc-canvas form.ff");
    await form.locator("input.in1").fill("Trần Thị B");
    await form.locator("input.in2").fill("0912 345 678");

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/leads")),
      form.locator('button[type="submit"]').click(),
    ]);
    expect([201, 503, 429]).toContain(response.status());
    await expect(page.locator(".tc-canvas .toast")).toHaveClass(/is-on/);
  });

  test("đường dẫn lạ trả về 404", async ({ page }) => {
    const response = await page.goto("/trai-nghiem/khong-ton-tai-dau");
    expect(response?.status()).toBe(404);
  });

  test("sitemap liệt kê đủ 37 trang", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect((body.match(/<url>/g) ?? []).length).toBe(37);
    for (const row of INDEX) {
      expect(body, row.route).toContain(row.route);
    }
  });

  test("robots.txt chặn khu quản trị và trỏ sitemap", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Sitemap:");
  });

  test("metadata riêng cho từng trang con", async ({ page }) => {
    await page.goto("/giai-phap/ppf");
    await expect(page).toHaveTitle(/PPF \| TC Auto Solutions/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/giai-phap\/ppf$/,
    );
  });
});

test.describe("tìm kiếm đại lý", () => {
  test("form dùng được và trả đúng đại lý từ thiết kế", async ({ page }) => {
    await page.goto("/dai-ly/mang-luoi-dai-ly");

    const selects = page.locator("select.tc-field");
    await expect(selects).toHaveCount(2);

    // Nhan roi: trong suot de khong de len o chon da ve san trong anh
    await expect(selects.first()).toHaveCSS("color", "rgba(0, 0, 0, 0)");

    await selects.nth(0).selectOption("3M");
    await selects.nth(1).selectOption("Đà Nẵng");
    // Da chon thi phai doc duoc
    await expect(selects.first()).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");

    await page.locator("button.tc-field-submit").click();

    const panel = page.locator(".tc-dealer-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator("li")).toHaveCount(16);
    await expect(panel).toContainText("Thanh Bình Auto CMT8");
    await expect(panel).toContainText("Thái Vỹ Auto");
  });

  test("tỉnh chưa có dữ liệu báo đang cập nhật kèm hotline", async ({
    page,
  }) => {
    await page.goto("/dai-ly/mang-luoi-dai-ly");
    await page.locator("select.tc-field").nth(0).selectOption("3M");
    await page.locator("select.tc-field").nth(1).selectOption("Huế");
    await page.locator("button.tc-field-submit").click();

    const empty = page.locator(".tc-dealer-empty");
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("đang được cập nhật");
    await expect(empty).toContainText("093");
  });

  test("đóng được bảng kết quả", async ({ page }) => {
    await page.goto("/dai-ly/mang-luoi-dai-ly");
    await page.locator("select.tc-field").nth(0).selectOption("3M");
    await page.locator("select.tc-field").nth(1).selectOption("Đà Nẵng");
    await page.locator("button.tc-field-submit").click();
    await expect(page.locator(".tc-dealer-panel")).toBeVisible();

    await page.locator(".tc-dealer-close").click();
    await expect(page.locator(".tc-dealer-panel")).toHaveCount(0);
  });
});

test.describe("tải ảnh theo lượt cuộn", () => {
  test("vào trang chỉ tải ảnh đầu, cuộn tới đâu tải tới đó", async ({
    page,
  }) => {
    const sliceCount =
      INDEX.find(
        (row) => row.slug === "giai-phap/phim-dan-kinh/3m-ceramic-elite-im",
      )?.slices ?? 0;
    expect(sliceCount, "phải đọc được số lát từ dữ liệu").toBeGreaterThan(1);

    const seen = new Set<string>();
    page.on("response", (r) => {
      const url = r.url();
      if (url.includes("/slices/sub/giai-phap__phim-dan-kinh__3m")) {
        seen.add(url.split("/").pop()!);
      }
    });

    await page.goto("/giai-phap/phim-dan-kinh/3m-ceramic-elite-im", {
      waitUntil: "load",
    });
    await page.waitForTimeout(1200);
    const atEntry = seen.size;

    // So lat doc TU DU LIEU chu khong ghi cung: thiet ke doi la so lat doi
    // theo (ban 28/09 lam trang nay ngan di, tu 10 lat con 9).
    expect(atEntry).toBeGreaterThan(0);
    expect(atEntry, "vào trang không được tải hết ảnh").toBeLessThanOrEqual(3);

    await page.evaluate(async () => {
      const step = Math.floor(innerHeight * 0.8);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((r) => setTimeout(r, 800));
    });
    await page.waitForTimeout(900);

    expect(seen.size, `cuộn hết phải tải đủ ${sliceCount} lát`).toBe(
      sliceCount,
    );

    const broken = await page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLImageElement>("img.sl")].filter(
          (img) => img.naturalWidth === 0,
        ).length,
    );
    expect(broken).toBe(0);
  });

  test("trang chủ chỉ tải ảnh cần thiết, không kéo cả 5 ảnh hero", async ({
    page,
  }) => {
    const loaded: string[] = [];
    page.on("request", (r) => {
      const url = r.url();
      if (url.includes("/slices/")) loaded.push(url.split("/").pop()!);
    });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(1500);

    // Bang hero co 5 slide nhung chi slide dang xem va slide ke tiep duoc tai.
    // Tai ca 5 ngay luc vao trang la pha hong viec tai theo luot cuon.
    const heroImages = loaded.filter((f) =>
      /^(home|trai-nghiem|giai-phap|cong-nghe|dai-ly|nhan-su)-0/.test(f),
    );
    expect(
      heroImages.length,
      `tải quá nhiều ảnh hero: ${heroImages.join(", ")}`,
    ).toBeLessThanOrEqual(2);
  });
});

test.describe("trang 404", () => {
  test("hiện đúng phong cách thương hiệu và có lối quay lại", async ({
    page,
  }) => {
    const response = await page.goto("/duong-dan-khong-ton-tai");
    expect(response?.status()).toBe(404);

    await expect(page.locator(".tc-404-kicker")).toHaveText("404");
    await expect(page.locator(".tc-404-cta")).toHaveAttribute("href", "/");
    // Co du lien ket toi 5 trang chinh con lai
    await expect(page.locator(".tc-404-nav a")).toHaveCount(5);
  });

  test("404 không cho index", async ({ page }) => {
    await page.goto("/duong-dan-khong-ton-tai");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
});

test.describe("băng hero trang chủ", () => {
  test("có 5 slide, chuyển được bằng mũi tên và vạch chỉ mục", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".tc-hero-slide")).toHaveCount(5);
    await expect(page.locator(".tc-hero-dot")).toHaveCount(5);
    await expect(page.locator(".tc-hero-arrow")).toHaveCount(2);

    await expect(page.locator(".tc-hero-dot.is-on")).toHaveAttribute(
      "aria-label",
      "Ảnh 1 trên 5",
    );

    await page.locator(".tc-hero-arrow").nth(1).click();
    await expect(page.locator(".tc-hero-dot.is-on")).toHaveAttribute(
      "aria-label",
      "Ảnh 2 trên 5",
    );

    // Bam thang vao vach thu 4
    await page.locator(".tc-hero-dot").nth(3).click();
    await expect(page.locator(".tc-hero-dot.is-on")).toHaveAttribute(
      "aria-label",
      "Ảnh 4 trên 5",
    );

    // Mui ten trai quay lai
    await page.locator(".tc-hero-arrow").nth(0).click();
    await expect(page.locator(".tc-hero-dot.is-on")).toHaveAttribute(
      "aria-label",
      "Ảnh 3 trên 5",
    );
  });

  test("chữ hero vẫn nằm trên ảnh, không bị băng ảnh che", async ({ page }) => {
    await page.goto("/");
    // Neu .tc-hero co z-index thi no se che mat tieu de — loi nay da tung xay ra.
    await expect(page.locator("#home-000")).toBeVisible();
    await expect(page.locator("#home-000")).toHaveText("THẾ GIỚI CỦA TC");
  });

  test("trang chủ không có mục nav nào sáng", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('.hdr .nv[aria-current="page"]')).toHaveCount(0);
  });
});

test.describe("phân trang và xem thêm", () => {
  test("phân trang theo dữ liệu: chỉ đủ một trang thì chỉ hiện một số", async ({
    page,
  }) => {
    await page.goto("/giai-phap/du-an");
    const pager = page.locator(".tc-pager");
    await expect(pager).toHaveCount(1);

    // Thiet ke ve "1 2 3 …" nhung do chi la hinh minh hoa. Danh sach nay moi co
    // du noi dung MOT trang nen chi duoc hien mot so — khong ghi cung 3 trang.
    await expect(page.locator(".tc-pager-page")).toHaveCount(1);
    await expect(page.locator(".tc-pager-page").first()).toHaveText("1");

    // Chi co mot trang -> ca hai mui ten deu vo hieu.
    await expect(page.locator(".tc-pager-arrow").first()).toBeDisabled();
    await expect(page.locator(".tc-pager-arrow").last()).toBeDisabled();

    // Dong giai thich "so trang tu tang" da duoc BO CO Y — xem chu thich cuoi
    // Pagination.tsx: do la chuyen cua nguoi lam web, khach khong can doc. So
    // "1" voi hai mui ten da tat da noi du.
    await expect(page.locator(".tc-pager-hint")).toHaveCount(0);
  });

  test("hình phân trang vẽ sẵn đã được xoá khỏi ảnh nền", async ({ page }) => {
    // Neu con hinh ve san thi se co hai bo phan trang chong nhau.
    await page.goto("/giai-phap/du-an");
    // Do theo he toa do canvas (getBoundingClientRect da nhan zoom cua .tc-canvas),
    // nen so sanh voi be rong CSS chu khong phai pixel man hinh.
    const width = await page.evaluate(() =>
      Number.parseFloat(
        getComputedStyle(document.querySelector(".tc-pager")!).width,
      ),
    );
    expect(width).toBeCloseTo(257, 0);
  });

  test("bấm XEM THÊM thì khối chữ xổ dài ra ngay tại chỗ", async ({ page }) => {
    await page.goto("/dai-ly/cau-chuyen-dong-hanh");
    const buttons = page.locator("button.tc-readmore");
    await expect(buttons).toHaveCount(5);

    await buttons.first().click();
    const panel = page.locator(".tc-readmore-panel");
    await expect(panel).toBeVisible();

    // TUYET DOI khong duoc mo lop phu / hop thoai — nguoi dung da noi ro.
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    // Panel phai nam DUNG CHO khoi chu, khong phai giua man hinh.
    const placed = await panel.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const canvas = document
        .querySelector(".tc-canvas")!
        .getBoundingClientRect();
      return rect.left > canvas.left + 40 && rect.top > canvas.top;
    });
    expect(placed).toBe(true);

    // Phai xo ra NOI DUNG THAT, ghep thanh doan van.
    const paragraphs = panel.locator("p");
    expect(await paragraphs.count()).toBeGreaterThan(1);
    await expect(panel).toContainText("Phạm Gia Auto");
    const lengths = (await paragraphs.allInnerTexts()).map(
      (t) => t.trim().length,
    );
    expect(
      Math.max(...lengths),
      "các dòng OCR chưa được ghép thành đoạn",
    ).toBeGreaterThan(150);

    // Thu gon dua ve nhu cu.
    await panel.locator(".tc-readmore-less").click();
    await expect(page.locator(".tc-readmore-panel")).toHaveCount(0);
  });

  test("XEM THÊM có trang chi tiết thật thì dẫn thẳng tới đó", async ({
    page,
  }) => {
    await page.goto("/trai-nghiem/phong-cach-song");
    const link = page.locator(
      'a.tc-readmore[href="/trai-nghiem/phong-cach-song/doi-mau-doi-dien-mao"]',
    );
    await expect(link).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(
      "/trai-nghiem/phong-cach-song/doi-mau-doi-dien-mao",
    );
  });
});

test.describe("mọi trang đều bấm tới được", () => {
  test("hai trang từng mồ côi giờ có lối vào từ /giai-phap", async ({
    page,
  }) => {
    await page.goto("/giai-phap");
    // Do la BAM TOI DUOC NGAY, khong phai "chi co dung mot duong vao": trang
    // phim gio co nhieu loi vao (nhan muc + ba the 3M/Nano Sun/5DO deu tro ve
    // trang chung).
    //
    // Phai loc `:visible`. Header co menu xo xuong, ma moi lien ket trong do
    // deu tro toi mot trang con va deu dung TRUOC noi dung trang trong DOM —
    // khong loc thi `.first()` bat trung mot lien ket dang an, bam khong duoc.
    // Loc `:visible` cung dung y hon: cai ta muon biet la nguoi dung NHIN THAY
    // loi vao, chu khong phai trong ma nguon co the <a>.
    for (const target of ["/giai-phap/phim-dan-kinh", "/giai-phap/loa"]) {
      const entries = page.locator(`a[href="${target}"]:visible`);
      expect(
        await entries.count(),
        `${target} phai co loi vao nhin thay duoc`,
      ).toBeGreaterThan(0);
    }

    await page
      .locator('a[href="/giai-phap/phim-dan-kinh"]:visible')
      .first()
      .click();
    await expect(page).toHaveURL("/giai-phap/phim-dan-kinh");
  });
});

test.describe("ba thẻ Ứng dụng trên trang Công nghệ", () => {
  test("thẻ ở giữa dẫn thẳng sang trang của mục đó", async ({ page }) => {
    // Ba the nay xep kieu bang chuyen: bam the ben canh thi no chay vao giua,
    // chi the DANG O GIUA moi dan sang trang. Xem AppCards.tsx.
    await page.goto("/cong-nghe");
    await page.locator(".tc-cards").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const middle = page.locator(".tc-card[data-on]");
    await expect(middle).toHaveCount(1);
    const href = await middle.getAttribute("href");
    expect(href).toMatch(/^\/cong-nghe\//);
    await middle.click();
    await expect(page).toHaveURL(href!);
  });
});
