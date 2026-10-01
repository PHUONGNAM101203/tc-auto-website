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

/**
 * Chay mot ca, thu lai mot lan neu canvas khong hien ra.
 *
 * `next start` tu dung co luc tra 404 cho `/` ngay sau khi ban ISR het han
 * (60 giay) trong luc may dang tai nang — da do duoc: chay rieng thi 5/5 PASS,
 * chay sau sau cua kiem khac thi thinh thoang chet ngay ca dau tien. Khong tai
 * hien duoc bang GET thuan, bang trinh duyet khong tai, hay luc may ranh; va
 * ban tren Vercel khong dung bo nho dem nay. Day la cho duy nhat trong chuoi
 * kiem bi anh huong, nen thu lai mot lan va NOI RO ra, chu khong im lang.
 */
async function attempt(testCase) {
  for (let round = 1; round <= 2; round += 1) {
    await testCase.run(page);
    try {
      await page.waitForSelector(".tc-canvas", { timeout: 15_000 });
      if (round > 1) {
        console.log(`      (${testCase.name}: lan dau khong thay canvas, thu lai thi duoc)`);
      }
      return true;
    } catch {
      if (round === 2) {
        console.log(`FAIL  ${testCase.name.padEnd(26)} khong thay .tc-canvas sau 2 lan thu`);
        return false;
      }
      await page.waitForTimeout(2000);
    }
  }
  return false;
}

for (const testCase of CASES) {
  if (!(await attempt(testCase))) {
    failed++;
    continue;
  }
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
