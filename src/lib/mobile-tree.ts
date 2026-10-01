import { getChildren } from "./subpages";

/**
 * Mot nhanh trong cay muc luc danh cho dien thoai.
 *
 * Tren man hinh rong, canvas ve san ca so do trang con nen nguoi xem nhin mot
 * cai la biet muc nao co gi. Tren dien thoai canvas bi an di, truoc day chi
 * con mot danh sach PHANG — vao "Ứng dụng" roi thi khong the biet duoi no con
 * "Kho ứng dụng" va "Cập nhật và lỗi" neu khong bam vao tung cai.
 */
export interface TreeNode {
  readonly href: string;
  readonly label: string;
  /** Trang con truc tiep. Rong thi hang do khong co mui ten. */
  readonly children: readonly TreeNode[];
}

/**
 * Do sau toi da cua cay. Cho sau nhat trong du lieu la bon cap
 * (nhan-su/tuyen-dung/vi-tri-dang-tuyen/ky-thuat-dan-phim-va-man-hinh), nen 3
 * cap ke tu moc la du phu kin ma khong bien ngan keo thanh mot trang muc luc.
 */
const MAX_DEPTH = 3;

/** Cay trang con nam duoi mot slug. `""` cho goc. */
export function buildTree(parentSlug: string, depth: number = MAX_DEPTH): readonly TreeNode[] {
  if (depth <= 0) {
    return [];
  }
  return getChildren(parentSlug).map((page) => ({
    href: page.route,
    label: page.title,
    children: buildTree(page.slug, depth - 1),
  }));
}

/** Tong so nhanh, ke ca nhanh con — dung cho nhan "N mục". */
export function countNodes(nodes: readonly TreeNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}
