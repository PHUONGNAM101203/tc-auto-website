import { getCtaSpots } from "./cta-links";
import { getHotspots } from "./hotspots";

/**
 * Cac lien ket cua mot trang con, gom lai cho BAN DIEN THOAI.
 *
 * ── Vi sao ──────────────────────────────────────────────────────────────────
 * Tren desktop, moi lien ket trong long trang con deu la mot VUNG BAM TRONG
 * SUOT dat theo toa do canvas 1440px: nut "TẢI VỀ", nut "XEM THÊM", the san
 * pham, tab WINCA/BRAVO. Duoi 900px canvas bi an di han — nen tren dien thoai
 * khong con mot cai nao trong so do.
 *
 * Hau qua do duoc: trang "Kho ứng dụng" co 15 tep tai tren desktop va 0 tren
 * dien thoai. Nguoi dung dien thoai doc duoc bai nhung khong bam di dau duoc.
 *
 * Bo nay gom tat ca lai thanh mot danh sach de MobileSubPage ve ra thanh cac
 * dong bam duoc. Lay tu CHINH hai nguon cua ban desktop nen hai ban khong bao
 * gio lech nhau.
 */

export interface MobileLink {
  readonly href: string;
  readonly label: string;
  /** Dan ra ngoai site — mo tab moi. */
  readonly external: boolean;
}

/** Bo tien to trang thai va chu "Tải về"/"Xem chi tiết" cho nhan gon. */
function tidy(label: string): string {
  return label.replace(/\s+/g, " ").trim();
}

export function getMobileLinks(slug: string): readonly MobileLink[] {
  const seen = new Set<string>();
  const out: MobileLink[] = [];

  const add = (href: string, label: string, external = false) => {
    const key = `${href}|${label}`;
    if (!href || seen.has(key)) {
      return;
    }
    seen.add(key);
    out.push({ href, label: tidy(label), external });
  };

  for (const spot of getHotspots(slug)) {
    add(spot.href, spot.label, Boolean(spot.external));
  }
  for (const spot of getCtaSpots(slug)) {
    if (spot.href) {
      add(spot.href, spot.heading || "Xem chi tiết");
    }
  }

  return out;
}
