import type { MetadataRoute } from "next";
import { getAuthoredPages } from "@/lib/authored-pages";
import { getAllPageSpecs } from "@/lib/pages";
import { listPublishedPosts } from "@/lib/posts";
import { getProducts } from "@/lib/products";
import { getSpotArticles } from "@/lib/spot-articles";
import { SITE } from "@/lib/site-config";
import { getAllSubPages } from "@/lib/subpages";

/**
 * Sitemap DAY DU.
 *
 * Truoc day chi liet ke 6 trang chinh va 31 trang con — bo sot 17 trang san
 * pham, 4 trang tu soan va toan bo bai viet. Google van tim ra chung qua lien
 * ket noi bo, nhung cham hon han, va trang nao it lien ket tro toi thi co khi
 * khong bao gio duoc thu thap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");
  const now = new Date();

  const mains = getAllPageSpecs().map((page) => ({
    url: `${base}${page.route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: page.slug === "home" ? 1 : 0.9,
  }));

  const subs = getAllSubPages().map((page) => ({
    url: `${base}${page.route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    // Trang cang sau thi do uu tien cang thap.
    priority: Math.max(0.4, 0.8 - (page.slug.split("/").length - 2) * 0.15),
  }));

  const products = getProducts().map((product) => ({
    url: `${base}${product.route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const authored = getAuthoredPages().map((page) => ({
    url: `${base}/${page.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Bai viet mo ra tu nut "XEM THÊM" — moi bai mot duong dan rieng.
  const spotArticles = getSpotArticles().map((article) => ({
    url: `${base}${article.route}`,
    lastModified: article.date ? new Date(article.date) : now,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  // Bai viet den tu CSDL. Chua cau hinh Supabase thi `listPublishedPosts` tra
  // mang rong chu khong nem — sitemap van sinh duoc nhu thuong.
  const posts = (await listPublishedPosts()).map((post) => ({
    url: `${base}/bai-viet/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [...mains, ...subs, ...products, ...authored, ...spotArticles, ...posts];
}
