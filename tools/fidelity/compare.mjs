/**
 * So sanh pixel giua prototype Figma goc va site Next da build.
 *
 * Chay:  node tools/fidelity/compare.mjs [baseUrl] [prototypePath]
 * Ket qua: tools/fidelity/out/{slug}-{proto,next,diff}.png + bang tom tat.
 *
 * Ca hai ben deu duoc ep zoom = 1 va reducedMotion = reduce de so o trang thai
 * tinh — dung trang thai ket thuc cua moi hieu ung.
 */
import { chromium } from "@playwright/test";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// Doc THANG tu nguon chuan — Node tu lot kieu cua tep .ts (can Node >= 22.18).
// Truoc day cho nay la mot BAN CHEP TAY va no da lech: danh sach o day thieu ba
// dai the duoc nhac len (home, dai-ly, giai-phap) nen gate bao lech gia.
import { deviationsFor } from "../../src/lib/design-deviations.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "out");

const BASE_URL = process.argv[2] ?? "http://127.0.0.1:3311";
const PROTOTYPE =
  process.argv[3] ?? resolve(HERE, "../../../TC-Auto-Website-Prototype.html");

const PAGES = [
  { slug: "home", hash: "home", route: "/" },
  { slug: "trai-nghiem", hash: "trai-nghiem", route: "/trai-nghiem" },
  { slug: "giai-phap", hash: "giai-phap", route: "/giai-phap" },
  { slug: "cong-nghe", hash: "cong-nghe", route: "/cong-nghe" },
  { slug: "dai-ly", hash: "dai-ly", route: "/dai-ly" },
  { slug: "nhan-su", hash: "nhan-su", route: "/nhan-su" },
];

const VIEWPORT = { width: 1440, height: 900 };
/** Nguong lech mau cho 1 pixel (0..1). 0.12 bo qua nhieu nen JPEG/WebP. */
const THRESHOLD = 0.12;

/** Ep canvas ve ti le 1:1 va tat moi overlay dong. */
const FREEZE = `(() => {
  const app = document.getElementById('app');
  if (app) app.style.zoom = '1';                       // prototype goc
  document.documentElement.style.setProperty('--tc-zoom', '1');  // site Next
  for (const sel of ['.tc-boot', '.tc-progress', '.tc-curtain', '.tc-cursor', '.toast']) {
    for (const el of document.querySelectorAll(sel)) el.style.display = 'none';
  }
  for (const el of document.querySelectorAll('.rv, .sl, .hero-line')) {
    el.classList.add('is-in', 'is-settled');
  }
})()`;

async function shoot(page, url, { hash } = {}) {
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  if (hash) {
    await page.evaluate((h) => {
      location.hash = `#${h}`;
      dispatchEvent(new HashChangeEvent("hashchange"));
    }, hash);
  }
  await page.evaluate(FREEZE);

  // Cuon het trang de kich hoat loading="lazy", roi cho moi anh ve xong.
  // Doi img.loading sau khi browser da hoan lai KHONG lam no tai — phai cuon.
  await page.evaluate(async () => {
    const step = Math.floor(innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      );
    }
    scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((done) => setTimeout(done, 150));
    scrollTo(0, 0);
  });

  // Cho loader gan het nguon cho cac lat con lai (anh 1x1 placeholder khong tinh la da tai).
  await page.waitForFunction(
    () => document.querySelectorAll("img[data-src]").length === 0,
    {
      timeout: 30_000,
    },
  );
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("img.sl")].every(
        (img) => img.complete && img.naturalWidth > 1,
      ),
    { timeout: 30_000 },
  );

  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const images = [...document.querySelectorAll("img")];
    await Promise.all(
      images.map((img) =>
        img.complete && img.naturalWidth > 0
          ? null
          : new Promise((done) => {
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
              setTimeout(done, 8000);
            }),
      ),
    );
  });

  // Bo qua anh cua lop MOBILE: o be rong desktop lop do bi `display:none` nen
  // trinh duyet co y khong tai — do la dieu mong muon, khong phai loi.
  const pending = await page.evaluate(
    () =>
      [...document.querySelectorAll("img")].filter(
        (img) => img.naturalWidth === 0 && !img.closest(".tc-m"),
      ).length,
  );
  if (pending > 0) {
    throw new Error(`Con ${pending} anh chua tai duoc tai ${url}`);
  }

  await page.waitForTimeout(400);
  await page.evaluate(() => scrollTo(0, 0));
  return page.screenshot({ fullPage: true, animations: "disabled" });
}

/** To den mot vung tren anh — dung de loai vung sai lech co chu dich khoi phep so. */
function maskOut(png, boxes) {
  for (const box of boxes ?? []) {
    for (let y = box.y; y < Math.min(box.y + box.height, png.height); y += 1) {
      for (let x = box.x; x < Math.min(box.x + box.width, png.width); x += 1) {
        const at = (png.width * y + x) << 2;
        png.data[at] = 0;
        png.data[at + 1] = 0;
        png.data[at + 2] = 0;
        png.data[at + 3] = 255;
      }
    }
  }
  return png;
}

function compare(protoBuffer, nextBuffer, slug) {
  const boxes = deviationsFor(slug).map((item) => item.box);
  const a = maskOut(PNG.sync.read(protoBuffer), boxes);
  const b = maskOut(PNG.sync.read(nextBuffer), boxes);

  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const diff = new PNG({ width, height });

  const crop = (png) => {
    if (png.width === width && png.height === height) return png;
    const out = new PNG({ width, height });
    PNG.bitblt(png, out, 0, 0, width, height, 0, 0);
    return out;
  };

  const mismatch = pixelmatch(
    crop(a).data,
    crop(b).data,
    diff.data,
    width,
    height,
    { threshold: THRESHOLD, includeAA: true },
  );

  return {
    width,
    height,
    mismatch,
    masked: boxes.length,
    ratio: mismatch / (width * height),
    sizeMatch: a.width === b.width && a.height === b.height,
    protoSize: `${a.width}x${a.height}`,
    nextSize: `${b.width}x${b.height}`,
    diff: PNG.sync.write(diff),
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });

  const rows = [];
  try {
    const protoPage = await context.newPage();
    const nextPage = await context.newPage();

    for (const target of PAGES) {
      const protoShot = await shoot(protoPage, `file://${PROTOTYPE}`, {
        hash: target.hash,
      });
      const nextShot = await shoot(nextPage, `${BASE_URL}${target.route}`);

      writeFileSync(resolve(OUT, `${target.slug}-proto.png`), protoShot);
      writeFileSync(resolve(OUT, `${target.slug}-next.png`), nextShot);

      const result = compare(protoShot, nextShot, target.slug);
      writeFileSync(resolve(OUT, `${target.slug}-diff.png`), result.diff);
      rows.push({ slug: target.slug, ...result, diff: undefined });
    }
  } finally {
    await browser.close();
  }

  console.log(
    "\n  trang          proto        next         lech px      % lech   o bo qua",
  );
  console.log("  " + "-".repeat(74));
  let worst = 0;
  for (const row of rows) {
    worst = Math.max(worst, row.ratio);
    const flag = row.sizeMatch ? " " : "!";
    console.log(
      `${flag} ${row.slug.padEnd(14)} ${row.protoSize.padEnd(12)} ${row.nextSize.padEnd(12)} ` +
        `${String(row.mismatch).padStart(9)}  ${(row.ratio * 100).toFixed(3).padStart(8)}%` +
        `  ${String(row.masked).padStart(8)}`,
    );
  }
  console.log(
    `\n  Lech lon nhat: ${(worst * 100).toFixed(3)}%   (anh diff trong ${OUT})`,
  );
  return worst;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
