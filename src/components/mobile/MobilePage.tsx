import { MobileFooter } from "@/components/mobile/MobileFooter";
import Link from "next/link";
import { MobileNav } from "@/components/mobile/MobileNav";
import { headingLines, type MobileHero, type MobileSection } from "@/lib/mobile-sections";
import type { NavSpec } from "@/lib/types";

/**
 * Ban MOBILE cua 6 trang chinh.
 *
 * Day KHONG phai canvas 1440px thu nho — do la ly do cu khien chu con 3-4px.
 * Noi dung duoc dung lai tu cung mot nguon du lieu, xep doc, chu co dan theo
 * be rong man hinh.
 */
export function MobilePage({
  nav,
  hero,
  sections,
  contact,
}: {
  nav: readonly NavSpec[];
  hero: MobileHero | null;
  sections: readonly MobileSection[];
  contact?: React.ReactNode;
}) {
  return (
    <div className="tc-m">
      <MobileNav nav={nav} />

      {hero ? (
        <section className="tc-m-hero">
          {hero.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- anh cat san
            <img src={hero.image} alt="" width={680} height={907} fetchPriority="high" />
          ) : null}
          <div className="tc-m-hero-text">
            <h1>{hero.title}</h1>
            {hero.slogan ? <p>{hero.slogan}</p> : null}
          </div>
        </section>
      ) : null}

      {sections.map((section) => (
        <section key={section.id} className="tc-m-sec">
          {section.label ? <p className="tc-m-label">{section.label}</p> : null}

          {section.heading ? (
            <h2>
              {headingLines(section.heading).map((line, index) => (
                <span key={`${index}-${line.slice(0, 12)}`}>{line}</span>
              ))}
            </h2>
          ) : null}

          {section.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- anh cat san
            <img
              className="tc-m-shot"
              src={section.image}
              alt=""
              width={680}
              height={510}
              loading="lazy"
              decoding="async"
            />
          ) : null}

          {section.body ? <p className="tc-m-body">{section.body}</p> : null}

          {section.cta ? (
            <Link href={section.cta.href} prefetch={false} className="tc-m-cta">
              {section.cta.label}
            </Link>
          ) : null}
        </section>
      ))}

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
