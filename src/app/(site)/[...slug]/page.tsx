import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PpfCarousel } from "@/components/site/PpfCarousel";
import { StyleQuiz } from "@/components/site/StyleQuiz";
import { ScreenTabs } from "@/components/site/ScreenTabs";
import { BrandTabs } from "@/components/site/BrandTabs";
import { DealerSearch } from "@/components/site/DealerSearch";
import { Pagination } from "@/components/site/Pagination";
import { ReadMore } from "@/components/site/ReadMore";
import { PostCards } from "@/components/site/PostCards";
import { StoryTabs } from "@/components/site/StoryTabs";
import { AuthoredPage } from "@/components/site/AuthoredPage";
import { ProductPage } from "@/components/site/ProductPage";
import { SubPageShell } from "@/components/site/SubPageShell";
import { getHotspots } from "@/lib/hotspots";
import { getCtaSpots } from "@/lib/cta-links";
import { ownedCtaRects } from "@/lib/owned-cta";
import { getPagination } from "@/lib/pagination";
import { listPublishedPosts } from "@/lib/posts";
import { SITE } from "@/lib/site-config";
import { DEFAULT_OG_IMAGE } from "@/lib/metadata";
import { getAuthoredPage, getAuthoredSlugs } from "@/lib/authored-pages";
import { getSpotArticle, getSpotArticles } from "@/lib/spot-articles";
import { SpotArticle } from "@/components/site/SpotArticle";
import {
  CataloguePage,
  CATALOGUE_SLUG,
  CATALOGUE_ROUTE,
} from "@/components/site/CataloguePage";
import { categoryOf, getProduct, getProductSlugs } from "@/lib/products";
import { getChildren, getSubPage, getSubPageSlugs } from "@/lib/subpages";
import { canonicalRouteOf } from "@/lib/canonical";

export const revalidate = 300;
/** Chi 31 slug duoc sinh tinh ton tai — moi duong dan khac tra 404. */
export const dynamicParams = false;

export function generateStaticParams(): { slug: string[] }[] {
  // 31 trang cat tu thiet ke + cac trang do ta tu soan (muc co nut CTA nhung
  // thiet ke khong ve trang con) + trang chi tiet tung san pham man hinh.
  return [
    ...getSubPageSlugs(),
    ...getAuthoredSlugs(),
    ...getProductSlugs(),
    // Bai viet mo ra tu nut "XEM THÊM" — khach yeu cau nut do dan sang trang
    // rieng chu khong xo chu tai cho (01/10/2026).
    ...getSpotArticles().map((article) => article.slug),
    // Danh muc man hinh co bo loc.
    CATALOGUE_SLUG,
  ].map((slug) => ({ slug: slug.split("/") }));
}

async function readSlug(params: Promise<{ slug: string[] }>): Promise<string> {
  const { slug } = await params;
  return slug.join("/");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const slug = await readSlug(params);
  const page = getSubPage(slug);
  if (slug === CATALOGUE_SLUG) {
    const text =
      `Toàn bộ các mẫu màn hình Winca và Bravo do ${SITE.name} phân phối, ` +
      "kèm thông số do chính hãng công bố. Lọc theo hãng, kích thước, độ phân " +
      "giải và camera 360.";
    return {
      title: `Tất cả các mẫu màn hình ô tô | ${SITE.name}`,
      description: text,
      alternates: { canonical: CATALOGUE_ROUTE },
      openGraph: {
        title: "Tất cả các mẫu màn hình ô tô",
        description: text,
        url: CATALOGUE_ROUTE,
        siteName: SITE.name,
        locale: SITE.locale,
        type: "website",
        images: [DEFAULT_OG_IMAGE],
      },
    };
  }
  if (!page) {
    const product = getProduct(slug);
    if (product) {
      const text = `${product.name} — ${categoryOf(product).title} tại ${SITE.name}. ${product.description}`;
      return {
        title: `${product.name} | ${SITE.name}`,
        description: text,
        alternates: { canonical: product.route },
        openGraph: {
          title: product.name,
          description: text,
          url: product.route,
          siteName: SITE.name,
          locale: SITE.locale,
          type: "website",
          images: [
            {
              url: product.image,
              width: product.imageWidth,
              height: product.imageHeight,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: product.name,
          description: text,
        },
      };
    }
    const article = getSpotArticle(slug);
    if (article) {
      const text = article.paragraphs[0] ?? `${article.title} — ${SITE.name}`;
      return {
        title: `${article.title} | ${SITE.name}`,
        description: text,
        alternates: { canonical: article.route },
        openGraph: {
          title: article.title,
          description: text,
          url: article.route,
          siteName: SITE.name,
          locale: SITE.locale,
          type: "article",
          images: [DEFAULT_OG_IMAGE],
          ...(article.date ? { publishedTime: article.date } : {}),
        },
      };
    }
    const authored = getAuthoredPage(slug);
    if (!authored) {
      return {};
    }
    const text = `${authored.title} — ${SITE.name}. ${authored.lead}`;
    return {
      title: `${authored.title} | ${SITE.name}`,
      description: text,
      alternates: { canonical: `/${authored.slug}` },
      openGraph: {
        title: authored.title,
        description: text,
        url: `/${authored.slug}`,
        siteName: SITE.name,
        locale: SITE.locale,
        type: "article",
        images: [DEFAULT_OG_IMAGE],
      },
    };
  }

  const description = `${page.title} — ${SITE.name}. ${SITE.description}`;

  return {
    title: `${page.title} | ${SITE.name}`,
    description,
    alternates: { canonical: canonicalRouteOf(slug, page.route) },
    openGraph: {
      title: page.title,
      description,
      url: page.route,
      siteName: SITE.name,
      locale: SITE.locale,
      type: page.isArticle ? "article" : "website",
      images: [{ url: page.slices[0].src, width: 2880, height: 1800 }],
    },
    twitter: { card: "summary_large_image", title: page.title, description },
  };
}

export default async function SubPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const slug = await readSlug(params);
  const page = getSubPage(slug);

  if (slug === CATALOGUE_SLUG) {
    return <CataloguePage />;
  }

  if (!page) {
    const product = getProduct(slug);
    if (product) {
      return <ProductPage product={product} />;
    }
    const authored = getAuthoredPage(slug);
    if (authored) {
      return <AuthoredPage page={authored} />;
    }
    const article = getSpotArticle(slug);
    if (!article) {
      notFound();
    }
    return <SpotArticle article={article} />;
  }

  // Trang mang luoi dai ly: hai o chon va nut "TÌM KIẾM" da duoc ve san trong
  // anh nen — gan dieu khien that de len de form dung duoc.
  const isDealerNetwork = slug.startsWith("dai-ly/mang-luoi-dai-ly");
  // Dai the "3M PPF": thiet ke ve chet bon the kem hai mui ten hai ben. Dai da
  // duoc tach ra khoi anh nen de hai mui ten do bam duoc.
  const isPpf = slug === "giai-phap/ppf";
  // Trac nghiem "Phong cách chơi xe": thiet ke ve chet mot cau hoi vao anh kem
  // nut "câu tiếp theo" — khoi that thay the no o dung cho do.
  const isQuiz = slug === "trai-nghiem/ban-sac-rieng";
  /** Trang co hai tab WINCA / BRAVO doi luoi san pham ngay tai cho. */
  const isScreens = slug === "giai-phap/man-hinh";
  /** Trang co ba tab 5DO / 3M / NANO SUN. */
  const isBrandGallery = slug === "dai-ly/gallery-by-brand";
  const isStoryPage = slug === "dai-ly/cau-chuyen-dong-hanh";
  const pager = getPagination(slug);
  const hotspots = getHotspots(slug);

  /**
   * Nut nao DA co vung bam rieng thi khong phu them lop "xem them" len nua —
   * neu khong se co hai lop chong nhau tren cung mot nut, va lop tren nuot
   * het cu bam. Hai nguon: `hotspots` (vung bam khai tay) va `ownedCtaRects`
   * (nut that do component rieng cua trang ve — xem src/lib/owned-cta.ts).
   */
  const taken = [...hotspots, ...ownedCtaRects(slug)];
  const covered = (spot: { x: number; y: number; w: number; h: number }) =>
    taken.some(
      (hot) =>
        spot.x < hot.x + hot.w &&
        spot.x + spot.w > hot.x &&
        spot.y < hot.y + hot.h &&
        spot.y + spot.h > hot.y,
    );
  // Bai viet that cua muc nay — thay cho cac o tieu de mau "TÊN BÀI VIẾT".
  const posts = await listPublishedPosts(slug);

  return (
    <SubPageShell
      page={page}
      hotspots={hotspots}
      childPages={getChildren(slug)}
      feature={
        <>
          {isDealerNetwork && <DealerSearch />}
          {isPpf && <PpfCarousel />}
          {isQuiz && <StyleQuiz />}
          {isScreens && <ScreenTabs />}
          {isBrandGallery && <BrandTabs />}
          {isStoryPage && <StoryTabs />}
          {pager && <Pagination model={pager} label={page.title} />}
          <ReadMore
            spots={getCtaSpots(slug).filter((spot) => !covered(spot))}
            posts={posts}
          />
          {/* `ReadMore` chi dat vung bam len nut "XEM THÊM"; lop nay moi ve de
              TIEU DE va MO TA that len cho tieu de mau trong anh nen. */}
          <PostCards spots={getCtaSpots(slug)} posts={posts} />
        </>
      }
      mobileFeature={
        <>
          {isDealerNetwork && <DealerSearch layout="mobile" />}
          {isQuiz && <StyleQuiz layout="mobile" />}
        </>
      }
    />
  );
}
