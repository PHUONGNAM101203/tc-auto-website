/**
 * Nhung trang co O TIM KIEM DA VE SAN trong anh nen.
 *
 * Binh thuong o tim kiem tren header la phan tu that va anh nen khong co gi o
 * cho do. RIENG trang Cong nghe: ban prototype export ra mot MANG TOI dac thay
 * cho o tim kiem, nen `tools/patch-from-design.py` va lai vung do bang dung
 * pixel cua ban thiet ke — ma pixel do gom CA khung, kinh lup va dong chu
 * "Nhập để tìm kiếm...".
 *
 * Hau qua: o that ve de len o da ve san, thanh ra chu bi nhan doi, lech nhau
 * vai pixel. Prototype cung bi y het nen gate so pixel khong bat duoc — no
 * dang so mot ban loi voi chinh ban loi do.
 *
 * Chua bang cach cho o that TRONG SUOT luc nghi tren nhung trang nay (giong
 * lop ghost cua 31 trang con), chi hien ra khi bam vao de go.
 *
 * BO SLUG KHOI DAY khi prototype duoc export lai dung — luc do anh nen se
 * khong con o tim kiem ve san nua.
 */
/**
 * DA RONG tu 30/09/2026: o tim kiem ve san tren trang Cong nghe da duoc xoa
 * khoi lat nen (tools/scrub-nav.py), nen ca 37 trang deu ve o that va trong
 * giong het nhau — dung yeu cau cua khach.
 *
 * Giu lai co nay de neu ban export prototype sau lai nuong o tim kiem vao anh
 * o trang khac thi chi can them slug vao day.
 */
export const SEARCH_BAKED_PAGES: ReadonlySet<string> = new Set<string>();

export function isSearchBaked(slug: string): boolean {
  return SEARCH_BAKED_PAGES.has(slug);
}
