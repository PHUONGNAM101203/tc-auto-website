import data from "@/data/related-strip.json";

/**
 * Dai the "CAC BAI VIET KHAC" o cuoi trang bai viet.
 *
 * Trong thiet ke day la mot HANG TRAN NGANG: the giua nam tron ven, hai the
 * hai ben bi cat o mep canvas — y la con nua, keo di. Khach muon no tu cuon
 * ngang, nen dai duoc dung lai bang phan tu that: anh lay tu bo tai nguyen
 * (ban nguyen ven, khong bi cat), xep thanh mot vong chay lien tuc.
 *
 * Dai KHONG xoa gi khoi anh nen — no PHU LEN bang mot lop mau nen dac. Lam vay
 * de con lui lai duoc: chi can bo trang khoi `pages` la moi thu ve nhu cu,
 * khong phai dung lai anh.
 */

export interface RelatedCard {
  readonly id: string;
  readonly src: string;
  /** De trong thi khong ve phan chu — xem `_doc_title` trong tep JSON. */
  readonly title: string;
  readonly href: string | null;
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Data {
  readonly box: Box;
  readonly padTop: number;
  readonly titleGap: number;
  readonly card: {
    readonly width: number;
    readonly height: number;
    readonly gap: number;
  };
  readonly background: string;
  readonly cards: readonly RelatedCard[];
  readonly pages: readonly string[];
}

const DATA = data as unknown as Data;

export const RELATED_BOX = DATA.box;
export const RELATED_CARD = DATA.card;
export const RELATED_BACKGROUND = DATA.background;
export const RELATED_CARDS = DATA.cards;
/** Chua tren de anh the roi dung cho thiet ke ve (y=2791). */
export const RELATED_PAD_TOP = DATA.padTop;
/** Khoang cach tu day anh xuong tieu de (thiet ke: y=3220). */
export const RELATED_TITLE_GAP = DATA.titleGap;

/** Buoc lap: be ngang mot the cong khoang ho. */
export const RELATED_PITCH = RELATED_CARD.width + RELATED_CARD.gap;

/** Trang nay co dai the khong? */
export function hasRelatedStrip(slug: string): boolean {
  return DATA.pages.includes(slug);
}

/**
 * So ban sao danh sach the de dai KHONG BAO GIO ho khoang trong.
 *
 * Vong chay bang cach dich trai dung MOT chu ky roi nhay ve 0. Muon khong thay
 * mep thi be ngang tong phai phu het khung nhin CONG them mot chu ky.
 */
export function repeatCount(viewWidth: number): number {
  const perLap = RELATED_CARDS.length * RELATED_PITCH;
  return Math.max(2, Math.ceil(viewWidth / perLap) + 1);
}

/** Danh sach the da lap, moi ban sao mot khoa rieng. */
export function repeatedCards(
  viewWidth: number,
): readonly (RelatedCard & { readonly key: string })[] {
  const copies = repeatCount(viewWidth);
  return Array.from({ length: copies * RELATED_CARDS.length }, (_, index) => {
    const card = RELATED_CARDS[index % RELATED_CARDS.length];
    return { ...card, key: `${card.id}-${index}` };
  });
}
