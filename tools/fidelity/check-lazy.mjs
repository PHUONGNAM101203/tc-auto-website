import { chromium } from "@playwright/test";

// Cung mac dinh voi compare.mjs. Truoc day cho nay ghim chet cong 3000 con
// gate chinh dung 3311, chay nham cong la bao "connection refused".
const BASE_URL = process.argv[2] ?? process.env.BASE_URL ?? "http://127.0.0.1:3311";
const ROUTES = ["/", "/giai-phap", "/giai-phap/phim-dan-kinh/3m-ceramic-elite-im"];
const b = await chromium.launch();
for (const dpr of [1, 3]) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  console.log(`\n=== devicePixelRatio ${dpr} ===`);
  for (const route of ROUTES) {
    const loaded = [];
    page.removeAllListeners("response");
    page.on("response", (r) => {
      const u = r.url();
      if (u.includes("/slices/")) loaded.push({ u: u.split("/").pop(), n: Number(r.headers()["content-length"] || 0) });
    });
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    // Chi tinh anh CUA TRANG DANG XEM (bo anh cua trang khac do prefetch keo ve).
    const key = route === "/" ? "home-" : route.slice(1).replace(/\//g, "__") + "-";
    const mine = () => loaded.filter((x) => x.u.startsWith(key));
    const initial = mine().length;
    const initialBytes = mine().reduce((s, x) => s + x.n, 0);

    await page.evaluate(async () => {
      const step = Math.floor(innerHeight * 0.8);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((r) => setTimeout(r, 700));
    });
    await page.waitForTimeout(800);

    const total = mine().length, totalBytes = mine().reduce((s, x) => s + x.n, 0);
    const other = loaded.length - total;
    const scale = loaded.length ? (loaded.find(x=>x.u.includes("@3x")) ? "3x" : "2x") : "-";
    console.log(
      `  ${route.padEnd(46)} vao trang: ${String(initial).padStart(2)} anh/${(initialBytes/1e6).toFixed(2)}MB` +
      `  ->  cuon het: ${String(total).padStart(2)} anh/${(totalBytes/1e6).toFixed(2)}MB  (${scale})` +
      `  | anh trang khac: ${other}`
    );
  }
  await ctx.close();
}
await b.close();
