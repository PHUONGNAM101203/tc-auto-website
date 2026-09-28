import raw from "@/data/solution-cards.json";

/**
 * Dai the muc "Giải pháp" tren trang chu.
 *
 * Thiet ke ve chet dai the vao anh, the thu 4 bi cat o mep canvas va co mot mui
 * ten trang bao "con nua". Muon mui ten do bam duoc thi dai the phai la phan tu
 * that — xem tools/brand/extract-solution-cards.py.
 *
 * Moi con so o day deu do tu chinh ban thiet ke. So buoc truot KHONG viet cung:
 * no tinh tu so the co that, them the la tu co them buoc.
 */

export interface SolutionCard {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly href: string;
  readonly src: string;
  /**
   * The nay bi cat o mep canvas nen trong anh khong co chu; chu duoc ve bang
   * CSS. Ba the kia giu nguyen chu da ve san trong anh.
   */
  readonly labelInCss: boolean;
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Raw {
  readonly view: Box;
  readonly card: { readonly width: number; readonly height: number };
  readonly pitch: number;
  readonly arrow: Box;
  readonly cards: readonly SolutionCard[];
}

const DATA = raw as unknown as Raw;

export const SOLUTION_VIEW = DATA.view;
export const SOLUTION_CARD = DATA.card;
export const SOLUTION_PITCH = DATA.pitch;
export const SOLUTION_ARROW = DATA.arrow;
export const SOLUTION_CARDS = DATA.cards;

/** Be rong that cua ca dai: n the dat cach nhau `pitch`. */
export function stripWidth(count: number = SOLUTION_CARDS.length): number {
  return count <= 0 ? 0 : (count - 1) * SOLUTION_PITCH + SOLUTION_CARD.width;
}

/**
 * So the CHO NHIEU NHAT ma khung nhin co the lo ra cung luc.
 *
 * Dung de biet phai lap lai danh sach bao nhieu lan thi dai khong bao gio ho
 * khoang trong khi chay vong.
 */
export function visibleCount(): number {
  return Math.ceil(SOLUTION_VIEW.width / SOLUTION_PITCH) + 1;
}

/**
 * Danh sach the DA LAP LAI du de chay vong khong ho.
 *
 * Dai chay mai sang trai. Sau moi nhip the ngoai cung ben trai bien mat, nen
 * neu chi co dung n the thi toi nhip thu n khung nhin se trong tron. Lap lai
 * danh sach du so lan la vi tri nhip 0 va nhip n TRUNG KHIT nhau — luc do chi
 * viec dat lai ve 0 (tat hoat anh trong dung mot khung hinh) la vong lai lien
 * mach, mat khong thay cho noi.
 */
export function repeatedCards(): readonly (SolutionCard & { key: string })[] {
  const count = SOLUTION_CARDS.length;
  // Du the cho mot TRANG BAM LIEN TUC. Dai chi duoc dat lai ve dau khi hoat
  // anh dung han; neu nguoi dung bam nhanh hon thoi gian truot, nhip cu tang
  // ma chua kip dat lai — het the thi dai ho ra mot mang trong. Bon the that
  // nen ra 64 the vẫn khong dang ke, ma du cho hang chuc nhip lien tiep.
  const copies = Math.max(
    BURST_COPIES,
    Math.ceil((count + visibleCount()) / count),
  );
  return Array.from({ length: copies * count }, (_, index) => ({
    ...SOLUTION_CARDS[index % count],
    key: `${SOLUTION_CARDS[index % count].id}-${Math.floor(index / count)}`,
  }));
}

/** So ban sao danh sach the, du cho mot trang bam lien tuc khong ho. */
const BURST_COPIES = 16;

/** Do truot ung voi nhip thu `step`. Moi nhip la dung mot the. */
export function offsetAt(step: number): number {
  return step * SOLUTION_PITCH;
}

/**
 * Nhip ma tai do dai da chay tron mot vong va trung khit lai voi nhip 0.
 * Toi nhip nay thi dat lai ve 0 ma khong hoat anh.
 */
export const LOOP_STEP = SOLUTION_CARDS.length;

/**
 * Do dam cua mot the khi dai da truot qua no.
 *
 * The bi keo ra khoi mep TRAI cua khung nhin thi mo dan cho toi khi khuat han,
 * thay vi bi cat cut dot ngot — dung y "thu ve trai la no se mo dan mo dan toi
 * het thi thoi".
 *
 * @param index  thu tu the trong dai da lap lai
 * @param offset do dai da truot sang trai
 */
export function cardOpacity(index: number, offset: number): number {
  const left = index * SOLUTION_PITCH - offset;
  if (left >= 0) {
    return 1;
  }
  // left am dan tu 0 toi -width khi the truot han ra ngoai.
  return Math.min(1, Math.max(0, 1 + left / SOLUTION_CARD.width));
}
