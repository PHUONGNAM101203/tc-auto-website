/**
 * Cong kiem tra: canvas 1440px luon duoc thu dung be rong man hinh,
 * du nguoi dung vao trang bang duong nao.
 *
 * Bay ra tu mot loi that (da tai hien duoc): trang 404 nam NGOAI nhom route
 * (site) nen inline script dat --tc-zoom khong chay. Bam mot link menu tren
 * trang 404 la dieu huong phia client vao trong nhom — React chen lai the
 * <script> nhung script chen bang innerHTML KHONG BAO GIO chay. Ket qua:
 * --tc-zoom chua he duoc dat, `zoom` roi ve 1, canvas hien dung 1440px nam lot
 * thom giua man hinh rong.
 *
 * LUU Y: chi tai hien tren ban build. O che do dev, Next tai lai ca trang khi
 * roi trang 404 nen script van chay. Vi vay cong nay phai chay voi `next start`.
 */
import { chromium } from "playwright";

// Cung mac dinh voi compare.mjs (3311), van cho phep doi bang tham so.
const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://127.0.0.1:3311";
const VIEWPORT = { width: 1728, height: 1000 };
const TOLERANCE = 2; // px — sai so lam tron cua `zoom`
const NOT_FOUND = "/duong-dan-khong-ton-tai";

/** Moi ca: mot chuoi thao tac ket thuc tren mot trang co canvas. */
const CASES = [
  { name: "tai thang trang chu", run: (p) => p.goto(BASE + "/") },
  {
    name: "404 -> bam VE TRANG CHU",
    run: async (p) => {
      await p.goto(BASE + NOT_FOUND);
      await p.click(".tc-404-cta");
    },
  },
  {
    name: "404 -> bam link menu",
    run: async (p) => {
      await p.goto(BASE + NOT_FOUND);
      await p.locator(".tc-404-nav a").first().click();
    },
  },
  {
    name: "404 -> nut Back",
    run: async (p) => {
      await p.goto(BASE + "/");
      await p.goto(BASE + NOT_FOUND);
      await p.goBack();
    },
  },
  {
    name: "doi be rong cua so",
    run: async (p) => {
      await p.goto(BASE + "/");
      await p.setViewportSize({ width: 1180, height: 900 });
      await p.setViewportSize(VIEWPORT);
    },
  },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });
let failed = 0;

for (const testCase of CASES) {
  await testCase.run(page);
  await page.waitForSelector(".tc-canvas");
  await page.waitForTimeout(150); // cho ResizeObserver kip mot khung hinh

  const { width, available } = await page.evaluate(() => ({
    width: document.querySelector(".tc-canvas").getBoundingClientRect().width,
    available: document.documentElement.clientWidth,
  }));

  const drift = Math.abs(width - available);
  const ok = drift <= TOLERANCE;
  if (!ok) failed++;

  console.log(
    `${ok ? "PASS" : "FAIL"}  ${testCase.name.padEnd(26)} canvas ${width.toFixed(0)}px / kha dung ${available}px`,
  );
}

await browser.close();

if (failed > 0) {
  console.error(`\n${failed}/${CASES.length} duong vao bi sai ti le canvas.`);
  process.exit(1);
}
console.log(`\n${CASES.length}/${CASES.length} duong vao giu dung ti le canvas.`);
