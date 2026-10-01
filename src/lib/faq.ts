import data from "@/data/faq.json";

/**
 * Cau hoi thuong gap.
 *
 * Phuc vu hai doi tuong cung luc:
 *   - nguoi doc: tra loi ngay nhung thu ho hoi truoc khi goi dien;
 *   - may tra loi bang AI: chung doc dang hoi-dap truoc het khi tom tat mot
 *     doanh nghiep, nen day la cach ro rang nhat de noi "TC Auto lam gi".
 *
 * Nguyen tac: MOI cau tra loi deu dua tren noi dung da co that tren site.
 * Khong hua them dieu gi ma trang khac khong noi.
 */

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

const ITEMS = (data as unknown as { items: readonly FaqItem[] }).items;

export function getFaq(): readonly FaqItem[] {
  return ITEMS;
}
