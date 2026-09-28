import { MobileFooter } from "@/components/mobile/MobileFooter";
import Link from "next/link";
import { MobileNav } from "@/components/mobile/MobileNav";
import { getMobileHero, type MobileBlock } from "@/lib/mobile-subpage";
import type { SubPageSpec } from "@/lib/subpage-schema";
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
  contact,
}: {
  page: SubPageSpec;
  nav: readonly NavSpec[];
  blocks: readonly MobileBlock[];
  childPages: readonly SubPageSpec[];
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
          <h1>{page.title}</h1>
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
