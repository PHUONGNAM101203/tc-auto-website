import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/JsonLd";
import { PostArticle } from "@/components/site/PostArticle";
import { articleLd, breadcrumbLd } from "@/lib/structured-data";
import { getPublishedPost } from "@/lib/posts";
import { DEFAULT_OG_IMAGE } from "@/lib/metadata";
import { SITE } from "@/lib/site-config";

/** Bai viet den tu co so du lieu nen khong the sinh tinh truoc. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) {
    return {};
  }

  const description = post.excerpt ?? `${post.title} — ${SITE.name}`;
  return {
    title: `${post.title} | ${SITE.name}`,
    description,
    alternates: { canonical: `/bai-viet/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      url: `/bai-viet/${post.slug}`,
      siteName: SITE.name,
      locale: SITE.locale,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      // Bai chua co anh bia thi dung anh chia se mac dinh, dung de trang.
      images: post.coverUrl ? [{ url: post.coverUrl }] : [DEFAULT_OG_IMAGE],
    },
  };
}

/**
 * Trang bai viet.
 *
 * Dung chung khuon voi cac trang tu soan (.tc-doc): co dan theo be rong man
 * hinh nen doc tot tren dien thoai, khong phu thuoc canvas 1440px.
 */
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      {/* Mau Article + duong dan phan cap dat o TUYEN chu khong trong
          <PostArticle />: cai do dung chung voi khung xem truoc trong quan tri,
          ma ban nhap thi khong duoc khai la bai da xuat ban. */}
      <JsonLd
        data={articleLd({
          title: post.title,
          excerpt: post.excerpt,
          url: `/bai-viet/${post.slug}`,
          image: post.coverUrl,
          publishedAt: post.publishedAt,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: "Trang chủ", url: "/" },
          { name: post.title, url: `/bai-viet/${post.slug}` },
        ])}
      />
      <PostArticle post={post} />
    </>
  );
}
