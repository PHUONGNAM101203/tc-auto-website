import { getAuthoredPage } from "./authored-pages";

/**
 * Hai tab WINCA / BRAVO tren trang "Màn hình ô tô".
 *
 * Truoc day BRAVO la mot lien ket sang trang rieng `/giai-phap/man-hinh/bravo`.
 * Khach yeu cau (01/10/2026) no phai doi NGAY TAI CHO nhu mot tab that: bam
 * BRAVO thi luoi san pham doi, khong roi trang.
 *
 * Luoi Winca duoc VE CHET trong anh nen (chi 9 nut "XEM THÊM" la phan tu that),
 * nen tab Bravo phai ve mot luoi THAT de len. Hinh hoc duoi day do thang tu
 * lat nen: tim cac vung sang (anh san pham tren nen trang) roi lay bien.
 */
export interface ScreenTabCard {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly image: string;
  readonly href: string;
}

/** Thanh tab ve san trong anh nen — hai nua bang nhau. */
export const SCREEN_TAB_BAR = { y: 878, height: 88, half: 720 } as const;

/**
 * Luoi the, he toa do canvas 1440px.
 *
 * Do duoc: anh san pham (nen trang) nam o cot x 83..435, 544..896, 1005..1357
 * va hang y 1111..1346, 1641..1876, 2171..2406. The bao ca anh lan phan chu
 * ben duoi, keo toi sat nut "XEM THÊM".
 */
export const SCREEN_GRID = {
  columns: [83, 544, 1005],
  rows: [1105, 1635, 2165],
  width: 352,
  height: 445,
  /** Phan anh san pham, tinh tu dinh the. */
  artHeight: 241,
} as const;

/** Vung phai che kin khi doi sang tab Bravo — ca ba hang the. */
export const SCREEN_GRID_COVER = {
  x: 0,
  y: 1090,
  width: 1440,
  height: 2460 - 1090,
} as const;

/** Mau nen cua trang, do thang tu lat nen o ngoai luoi. */
export const SCREEN_BACKGROUND = "#03111c";

const BRAVO_SLUG = "giai-phap/man-hinh/bravo";
const BRAVO_ROUTE = "/giai-phap/man-hinh/bravo";

interface BravoItem {
  readonly name: string;
  readonly tagline: string;
  readonly image: string;
}

/**
 * Ba dong Bravo, lay tu CHINH trang Bravo da soan — khong chep lai.
 *
 * Trang do van giu nguyen va van co day du thong so; nut "XEM THÊM" cua tung
 * the dan toi do. Doi so lieu thi chi phai sua mot cho.
 */
export function getBravoCards(): readonly ScreenTabCard[] {
  const page = getAuthoredPage(BRAVO_SLUG);
  const items = (page?.products?.items ?? []) as readonly BravoItem[];
  return items.map((item) => ({
    id: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name: item.name,
    tagline: item.tagline,
    image: item.image,
    href: BRAVO_ROUTE,
  }));
}
