/**
 * Moi trang con phai co anh hero RIENG cho dien thoai.
 *
 * ── Vi sao ─────────────────────────────────────────────────────────────────
 * `MobileSubPage` co mot dong du phong: thieu anh rieng thi lay thang
 * `page.slices[0]` — lat thiet ke nguyen ban rong 1440px. Lat do DA CO tua de,
 * logo va cot CLARITY/PROTECTION ve san trong anh, con ban mobile thi ve tua
 * de bang chu that de len. Ket qua: tua de hien HAI LAN lech nhau, logo bi cat.
 *
 * Ba trang tung roi vao canh do (dai-ly/cau-chuyen-dong-hanh,
 * dai-ly/gallery-by-brand, trang chan dung Pham Gia Auto) vi tua de cua chung
 * trai gan het be ngang bang hero nen bo cat khong tim duoc cot sach. Khach
 * chup lai 02/10/2026.
 *
 * Dong du phong VAN GIU — mat mot tam anh con hon trang trong — nhung khong
 * duoc phep co trang nao dung toi no.
 *
 * Khong can may chu. Chay: node tools/fidelity/check-mobile-hero.mjs
 */
import { readFileSync, readdirSync } from "node:fs";

const tiles = JSON.parse(readFileSync("src/data/subpage-tiles.json", "utf8")).pages;

const missing = [];
let checked = 0;

for (const name of readdirSync("src/data/subpages")) {
  if (!name.endsWith(".json") || name === "index.json") continue;
  const spec = JSON.parse(readFileSync(`src/data/subpages/${name}`, "utf8"));
  if (!spec.slug) continue;
  checked += 1;
  if (!tiles[spec.slug]?.hero) missing.push(spec.slug);
}

if (missing.length) {
  console.log("");
  for (const slug of missing) {
    console.log(`  SAI ${slug}: khong co anh hero rieng — ban mobile se lay lat`);
    console.log(`      thiet ke 1440px, tua de hien hai lan chong len nhau.`);
  }
  console.log(
    `\n  ${missing.length}/${checked} trang thieu. Sua o ` +
      `tools/brand/extract-subpage-tiles.py roi chay lai.`,
  );
  process.exit(1);
}

console.log(`\n  Da so ${checked} trang con — trang nao cung co anh hero rieng.`);
