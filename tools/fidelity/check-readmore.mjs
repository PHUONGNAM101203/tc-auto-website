/**
 * Mo THU tung nut "XEM THÊM" tren moi trang con, xem no bung ra co dung khong.
 *
 * ── Vi sao can chay that chu khong chi kiem du lieu ─────────────────────────
 * Cac bai kiem trong tests/unit/cta-links.test.ts da chan duoc hinh hoc sai
 * (khoi voi nguoc len dinh trang, mang che khong phu kin nut do). Nhung co
 * nhung loi chi lo ra khi RENDER that:
 *   - nut khong co gi de mo ma van dat vung bam -> bam khong xay ra gi,
 *   - khoi bung ra cao/rong bat thuong, hoac nen trong suot.
 * Bo nay da bat duoc ca hai loai do.
 *
 * Moi nut deu tai lai trang truoc khi bam: nut nao dan sang trang chi tiet se
 * lam trang chuyen di, va cac nut sau no tren cung trang se khong con.
 *
 * Chay: node tools/fidelity/check-readmore.mjs [goc]
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:3311";
const spots = JSON.parse(readFileSync("src/data/cta-links.json", "utf8"));

/** Khoi to nhat that su co trong thiet ke la doan mo bai, 747x327. */
const MAX_WIDTH = 820;
const MAX_HEIGHT = 600;
const MAX_CHARS = 1400;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const bad = [];
let opened = 0;
let links = 0;
let quiet = 0;

for (const slug of Object.keys(spots)) {
  for (let index = 0; index < spots[slug].length; index += 1) {
    const url = `${BASE}/${slug}`;
    const res = await page.goto(url, { waitUntil: "load" }).catch(() => null);
    if (!res?.ok()) {
      bad.push({ slug, index, why: "trang khong mo duoc" });
      break;
    }
    await page.waitForTimeout(700);
    const buttons = await page.locator(".tc-readmore").count();
    if (index >= buttons) {
      // Nut nay CO Y khong duoc dat vung bam: khong co gi de mo, hoac da co
      // vung bam khac phu len (xem `covered` trong app/(site)/[...slug]).
      quiet += 1;
      continue;
    }
    const button = page.locator(".tc-readmore").nth(index);
    await button.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(150);
    await button.click({ timeout: 4000 }).catch(() => {});
    // Cho DUNG su kien: hoac trang chuyen di, hoac khoi chu bung ra. Cho cung
    // mot khoang thi nut dan sang trang chi tiet co the chua kip chuyen, va bo
    // nay se bao oan la "bam khong ra gi".
    await page
      .waitForFunction(
        (from) =>
          location.href !== from ||
          document.querySelector(".tc-readmore-panel") !== null,
        url,
        { timeout: 5000 },
      )
      .catch(() => undefined);
    await page.waitForTimeout(200);
    if (page.url() !== url) {
      links += 1;
      continue;
    }
    const panel = await page
      .$eval(".tc-readmore-panel", (el) => {
        const rect = el.getBoundingClientRect();
        return {
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          bg: getComputedStyle(el).backgroundColor,
          chars: el.textContent.trim().length,
        };
      })
      .catch(() => null);
    if (!panel) {
      bad.push({ slug, index, why: "bam khong ra gi" });
      continue;
    }
    opened += 1;
    if (panel.h > MAX_HEIGHT) bad.push({ slug, index, why: `cao ${panel.h}px` });
    else if (panel.w > MAX_WIDTH) bad.push({ slug, index, why: `rong ${panel.w}px` });
    else if (panel.chars > MAX_CHARS) bad.push({ slug, index, why: `${panel.chars} ky tu` });
    else if (panel.bg.includes(", 0)")) bad.push({ slug, index, why: "nen trong suot" });
  }
}
await browser.close();

console.log(
  `\n  ${opened} nut xo khoi chu ra, ${links} nut dan sang trang chi tiet, ` +
    `${quiet} nut co y khong dat vung bam.`,
);
if (!bad.length) {
  console.log("  Khong nut nao hong.");
  process.exit(0);
}
console.log("\n  Nut hong:\n");
for (const row of bad) {
  console.log(`    /${row.slug} nut ${row.index}: ${row.why}`);
}
process.exit(1);
