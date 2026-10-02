/**
 * Khong the nao bi IN CHU HAI LAN tren ban mobile.
 *
 * ── Loi that ───────────────────────────────────────────────────────────────
 * Cac the "noi len khi ro chuot" duoc CAT RA tu anh thiet ke, va phan lon
 * chung da co san tieu de ve trong anh. Ban mobile dung lai chinh tam anh do,
 * roi — neu the khong khai `captionInImage` — in THEM tieu de bang chu that
 * ngay duoi. Ket qua la hai lop chu chong len nhau.
 *
 * Da xay ra tren ca SAU nhom the (02/10/2026), khach chup lai man hinh: bon o
 * INNOVATION / APPLICATIONS / WARRANTY / EXPERIENCE LAB doc ra
 * "INNOVATIONion", "APPLICAATIONSns". Chu thich trong bo sinh con ghi nham la
 * "bon o muc Cong nghe co chu nam NGOAI anh" — khong ai doi chieu lai voi
 * chinh tep anh.
 *
 * ── Cua nay do gi ──────────────────────────────────────────────────────────
 * Voi moi the co `mobileSrc`: neu the KHONG khai `captionInImage` thi anh cua
 * no khong duoc chua chu. Do bang cach tim cac HANG CO NHIEU DIEM SANG o
 * phan duoi anh — chu trang tren nen toi tao ra dung dac trung do. Nguoc lai,
 * the CO khai thi anh PHAI co chu; neu khong thi the mat ten han.
 *
 * Khong can may chu — doc thang tep anh.
 *
 * Chay: node tools/fidelity/check-caption-dup.mjs
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

const cards = JSON.parse(readFileSync("src/data/lift-cards.json", "utf8"));

/** Phan duoi anh, noi tieu de luon nam. */
const BAND_FROM = 0.62;

/**
 * Mot hang duoc coi la "co chu" khi co du diem SANG RO tren nen toi.
 * Nguong do tu chinh cac tep that: hang co chu dat 4-18% be ngang, hang nen
 * duoi 1%.
 */
const BRIGHT = 150;
const MIN_RATIO = 0.03;
const MIN_ROWS = 6;

async function hasCaption(path) {
  const file = `public${path.split("?")[0]}`;
  const { data, info } = await sharp(file)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const from = Math.floor(info.height * BAND_FROM);
  let rows = 0;
  for (let y = from; y < info.height; y += 1) {
    let bright = 0;
    for (let x = 0; x < info.width; x += 1) {
      if (data[y * info.width + x] >= BRIGHT) bright += 1;
    }
    if (bright / info.width >= MIN_RATIO) rows += 1;
  }
  return rows >= MIN_ROWS;
}

const problems = [];
let checked = 0;

for (const [page, list] of Object.entries(cards.pages)) {
  for (const card of list) {
    // The bi an khoi lop mobile thi khong co chuyen in chu hai lan.
    if (!card.mobileSrc || card.hideOnMobile) continue;
    checked += 1;
    const inImage = await hasCaption(card.mobileSrc);
    if (inImage && !card.captionInImage) {
      problems.push(
        `${page}/${card.id}: anh DA CO chu nhung the khong khai ` +
          `\`captionInImage\` — ban mobile se in chu lan hai, chong len nhau.`,
      );
    }
    if (!inImage && card.captionInImage) {
      problems.push(
        `${page}/${card.id}: the khai \`captionInImage\` nhung anh KHONG co ` +
          `chu — tren mobile the nay se khong co ten gi.`,
      );
    }
  }
}

if (problems.length) {
  console.log("");
  for (const line of problems) console.log(`  SAI ${line}`);
  console.log(
    `\n  ${problems.length}/${checked} the sai. Sua o tools/brand/extract-lift-cards.py ` +
      `(khoa \`captionInImage\` cua nhom) roi dung lai src/data/lift-cards.json.`,
  );
  process.exit(1);
}

console.log(`\n  Da so ${checked} the co ban mobile.`);
console.log("  The nao co chu trong anh deu da khai — khong cho nao in chu hai lan.");
