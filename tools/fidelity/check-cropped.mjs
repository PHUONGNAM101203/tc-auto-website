/**
 * Khong anh nao duoc bi CAT MAT NOI DUNG.
 *
 * ── Do gi ───────────────────────────────────────────────────────────────────
 * Mot the <img> dat `object-fit: cover` trong mot o co ti le khac ti le that
 * cua anh thi trinh duyet cat bot hai ben (hoac tren duoi). Voi anh phong
 * canh thi khong sao — do la y do. Voi ANH SAN PHAM thi hong: anh hang goi san
 * ten dong o mep, cat la mat chu. Da sap bay dung vay mot lan
 * ("S170+ QLED 2K" chi con "S170+ QLED 2").
 *
 * Bo nay do TI LE that cua tep so voi ti le o hien, tren moi trang va o ca ban
 * dien thoai lan may ban, roi bao nhung cho mat tu `LIMIT` tro len.
 *
 * Anh CO Y cat (bang hero, bang anh chay ngang) duoc mien tru qua `ALLOW` —
 * ghi ro ten lop va ly do, chu khong de ngam.
 *
 * Can may chu — chay qua `npm run verify:live`.
 */
import { chromium } from "@playwright/test";
import { readdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:3311";

/** Mat bao nhieu phan tram be ngang (hoac chieu cao) thi coi la hong. */
const LIMIT = 0.06;

/**
 * Nhung lop CO Y cat. Day deu la anh PHONG CANH dat lam nen, khong mang chu:
 * cat bot hai ben de vua khung la dung y thiet ke.
 */
const ALLOW = [
  "tc-m-hero",        // bang dau trang — anh nen toan man
  "tc-m-car",         // bang anh chay ngang
  "tc-m-tiles",       // o luoi anh phong canh, chu da ve trong anh
  "tc-cover",         // dai "BỘ SƯU TẬP" tren may ban
  "tc-dochdr",        // dai header cua trang ngoai canvas
  "tc-m-foot-logo",
];

const browser = await chromium.launch();

function routes() {
  const main = ["/", "/trai-nghiem", "/giai-phap", "/cong-nghe", "/dai-ly", "/nhan-su"];
  const sub = readdirSync("src/data/subpages")
    .filter((n) => n.endsWith(".json") && n !== "index.json")
    .map((n) => "/" + n.slice(0, -5).replaceAll("__", "/"));
  return [...main, ...sub];
}

const problems = [];
let checked = 0;

for (const [width, label] of [[390, "dien thoai"], [1440, "may ban"]]) {
  for (const route of routes()) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      isMobile: width < 900,
      deviceScaleFactor: 1,
    });
    await page.goto(BASE + route, { waitUntil: "load" }).catch(() => {});
    await page.waitForTimeout(350);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 800) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((done) => setTimeout(done, 25));
      }
    });
    await page.waitForTimeout(250);

    const found = await page.evaluate(
      ({ allow, limit }) => {
        const out = [];
        for (const img of document.querySelectorAll("img")) {
          // Anh giu cho 1x1 (GIF trong suot) khong phai anh that — bang hero
          // dung no cho nhung tam chua toi luot tai.
          if (img.naturalWidth <= 2 || img.naturalHeight <= 2) continue;
          const style = getComputedStyle(img);
          if (style.objectFit !== "cover") continue;
          const box = img.getBoundingClientRect();
          if (box.width < 40 || box.height < 40) continue;

          // Co y cat thi bo qua.
          let skip = false;
          for (let el = img; el && !skip; el = el.parentElement) {
            const cls = (el.className ?? "").toString();
            if (allow.some((name) => cls.includes(name))) skip = true;
          }
          if (skip) continue;

          const natural = img.naturalWidth / img.naturalHeight;
          const shown = box.width / box.height;
          // `cover` phong anh cho phu kin o roi cat phan thua.
          const lost =
            shown > natural
              ? 1 - natural / shown // mat tren duoi
              : 1 - shown / natural; // mat hai ben
          if (lost >= limit) {
            out.push({
              src: (img.currentSrc || img.src).split("?")[0].split("/").pop(),
              cls: (img.className ?? "").toString().split(" ")[0] || img.parentElement?.className,
              lost: Math.round(lost * 100),
              where: shown > natural ? "tren duoi" : "hai ben",
            });
          }
        }
        return out;
      },
      { allow: ALLOW, limit: LIMIT },
    );

    checked += 1;
    for (const f of found) {
      problems.push(
        `${label} ${route} — ${f.src} mat ${f.lost}% ${f.where} (${f.cls})`,
      );
    }
    await page.close();
  }
}

await browser.close();

if (problems.length) {
  const seen = new Set();
  const unique = problems.filter((p) => {
    const key = p.split(" — ")[1];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log("");
  for (const line of unique.slice(0, 30)) console.log(`  SAI ${line}`);
  console.log(`\n  ${unique.length} anh bi cat mat noi dung (tren ${problems.length} luot gap).`);
  process.exit(1);
}

console.log(`\n  Da so ${checked} luot trang.`);
console.log("  Khong anh nao bi cat mat noi dung ngoai nhung cho co y.");
