import { MobileFooter } from "@/components/mobile/MobileFooter";
import Link from "next/link";
import { MobileNav } from "@/components/mobile/MobileNav";
import { getMobileHero, type MobileBlock } from "@/lib/mobile-subpage";
import type { SubPageSpec } from "@/lib/subpage-schema";
import type { PpfCard } from "@/lib/ppf-cards";
import type { Product } from "@/lib/products";
import type { NavSpec } from "@/lib/types";

/**
 * Ban MOBILE cua 31 trang con.
 *
 * Trang con von la ANH: chu nam trong anh nen thu xuong be rong dien thoai la
 * khong doc noi. O day chu duoc lay tu ban OCR da trich va ve lai bang chu
 * THAT — doc duoc, chon duoc, may tim kiem doc duoc. Anh dau trang giu lai de
 * khong mat khong khi cua thiet ke.
 */
export function MobileSubPage({
  page,
  nav,
  blocks,
  childPages,
  products = [],
  cards = [],
  contact,
}: {
  page: SubPageSpec;
  nav: readonly NavSpec[];
  blocks: readonly MobileBlock[];
  childPages: readonly SubPageSpec[];
  /**
   * San pham cua trang danh muc nay.
   *
   * Ban desktop hien chung thanh cac the tren canvas; ban mobile khong co
   * canvas nen phai xep lai thanh luoi doc — neu khong thi tren dien thoai
   * trang danh muc chang co san pham nao.
   */
  products?: readonly Product[];
  /**
   * Dai the 3M PPF. Ban desktop cho no truot ngang bang mui ten ve san trong
   * thiet ke; ban mobile khong co dai do nen phai xep lai, neu khong bon the
   * nay bien mat khoi dien thoai.
   */
  cards?: readonly PpfCard[];
  contact?: React.ReactNode;
}) {
  // Lat nen dau tien co ca tua de VE SAN trong anh. Ban mobile ve lai tua de
  // bang chu that, nen dung ban cat da bo cot do — neu khong tua de hien hai
  // lan, chong len nhau.
  const hero = getMobileHero(page.slug) ?? page.slices[0]?.src ?? null;

  return (
    <div className="tc-m">
      <MobileNav nav={nav} />

      <section className="tc-m-hero tc-m-hero-sub">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element -- lat nen cat san
          <img src={hero} alt="" width={1440} height={1080} fetchPriority="high" />
        ) : null}
        <div className="tc-m-hero-text">
          {/* `p` chu khong phai `h1`: lop chu an `.tc-sr` phia duoi da co mot
              `h1` cho chinh trang nay, ma hai the h1 trung noi dung tren cung
              mot trang la mot loi chuan hoa — ca hai deu nam trong DOM du chi
              mot cai hien ra. Kieu chu khong doi. */}
          <p className="tc-m-hero-title">{page.title}</p>
        </div>
      </section>

      <article className="tc-m-article">
        {blocks.map((block, index) => {
          const key = `${index}-${block.image ?? block.text.slice(0, 14)}`;
          if (block.kind === "figure") {
            return (
              // eslint-disable-next-line @next/next/no-img-element -- anh cat san
              <img key={key} className="tc-m-shot" src={block.image} alt="" loading="lazy" />
            );
          }
          return block.kind === "heading" ? (
            <h2 key={key}>{block.text}</h2>
          ) : (
            <p key={key}>{block.text}</p>
          );
        })}
      </article>

      {cards.length > 0 ? (
        <section className="tc-m-sec" aria-label="Các dòng 3M PPF">
          <ul className="tc-m-prods">
            {cards.map((card) => (
              <li key={card.id}>
                {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san */}
                <img src={card.art} alt="" loading="lazy" decoding="async" />
                <strong>{card.title}</strong>
                {card.body ? <em>{card.body}</em> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {products.length > 0 ? (
        <section className="tc-m-sec" aria-label="Sản phẩm">
          <ul className="tc-m-prods">
            {products.map((product) => (
              <li key={product.slug}>
                <Link href={product.route} prefetch={false}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san */}
                  <img
                    src={product.image}
                    alt=""
                    width={product.imageWidth}
                    height={product.imageHeight}
                    loading="lazy"
                    decoding="async"
                  />
                  <strong>{product.name}</strong>
                  <em>{product.description}</em>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Loi vao danh muc co bo loc. Ban desktop khong them duoc phan tu nhin
          thay (trang con khoa lech 0 pixel), nen o ban dien thoai thi hien ro. */}
      {page.slug === "giai-phap/man-hinh" ? (
        <p className="tc-m-cta">
          <Link href="/giai-phap/man-hinh/tat-ca" prefetch={false}>
            Xem tất cả các mẫu
          </Link>
        </p>
      ) : null}

      {childPages.length > 0 ? (
        <nav className="tc-m-children" aria-label="Nội dung trong mục này">
          <h2>Xem thêm trong mục này</h2>
          {childPages.map((child) => (
            <Link key={child.slug} href={child.route} prefetch={false}>
              {child.title}
            </Link>
          ))}
        </nav>
      ) : null}

      {contact ? (
        <section className="tc-m-contact">
          <h2 className="tc-m-contact-head">TC LUÔN SẴN SÀNG ĐỒNG HÀNH CÙNG BẠN</h2>
          {contact}
        </section>
      ) : null}
      <MobileFooter nav={nav} />
    </div>
  );
}
