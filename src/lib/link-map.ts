/**
 * Noi cac nut CTA cua 6 trang chinh toi trang con tuong ung.
 *
 * Trong ban export prototype, nhung nut nay deu la `javascript:void(0)` —
 * thoi diem do chua co thiet ke trang con nen chua biet dich den. Bang do
 * duoc suy ra tu NHAN MUC dat ngay tren moi nut (xem `.lbl` trong page spec),
 * doi chieu voi ten frame trong '[TC] Website/Website_TC'.
 *
 * Giu rieng o day thay vi sua page spec: chay lai `npm run parse:prototype`
 * se ghi de page spec, con bang do nay thi khong mat.
 */
export const CTA_LINK_MAP: Readonly<Record<string, string>> = {
  // Trải nghiệm
  "trai-nghiem-005": "/trai-nghiem/hanh-trinh",
  "trai-nghiem-009": "/trai-nghiem/ban-sac-rieng",
  "trai-nghiem-013": "/trai-nghiem/khoanh-khac",
  "trai-nghiem-017": "/trai-nghiem/phong-cach-song",

  // Giải pháp
  "giai-phap-010": "/giai-phap/ppf",
  "giai-phap-017": "/giai-phap/man-hinh",
  "giai-phap-022": "/giai-phap/du-an",

  // Hai muc nay KHONG co nut trong thiet ke (detector do 0 vung do), nen trang
  // con cua chung khong the bam toi duoc. Gan lien ket len chinh NHAN MUC —
  // nhan la tieu de cua muc, bam vao no la hanh vi tu nhien va khong them UI moi.
  "giai-phap-004": "/giai-phap/phim-dan-kinh", // nhãn PHIM CÁCH NHIỆT
  "giai-phap-011": "/giai-phap/loa", // nhãn LOA NỘI THẤT

  // Công nghệ — mục Tiên phong công nghệ.
  // Mục này có HAI nút "TÌM HIỂU THÊM", một dưới tiêu đề chính và một dưới
  // tiêu đề phụ "NGHIÊN CỨU & PHÁT TRIỂN". Bản thiết kế 28/09 từng bỏ nút thứ
  // nhất, nhưng khách làm việc theo bản còn cả hai và yêu cầu giữ nguyên
  // (30/09/2026) — nên cả hai đều trỏ về cùng một trang, đúng như thiết kế.
  "cong-nghe-004": "/cong-nghe/tien-phong-cong-nghe",
  "cong-nghe-007": "/cong-nghe/tien-phong-cong-nghe",
  "cong-nghe-011": "/cong-nghe/ung-dung",
  // Hai muc duoi day khong co frame thiet ke; trang duoc TU SOAN — xem
  // src/data/authored-pages.json.
  "cong-nghe-015": "/cong-nghe/bao-hanh",
  "cong-nghe-019": "/cong-nghe/khong-gian-trai-nghiem",

  // Đại lý
  "dai-ly-005": "/dai-ly/mang-luoi-dai-ly",
  "dai-ly-009": "/dai-ly/cau-chuyen-dong-hanh",
  "dai-ly-013": "/dai-ly/chan-dung-dai-ly",
  "dai-ly-017": "/dai-ly/ho-tro-tiep-thi",
  "dai-ly-021": "/dai-ly/gallery-by-brand",

  // Nhân sự
  "nhan-su-005": "/nhan-su/van-hoa-tc",
  "nhan-su-009": "/nhan-su/nhan-su-tc",
  "nhan-su-013": "/nhan-su/tuyen-dung",
};

/**
 * Nut CO Y de khong co dich den — muc tuong ung chua co frame thiet ke rieng.
 * Liet ke tuong minh de test phan biet "chua lam" voi "quen noi".
 */
export const CTA_INTENTIONALLY_UNLINKED: readonly string[] = [];
