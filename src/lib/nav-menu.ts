/**
 * Danh sach trang con xo xuong khi ro chuot vao mot muc tren thanh dieu huong.
 *
 * Thu tu o day la THU TU CUA NHA THIET KE, doc tu cach danh so thu muc trong
 * bo tai nguyen (1.1 Hanh trinh, 1.2 Ban sac, 1.3 Khoanh khac, 1.4 Phong cach
 * song...). CO Y khong sinh tu dong tu `getAllSubPages()`: ham do tra ve theo
 * thu tu chu cai, ma theo chu cai thi "Cac du an" nhay len dau muc Giai phap
 * trong khi thiet ke xep no cuoi cung.
 *
 * Nhan o day viet HOA va NGAN hon tieu de trang (vi du "CAC DU AN" thay vi
 * "Cac du an da trien khai") cho vua be ngang cua bang xo xuong.
 *
 * Duong dan duoc test doi chieu voi trang co that — xem tests/unit/nav-menu.test.ts.
 */

export interface SubmenuEntry {
  readonly label: string;
  readonly href: string;
}

export const NAV_SUBMENU: Readonly<Record<string, readonly SubmenuEntry[]>> = {
  "/trai-nghiem": [
    { label: "HÀNH TRÌNH", href: "/trai-nghiem/hanh-trinh" },
    { label: "BẢN SẮC RIÊNG", href: "/trai-nghiem/ban-sac-rieng" },
    { label: "KHOẢNH KHẮC", href: "/trai-nghiem/khoanh-khac" },
    { label: "PHONG CÁCH SỐNG", href: "/trai-nghiem/phong-cach-song" },
  ],
  "/giai-phap": [
    { label: "MÀN HÌNH", href: "/giai-phap/man-hinh" },
    { label: "PHIM DÁN KÍNH", href: "/giai-phap/phim-dan-kinh" },
    { label: "PPF", href: "/giai-phap/ppf" },
    { label: "LOA NỘI THẤT", href: "/giai-phap/loa" },
    { label: "CÁC DỰ ÁN", href: "/giai-phap/du-an" },
  ],
  "/cong-nghe": [
    { label: "TIÊN PHONG CÔNG NGHỆ", href: "/cong-nghe/tien-phong-cong-nghe" },
    { label: "ỨNG DỤNG", href: "/cong-nghe/ung-dung" },
  ],
  "/dai-ly": [
    { label: "MẠNG LƯỚI ĐẠI LÝ", href: "/dai-ly/mang-luoi-dai-ly" },
    { label: "CÂU CHUYỆN ĐỒNG HÀNH", href: "/dai-ly/cau-chuyen-dong-hanh" },
    { label: "CHÂN DUNG ĐẠI LÝ", href: "/dai-ly/chan-dung-dai-ly" },
    { label: "HỖ TRỢ TIẾP THỊ", href: "/dai-ly/ho-tro-tiep-thi" },
    { label: "GALLERY BY BRAND", href: "/dai-ly/gallery-by-brand" },
  ],
  "/nhan-su": [
    { label: "VĂN HOÁ TC", href: "/nhan-su/van-hoa-tc" },
    { label: "NHÂN SỰ TC", href: "/nhan-su/nhan-su-tc" },
    { label: "TUYỂN DỤNG", href: "/nhan-su/tuyen-dung" },
  ],
};

const EMPTY: readonly SubmenuEntry[] = [];

/**
 * Menu con cua muc chua duong dan nay.
 *
 * Nhan ca duong dan trang con (`/trai-nghiem/khoanh-khac`) lan duong dan muc
 * cha (`/trai-nghiem`) — dang o trang con thi menu cua muc cha van phai mo ra
 * duoc.
 */
export function submenuFor(href: string): readonly SubmenuEntry[] {
  const section = `/${href.split("/").filter(Boolean)[0] ?? ""}`;
  return NAV_SUBMENU[section] ?? EMPTY;
}
