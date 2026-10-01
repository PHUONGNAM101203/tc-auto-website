import Link from "next/link";
import { assetUrl } from "@/lib/asset-url";
import { MobileNav } from "@/components/mobile/MobileNav";
import { BackToTop } from "@/components/site/BackToTop";
import { JsonLd } from "@/components/site/JsonLd";
import { getPageSpec } from "@/lib/pages";
import { articleLd, breadcrumbLd } from "@/lib/structured-data";
import { getSubPage } from "@/lib/subpages";
import type { SpotArticle as Article } from "@/lib/spot-articles";
import type { PageSlug } from "@/lib/types";

/**
 * Trang bai viet mo ra tu nut "XEM THÊM".
 *
 * Dung chung lop `tc-doc` voi cac trang tu soan: co dan theo be rong man hinh,
 * cung he mau va kieu chu. Khong dung canvas 1440px — bai viet la chu, doc
 * tren dien thoai moi la cho dung nhat.
 */

/** "2026-08-19" -> "Ngày 19.8.2026", dung dinh dang cua ban thiet ke. */
function vietnameseDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : `Ngày ${date.getUTCDate()}.${date.getUTCMonth() + 1}.${date.getUTCFullYear()}`;
}

export function SpotArticle({ article }: { article: Article }) {
  const section = article.parentPage.split("/")[0] as PageSlug;
  const nav = getPageSpec(section).nav;
  const parent = getSubPage(article.parentPage);
  const parentLabel = parent?.title ?? section;
  const date = article.date ? vietnameseDate(article.date) : "";

  return (
    <>
      <MobileNav nav={nav} />

      <JsonLd
        data={articleLd({
          title: article.title,
          excerpt: article.paragraphs[0] ?? null,
          url: article.route,
          image: null,
          publishedAt: article.date,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: "Trang chủ", url: "/" },
          { name: parentLabel, url: article.parent },
          { name: article.title, url: article.route },
        ])}
      />

      <main className="tc-doc">
        <nav className="tc-doc-crumbs" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden="true">›</span>
          <Link href={article.parent}>{parentLabel}</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{article.title}</span>
        </nav>

        {date ? <p className="tc-doc-label">{date}</p> : null}
        <h1 className="tc-doc-title">{article.title}</h1>

        {article.image ? (
          /* eslint-disable-next-line @next/next/no-img-element -- anh cat san
             tu frame thiet ke o ti le goc, khong qua image optimizer */
          <img
            className="tc-doc-cover"
            src={assetUrl(article.image)}
            alt=""
            width={article.imageWidth}
            height={article.imageHeight}
            decoding="async"
          />
        ) : null}

        {article.paragraphs.map((text, index) => (
          <p key={`${index}-${text.slice(0, 16)}`} className="tc-doc-para">
            {text}
          </p>
        ))}

        <p className="tc-doc-cta">
          <Link href={article.parent}>Quay lại {parentLabel}</Link>
        </p>
      </main>

      <BackToTop />
    </>
  );
}
