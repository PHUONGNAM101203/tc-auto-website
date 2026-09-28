import { siteUrl } from "./site-url";

export const SITE = {
  name: "TC Auto Solutions",
  slogan: "DRIVE · EXPERIENCE · ELEVATE",
  description:
    "TC Auto Solutions kiến tạo những giải pháp nâng tầm trải nghiệm lái xe – nơi công nghệ, thẩm mỹ và cảm xúc hòa quyện trong từng hành trình.",
  locale: "vi_VN",
  /**
   * Dia chi goc — dung cho canonical, Open Graph, sitemap va robots.
   * Tu bam theo moi truong: xem `src/lib/site-url.ts`. Khi gan domain that thi
   * chi can dat `NEXT_PUBLIC_SITE_URL` tren Vercel, khong dung den ma nguon.
   */
  url: siteUrl(),
} as const;

/** Mo ta rieng cho tung trang, dung cho <meta name="description"> va OG. */
export const PAGE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  home: SITE.description,
  "trai-nghiem":
    "Tận hưởng từng khoảnh khắc trên hành trình cùng TC Auto — bản sắc riêng, khoảnh khắc đáng nhớ và phong cách sống dành cho người yêu xe.",
  "giai-phap":
    "Phim cách nhiệt, PPF, loa nội thất DEGO và màn hình ô tô chính hãng — giải pháp TC Auto nâng tầm trải nghiệm lái xe của bạn.",
  "cong-nghe":
    "Nghiên cứu & phát triển, ứng dụng công nghệ, chính sách bảo hành minh bạch và không gian trải nghiệm trực tiếp tại TC Auto.",
  "dai-ly":
    "Mạng lưới đại lý TC Auto trên toàn quốc — đồng hành truyền thông, hỗ trợ tiếp thị và cùng nhau kiến tạo giá trị bền vững.",
  "nhan-su":
    "Văn hoá TC Auto, đội ngũ nhân sự và cơ hội tuyển dụng — nơi giá trị chung tạo nên sức mạnh chung.",
};
