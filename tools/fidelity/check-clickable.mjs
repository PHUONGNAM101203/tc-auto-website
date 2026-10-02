/**
 * Lien ket va nut NHIN THAY duoc thi phai BAM duoc.
 *
 * ── Loi that ────────────────────────────────────────────────────────────
 * Ca site dat phan tu tuyet doi len canvas 1440px, va nhieu vung chong nhau:
 * nhan muc nam trong pham vi cua mot the noi, nut nam trong pham vi cua mot
 * dai anh. Khong khai `z-index` thi thu tu DOM quyet dinh — ma nhan muc dung
 * TRUOC the trong DOM, nen the phu len. Nguoi dung thay chu, ro chuot thay
 * con tro doi, bam thi khong co gi xay ra.
 *
 * Phat hien tren /giai-phap: nhan "PHIM CÁCH NHIỆT" (y 2518) nam gon trong
 * the noi (y 2205..2902) va bi chan hoan toan. Bai e2e bat duoc vi
 * `locator.click()` cua Playwright cho den khi phan tu that su bam duoc —
 * no treo 60 giay roi bao het gio.
 *
 * ── Do the nao ──────────────────────────────────────────────────────────
 * Voi moi lien ket/nut dang hien, lay diem GIUA cua no roi hoi trinh duyet
 * `elementFromPoint`. Neu thu tra ve khong phai chinh no (hay con cua no) thi
 * co cai gi do dang chan.
 *
 * Can may chu o cong 3311 — chay qua `npm run verify:live`.
 */
import { chromium } from "@playwright/test";
import { readdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:3311";

function routes() {
  const main = ["/", "/trai-nghiem", "/giai-phap", "/cong-nghe", "/dai-ly", "/nhan-su"];
  const sub = readdirSync("src/data/subpages")
    .filter((name) => name.endsWith(".json") && name !== "index.json")
    .map((name) => "/" + name.slice(0, -5).replaceAll("__", "/"));
  return [...main, ...sub];
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
let checked = 0;

for (const route of routes()) {
  await page.goto(BASE + route, { waitUntil: "load" });
  // Cho man cho tai bien mat, neu khong no chan HET moi thu.
  //
  // `.tc-boot` phu kin man hinh o z-index 80 cho den khi `load` xong hoac het
  // 2,2 giay (xem MotionLayer). Do khi no con do thi 218 lien ket deu bao "bi
  // chan" — dung ve ky thuat nhung vo nghia. Phai doi no xong, roi doi them
  // mot nhip cho hieu ung mo dan 0,55s chay het.
  await page.waitForFunction(
    () => document.querySelector(".tc-boot")?.getAttribute("data-done") === "true",
    null,
    { timeout: 15_000 },
  );
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((done) => setTimeout(done, 35));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(250);

  const blocked = await page.evaluate(() => {
    const out = [];
    const scope = document.querySelector(".tc-canvas") ?? document.body;
    for (const el of scope.querySelectorAll("a[href], button")) {
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      if (style.pointerEvents === "none") continue;
      // Bo qua CHONG BAI ANH: cac tam sau CO Y nam duoi tam truoc, va nguoi
      // dung bam vao phan ria con lo ra chu khong bam vao tam. Do o diem giua
      // thi tam nao cung "bi chan" — dung ve ky thuat, vo nghia ve y nghia.
      if (el.classList.contains("tc-deck-card")) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 6 || box.height < 6) continue;

      // Cuon sao cho phan tu vao giua khung nhin roi moi hoi.
      //
      // `behavior: "instant"` la bat buoc: site dat `scroll-behavior: smooth`,
      // ma cuon muot thi `getBoundingClientRect()` doc ngay sau do van la toa
      // do CU — diem tinh ra roi ra ngoai khung nhin, vong lap `continue`, va
      // bai nay bao "khong cai nao bi chan" trong khi no chua kiem duoc gi.
      // Da dinh dung cai bay do.
      const want = box.top + window.scrollY - window.innerHeight / 2 + box.height / 2;
      window.scrollTo({ top: Math.max(0, want), behavior: "instant" });
      const now = el.getBoundingClientRect();
      const x = now.left + now.width / 2;
      const y = now.top + now.height / 2;
      if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) continue;

      const hit = document.elementFromPoint(x, y);
      if (!hit) continue;
      if (hit === el || el.contains(hit) || hit.contains(el)) continue;

      out.push({
        label: (el.textContent ?? "").trim().slice(0, 28) ||
          el.getAttribute("aria-label")?.slice(0, 28) || "(không chữ)",
        cls: (el.className ?? "").toString().split(" ")[0],
        by: hit.tagName + "." + (hit.className ?? "").toString().split(" ")[0],
      });
    }
    return out;
  });

  checked += 1;
  for (const entry of blocked) {
    problems.push(
      `${route} — "${entry.label}" (.${entry.cls}) bi ${entry.by} chan`,
    );
  }
}

await browser.close();

if (problems.length) {
  console.log("");
  for (const line of problems.slice(0, 30)) console.log(`  SAI ${line}`);
  if (problems.length > 30) console.log(`  … va ${problems.length - 30} cho nua`);
  console.log(`\n  ${problems.length} lien ket/nut nhin thay ma bam khong duoc.`);
  process.exit(1);
}
console.log(`\n  Da so moi lien ket va nut tren ${checked} trang. Khong cai nao bi chan.`);
