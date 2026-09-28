import type { MetadataRoute } from "next";
import { getAllPageSpecs } from "@/lib/pages";
import { SITE } from "@/lib/site-config";
import { getAllSubPages } from "@/lib/subpages";

/** Sitemap day du: 6 trang chinh + 31 trang con. */
export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...mains, ...subs];
}
