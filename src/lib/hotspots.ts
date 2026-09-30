import detected from "@/data/detected-buttons.json";
import downloads from "@/data/app-downloads.json";
import { getSubPage } from "./subpages";

export interface Hotspot {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly href: string;
  readonly label: string;
  /** Dan ra NGOAI site — mo tab moi, va khong di qua router cua Next. */
  readonly external?: boolean;
}

interface DetectedRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

const DETECTED = detected as Readonly<Record<string, readonly DetectedRect[]>>;
const DOWNLOADS = (downloads as unknown as {
  pages: Readonly<Record<string, readonly Hotspot[]>>;
}).pages;

/**
 * Dich den cho tung nut CTA ve san trong anh trang con.
 *
 * Khoa: "<slug>#<chi so nut>", chi so tinh theo thu tu tu tren xuong duoi
 * (do tools/detect-buttons.py sinh ra, sap theo y roi x).
 * Nut khong co trong bang nay se KHONG duoc phu vung bam — tranh tao ra
 * lien ket doan mo ho.
 */
const HOTSPOT_TARGETS: Readonly<Record<string, string>> = {
  // Phim dán kính -> bài viết chi tiết sản phẩm
  "giai-phap/phim-dan-kinh#0": "/giai-phap/phim-dan-kinh/3m-ceramic-elite-im",

  // Các dự án -> bài viết dự án
  "giai-phap/du-an#0": "/giai-phap/du-an/dai-ly-winca-pham-gia-auto",

  // Ứng dụng -> hai trang con
  "cong-nghe/ung-dung#0": "/cong-nghe/ung-dung/kho-ung-dung",
  "cong-nghe/ung-dung#1": "/cong-nghe/ung-dung/cap-nhat-va-loi",

  // Mạng lưới đại lý -> các trang tiếp theo
  "dai-ly/mang-luoi-dai-ly#0": "/dai-ly/mang-luoi-dai-ly/mien-trung",
  "dai-ly/mang-luoi-dai-ly/mien-trung#0": "/dai-ly/mang-luoi-dai-ly/mien-nam",

  // Chân dung đại lý -> bài viết
  "dai-ly/chan-dung-dai-ly#0": "/dai-ly/chan-dung-dai-ly/dai-ly-winca-pham-gia-auto",

  // Văn hoá TC -> câu chuyện khởi nghiệp
  "nhan-su/van-hoa-tc#0": "/nhan-su/van-hoa-tc/cau-chuyen-khoi-nghiep",

  // Tuyển dụng -> vị trí đang tuyển
  "nhan-su/tuyen-dung#0": "/nhan-su/tuyen-dung/vi-tri-dang-tuyen",

  // Nhân sự TC: hai nút "KHÁM PHÁ NGAY"
  //   #0 duoi "TỔNG QUAN NHÂN SỰ" -> van hoa cua tap the
  //   #1 duoi "NHÂN SỰ TIÊU BIỂU THÁNG" -> trang ta soan (thiet ke khong ve)
  "nhan-su/nhan-su-tc#0": "/nhan-su/van-hoa-tc",
  "nhan-su/nhan-su-tc#1": "/nhan-su/nhan-su-tieu-bieu",
};

/**
 * Vung bam KHONG phai nut — do tay tu ban thiet ke.
 *
 * tools/detect-buttons.py chi tim cac nut chu nhat bo goc mau do. Nhung dieu
 * khien khac duoc ve chet vao anh — thanh tab chang han — phai do tay.
 */
const EXTRA_HOTSPOTS: Readonly<Record<string, readonly (DetectedRect & { href: string; label: string })[]>> = {
  // Thanh tab "WINCA | BRAVO": hai o moi o rong 720, cao 88, tai y878.
  // Thiet ke chi dung noi dung cho tab WINCA — chinh trang nay. Tab BRAVO dan
  // sang trang rieng (src/data/authored-pages.json) thay vi doi noi dung tai
  // cho, vi khong co frame nao de doi cho dung.
  // Dai "CÁC BÀI VIẾT KHÁC" o cuoi trang 3M Ceramic Elite IM duoc VE CHET vao
  // anh nen nen hai the trong do khong bam duoc. Hai the la hai san pham that,
  // nay da co trang rieng (xem src/lib/products.ts).
  // Do bang cach quet vung khac mau nen: the cao 6726..7104, tieu de ngay duoi;
  // vung bam phu ca anh lan tieu de cho de bam.
  "giai-phap/phim-dan-kinh/3m-ceramic-elite-im": [
    {
      x: 83,
      y: 6726,
      w: 592,
      h: 459,
      href: "/giai-phap/phim-dan-kinh/3m-ceramic-hong-ngoai",
      label: "3M Ceramic Hồng Ngoại",
    },
    {
      x: 767,
      y: 6726,
      w: 592,
      h: 459,
      href: "/giai-phap/phim-dan-kinh/3m-ceramic-crystalline",
      label: "3M Ceramic Crystalline",
    },
  ],

  "giai-phap/man-hinh": [
    { x: 0, y: 878, w: 720, h: 88, href: "/giai-phap/man-hinh", label: "Màn hình Winca" },
    {
      x: 720,
      y: 878,
      w: 720,
      h: 88,
      href: "/giai-phap/man-hinh/bravo",
      label: "Màn hình Bravo",
    },
  ],
};

/**
 * Vung bam cho mot trang con: chi tra ve nut da duoc gan dich den tuong minh.
 * Toa do do bang tools/detect-buttons.py (do chinh xac +/-1px, da kiem chung
 * 25/25 nut tren 6 trang chinh).
 */
export function getHotspots(slug: string): readonly Hotspot[] {
  const rects = DETECTED[slug];
  if (!rects) {
    return [];
  }

  const spots: Hotspot[] = [];
  rects.forEach((rect, index) => {
    const href = HOTSPOT_TARGETS[`${slug}#${index}`];
    if (!href) {
      return;
    }
    spots.push({
      ...rect,
      href,
      label: getSubPage(href.slice(1))?.title ?? "Xem chi tiết",
    });
  });

  spots.push(...(EXTRA_HOTSPOTS[slug] ?? []));
  spots.push(...appDownloads(slug));

  return spots;
}

/**
 * Nut "TẢI VỀ" tren hai trang kho ung dung.
 *
 * Duong tai la tep that tren wincavn.com — khach gui trang cua hang va yeu
 * cau "bấm vào là tải thôi" (30/09/2026). Vi tri nut do
 * tools/brand/link-app-downloads.py sinh ra tu lop chu OCR cua chinh trang,
 * nen thiet ke co xe dich thi chay lai bo do la vung bam tu bam theo.
 */
function appDownloads(slug: string): readonly Hotspot[] {
  const spots = DOWNLOADS[slug] ?? [];
  return spots.map((spot) => ({ ...spot, external: true }));
}

/** Dung cho test: so nut do duoc tren tung trang. */
export function countDetected(slug: string): number {
  return DETECTED[slug]?.length ?? 0;
}
