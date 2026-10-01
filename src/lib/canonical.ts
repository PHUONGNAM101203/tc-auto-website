/**
 * Trang nao la BAN CHINH khi hai duong dan cung mot noi dung.
 *
 * Bo thiet ke co nhung bai duoc dat o hai muc khac nhau. Do chung tren ban
 * dung that (01/10/2026): `/dai-ly/chan-dung-dai-ly/dai-ly-winca-pham-gia-auto`
 * va `/giai-phap/du-an/dai-ly-winca-pham-gia-auto` co **cung tieu de, cung mo
 * ta, va 36 trong 38 khoi chu giong het nhau** — chi khac phan duoi trang.
 *
 * Voi cong cu tim kiem thi do la NOI DUNG TRUNG LAP: hai duong dan tranh nhau
 * cung mot truy van, Google tu chon mot cai va cai kia phi cong thu thap.
 *
 * Cach xu ly o day la cach chuan: GIU ca hai duong dan (moi cai van la loi vao
 * hop le tu muc cha cua no), nhung khai `<link rel="canonical">` cua ban phu
 * tro ve ban chinh, VA bo ban phu khoi `sitemap.xml` — liet ke mot trang roi
 * lai bao no khong phai ban chinh la gui tin hieu mau thuan.
 *
 * KHONG dung chuyen huong: nguoi doc dang o muc "Dự án" ma bi day sang muc
 * "Đại lý" thi mat mach doc, va duong dan breadcrumb cung sai theo.
 */
export const CANONICAL_OF: Readonly<Record<string, string>> = {
  // Bai chan dung dai ly Pham Gia Auto. Ban o "Chân dung đại lý" day du hon
  // (cao 5042 so voi 4739) va dung chu de hon, nen no la ban chinh.
  "giai-phap/du-an/dai-ly-winca-pham-gia-auto":
    "dai-ly/chan-dung-dai-ly/dai-ly-winca-pham-gia-auto",
};

/** Duong dan chinh thuc cua mot slug — chinh no, tru khi co khai o tren. */
export function canonicalRouteOf(slug: string, fallback: string): string {
  const target = CANONICAL_OF[slug];
  return target ? `/${target}` : fallback;
}

/** Trang nay co phai ban phu cua mot trang khac khong? */
export function isDuplicateOfAnother(slug: string): boolean {
  return slug in CANONICAL_OF;
}
