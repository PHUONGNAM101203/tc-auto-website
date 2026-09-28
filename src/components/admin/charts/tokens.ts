import type { LeadStatus } from "@/lib/types";

/**
 * Token mau cho bieu do trong admin.
 *
 * Admin chi co MOT che do (dark) nen palette duoc chon rieng cho be mat toi
 * #121927 — khong phai lat nguoc tu palette sang.
 *
 * Da xac thuc bang scripts/validate_palette.js cua skill dataviz:
 *   node validate_palette.js "#7A62DE,#1E9BC2,#BE8311,#37A663,#B93A54" \
 *     --mode dark --surface "#121927"
 *   -> Lightness band PASS · Chroma floor PASS · Normal-vision floor PASS (17.1)
 *      Contrast vs surface PASS · CVD separation WARN (7.8 deutan, dai 6-8)
 *
 * WARN o dai 6-8 CHI hop le khi co ma hoa phu. O day moi trang thai luon di kem
 * NHAN CHU truc tiep (StatusBreakdown) nen dieu kien duoc thoa man — khong duoc
 * bo nhan chu khoi cac bieu do dung palette nay.
 */
export const CHART_SURFACE = "#121927";

/** Mau mot chuoi don (chuoi thoi gian, top trang). Da xac thuc: moi check PASS. */
export const SERIES_HUE = "#2E9FD4";

/** Thu tu CO DINH theo tien trinh cua lead — khong bao gio xoay vong hay sap lai. */
export const STATUS_ORDER: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
];

export const STATUS_HUE: Readonly<Record<LeadStatus, string>> = {
  new: "#7A62DE",
  contacted: "#1E9BC2",
  qualified: "#BE8311",
  won: "#37A663",
  lost: "#B93A54",
};

/** Mau chu — KHONG BAO GIO dung mau chuoi du lieu lam mau chu. */
export const INK = {
  primary: "rgba(255,255,255,0.92)",
  secondary: "rgba(255,255,255,0.58)",
  muted: "rgba(255,255,255,0.38)",
  grid: "rgba(255,255,255,0.08)",
} as const;

/**
 * Nhan truc x dang "DD/MM".
 * Dinh dang thu cong chu khong dung Intl: ban ICU cua Node/trinh duyet co the
 * tra ve "09-03" cho vi-VN, lam nhan truc doi tuy moi truong.
 */
export function dayLabel(iso: string): string {
  const at = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(at.getTime())) {
    return iso;
  }
  const day = String(at.getDate()).padStart(2, "0");
  const month = String(at.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

/**
 * Lam gon so lon cho hero figure / stat tile: 1.284 -> "1.284", 12900 -> "12,9K".
 * Dung font figure ti le (khong tabular) cho so lon — xem marks-and-anatomy.
 */
export function compactNumber(value: number): string {
  if (value < 10_000) {
    return new Intl.NumberFormat("vi-VN").format(value);
  }
  if (value < 1_000_000) {
    return `${(value / 1000).toFixed(1).replace(".", ",")}K`;
  }
  return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
}

/** Lam tron tran truc y len so "dep" (1, 2, 5 x 10^n) de tick de doc. */
export function niceCeiling(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * magnitude;
    if (candidate >= value) {
      return candidate;
    }
  }
  return 10 * magnitude;
}
