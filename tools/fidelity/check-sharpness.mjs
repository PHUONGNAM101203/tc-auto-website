/**
 * Moi anh tren canvas phai du do phan giai cho man retina RONG.
 *
 * ── Do cai gi ───────────────────────────────────────────────────────────────
 * Canvas rong 1440px nhung duoc PHONG TO cho vua be ngang cua so. Tren cua so
 * 2560px no phong 1,78 lan, nen o mat do diem anh 2 thi mot anh rong 100px tren
 * canvas phai co 100 x 1,78 x 2 = 356 diem anh that. Bo nay do ti le
 *
 *     co / can  =  be rong that cua tep  /  (be rong da bo tri x mat do)
 *
 * cho tung anh, va bao nhung anh tut duoi nguong.
 *
 * ── Vi sao 0,84 la DAT ──────────────────────────────────────────────────────
 * Ban thiet ke chi co den @3x. O cua so 2560 mat do 2 thi can 3,56 lan, nen
 * tran cua CA trang la 3 / 3,56 = 0,84. Duoi muc do la anh do co nguon nho hon
 * phan con lai cua trang — do moi la loi.
 *
 * Anh co `srcset` khong do duoc bang `naturalWidth` (tri so do da duoc chia lai
 * theo mat do), nen bo nay bo qua chung; chung da duoc
 * src/lib/slice-srcset.ts lo.
 *
 * Chay: node tools/fidelity/check-sharpness.mjs [goc]
 */
import { chromium } from "@playwright/test";
import { readdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:3311";
const WIDTH = 2560;
const DENSITY = 2;

/** Tran cua ban thiet ke: chi co den @3x. */
const CEILING = 3 / ((WIDTH / 1440) * DENSITY);
/** Cho phep thap hon tran mot chut cho sai so lam tron. */
const LIMIT = CEILING - 0.02;

/**
 * Anh ma BAN THAN bo tai nguyen cua khach khong co ban to hon. Da doi chieu
 * ca ba bo (xem tools/brand/asset_source.py) — day la ban lon nhat ton tai.
 * Muon net hon thi phai xin khach xuat lai, khong phai viec cua ma nguon.
 */
const SOURCE_LIMITED = new Set([
  "loa.webp",                      // Rectangle 39.png  — chi co 526px
  "cau-chuyen-khoi-nghiep-2.webp", // Rectangle 23 — 3D Transform-1.png
  "cau-chuyen-khoi-nghiep-3.webp", // Rectangle 23 — 3D Transform-2.png
  "chan-dung-dai-ly-2.webp",       // Rectangle 186 — Perspective Warp-1.png
  "chan-dung-dai-ly-3.webp",       // Rectangle 186 — Perspective Warp-2.png
  "con-nguoi-tc-2.webp",           // Rectangle 186.png — chi co 1444px
  "con-nguoi-tc-3.webp",           // Rectangle 187.png
  "con-nguoi-tc-4.webp",           // Rectangle 188.png
  // Bon tam trong dai "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" — ban to nhat trong bo tai
  // nguyen chi rong 1154px (Rectangle 128/183/185/188 o muc 2.5).
  "le-ky-ket-thanh-tien-auto.webp",
  "le-ky-ket-toyota-phu-tai-duc.webp",
  "le-ky-ket-otua-thanh-nien.webp",
  "le-ky-ket-tan-nat.webp",
  // Ba tam cua bang "BỘ SƯU TẬP" tren /trai-nghiem/khoanh-khac. Khac cac the
  // tren trang Giai phap (chung cat tu lat nen nen con nang len @3x duoc —
  // xem `retina` trong extract-lift-cards.py), ba tam nay lay THANG tu bo tai
  // nguyen cua khach va do da la ban to nhat trong do: da quet ca hai bo,
  // Rectangle 196/197/198 chi co dung mot ban moi tam.
  "song-tron-bien.webp",      // Rectangle 196.png — 1750px
  "song-tron-noi-that.webp",  // Rectangle 197.png — 1748px
  "song-tron-xe-co.webp",     // Rectangle 198.png — 1754px
]);

function routes() {
  const main = ["/", "/trai-nghiem", "/giai-phap", "/cong-nghe", "/dai-ly", "/nhan-su"];
  const sub = readdirSync("src/data/subpages")
    // `index.json` la BAN MUC LUC liet ke 31 trang con, khong phai mot trang.
    // Dem no vao thanh route `/index` — tung lam sap trang chu that: `/index`
    // bam vao cung tep dem `.next/server/app/index.html` voi `/`. Da chan bang
    // chuyen huong trong next.config.ts, nhung day van khong phai mot trang nen
    // do do net no la vo nghia.
    .filter((name) => name.endsWith(".json") && name !== "index.json")
    .map((name) => "/" + name.slice(0, -5).replaceAll("__", "/"));
  return [...main, ...sub];
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: WIDTH, height: 1200 },
  deviceScaleFactor: DENSITY,
});
const page = await context.newPage();
const found = new Map();

for (const route of routes()) {
  const response = await page.goto(BASE + route, { waitUntil: "load" }).catch(() => null);
  if (!response?.ok()) {
    console.log(`  (bo qua ${route})`);
    continue;
  }
  await page.evaluate(async () => {
    const step = innerHeight / 2;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((done) => setTimeout(done, 100));
    }
  });
  await page.waitForTimeout(1500);

  const rows = await page.evaluate((density) => {
    const out = [];
    for (const img of document.querySelectorAll("img")) {
      // Lop mobile dang an, va anh dung `srcset` (naturalWidth khong do duoc:
      // tri so do da duoc chia lai theo mat do diem anh).
      //
      // `img.closest("picture")` la phan khong duoc quen: tu 02/10/2026 lat
      // nen dau tien va anh hero nam trong `<picture>` voi mot `<source
      // media>` — de duoi 900px chung khong tai, vi canvas bi an
      // (xem SliceImage.tsx). Luc do `srcset` nam tren `<source>` chu khong
      // tren `<img>`, nen dieu kien cu khong con bat duoc va bai nay bao sai
      // oan ca loat anh hero.
      if (img.closest(".tc-m") || img.srcset || img.closest("picture")) continue;
      if (!img.currentSrc || img.naturalWidth <= 1) continue;
      const shown = img.getBoundingClientRect().width;
      if (shown < 2) continue;
      out.push({
        file: img.currentSrc.split("/").pop().split("?")[0],
        have: img.naturalWidth,
        need: Math.round(shown * density),
      });
    }
    return out;
  }, DENSITY);

  for (const row of rows) {
    const ratio = row.have / row.need;
    const seen = found.get(row.file);
    if (!seen || ratio < seen.ratio) {
      found.set(row.file, { ...row, ratio, route });
    }
  }
}
await browser.close();

const soft = [...found.values()].filter((row) => row.ratio < LIMIT);
const known = soft.filter((row) => SOURCE_LIMITED.has(row.file));
const fresh = soft.filter((row) => !SOURCE_LIMITED.has(row.file));

console.log(
  `\n  Cua so ${WIDTH}px, mat do ${DENSITY} — canvas phong ${(WIDTH / 1440).toFixed(2)} lan.`,
);
console.log(`  Da do ${found.size} anh. Tran cua ban thiet ke: ${CEILING.toFixed(2)}.\n`);

if (known.length) {
  console.log("  Bo tai nguyen cua khach khong co ban to hon (da biet):");
  for (const row of known.sort((a, b) => a.ratio - b.ratio)) {
    console.log(`    ${row.ratio.toFixed(2)}  ${row.have}/${row.need}  ${row.file}`);
  }
  console.log();
}

if (!fresh.length) {
  console.log("  Moi anh con lai deu dat tran do phan giai cua ban thiet ke.");
  process.exit(0);
}

console.log("  Anh THIEU do phan giai — se mo tren man retina rong:\n");
for (const row of fresh.sort((a, b) => a.ratio - b.ratio)) {
  console.log(
    `    ${row.ratio.toFixed(2)}  ${row.have}/${row.need}  ${row.file}  (${row.route})`,
  );
}
process.exit(1);
