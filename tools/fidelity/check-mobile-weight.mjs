/**
 * Ban dien thoai phai NHE HON ban may ban, va khong duoc tai anh cua canvas.
 *
 * Bai nay sinh ra sau mot loi that (02/10/2026): do tren trang chu, dien thoai
 * tai **2,98 MB** con may ban 2,61 MB — nguoc doi. Hai nguyen nhan:
 *
 * 1. Duoi 900px ca canvas bi `display: none`, nhung the <img> co
 *    `loading="eager"` thi VAN TAI. `display:none` chi chan duoc anh lazy.
 *    Lat nen dau tien va tam hero dau tien bi keo ve du khong bao gio duoc
 *    nhin thay. Da chua bang `<picture>` + `media` trong SliceImage.tsx va
 *    HeroSlider.tsx.
 * 2. Bang hero ban mobile tai CA NAM tam cung luc. `loading="lazy"` do khoang
 *    cach theo chieu DOC, ma nam tam deu nam trong mot dai cuon NGANG — voi
 *    trinh duyet thi chung deu "gan khung nhin". Da chua bang co `armed`
 *    trong MobileCarousel.tsx, va bang ban hep 720px
 *    (tools/brand/make-mobile-hero.py).
 *
 * Can may chu o cong 3311 — chay qua `npm run verify:live`.
 */
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://127.0.0.1:3311";
const ROUTES = ["/", "/giai-phap", "/giai-phap/man-hinh"];

/** Anh CHI co y nghia tren canvas — dien thoai khong duoc tai cai nao. */
const DESKTOP_ONLY = /\/slices\/|@3x\.webp/;

async function measure(browser, route, width, density) {
  const page = await browser.newPage({
    viewport: { width, height: 844 },
    isMobile: width < 900,
    deviceScaleFactor: density,
  });
  let bytes = 0;
  const images = [];
  page.on("response", (response) => {
    const length = response.headers()["content-length"];
    if (length) bytes += Number(length);
    if (/\.(webp|png|jpg|avif)(\?|$)/.test(response.url())) images.push(response.url());
  });
  await page.goto(BASE + route, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.close();
  return { bytes, images };
}

const browser = await chromium.launch();
const problems = [];

for (const route of ROUTES) {
  const mobile = await measure(browser, route, 390, 2);
  const desktop = await measure(browser, route, 1440, 1);

  const leaked = mobile.images.filter((url) => DESKTOP_ONLY.test(url));
  if (leaked.length) {
    problems.push(
      `${route}: dien thoai tai ${leaked.length} anh CUA CANVAS ` +
        `(${leaked.slice(0, 3).map((u) => u.split("/").pop().split("?")[0]).join(", ")}` +
        `${leaked.length > 3 ? ", …" : ""}) — canvas bi an duoi 900px`,
    );
  }

  if (mobile.bytes > desktop.bytes) {
    problems.push(
      `${route}: dien thoai ${(mobile.bytes / 1e6).toFixed(2)} MB NANG HON ` +
        `may ban ${(desktop.bytes / 1e6).toFixed(2)} MB`,
    );
  }

  console.log(
    `  ${route.padEnd(24)} dien thoai ${(mobile.bytes / 1e6).toFixed(2)} MB · ` +
      `may ban ${(desktop.bytes / 1e6).toFixed(2)} MB`,
  );
}

await browser.close();

if (problems.length) {
  console.log("");
  for (const line of problems) console.log(`  SAI ${line}`);
  process.exit(1);
}
console.log("\n  Ban dien thoai nhe hon o moi trang, va khong tai anh nao cua canvas.");
