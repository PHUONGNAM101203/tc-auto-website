/**
 * So pixel 31 trang con da render voi PNG thiet ke goc (@3x).
 *
 * Chay:  node tools/fidelity/compare-subpages.mjs [baseUrl]
 *
 * Nguon la PNG khong nen, ban render dung WebP q80 nen SE co nhieu nen do nen
 * anh. Nguong pixelmatch 0.15 bo qua nhieu nen do; phan con lai moi la sai lech
 * that (lech vi tri, thieu lat, overlay ve de len thiet ke).
 */
import { chromium } from "@playwright/test";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
// Doc THANG tu nguon chuan — Node tu lot kieu cua tep .ts (can Node >= 22.18).
// Truoc day cho nay la mot BAN CHEP TAY kem giao uoc "sua o do thi sua ca o day";
// giao uoc do da dut o gate trang chinh, nen bo han ban chep.
import {
  deviationsFor,
  FOOTER_DEVIATION,
} from "../../src/lib/design-deviations.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const OUT = resolve(HERE, "out-sub");
const BASE_URL = process.argv[2] ?? "http://127.0.0.1:3311";

const CANVAS_WIDTH = 1440;
/** Bo qua nhieu nen do nen WebP; chi bat sai lech hinh hoc that. */
const THRESHOLD = 0.15;
/** Bao dong khi ti le lech vuot muc nay. */
const FAIL_RATIO = 0.02;

const manifest = JSON.parse(
  readFileSync(join(ROOT, "tools/subpage-manifest.json"), "utf8"),
);

const PAGER_BOXES = JSON.parse(
  readFileSync(join(ROOT, "src/data/detected-pagination.json"), "utf8"),
);
const PAGER_PAD = 26;
const index = JSON.parse(
  readFileSync(join(ROOT, "src/data/subpages/index.json"), "utf8"),
);
/**
 * Giai duong dan toi bo thiet ke goc.
 *
 * `subpage-manifest.json` tung ghi duong dan TUYET DOI tro vao `~/Downloads`.
 * Ngay 03/10/2026 khach don het tai nguyen sang `~/Documents/TC-Auto/` va xoa
 * cho cu — cua kiem nay chet ngay voi "Input file is missing".
 *
 * Giong `resolve_root` ben Python (tools/brand/design_root.py): con duong dan
 * nao ton tai thi dung luon, khong thi tim lai doan ten cuoi trong cac goc
 * da biet.
 */
function resolveRoot(value) {
  if (existsSync(value)) return value;
  const parts = value.split("/").filter(Boolean);
  const tails = [parts.slice(-2).join("/"), parts.at(-1)].filter(Boolean);
  const bases = [
    join(homedir(), "Documents", "TC-Auto"),
    join(homedir(), "Downloads"),
  ];
  for (const base of bases) {
    for (const tail of tails) {
      const path = join(base, tail);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(
    `Khong tim thay bo thiet ke. Da thu: ${bases.join(", ")} voi ${tails.join(", ")}`,
  );
}

const SUB_ROOT = resolveRoot(manifest.sourceRoot);
const MAIN_ROOT = resolveRoot(manifest.mainSourceRoot ?? manifest.sourceRoot);

const sourceBySlug = new Map(
  manifest.pages.map((p) => [
    p.slug,
    join(p.main ? MAIN_ROOT : SUB_ROOT, p.dir, p.file),
  ]),
);

const FREEZE = `(() => {
  document.documentElement.style.setProperty('--tc-zoom', '1');
  for (const sel of ['.tc-boot', '.tc-progress', '.tc-curtain', '.tc-cursor', '.toast']) {
    for (const el of document.querySelectorAll(sel)) el.style.display = 'none';
  }
  for (const el of document.querySelectorAll('.rv, .sl, .hero-line')) {
    el.classList.add('is-in', 'is-settled');
  }
})()`;

async function renderPage(page, route) {
  await page.goto(`${BASE_URL}${route}`, {
    waitUntil: "load",
    timeout: 90_000,
  });
  // Chu tren canvas duoc giu lai cho toi khi phong san sang (lop `tc-fontwait`,
  // xem src/app/(site)/layout.tsx). Chup truoc luc do la anh khong co chu nao.
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("tc-fontwait"),
    { timeout: 10_000 },
  ).catch(() => undefined);
  await page.evaluate(FREEZE);
  await page.evaluate(async () => {
    const step = Math.floor(innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      );
    }
    scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((done) => setTimeout(done, 200));
    await Promise.all(
      [...document.querySelectorAll("img")]
        .filter((img) => !img.closest(".tc-m"))
        .map((img) =>
          img.complete && img.naturalWidth > 0
            ? null
            : new Promise((done) => {
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
                setTimeout(done, 15_000);
              }),
        ),
    );
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
  await page.waitForTimeout(250);
  return page.screenshot({ fullPage: true, animations: "disabled" });
}

/** Ha PNG goc @3x xuong dung ti le hien thi 1440px. */
async function sourceAt1440(path) {
  const { data, info } = await sharp(path, { limitInputPixels: false })
    .resize({ width: CANVAS_WIDTH, kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: CANVAS_WIDTH, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  const rows = [];
  try {
    for (const entry of index) {
      const shot = PNG.sync.read(await renderPage(page, entry.route));
      const src = await sourceAt1440(sourceBySlug.get(entry.slug));

      const width = Math.min(shot.width, src.width);
      const height = Math.min(shot.height, src.height);
      const diff = new PNG({ width, height });

      // To den vung phan trang o CA HAI ben truoc khi so.
      const pager = PAGER_BOXES[entry.slug];
      const maskBoxes = [
        ...(pager
          ? [
              {
                x: Math.max(0, pager.x - PAGER_PAD),
                y: Math.max(0, pager.y - PAGER_PAD),
                w: pager.width + PAGER_PAD * 2,
                h: pager.height + PAGER_PAD * 2,
              },
            ]
          : []),
        ...deviationsFor(entry.slug).map(({ box }) => ({
          x: box.x,
          y: box.y,
          w: box.width,
          h: box.height,
        })),
        // Dong dia chi tru so — bam day trang nen `y` suy tu chieu cao that.
        {
          x: FOOTER_DEVIATION.box.x,
          y: height - FOOTER_DEVIATION.fromBottom,
          w: FOOTER_DEVIATION.box.width,
          h: FOOTER_DEVIATION.box.height,
        },
      ];
      const blackOut = (data, rowWidth) => {
        for (const maskBox of maskBoxes) {
          for (
            let y = maskBox.y;
            y < Math.min(maskBox.y + maskBox.h, height);
            y += 1
          ) {
            for (
              let x = maskBox.x;
              x < Math.min(maskBox.x + maskBox.w, rowWidth);
              x += 1
            ) {
              const at = (rowWidth * y + x) << 2;
              data[at] = 0;
              data[at + 1] = 0;
              data[at + 2] = 0;
              data[at + 3] = 255;
            }
          }
        }
        return data;
      };

      const crop = (data, w) => {
        const out = Buffer.alloc(width * height * 4);
        for (let y = 0; y < height; y += 1) {
          data.copy(out, y * width * 4, y * w * 4, y * w * 4 + width * 4);
        }
        return out;
      };

      const mismatch = pixelmatch(
        crop(blackOut(src.data, src.width), src.width),
        crop(blackOut(shot.data, shot.width), shot.width),
        diff.data,
        width,
        height,
        { threshold: THRESHOLD, includeAA: true },
      );

      const ratio = mismatch / (width * height);
      if (ratio > FAIL_RATIO) {
        writeFileSync(
          resolve(OUT, `${entry.slug.replace(/\//g, "__")}-diff.png`),
          PNG.sync.write(diff),
        );
      }

      rows.push({
        slug: entry.slug,
        srcSize: `${src.width}x${src.height}`,
        gotSize: `${shot.width}x${shot.height}`,
        sizeMatch:
          src.width === shot.width && Math.abs(src.height - shot.height) <= 1,
        ratio,
      });
    }
  } finally {
    await browser.close();
  }

  console.log(
    "\n  trang                                                        nguon        render       % lech",
  );
  console.log("  " + "-".repeat(100));
  let worst = 0;
  let failed = 0;
  for (const row of rows) {
    worst = Math.max(worst, row.ratio);
    const bad = !row.sizeMatch || row.ratio > FAIL_RATIO;
    if (bad) failed += 1;
    console.log(
      `${bad ? "!" : " "} ${row.slug.padEnd(58)} ${row.srcSize.padEnd(12)} ${row.gotSize.padEnd(12)} ` +
        `${(row.ratio * 100).toFixed(3).padStart(8)}%${row.sizeMatch ? "" : "  KICH THUOC LECH"}`,
    );
  }
  console.log(
    `\n  ${rows.length} trang · lech lon nhat ${(worst * 100).toFixed(3)}% · ${failed} trang vuot nguong ${FAIL_RATIO * 100}%`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
