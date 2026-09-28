/**
 * Bo tu trang chu, di theo moi lien ket, xem trong 37 trang thi BAM TOI DUOC bao nhieu.
 * Trang co noi dung nhung khong bam toi duoc thi coi nhu khach khong bao gio thay.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:3311";
const all = [
  { route: "/", title: "Trang chủ" },
  ...["trai-nghiem", "giai-phap", "cong-nghe", "dai-ly", "nhan-su"].map((s) => ({
    route: `/${s}`, title: s,
  })),
  ...JSON.parse(readFileSync("src/data/subpages/index.json", "utf8")).map((r) => ({
    route: r.route, title: r.title,
  })),
];

const b = await chromium.launch();
const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

const seen = new Set(["/"]);
const queue = ["/"];
const linksFrom = new Map();

while (queue.length) {
  const route = queue.shift();
  await page.goto(`${BASE}${route}`, { waitUntil: "load" });
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h && h.startsWith("/") && !h.startsWith("/admin") && !h.startsWith("/api")),
  );
  const clean = [...new Set(hrefs.map((h) => h.split("#")[0].replace(/\/$/, "") || "/"))];
  linksFrom.set(route, clean);
  for (const href of clean) {
    if (!seen.has(href)) { seen.add(href); queue.push(href); }
  }
}
await b.close();

const reachable = all.filter((p) => seen.has(p.route));
const orphan = all.filter((p) => !seen.has(p.route));

console.log(`\n  BAM TOI DUOC: ${reachable.length}/${all.length} trang`);
if (orphan.length) {
  console.log(`\n  KHONG BAM TOI DUOC (${orphan.length}) — khach se khong bao gio thay:`);
  for (const p of orphan) console.log(`     ${p.route}`);
}
