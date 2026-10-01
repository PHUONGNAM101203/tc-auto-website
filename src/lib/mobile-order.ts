/**
 * Tron cac khoi cua ban dien thoai theo DO CAO tren canvas desktop.
 *
 * Ban mobile khong phai canvas thu nho, nhung thu tu doc thi phai giong — moi
 * khoi deu biet no nam o do cao nao tren ban 1440px, nen tron hai danh sach
 * roi xep theo `y` la ra dung mach cua ban desktop, khong phai xep tay va
 * khong lo lech khi thiet ke doi.
 *
 * Tach rieng ra day vi ca `MobilePage` lan `MobileSubPage` deu can, va vi cho
 * nay phai kiem duoc bang du lieu dung san: hien tai ca hai dai anh deu TINH
 * CO nam cuoi trang cua chung, nen nhin DOM thi "tron theo do cao" va "nhet
 * xuong cuoi" cho ra ket qua y het nhau — mot bai kiem tren trinh duyet khong
 * phan biet duoc hai cai do.
 */
export interface Placed<T> {
  readonly y: number;
  readonly item: T;
}

/**
 * Xep on dinh theo `y`: hai khoi cung do cao thi giu nguyen thu tu dua vao.
 *
 * `Array.prototype.sort` cua JS da on dinh tu ES2019, nhung cho nay phu thuoc
 * vao tinh chat do nen noi ro — co nhung khoi chu cung mot `y` (do dong chu
 * tren canvas nam ngang hang nhau), dao chung len la cau van dut doan.
 */
export function mergeByY<T>(...groups: readonly (readonly Placed<T>[])[]): readonly T[] {
  return groups
    .flat()
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.y - b.entry.y || a.index - b.index)
    .map((row) => row.entry.item);
}
