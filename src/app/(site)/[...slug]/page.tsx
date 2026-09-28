import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PpfCarousel } from "@/components/site/PpfCarousel";
import { StyleQuiz } from "@/components/site/StyleQuiz";
import { DealerSearch } from "@/components/site/DealerSearch";
import { Pagination } from "@/components/site/Pagination";
import { ReadMore } from "@/components/site/ReadMore";
import { AuthoredPage } from "@/components/site/AuthoredPage";
import { SubPageShell } from "@/components/site/SubPageShell";
import { getHotspots } from "@/lib/hotspots";
import { getCtaSpots } from "@/lib/cta-links";
import { getPagination } from "@/lib/pagination";
import { listPublishedPosts } from "@/lib/posts";
import { SITE } from "@/lib/site-config";
import { getAuthoredPage, getAuthoredSlugs } from "@/lib/authored-pages";
import { getChildren, getSubPage, getSubPageSlugs } from "@/lib/subpages";

export const revalidate = 300;
/** Chi 31 slug duoc sinh tinh ton tai — moi duong dan khac tra 404. */
export const dynamicParams = false;

export function generateStaticParams(): { slug: string[] }[] {
  // 31 trang cat tu thiet ke + cac trang do ta tu soan (muc co nut CTA nhung
  // thiet ke khong ve trang con).
  return [...getSubPageSlugs(), ...getAuthoredSlugs()].map((slug) => ({
    slug: slug.split("/"),
  }));
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
  if (!page) {
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
      },
    };
  }

  const description = `${page.title} — ${SITE.name}. ${SITE.description}`;

  return {
    title: `${page.title} | ${SITE.name}`,
    description,
    alternates: { canonical: page.route },
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

  if (!page) {
    const authored = getAuthoredPage(slug);
    if (!authored) {
      notFound();
    }
    return <AuthoredPage page={authored} />;
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
  const pager = getPagination(slug);
  const hotspots = getHotspots(slug);

  /**
   * Nut nao DA co vung bam rieng (bang hotspots) thi khong phu them lop
   * "xem them" len nua — neu khong se co hai lop chong nhau tren cung mot nut.
   */
  const covered = (spot: { x: number; y: number; w: number; h: number }) =>
    hotspots.some(
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
          {pager && <Pagination model={pager} label={page.title} />}
          <ReadMore spots={getCtaSpots(slug).filter((spot) => !covered(spot))} posts={posts} />
        </>
      }
    />
  );
}
