import { MobileFooter } from "@/components/mobile/MobileFooter";
import Link from "next/link";
import { MobileCarousel, type MobileSlide } from "@/components/mobile/MobileCarousel";
import { MobileNav } from "@/components/mobile/MobileNav";
import { SLIDER_AUTOPLAY_MS } from "@/lib/slider-timing";
import { headingLines, type MobileHero, type MobileSection } from "@/lib/mobile-sections";
import type { MobileBlock } from "@/lib/mobile-blocks";
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
  heroSlides = [],
  sections,
  blocks = [],
  contact,
}: {
  nav: readonly NavSpec[];
  hero: MobileHero | null;
  /**
   * Cac tam cua bang hero. Ban desktop co bang anh tu chay; ban mobile truoc
   * day chi hien MOT tam tinh — khach bao thieu (30/09/2026).
   */
  heroSlides?: readonly MobileSlide[];
  sections: readonly MobileSection[];
  /**
   * Bang anh, dai the va cac the noi — nhung khoi truoc day chi co tren
   * desktop. Duoc tron vao giua cac muc chu theo do cao tren canvas, nen ban
   * mobile doc theo dung mach cua ban desktop.
   */
  blocks?: readonly MobileBlock[];
  contact?: React.ReactNode;
}) {
  return (
    <div className="tc-m">
      <MobileNav nav={nav} />

      {hero ? (
        <section className="tc-m-hero">
          {heroSlides.length > 1 ? (
            <MobileCarousel
              slides={heroSlides}
              label="Ảnh giới thiệu TC Auto"
              everyMs={3000}
              ratio="680 / 907"
            />
          ) : hero.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- anh cat san
            <img src={hero.image} alt="" width={680} height={907} fetchPriority="high" />
          ) : null}
          <div className="tc-m-hero-text">
            <h1>{hero.title}</h1>
            {hero.slogan ? <p>{hero.slogan}</p> : null}
          </div>
        </section>
      ) : null}

      {/* Tron muc chu va khoi, xep theo do cao tren canvas desktop. */}
      {[
        ...sections.map((section) => ({ y: section.y, node: renderSection(section) })),
        ...blocks.map((block) => ({ y: block.y, node: renderBlock(block) })),
      ]
        .sort((a, b) => a.y - b.y)
        .map((row) => row.node)}

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

/** Mot muc chu: nhan, tieu de, anh, than bai, nut. */
function renderSection(section: MobileSection) {
  return (
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
  );
}

/** Mot khoi dua xuong tu ban desktop: bang anh hoac dai the. */
function renderBlock(block: MobileBlock) {
  if (block.kind === "carousel") {
    return (
      <section key={block.id} className="tc-m-sec">
        <p className="tc-m-label">{block.label}</p>
        <MobileCarousel
          slides={block.slides}
          label={block.label}
          everyMs={SLIDER_AUTOPLAY_MS}
          ratio={block.ratio}
        />
      </section>
    );
  }

  return (
    <section key={block.id} className="tc-m-sec">
      <ul
        className="tc-m-tiles"
        style={{ ["--tc-m-tile" as string]: block.ratio }}
      >
        {block.tiles.map((tile) => (
          <li key={tile.href + tile.title}>
            <Link href={tile.href} prefetch={false}>
              {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san */}
              <img src={tile.src} alt="" loading="lazy" decoding="async" />
              {tile.title ? <strong>{tile.title}</strong> : null}
              {tile.subtitle ? <em>{tile.subtitle}</em> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
