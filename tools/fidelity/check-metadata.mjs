/**
 * Moi trang phai co du the mo ta, va KHONG hai trang nao trung nhau.
 *
 * Bai nay sinh ra sau mot loi that (01/10/2026): hai duong dan
 * `/dai-ly/chan-dung-dai-ly/dai-ly-winca-pham-gia-auto` va
 * `/giai-phap/du-an/dai-ly-winca-pham-gia-auto` co cung tieu de, cung mo ta va
 * 36 trong 38 khoi chu giong het nhau — bo thiet ke dat cung mot bai o hai
 * muc. Voi cong cu tim kiem thi do la NOI DUNG TRUNG LAP: hai duong dan tranh
 * nhau cung mot truy van.
 *
 * Trung nhau KHONG phai la loi neu ban phu da khai `canonical` tro ve ban
 * chinh — do la cach xu ly dung. Bai nay chi bao khi trung MA KHONG khai.
 *
 * Can may chu o cong 3311 — chay qua `npm run verify:live`.
 */
import { chromium } from "@playwright/test";
import { readdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:3311";

function routes() {
  const main = [
    "/",
    "/trai-nghiem",
    "/giai-phap",
    "/cong-nghe",
    "/dai-ly",
    "/nhan-su",
    "/cau-hoi-thuong-gap",
    "/giai-phap/man-hinh/tat-ca",
  ];
  const sub = readdirSync("src/data/subpages")
    // `index.json` la ban muc luc, khong phai mot trang — xem next.config.ts.
    .filter((name) => name.endsWith(".json") && name !== "index.json")
    .map((name) => "/" + name.slice(0, -5).replaceAll("__", "/"));
  return [...main, ...sub];
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const seen = [];
const problems = [];

for (const route of routes()) {
  const response = await page
    .goto(BASE + route, { waitUntil: "domcontentloaded" })
    .catch(() => null);
  if (!response?.ok()) {
    problems.push(`${route}: khong tai duoc (${response?.status() ?? "khong phan hoi"})`);
    continue;
  }

  const meta = await page.evaluate(() => {
    const get = (selector, attribute) =>
      document.querySelector(selector)?.getAttribute(attribute)?.trim() ?? "";
    return {
      title: document.title.trim(),
      description: get('meta[name="description"]', "content"),
      canonical: get('link[rel="canonical"]', "href"),
      ogTitle: get('meta[property="og:title"]', "content"),
      ogImage: get('meta[property="og:image"]', "content"),
      headings: document.querySelectorAll("h1").length,
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].length,
    };
  });

  for (const [field, value] of Object.entries({
    "the <title>": meta.title,
    "mo ta": meta.description,
    canonical: meta.canonical,
    "og:title": meta.ogTitle,
    "og:image": meta.ogImage,
  })) {
    if (!value) problems.push(`${route}: thieu ${field}`);
  }
  if (meta.headings !== 1) {
    problems.push(`${route}: co ${meta.headings} the <h1>, phai dung 1`);
  }
  if (meta.jsonLd === 0) {
    problems.push(`${route}: khong co du lieu co cau truc (JSON-LD)`);
  }

  seen.push({ route, ...meta });
}

/** Duong dan ma canonical cua no tro di cho khac — da khai la ban phu. */
function declared(entry) {
  if (!entry.canonical) return false;
  const path = new URL(entry.canonical, BASE).pathname.replace(/\/$/, "");
  return path !== entry.route.replace(/\/$/, "");
}

for (const field of ["title", "description"]) {
  const groups = new Map();
  for (const entry of seen) {
    if (!entry[field]) continue;
    groups.set(entry[field], [...(groups.get(entry[field]) ?? []), entry]);
  }
  for (const [value, entries] of groups) {
    if (entries.length < 2) continue;
    // Du mot ban khai canonical di cho khac la da xu ly xong.
    const unresolved = entries.filter((entry) => !declared(entry));
    if (unresolved.length < 2) continue;
    problems.push(
      `TRUNG ${field} "${value.slice(0, 46)}…" o ${unresolved.length} trang: ` +
        `${unresolved.map((entry) => entry.route).join(", ")} ` +
        `— chon mot ban chinh roi khai trong src/lib/canonical.ts`,
    );
  }
}

await browser.close();

console.log(`\n  Da so ${seen.length} trang.`);
if (problems.length) {
  for (const line of problems) console.log(`  SAI ${line}`);
  console.log(`\n  ${problems.length} cho can sua.`);
  process.exit(1);
}
console.log("  Trang nao cung du the mo ta, va khong trang nao trung nhau.");
