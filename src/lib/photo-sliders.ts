import data from "@/data/photo-sliders.json";

/**
 * Cac slider anh duoc ve chet trong ban thiet ke.
 *
 * Thiet ke ve mot tam anh kem mui ten "›" — y la con anh nua, keo di. Muon mui
 * ten do bam duoc thi vung anh phai la phan tu that.
 *
 * Slide DAU duoc cat tu chinh ban thiet ke nen luc dung yen man hinh trung khop
 * tuyet doi; cac slide sau lay tu bo tai nguyen roi. Xem
 * tools/brand/extract-photo-sliders.py.
 */

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Do xoe cua chong anh: moi tang lui lai thi dich bao nhieu, mo di bao nhieu. */
export interface DeckStep {
  readonly x: number;
  readonly y: number;
  readonly fade: number;
}

/**
 * Bac thang mac dinh cua chong anh, do tu chinh ban thiet ke.
 *
 * Tren trang chu: the truoc co mep phai o x = 1334, ca chong lan toi x = 1374,
 * mep tren tu 2976 len 2936 — hai tang, moi tang 20px sang phai va 20px len
 * tren. Hai chong con lai cung mot kieu xoe.
 */
export const DECK_STEP: DeckStep = { x: 20, y: -20, fade: 0.42 };

export interface PhotoSlider {
  readonly id: string;
  readonly label: string;
  readonly box: Box;
  /** Mui ten TIEN ve san trong anh — ta dat mot nut that dung cho do. */
  readonly arrow: Box;
  /** Mui ten LUI, neu thiet ke co ve (vi du muc "Con người TC"). */
  readonly prev?: Box;
  readonly slides: readonly string[];
  /** Rieng chong nay xoe khac mac dinh thi khai o day. */
  readonly deck?: DeckStep;
}

const PAGES = (data as unknown as { pages: Record<string, readonly PhotoSlider[]> }).pages;

export function getPhotoSliders(slug: string): readonly PhotoSlider[] {
  return PAGES[slug] ?? [];
}

/** Slide ke tiep — chay vong, khong bao gio het. */
export function nextSlide(index: number, count: number): number {
  return count <= 0 ? 0 : (index + 1) % count;
}

/** Slide truoc do — cung chay vong. */
export function prevSlide(index: number, count: number): number {
  return count <= 0 ? 0 : (index - 1 + count) % count;
}
