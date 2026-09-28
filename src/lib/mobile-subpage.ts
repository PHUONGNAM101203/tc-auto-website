import ppf from "@/data/ppf-cards.json";
import tiles from "@/data/subpage-tiles.json";
import { getPageText, type TextBlock } from "./subpage-text";
import type { SubPageSpec } from "./subpage-schema";

/**
 * Chuyen mot trang con (von la ANH) thanh noi dung doc duoc tren dien thoai.
 *
 * 31 trang con den tu PNG @3x: chu nam TRONG anh. Tren man hinh 390px, canvas
 * 1440px bi thu con 27% nen chu chi con 3-4px. Ban mobile vi vay dung lai tu
 * VAN BAN OCR da trich (src/data/subpage-text.json) — cung mot chu, nhung la
 * chu that nen doc duoc, chon duoc, va may tim kiem doc duoc.
 */

/** Dai header tren cung: logo, nav, o tim kiem — da co ban mobile rieng. */
const HEADER_BOTTOM = 560;
/** Dai chan trang: form lien he va thong tin — da co ban mobile rieng. */
const FOOTER_MARGIN = 430;
/** Cot phu ben phai cua anh hero (CLARITY / PROTECTION / COMFORT...). */
const SIDE_COLUMN = 1180;
/**
 * Day cua dai hero. Loc `SIDE_COLUMN` chi duoc ap dung TRONG dai nay — duoi do
 * cot ben phai la noi dung that (the thu tu cua mot hang the chang han), cat di
 * la mat hang.
 */
const HERO_BOTTOM = 900;
/** Manh chu qua ngan thuong la nhan trang tri, khong phai noi dung. */
const MIN_LENGTH = 12;
/** Khoang ho doc du lon de coi la sang mot DAI moi cua trang. */
const BAND_GAP = 70;
/** Khoang ho ngang du lon de coi la sang mot COT khac trong cung dai. */
const COLUMN_GAP = 60;
/**
 * Do dai toi da cua mot TIEU DE.
 *
 * Tren cac trang bai viet, chu than bai duoc ve kha to nen bo phan loai OCR gan
 * nham gan het thanh `h3`. De nguyen thi ca bai bien thanh mot chuoi tieu de
 * hoa in dam, dai gap muoi lan binh thuong va doc khong noi. Tieu de that thi
 * ngan; cau van thi dai.
 */
const HEADING_MAX = 60;

/**
 * Day co phai mot TIEU DE that khong?
 *
 * Bo phan loai OCR gan nham kha nhieu. Hai dau hieu chac chan: tieu de thi
 * NGAN, va bat dau bang chu HOA hoac chu so. Dong bat dau bang chu thuong la
 * doan giua cau bi cat ra — nhan no lam tieu de thi doan van dut lam doi.
 */
function looksLikeHeading(text: string): boolean {
  if (text.length > HEADING_MAX) {
    return false;
  }
  const first = text.trimStart()[0] ?? "";
  return first === first.toUpperCase();
}

/**
 * Chu tren cac NUT ve san trong anh. Chung da co nut that rieng, nen o phan
 * doc khong can lap lai — ma de nguyen thi OCR con dinh ca dau ">" phia truoc.
 */
const BUTTON_WORDS = [
  "TÌM HIỂU THÊM",
  "XEM THÊM",
  "KHÁM PHÁ NGAY",
  "XEM GIẢI PHÁP",
  "XEM DỰ ÁN",
  "THAM GIA TUYỂN DỤNG",
  "TÌM KIẾM",
  "GỬI",
];

function isButtonLabel(text: string): boolean {
  const bare = text.replace(/^[>›»\s]+/, "").trim().toUpperCase();
  return BUTTON_WORDS.some((word) => bare === word || bare.startsWith(`${word} `));
}

export interface MobileBlock {
  readonly kind: "heading" | "text" | "figure";
  readonly text: string;
  /** Chi co o `figure` — anh cat tu chinh trang, xem extract-subpage-tiles.py. */
  readonly image?: string;
  /** Vi tri tren canvas goc, dung de xen anh vao dung mach doc. */
  readonly y: number;
}

interface Tile {
  readonly after: number;
  readonly src: string;
}

interface PageTiles {
  /** Anh dau trang da cat bo cot chu tua de ve san. */
  readonly hero: string | null;
  readonly tiles: readonly Tile[];
}

const TILES = (tiles as { pages: Record<string, PageTiles> }).pages;

/**
 * Rut mot doan ve dang so sanh duoc.
 *
 * Cung mot cau duoc OCR doc o hai cho khac nhau thi hay lech vai ky tu: "gồm"
 * thanh "gốm", chu "3M" thanh "ЗМ" (chu Kirin). So khit se truot het. Bo dau,
 * bo luon moi ky tu khong phai chu/so ASCII roi moi so — luc do hai ban sao
 * quy ve cung mot chuoi.
 */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Anh dau trang ban mobile — null thi dung lat nen dau tien. */
export function getMobileHero(slug: string): string | null {
  return TILES[slug]?.hero ?? null;
}

function usable(block: TextBlock, pageHeight: number): boolean {
  if (block.y < HEADER_BOTTOM) {
    return false;
  }
  if (block.y > pageHeight - FOOTER_MARGIN) {
    return false;
  }
  if (block.x >= SIDE_COLUMN && block.y < HERO_BOTTOM) {
    return false;
  }
  const text = block.text.trim();
  if (isButtonLabel(text)) {
    return false;
  }
  return text.length >= MIN_LENGTH;
}

/**
 * Chia trang thanh cac DAI theo khoang ho doc.
 *
 * Mot dai la mot lop noi dung nam ngang hang nhau — vi du mot hang the san pham.
 */
function toBands(blocks: readonly TextBlock[]): TextBlock[][] {
  const bands: TextBlock[][] = [];
  let bottom = -Infinity;

  for (const block of blocks) {
    if (bands.length === 0 || block.y - bottom > BAND_GAP) {
      bands.push([]);
      bottom = -Infinity;
    }
    bands[bands.length - 1].push(block);
    bottom = Math.max(bottom, block.y + block.h);
  }

  return bands;
}

/**
 * Chia mot dai thanh cac COT theo mep trai.
 *
 * Day la mau chot: thiet ke hay xep ba bon the canh nhau, dong thu nhat cua ca
 * bon the deu nam o cung mot y. Xep theo y roi theo x thi bon the do bi DAN XEN
 * vao nhau thanh mot doan vo nghia. Gom theo cot roi doc tung cot moi ra dung
 * thu tu nguoi ta viet.
 */
function toColumns(band: readonly TextBlock[]): TextBlock[][] {
  const byLeft = [...band].sort((a, b) => a.x - b.x);
  const columns: TextBlock[][] = [];
  let edge = -Infinity;

  for (const block of byLeft) {
    if (columns.length === 0 || block.x - edge > COLUMN_GAP) {
      columns.push([]);
    }
    columns[columns.length - 1].push(block);
    edge = Math.max(edge, block.x);
  }

  return columns.map((column) => [...column].sort((a, b) => a.y - b.y || a.x - b.x));
}

/**
 * Van ban cua trang, xep theo thu tu doc.
 *
 * Cac dong `p` lien tiep duoc noi lai thanh doan: OCR tra ve TUNG DONG, de rieng
 * thi moi dong thanh mot doan va doc rat roi.
 */
export function getMobileBlocks(page: SubPageSpec): readonly MobileBlock[] {
  const usableBlocks = [...getPageText(page.slug).blocks]
    .filter((block) => usable(block, page.height))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const columns = toBands(usableBlocks).flatMap((band) => toColumns(band));

  const out: MobileBlock[] = [];
  let buffer: string[] = [];
  let bufferY = 0;

  // OCR doc lai cung mot doan o nhieu cho (vung chong lan giua cac manh anh,
  // hoac thiet ke ve doan do hai lan). Tren desktop khung co dinh nen khong lo,
  // ban mobile de chu chay tu do thi hien ca hai ban sao lien nhau.
  const seen = new Set<string>();
  // Ban sao khong phai luc nao cung trung khit: thiet ke hay dan lai nguyen
  // doan mo ta sang mot the khac nhung BO tieu de san pham o dau. Luc do ban
  // dai CHUA ban ngan. Chi xet cac doan du dai — chuoi ngan trung nhau la
  // chuyen thuong.
  const CONTAIN_MIN = 40;
  const kept: string[] = [];

  const isDuplicate = (key: string) => {
    if (seen.has(key)) {
      return true;
    }
    return key.length >= CONTAIN_MIN && kept.some((earlier) => earlier.includes(key));
  };

  const remember = (key: string) => {
    seen.add(key);
    kept.push(key);
  };

  const flush = () => {
    if (buffer.length > 0) {
      const text = buffer.join(" ");
      const key = fold(text);
      if (!isDuplicate(key)) {
        remember(key);
        out.push({ kind: "text", text, y: bufferY });
      }
      buffer = [];
    }
  };

  for (const column of columns) {
    for (const block of column) {
      const text = block.text.trim();
      if (block.kind !== "p" && looksLikeHeading(text)) {
        flush();
        const key = fold(text);
        if (!isDuplicate(key)) {
          remember(key);
          out.push({ kind: "heading", text, y: block.y });
        }
        continue;
      }
      // OCR doi khi doc lai dung dong vua doc (vung chong lan giua cac manh anh).
      if (buffer.at(-1) === text) {
        continue;
      }
      if (buffer.length === 0) {
        bufferY = block.y;
      }
      buffer.push(text);
    }
    // Het mot cot la het mot doan — khong duoc de chu cua cot nay chay tiep
    // sang cot ben canh.
    flush();
  }

  // Xen anh vao dung cho no dung trong thiet ke. Khong co anh thi trang con
  // tren dien thoai chi la mot buc tuong chu.
  const figures: MobileBlock[] = (TILES[page.slug]?.tiles ?? []).map((tile) => ({
    kind: "figure" as const,
    text: "",
    image: tile.src,
    y: tile.after,
  }));

  return replaceStrip(page.slug, [...out, ...figures].sort((a, b) => a.y - b.y));
}

/**
 * Doi nhung manh chu OCR cua mot DAI THE lay tu du lieu the that.
 *
 * Trong thiet ke, the ngoai cung bi cat o mep canvas nen OCR chi doc duoc nua
 * cau ("...loss Series tại TC Auto bảo vệ"). Tren desktop khong sao — the do
 * von chi lo mot nua. Nhung ban mobile ve lai chu that, de nguyen thi doc ra
 * nhung manh cut ngang. Dai the do da co du lieu day du roi, dung lai no.
 */
function replaceStrip(slug: string, blocks: readonly MobileBlock[]): readonly MobileBlock[] {
  if (slug !== "giai-phap/ppf") {
    return blocks;
  }
  const { view, card, cards } = ppf as unknown as {
    view: { y: number; height: number };
    card: { height: number };
    cards: readonly { title: string; body: string | null; art: string }[];
  };
  const top = view.y - 40;
  const bottom = view.y + Math.max(view.height, card.height) + 40;
  const kept = blocks.filter((block) => block.y < top || block.y > bottom);

  const replacement: MobileBlock[] = cards.flatMap((entry, index) => [
    { kind: "figure" as const, text: "", image: entry.art, y: top + index * 4 + 1 },
    { kind: "heading" as const, text: entry.title, y: top + index * 4 + 2 },
    ...(entry.body ? [{ kind: "text" as const, text: entry.body, y: top + index * 4 + 3 }] : []),
  ]);

  return [...kept, ...replacement].sort((a, b) => a.y - b.y);
}
