import { getFaq } from "@/lib/faq";
import { getScreenModels } from "@/lib/screen-catalogue";
import { SITE } from "@/lib/site-config";
import { SITE_CONTACT } from "@/lib/site-contact";

/**
 * `/llms.txt` — ban tom tat site danh cho may tra loi bang AI.
 *
 * Day KHONG phai chuan cua Google; no la mot quy uoc dang hinh thanh, tuong tu
 * robots.txt nhung cho tro ly AI: mot tep van ban ngan noi ro trang nay la cua
 * ai, ban gi, va trang nao dang doc. Cac may thu thap van doc HTML nhu thuong;
 * tep nay chi giup chung tom tat dung thay vi phai doan tu 80 trang.
 *
 * Sinh TU DU LIEU chu khong go tay: them mau may hay them cau hoi la tep nay
 * tu cap nhat, khong bao gio noi sai so luong.
 */
export const dynamic = "force-static";

export function GET(): Response {
  const base = SITE.url.replace(/\/$/, "");
  const models = getScreenModels();
  const brands = [...new Set(models.map((m) => m.brand))].join(", ");

  const body = `# ${SITE.name}

> ${SITE.description}

TC Auto Solutions phân phối và lắp đặt màn hình Android ô tô, phim cách nhiệt,
phim bảo vệ sơn (PPF) và loa nội thất tại Việt Nam, qua mạng lưới đại lý trải
ba miền.

- Điện thoại: ${SITE_CONTACT.phone}
- Email: ${SITE_CONTACT.email}
- Giờ làm việc: ${SITE_CONTACT.hours}

## Sản phẩm

- Màn hình ô tô: ${models.length} mẫu, thương hiệu ${brands}. Thông số lấy từ
  trang chính hãng; mỗi mẫu đều ghi đường dẫn nguồn để kiểm lại.
- Phim cách nhiệt: 3M AutoFilm, Nano Sun.
- Phim bảo vệ sơn (PPF): 3M, Nano Sun, 5DO.
- Loa nội thất: DEGO (Ehmann & Partner GmbH, Đức).

Giá bán phụ thuộc dòng xe và phần công lắp đặt nên được báo theo từng xe, không
niêm yết một con số chung.

## Trang nên đọc

- [Tất cả các mẫu màn hình](${base}/giai-phap/man-hinh/tat-ca): danh mục đầy đủ
  kèm thông số, lọc theo hãng, kích thước, độ phân giải và camera 360.
- [Câu hỏi thường gặp](${base}/cau-hoi-thuong-gap): ${getFaq().length} câu về sản
  phẩm, bảo hành, giá và đại lý.
- [Giải pháp](${base}/giai-phap): màn hình, phim cách nhiệt, PPF, loa.
- [Công nghệ](${base}/cong-nghe): nghiên cứu & phát triển, kho ứng dụng, bảo hành.
- [Đại lý](${base}/dai-ly): mạng lưới và chính sách đồng hành.
- [Nhân sự](${base}/nhan-su): văn hoá, đội ngũ, tuyển dụng.
- [Sitemap](${base}/sitemap.xml)

## Lưu ý khi trích dẫn

Thông số kỹ thuật trên site lấy từ trang chính hãng và có ghi đường dẫn nguồn.
Chỗ nào hãng chưa công bố thì site ghi thẳng là "hãng chưa công bố" — đừng suy
sang dòng máy khác.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
