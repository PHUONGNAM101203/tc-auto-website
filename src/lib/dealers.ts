import raw from "@/data/dealers.json";

/**
 * Mang luoi dai ly — doc tu frame thiet ke trang "Mạng lưới đại lý".
 *
 * Thiet ke chi liet ke dai ly cua MOT tinh (Đà Nẵng) va MOT hang (3M) vi do la
 * trang thai duoc ve minh hoa. Cac tinh khac co trong o chon nhung chua co
 * danh sach — khi do trang bao "đang cập nhật" chu KHONG khang dinh la khong co
 * dai ly nao.
 */

export interface Dealer {
  readonly name: string;
  /** Khu vuc cu the (quan/huyen/thanh pho truc thuoc). */
  readonly area: string;
  readonly province: string;
  readonly brand: string;
}

/**
 * Dia chi duong CHINH XAC — chi cho nhung dai ly ma TC Auto co cong bo.
 *
 * Danh muc dai ly chi ghi ten va khu vuc, khong ghi so nha. Rieng hai co so
 * Thanh Binh Auto thi trang gioi thieu cua TC Auto co dia chi day du.
 */
const EXACT_ADDRESS: Readonly<Record<string, string>> = {
  "Thanh Bình Auto CMT8": "03 Cách Mạng Tháng 8, P. Hòa Cường, Đà Nẵng",
  "Thanh Bình Auto Đường 2/9": "142 Đường 2/9, P. Hải Châu, Đà Nẵng",
};

/**
 * Lien ket Google Maps cua mot dai ly.
 *
 * Dung dang TIM KIEM chu khong phai toa do: phan lon dai ly chi co ten va khu
 * vuc, dat mot cai ghim theo phong doan thi co luc ghim nham sang cho khac —
 * con tim kiem thi luon mo ra dung khu vuc va dung ten can tim.
 */
export function mapHref(dealer: Dealer): string {
  // Nhieu dai ly co khu vuc trung voi tinh (vi du "Đà Nẵng / Đà Nẵng") —
  // lap lai trong cau tim kiem chi lam nhieu.
  const place = [dealer.area, dealer.province].filter(
    (part, index, all) => all.indexOf(part) === index,
  );
  const query = EXACT_ADDRESS[dealer.name] ?? [dealer.name, ...place].join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

interface DealerData {
  readonly brands: readonly string[];
  readonly provinces: readonly string[];
  readonly mapPins: readonly string[];
  readonly dealers: readonly Dealer[];
}

const DATA = raw as unknown as DealerData;

export const BRANDS = DATA.brands;
export const PROVINCES = DATA.provinces;
export const MAP_PINS = DATA.mapPins;

export interface DealerQuery {
  readonly brand: string;
  readonly province: string;
}

export interface DealerResult {
  readonly dealers: readonly Dealer[];
  /** true khi tinh do chua co du lieu trong thiet ke — khac voi "khong co dai ly". */
  readonly pending: boolean;
}

export function findDealers({ brand, province }: DealerQuery): DealerResult {
  if (!brand || !province) {
    return { dealers: [], pending: false };
  }

  const dealers = DATA.dealers.filter(
    (dealer) => dealer.brand === brand && dealer.province === province,
  );

  return { dealers, pending: dealers.length === 0 };
}

export function countByProvince(): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const dealer of DATA.dealers) {
    counts.set(dealer.province, (counts.get(dealer.province) ?? 0) + 1);
  }
  return counts;
}

export function totalDealers(): number {
  return DATA.dealers.length;
}
