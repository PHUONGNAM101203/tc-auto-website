/**
 * Moi be ngang man hinh deu phai gon gang: khong tran ngang, khong chong chu.
 *
 * Khach yeu cau (02/10/2026): "kéo nhỏ lại thì nó đi theo, không lệch hay xấu
 * bất cứ một cái gì cả".
 *
 * ── Do gi ───────────────────────────────────────────────────────────────
 * 1. TRAN NGANG: `scrollWidth` cua trang khong duoc lon hon be ngang cua so.
 *    Day la dau hieu ro nhat cua bo cuc vo — xuat hien thanh cuon ngang.
 * 2. PHAN TU VUOT MEP: khong phan tu nao duoc tran ra ngoai mep phai.
 * 3. CHU QUA NHO: duoi 11px thi khong doc duoc tren dien thoai.
 *
 * Be ngang kiem tra trai deu tu dien thoai nho nhat den man rong, va bao gom
 * hai moc chuyen giao doi lop: 899/900 (canvas <-> lop mobile).
 *
 * Can may chu o cong 3311 — chay qua `npm run verify:live`.
 */
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://127.0.0.1:3311";

/** Be ngang do. Gom ca hai ben cua moc 900px. */
const WIDTHS = [320, 360, 390, 414, 600, 768, 899, 900, 1024, 1280, 1440, 1920, 2560];

/** Trang dai dien cho tung kieu bo cuc. */
const ROUTES = [
  "/",
  "/giai-phap",
  "/giai-phap/man-hinh",
  "/giai-phap/ppf",
  "/dai-ly/mang-luoi-dai-ly",
  "/dai-ly/gallery-by-brand",
  "/giai-phap/man-hinh/tat-ca",
  "/cau-hoi-thuong-gap",
  "/giai-phap/du-an/tc-auto-hop-tac-voi-thanh-tien-auto",
  "/giai-phap/man-hinh/s170-plus-qled",
  // Hai cho khach tung chi ra loi bo cuc: the kho ung dung va trang muc Dai ly.
  "/cong-nghe/ung-dung",
  "/dai-ly",
];

const browser = await chromium.launch();
const problems = [];
let checked = 0;

for (const width of WIDTHS) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    isMobile: width < 900,
    deviceScaleFactor: width < 900 ? 2 : 1,
  });

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "load" });
    await page
      .waitForFunction(
        () => document.querySelector(".tc-boot")?.getAttribute("data-done") === "true",
        null,
        { timeout: 15_000 },
      )
      .catch(() => {});
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 800) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((done) => setTimeout(done, 25));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForTimeout(150);
    checked += 1;

    const found = await page.evaluate(() => {
      const out = [];
      const limit = document.documentElement.clientWidth;

      if (document.documentElement.scrollWidth > limit + 1) {
        out.push({
          kind: "tran ngang",
          detail: `trang rong ${document.documentElement.scrollWidth}px / khung ${limit}px`,
        });
      }

      // Phan tu nao tran ra ngoai mep phai.
      //
      // Bo qua cai nao nam trong mot khung CO CAT (`overflow-x` khac
      // `visible`). Day la y do chu khong phai hong: cac dai the truot ngang
      // (`.tc-solutions`, `.tc-ppf`) deu de the ke tiep tho ra khoi mep roi
      // khung cat di — do chinh la cai cho nguoi dung biet con the nua.
      // Chi `auto`/`scroll` thi bo sot `hidden`, ma `hidden` moi la cach cac
      // dai the nay dung.
      const clippers = new Set();
      for (const el of document.querySelectorAll("*")) {
        if (getComputedStyle(el).overflowX !== "visible") clippers.add(el);
      }
      const insideScroller = (el) => {
        for (let node = el.parentElement; node; node = node.parentElement) {
          if (clippers.has(node)) return true;
        }
        return false;
      };

      for (const el of document.querySelectorAll("body *")) {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (style.position === "fixed") continue;
        if (insideScroller(el)) continue;
        const box = el.getBoundingClientRect();
        if (box.width < 2 || box.height < 2) continue;
        if (box.right > limit + 2) {
          out.push({
            kind: "vuot mep phai",
            detail: `${el.tagName}.${(el.className ?? "").toString().split(" ")[0]} ` +
              `tran ${Math.round(box.right - limit)}px`,
          });
          break; // mot cho moi trang la du de biet
        }
      }

      // Chu qua nho de doc.
      //
      // CHI do chu NGOAI canvas. Trong canvas moi co so do thiet ke theo he
      // 1440px roi ca khoi duoc phong bang `zoom` cho vua cua so — mot dong
      // 8,6px o do hien ra 11,5px tren man 1920. Lay nguong co dinh ma do
      // thi hoac bao nham moi dong chu nho cua thiet ke, hoac bat ta phai
      // phong to mot dong len khac han ba dong ve san ngay canh no.
      // `getComputedStyle` tra ve co TRUOC khi phong, nen con so doc duoc o
      // trong canvas khong so sanh duoc voi pixel that.
      const zoomed = [...document.querySelectorAll(".tc-canvas, .tc-dochdr-canvas")];
      const insideCanvas = (el) => zoomed.some((box) => box.contains(el));

      for (const el of document.querySelectorAll("p, h1, h2, h3, a, span, strong, em, li")) {
        if (!el.textContent?.trim()) continue;
        if (insideCanvas(el)) continue;
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;
        const size = parseFloat(style.fontSize);
        if (size > 0 && size < 11 && el.getBoundingClientRect().width > 2) {
          out.push({
            kind: "chu qua nho",
            detail: `${size.toFixed(1)}px — "${el.textContent.trim().slice(0, 24)}"`,
          });
          break;
        }
      }

      return out;
    });

    for (const entry of found) {
      problems.push(`${width}px ${route} — ${entry.kind}: ${entry.detail}`);
    }
  }

  await page.close();
}

await browser.close();

if (problems.length) {
  console.log("");
  for (const line of problems.slice(0, 40)) console.log(`  SAI ${line}`);
  if (problems.length > 40) console.log(`  … va ${problems.length - 40} cho nua`);
  console.log(`\n  ${problems.length} cho hong tren ${checked} luot do.`);
  process.exit(1);
}
console.log(`\n  Da do ${checked} luot (${WIDTHS.length} be ngang x ${ROUTES.length} trang).`);
console.log("  Khong trang nao tran ngang, vuot mep hay chu qua nho.");
