/**
 * Mot DAI anh co nen tu in tieu de cua no khong?
 *
 * Mot so dai da co san tieu de trong mach chu cua trang: "CÁC DỰ ÁN ĐÃ TRIỂN
 * KHAI" la mot muc chu tren trang Giai phap, "CÁC BÀI VIẾT KHÁC" la mot the h2
 * trong bai viet. Dai tu in them nhan cua no thi nguoi doc thay hai lan, chi
 * khac moi chu hoa chu thuong.
 *
 * So sanh sau khi bo dau, bo dau cau va dua ve chu thuong — hai ben lay tu hai
 * nguon khac nhau nen khong bao gio trung nhau tung ky tu.
 */
export function normalise(text: string): string {
  return text
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

export function headingAlreadyShown(
  label: string,
  shown: readonly string[],
): boolean {
  const want = normalise(label);
  if (!want) {
    return true;
  }
  return shown.some((text) => normalise(text) === want);
}
