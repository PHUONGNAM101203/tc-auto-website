import Link from "next/link";
import { MobileNav } from "@/components/mobile/MobileNav";
import { BackToTop } from "@/components/site/BackToTop";
import { JsonLd } from "@/components/site/JsonLd";
import { getFaq } from "@/lib/faq";
import { getPageSpec } from "@/lib/pages";
import { SITE } from "@/lib/site-config";
import { SITE_CONTACT } from "@/lib/site-contact";
import { breadcrumbLd } from "@/lib/structured-data";

/**
 * Trang "Câu hỏi thường gặp".
 *
 * Moi cau tra loi deu dua tren noi dung da co that tren site (xem
 * src/lib/faq.ts). Mau `FAQPage` o duoi la mot trong nhung dang du lieu co
 * cau truc Google ho tro, va cung la dang may tra loi bang AI doc truoc het.
 */
export const FAQ_SLUG = "cau-hoi-thuong-gap";
export const FAQ_ROUTE = `/${FAQ_SLUG}`;

export function FaqPage() {
  const items = getFaq();

  return (
    <>
      <MobileNav nav={getPageSpec("home").nav} />

      <JsonLd
        data={breadcrumbLd([
          { name: "Trang chủ", url: "/" },
          { name: "Câu hỏi thường gặp", url: FAQ_ROUTE },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />

      <main className="tc-doc">
        <nav className="tc-doc-crumbs" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Câu hỏi thường gặp</span>
        </nav>

        <p className="tc-doc-label">HỎI ĐÁP</p>
        <h1 className="tc-doc-title">Những điều khách hay hỏi trước khi gọi.</h1>
        <p className="tc-doc-lead">
          {items.length} câu hỏi thường gặp về sản phẩm, bảo hành, giá và mạng
          lưới đại lý của {SITE.name}. Chưa thấy điều bạn cần, gọi{" "}
          {SITE_CONTACT.phone} — đội ngũ trả lời trong giờ làm việc{" "}
          {SITE_CONTACT.hours.toLowerCase()}.
        </p>

        <section className="tc-faq">
          {items.map((item) => (
            <article key={item.question} className="tc-faq-item">
              <h2>{item.question}</h2>
              <p>{item.answer}</p>
            </article>
          ))}
        </section>

        <p className="tc-doc-cta">
          <Link href="/giai-phap/man-hinh/tat-ca">Xem tất cả các mẫu màn hình</Link>
        </p>
      </main>

      <BackToTop />
    </>
  );
}
