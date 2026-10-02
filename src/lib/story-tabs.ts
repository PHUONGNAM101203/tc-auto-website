/**
 * Hai tab tren trang "Câu chuyện đồng hành" (/dai-ly/cau-chuyen-dong-hanh).
 *
 * Thiet ke ve chet mot thanh HAI o — "HÀNH TRÌNH HỢP TÁC" dang sang, va
 * "GIÁ TRỊ CÙNG ĐẠT ĐƯỢC" — nhung khong o nao bam duoc, va duoi thanh chi co
 * MOT khoi noi dung: nam the bai viet con de tieu de mau. Khach chi dung o
 * thu hai (02/10/2026): "tính năng này cũng chưa được phát triển".
 *
 * ── Lay noi dung o dau ────────────────────────────────────────────────────
 * Bo thiet ke KHONG ve gi cho tab thu hai. Nhung "giá trị cùng đạt được" thi
 * chinh khach da viet san — nam o trang anh em /dai-ly/ho-tro-tiep-thi, duoi
 * ba de muc: HỖ TRỢ TRUYỀN THÔNG, ĐÀO TẠO, CÔNG CỤ BÁN HÀNG.
 *
 * Nen tab thu hai dan lai ba tru do, voi dung chu cua ho, va moi the tro ve
 * trang goc. KHONG tu bia ra mot con so hay mot loi hua nao — do la viec cua
 * khach, khong phai cua ma nguon. Cung nguyen tac da dung cho tab 5DO
 * (xem brand-tabs.ts).
 */

export interface StoryValue {
  readonly id: string;
  readonly title: string;
  readonly lead: string;
  readonly body: string;
  readonly href: string;
}

/** Thanh hai o, do tu van ban trich: ca hai de o y 908.6, cao ~36. */
export const STORY_TAB_BAR = { y: 897, height: 60, columns: 2 } as const;

/**
 * Vung noi dung bi che khi doi sang tab thu hai.
 *
 * Bien do bang cach tim nhung dai HOAN TOAN la mau nen tren lat anh: dai yen
 * tinh 974..1074 o tren (lay diem giua 1024) va 3396..3434 o duoi (lay 3415).
 * Trong khoang do la nam the bai viet cua tab thu nhat.
 */
export const STORY_CONTENT = { y: 1024, height: 3415 - 1024 } as const;

/** Mau nen cua trang, do thang tu lat nen. */
export const STORY_BACKGROUND = "#03111c";

export const STORY_DEFAULT = "hanh-trinh";

export const STORY_TABS = [
  { id: "hanh-trinh", label: "Hành trình hợp tác" },
  { id: "gia-tri", label: "Giá trị cùng đạt được" },
] as const;

/**
 * Ba tru gia tri. Chu lay nguyen tu /dai-ly/ho-tro-tiep-thi — da sua loi nhan
 * dang ky tu (OCR doc "đề chú động" thay vi "để chủ động", mat chu "T" dau
 * cau "ại TC AUTO"), khong viet lai y.
 */
export const STORY_VALUES: readonly StoryValue[] = [
  {
    id: "truyen-thong",
    title: "Hỗ trợ truyền thông",
    lead: "Hỗ trợ từ nền tảng thương hiệu",
    body:
      "TC AUTO đồng hành cùng đại lý trong việc xây dựng hình ảnh, gia tăng " +
      "nhận diện và kết nối với khách hàng. Hệ thống hình ảnh, nội dung và " +
      "nhận diện thương hiệu được chuẩn hoá, giúp đại lý có thêm nguồn lực để " +
      "chủ động triển khai marketing và phát triển thị trường.",
    href: "/dai-ly/ho-tro-tiep-thi",
  },
  {
    id: "dao-tao",
    title: "Đào tạo",
    lead: "Một hệ thống đại lý vững mạnh bắt đầu từ đội ngũ có chuyên môn",
    body:
      "Tại TC AUTO, đào tạo không chỉ là hoạt động hỗ trợ, mà là một phần " +
      "trong hành trình đồng hành và phát triển cùng mỗi đại lý — để đội ngũ " +
      "có chuyên môn, tư duy dịch vụ và khả năng thích ứng với thị trường.",
    href: "/dai-ly/ho-tro-tiep-thi",
  },
  {
    id: "cong-cu",
    title: "Công cụ bán hàng",
    lead: "Đầy đủ thông tin. Dễ dàng tư vấn.",
    body:
      "Đại lý được cung cấp hệ thống tài liệu sản phẩm với thông tin rõ ràng " +
      "về tính năng, công nghệ, ưu điểm và ứng dụng thực tế. Đây là nền tảng " +
      "giúp chủ động nắm bắt sản phẩm và giải đáp nhu cầu của khách.",
    href: "/dai-ly/ho-tro-tiep-thi",
  },
];
