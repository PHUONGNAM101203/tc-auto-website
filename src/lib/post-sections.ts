import subpageText from "@/data/subpage-text.json";
import { getSubPage } from "./subpages";

/**
 * Nhung trang CO O CHO BAI VIET.
 *
 * ── Vi sao can danh sach nay ───────────────────────────────────────────────
 * Bai viet trong quan tri co mot truong `section`; o nao trong thiet ke de
 * tieu de mau "TÊN BÀI VIẾT" thi duoc lap bang bai co `section` trung voi slug
 * trang do (xem `listPublishedPosts` trong posts.ts, goi tu
 * src/app/(site)/[...slug]/page.tsx).
 *
 * Truoc day o quan tri day la mot O NHAP CHU TRONG, kem mot dong goi y duy
 * nhat. Nguoi dung phai nho chinh xac "cong-nghe/tien-phong-cong-nghe/bai-viet"
 * — go sai mot dau gach la bai bien mat khong bao loi, vi khong cho nao doi
 * chieu. Nay o do la mot DANH SACH CHON, va danh sach duoc SINH RA tu chinh
 * van ban thiet ke chu khong chep tay, nen them trang moi la no tu co.
 *
 * Dem truc tiep chuoi "TÊN BÀI VIẾT" trong van ban da trich cua tung trang con:
 * do dung la o ma thiet ke chua co noi dung that.
 */
const PLACEHOLDER = "TÊN BÀI VIẾT";

export interface PostSection {
  readonly slug: string;
  /** Ten trang, de nguoi dung nhan ra — khong phai slug. */
  readonly label: string;
  /** Co bao nhieu o dang cho bai viet tren trang do. */
  readonly slots: number;
}

interface TextEntry {
  readonly plain?: string;
}

function countSlots(plain: string): number {
  return plain.split(PLACEHOLDER).length - 1;
}

export function getPostSections(): readonly PostSection[] {
  const entries = Object.entries(subpageText as Record<string, TextEntry>);
  const out: PostSection[] = [];

  for (const [slug, entry] of entries) {
    const slots = countSlots(entry.plain ?? "");
    if (slots === 0) {
      continue;
    }
    const page = getSubPage(slug);
    out.push({
      slug,
      label: page ? page.title : slug,
      slots,
    });
  }

  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}
