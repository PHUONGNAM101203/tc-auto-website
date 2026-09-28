/**
 * Dia chi goc cho anh nen cua canvas.
 *
 * Mac dinh anh nam trong /public va duoc chinh Next phuc vu. Khi dat
 * NEXT_PUBLIC_ASSET_BASE_URL (vi du bucket Supabase Storage), toan bo anh se
 * duoc lay tu do — repo nhe di ~55MB va anh duoc phuc vu qua CDN.
 *
 * Doi qua doi lai chi bang mot bien moi truong, khong phai build lai anh.
 */
const RAW_BASE = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim() ?? "";

/** Bo dau / cuoi de noi chuoi khong bi hai dau gach. */
const BASE = RAW_BASE.replace(/\/+$/, "");

export function assetUrl(path: string): string {
  if (!BASE) {
    return path;
  }
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isRemoteAssets(): boolean {
  return BASE.length > 0;
}

/**
 * Dung cho script tai len: thu muc trong /public can dong bo.
 * Font KHONG nam trong danh sach: chung duoc nhung vao CSS bang duong dan tuyet
 * doi /fonts/... va can tai that som, de o cung domain se nhanh hon.
 */
export const ASSET_DIRS = ["slices"] as const;
