import data from "@/data/screen-catalogue.json";

/**
 * Danh muc man hinh o to.
 *
 * Bo thiet ke chi ve chin mau; trang hang niem yet nhieu hon han. Khach yeu
 * cau dua day du len va cho LOC duoc theo thu khach hay tim (01/10/2026).
 *
 * Nguyen tac chep so lieu giong het product-specs.ts: cho nao trang hang
 * khong neu thi ghi thang "Hãng chưa công bố" chu khong suy tu dong khac.
 */

export interface ScreenModel {
  readonly slug: string;
  readonly name: string;
  readonly brand: string;
  /** Dong may: S150, S170, S200, S300, S400, Bravo. */
  readonly family: string;
  readonly size: string;
  readonly resolution: string;
  readonly android: string;
  readonly cpu: string;
  readonly ram: string;
  readonly rom: string;
  readonly audio: string;
  readonly camera: string;
  /** Trang cua hang, de kiem lai so lieu. */
  readonly source: string;
  /** Trang chi tiet tren site nay, neu co. */
  readonly route?: string;
  /** Noi ro cho nao hang chua cong bo. */
  readonly note?: string;
}

const MODELS = (data as unknown as { models: readonly ScreenModel[] }).models;

export function getScreenModels(): readonly ScreenModel[] {
  return MODELS;
}

/** Mau nay co camera 360 khong — suy tu chinh dong mo ta camera. */
export function has360(model: ScreenModel): boolean {
  return model.camera.includes("360");
}

/** Mau nay co man 2K khong. */
export function is2K(model: ScreenModel): boolean {
  return /2K|1920 × 1200/.test(model.resolution);
}

/**
 * Cac gia tri co that trong danh muc, de dung lam bo loc.
 *
 * Sinh TU DU LIEU chu khong go tay: them mau moi la bo loc tu co them lua
 * chon, khong phai nho sua hai cho.
 */
export function filterOptions() {
  const uniq = (list: readonly string[]) => [...new Set(list)];
  return {
    brands: uniq(MODELS.map((m) => m.brand)),
    families: uniq(MODELS.map((m) => m.family)),
    sizes: uniq(MODELS.map((m) => m.size)),
  };
}
