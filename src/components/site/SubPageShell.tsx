import Link from "next/link";
import { MobileSubPage } from "@/components/mobile/MobileSubPage";
import { productsIn } from "@/lib/products";
import { PPF_CARDS } from "@/lib/ppf-cards";
import { SliceImage } from "@/components/canvas/SliceImage";
import { ContactForm } from "@/components/site/ContactForm";
import { FooterSocial } from "@/components/site/FooterSocial";
import { RelatedStrip } from "@/components/site/RelatedStrip";
import { BackToTop } from "@/components/site/BackToTop";
import { Coverflow } from "@/components/site/Coverflow";
import {
  GALLERY_CENTRE,
  GALLERY_STEP,
  getGalleryPhotos,
} from "@/lib/gallery";
import { OverlapCards } from "@/components/site/OverlapCard";
import { SiteHeader } from "@/components/site/SiteHeader";
import { hasRelatedStrip } from "@/lib/related-strip";
import type { SubPageSpec } from "@/lib/subpage-schema";
import { getMobileBlocks } from "@/lib/mobile-subpage";
import { getPageText, type TextBlock } from "@/lib/subpage-text";

export interface Hotspot {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly href: string;
  readonly label: string;
  readonly external?: boolean;
}

interface SubPageShellProps {
  readonly page: SubPageSpec;
  /** Vung bam de len nut CTA duoc ve san trong anh thiet ke. */
  readonly hotspots?: readonly Hotspot[];
  /** Trang con truc tiep — dung cho lien ket an phuc vu SEO / dieu huong. */
  readonly childPages?: readonly SubPageSpec[];
  /** Tinh nang tuong tac rieng cua trang (vi du form tim dai ly). */
  readonly feature?: React.ReactNode;
}

/**
 * Dung mot trang con tu frame thiet ke da render.
 *
 * Khac voi 6 trang chinh (dung tu toa do + van ban that), trang con den tu
 * PNG @3x nen chu nam TRONG anh. Vi vay:
 *   - nen  : cac lat WebP @2x, giu nguyen 100% pixel thiet ke
 *   - tren : header / form / vung bam that o dang "ghost" (xem overlay.css)
 *   - an   : breadcrumb + lien ket trang con cho screen reader va SEO
 */
export function SubPageShell({
  page,
  hotspots = [],
  childPages = [],
  feature,
}: SubPageShellProps) {
  return (
    <>
      {/* Duoi 900px, canvas duoc an di va ban nay hien ra — chu trong anh khong
        the doc duoc khi thu xuong be rong dien thoai. */}
      <MobileSubPage
        products={productsIn(page.slug)}
        cards={page.slug === "giai-phap/ppf" ? PPF_CARDS : []}
        page={page}
        nav={page.nav}
        blocks={getMobileBlocks(page)}
        childPages={childPages}
        contact={
          page.contactForm ? (
            <ContactForm y={0} sourcePage={page.route} layout="mobile" />
          ) : null
        }
      />
      <div className="tc-canvas tc-ghost">
        <section
          className="pg"
          style={{ height: `${page.height}px` }}
          aria-label={page.title}
        >
          <div className="bg">
            {page.slices.map((slice, index) => (
              <SliceImage
                key={slice.src}
                slice={slice}
                index={index}
                alt={index === 0 ? `${page.title} — TC Auto Solutions` : ""}
              />
            ))}
          </div>

          {/* KHONG ve thanh truot o trang con: o danh dau muc dang xem da nam
            san trong anh nen PNG, ve them la ra hai khung long nhau. */}
          <SiteHeader nav={page.nav} />

          {hasRelatedStrip(page.slug) ? <RelatedStrip /> : null}

          {/* Duong dan phan cap — an voi mat thuong (thiet ke khong co breadcrumb)
            nhung screen reader va cong cu tim kiem van doc duoc. */}
          <nav className="tc-sr" aria-label="Đường dẫn">
            <ol>
              {page.breadcrumb.map((crumb) => (
                <li key={crumb.href}>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </li>
              ))}
              <li aria-current="page">{page.title}</li>
            </ol>
          </nav>

          {hotspots.map((spot) =>
            spot.external ? (
              /* Tep tai nam tren wincavn.com — dung the <a> thuong chu khong
                 qua router cua Next, va mo tab moi de nguoi dung khong mat
                 trang dang xem. `rel` bat buoc di kem `target="_blank"`. */
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a
                key={`${spot.x}-${spot.y}-${spot.href}`}
                href={spot.href}
                className="tc-hotspot rv"
                data-rv="scale"
                data-magnetic=""
                target="_blank"
                rel="noopener noreferrer"
                aria-label={spot.label}
                style={{
                  left: `${spot.x}px`,
                  top: `${spot.y}px`,
                  width: `${spot.w}px`,
                  height: `${spot.h}px`,
                }}
              />
            ) : (
              <Link
                key={`${spot.x}-${spot.y}-${spot.href}`}
                href={spot.href}
                prefetch={false}
                className="tc-hotspot rv"
                data-rv="scale"
                data-magnetic=""
                aria-label={spot.label}
                style={{
                  left: `${spot.x}px`,
                  top: `${spot.y}px`,
                  width: `${spot.w}px`,
                  height: `${spot.h}px`,
                }}
              />
            ),
          )}

          {/* Lop van ban cho trinh doc man hinh va cong cu tim kiem.
            Trang la anh nen chu khong co trong DOM — thieu lop nay thi trang
            "rong" voi Google. Trich bang OCR tu chinh frame thiet ke. */}
          <ReadableText
            title={page.title}
            blocks={getPageText(page.slug).blocks}
          />

          {childPages.length > 0 && (
            <nav className="tc-sr" aria-label={`Trang con của ${page.title}`}>
              <ul>
                {childPages.map((child) => (
                  <li key={child.slug}>
                    <Link href={child.route}>{child.title}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Dai "BỘ SƯU TẬP": tu chay, bam tam nao tam do chay vao giua. */}
          <Coverflow
            photos={getGalleryPhotos(page.slug)}
            centre={GALLERY_CENTRE}
            step={GALLERY_STEP}
            label="Bộ sưu tập"
          />

          {/* The nao bi nut "TẢI VỀ" de len chu thi chan the duoc ve lai. */}
          <OverlapCards slug={page.slug} />

          {feature}

          <ContactForm y={page.contactForm.y} sourcePage={page.route} />
          <FooterSocial pageHeight={page.height} />
        </section>
      </div>

      {/* Ngoai `.tc-canvas` — trong do co `zoom`, nut se bi keo lech vi tri. */}
      <BackToTop />
    </>
  );
}

/**
 * Dung cau truc heading hop le tu cac khoi van ban OCR.
 * Phan cap theo chieu cao chu: chu cang lon -> cap tieu de cang cao.
 */
function ReadableText({
  title,
  blocks,
}: {
  readonly title: string;
  readonly blocks: readonly TextBlock[];
}) {
  if (blocks.length === 0) {
    return (
      <div className="tc-sr" data-text-layer="">
        <h1>{title}</h1>
      </div>
    );
  }

  return (
    <div className="tc-sr" data-text-layer="">
      <h1>{title}</h1>
      {blocks.map((block, index) => {
        const key = `${block.y}-${block.x}-${index}`;
        if (block.kind === "h2") {
          return <h2 key={key}>{block.text}</h2>;
        }
        if (block.kind === "h3") {
          return <h3 key={key}>{block.text}</h3>;
        }
        return <p key={key}>{block.text}</p>;
      })}
    </div>
  );
}
