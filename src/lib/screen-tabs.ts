import data from "@/data/bravo-models.json";
import { assetUrl } from "./asset-url";

/**
 * Hai tab WINCA / BRAVO tren trang "Màn hình ô tô".
 *
 * Truoc day BRAVO la mot lien ket sang trang rieng. Khach yeu cau (01/10/2026)
 * no phai doi NGAY TAI CHO nhu mot tab that, va sau do (02/10/2026) bo han
 * trang rieng di: Bravo chi la mot tab, con tung dong thi co trang san pham
 * cua rieng no.
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

/**
 * Vung phai che kin khi doi sang tab Bravo — CA BA hang the.
 *
 * Day o 2750 chu khong phai 2460: hang the thu ba keo toi 2616, va ngay duoi
 * no la THANH PHAN TRANG ve san trong anh (2688..2744). Thanh phan trang that
 * da duoc an o tab Bravo — ba dong thi khong co trang nao de lat — nhung cai
 * ve chet thi van hien, lo ra hai vach mo. Lay 2460 thi lo ca 156px cuoi cua
 * ba tam Winca; lay 2640 thi het the nhung con hai vach do.
 *
 * 2750 dung ngay truoc nut "XEM TẤT CẢ … MẪU MÀN HÌNH" (2758) — nut do liet
 * ke ca Winca lan Bravo nen phai giu lai o ca hai tab.
 */
export const SCREEN_GRID_COVER = {
  x: 0,
  y: 1090,
  width: 1440,
  height: 2750 - 1090,
} as const;

/** Mau nen cua trang, do thang tu lat nen o ngoai luoi. */
export const SCREEN_BACKGROUND = "#03111c";

/** Doan gioi thieu va cac muc chu cua tab Bravo. */
export interface BravoCopy {
  readonly heading: string;
  readonly lead: string;
  readonly intro: string;
  readonly blocks: readonly {
    readonly heading: string;
    readonly paragraphs: readonly string[];
  }[];
  readonly pending: { readonly heading: string; readonly items: readonly string[] };
}

interface BravoModel {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly image: string;
}

const BRAVO = data as unknown as BravoCopy & { readonly models: readonly BravoModel[] };

/**
 * Ba dong Bravo, lay tu `src/data/bravo-models.json`.
 *
 * Moi dong co mot TRANG SAN PHAM that o `/giai-phap/man-hinh/<slug>`, dung nhu
 * chin dong Winca — xem tools/brand/add-bravo-products.py. Truoc day chung chi
 * tro chung toi mot trang Bravo gop, ma trang do khach da yeu cau bo
 * (02/10/2026).
 */
export function getBravoCards(): readonly ScreenTabCard[] {
  return BRAVO.models.map((model) => ({
    id: model.slug,
    name: model.name,
    tagline: model.tagline,
    image: assetUrl(model.image),
    href: `/giai-phap/man-hinh/${model.slug}`,
  }));
}

/** Phan chu cua tab Bravo — truoc day nam tren trang rieng da bo. */
export function getBravoCopy(): BravoCopy {
  const { heading, lead, intro, blocks, pending } = BRAVO;
  return { heading, lead, intro, blocks, pending };
}
