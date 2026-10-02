/**
 * Thong tin lien he cua TC Auto.
 *
 * Chan trang trong ban thiet ke duoc VE CHET vao anh nen (khong phai phan tu),
 * nen nhung dong nay duoc doc lai tu chinh frame Home.png. Ban mobile khong
 * dung anh nen nen phai co du lieu that de dung lai chan trang.
 */
export const SITE_CONTACT = {
  phone: "093 617 6996",
  /**
   * Tru so. Khach cung cap 02/10/2026; trung voi mot trong hai dia chi dang
   * ghi tren tcauto.vn. Co no moi khai duoc `LocalBusiness` — xem
   * structured-data.ts. KHONG tu them phuong/quan: chi ghi dung phan khach
   * doc, vi don vi hanh chinh Da Nang vua sap xep lai nam 2025.
   */
  address: "463 Trưng Nữ Vương, Đà Nẵng",
  addressLocality: "Đà Nẵng",
  addressCountry: "VN",
  email: "infor@tcautosolutions.vn",
  hours: "Thứ 2 - 7 | 8:00 - 17:30",
  slogan: "DRIVE · EXPERIENCE · ELEVATE",
  pitch: "TC luôn sẵn sàng lắng nghe và tư vấn giải pháp phù hợp nhất dành cho bạn.",
  copyright: "©2026 TC Auto Solutions. All rights reserved",
} as const;

/**
 * Trang mang xa hoi. Doc tu chinh trang tcauto.vn cua TC Auto (so hotline o do
 * trung khop voi so trong thiet ke), khong phai suy doan.
 *
 * Instagram: thiet ke co ve bieu tuong, nhung TC Auto CHUA co tai khoan
 * Instagram nao — nhung tai khoan ten giong deu la hang khac o Brazil, Hawaii,
 * Uc. Nen bieu tuong do de nguyen, khong gan lien ket bia.
 */
export const SOCIAL = [
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/tcautovn" },
  { id: "instagram", label: "Instagram", href: null },
  { id: "zalo", label: "Zalo", href: `https://zalo.me/${SITE_CONTACT.phone.replace(/\s/g, "")}` },
] as const;

/**
 * Ba bieu tuong mang xa hoi VE SAN trong chan trang cua moi frame.
 *
 * Do tu cac frame thiet ke: luon cach DAY trang 62px, x co dinh, o 24x24.
 * Da kiem chung tren 4 frame co chieu cao khac nhau.
 */
export const SOCIAL_BOX = {
  fromBottom: 62,
  size: 24,
  xs: { facebook: 1235, instagram: 1270, zalo: 1304 },
} as const;

/** So dien thoai dang `tel:` — bo khoang trang. */
export const PHONE_HREF = `tel:${SITE_CONTACT.phone.replace(/\s/g, "")}`;
