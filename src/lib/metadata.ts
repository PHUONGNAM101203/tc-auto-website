import type { Metadata } from "next";
import { getPageSpec } from "./pages";
import { PAGE_DESCRIPTIONS, SITE } from "./site-config";
import type { PageSlug } from "./types";

/**
 * Anh chia se MAC DINH.
 *
 * Next KHONG gop sau khoi `openGraph`: trang nao tu khai `openGraph` la thay
 * nguyen khoi cua layout goc, nen khai anh mac dinh o goc khong du — trang tu
 * soan, trang bai viet va trang san pham van khong co anh. Dung hang so nay o
 * moi cho tu khai.
 *
 * Thieu anh thi link chia se tren Facebook, Zalo hay trong cau tra loi cua
 * tro ly AI chi con mot dong chu tran.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/slices/home-0.webp",
  width: 2880,
  height: 1800,
  alt: SITE.name,
} as const;

/** Metadata dong nhat cho 6 trang chinh, sinh tu page spec. */
export function pageMetadata(slug: PageSlug): Metadata {
  const page = getPageSpec(slug);
  const description = PAGE_DESCRIPTIONS[slug] ?? SITE.description;
  const title = slug === "home" ? SITE.name : `${page.title} | ${SITE.name}`;
  const canonical = page.route;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: SITE.locale,
      type: "website",
      images: [{ url: page.slices[0]?.src ?? "/slices/home-0.webp", width: 2880, height: 1800 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
