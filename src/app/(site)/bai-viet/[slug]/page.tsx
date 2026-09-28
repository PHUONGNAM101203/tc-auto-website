import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/site/PostArticle";
import { getPublishedPost } from "@/lib/posts";
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
      images: post.coverUrl ? [{ url: post.coverUrl }] : undefined,
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

  return <PostArticle post={post} />;
}
