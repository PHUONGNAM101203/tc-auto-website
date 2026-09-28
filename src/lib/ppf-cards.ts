import raw from "@/data/ppf-cards.json";

/**
 * Dai the "3M PPF" tren /giai-phap/ppf.
 *
 * Thiet ke ve chet bon the vao anh, hai the ngoai cung tho ra khoi hai mep
 * canvas kem mot mui ten moi ben — y la "con nua, keo di". Muon hai mui ten do
 * bam duoc thi dai the phai la phan tu that; xem tools/brand/extract-ppf-cards.py.
 *
 * Moi con so o day deu do tu chinh ban thiet ke.
 */

export interface PpfCard {
  readonly id: string;
  readonly title: string;
  /** Chi co o the bi cat — the con nguyen giu chu da ve san trong anh. */
  readonly body: string | null;
  readonly src: string;
  /** Rieng phan anh minh hoa o dau the — ban mobile dung cai nay. */
  readonly art: string;
  readonly labelInCss: boolean;
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Layout {
  readonly padding: number;
  readonly paddingRight: number;
  readonly title: { readonly top: number; readonly fontSize: number; readonly lineHeight: number };
  readonly body: { readonly top: number; readonly fontSize: number; readonly lineHeight: number };
  readonly button: Box;
}

interface Raw {
  readonly view: Box;
  readonly card: { readonly width: number; readonly height: number };
  readonly pitch: number;
  readonly firstX: number;
  readonly arrows: { readonly prev: Box; readonly next: Box };
  readonly layout: Layout;
  readonly cards: readonly PpfCard[];
}

const DATA = raw as unknown as Raw;

export const PPF_VIEW = DATA.view;
export const PPF_CARD = DATA.card;
export const PPF_PITCH = DATA.pitch;
export const PPF_FIRST_X = DATA.firstX;
export const PPF_ARROWS = DATA.arrows;
export const PPF_LAYOUT = DATA.layout;
export const PPF_CARDS = DATA.cards;

/** Duong dan trang chi tiet cua mot the. Chua co trang rieng — ve muc PPF. */
export const PPF_HREF = "/giai-phap/ppf";

/**
 * So the CHO NHIEU NHAT lo ra cung luc trong khung nhin.
 *
 * Dung de biet phai lap danh sach bao nhieu lan thi dai khong bao gio ho khoang
 * trong khi chay vong.
 */
export function visibleCount(): number {
  return Math.ceil(PPF_VIEW.width / PPF_PITCH) + 2;
}

/**
 * Danh sach the DA LAP LAI du de chay vong ca hai chieu ma khong ho.
 *
 * Dai chay duoc sang ca hai ben nen phai co du the o CA HAI phia vi tri goc.
 */
export function repeatedCards(): readonly (PpfCard & { readonly key: string })[] {
  // Du the cho mot trang bam lien tuc ca hai chieu: dai chi duoc dat lai khi
  // hoat anh dung han, bam nhanh hon the thi nhip cu tang ma chua kip dat lai.
  const copies = Math.max(BURST_COPIES, Math.ceil(visibleCount() / PPF_CARDS.length) + 2);
  return Array.from({ length: copies * PPF_CARDS.length }, (_, index) => {
    const card = PPF_CARDS[index % PPF_CARDS.length];
    return { ...card, key: `${card.id}-${index}` };
  });
}

/** So ban sao danh sach the, du cho mot trang bam lien tuc khong ho. */
const BURST_COPIES = 12;

/** So nhip de dai lap lai trung khit voi chinh no — moc de dat lai vi tri. */
export const PPF_LOOP_STEP = PPF_CARDS.length;

/** Vi tri the dau tien cua dai da lap, sao cho nhip 0 trung khop thiet ke. */
export function stripOriginX(): number {
  const lead = Math.floor(repeatedCards().length / PPF_CARDS.length / 2) * PPF_CARDS.length;
  return PPF_FIRST_X - lead * PPF_PITCH;
}

/** Do doi vi tri cua dai o mot nhip. Nhip duong = keo sang trai. */
export function offsetAt(step: number): number {
  return -step * PPF_PITCH;
}
