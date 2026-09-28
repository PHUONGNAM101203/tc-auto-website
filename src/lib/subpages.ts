import { SUBPAGE_MODULES } from "@/data/subpages/registry";
import { parseSubPageSpec, type SubPageSpec } from "./subpage-schema";
import type { PageSlug } from "./types";

/** Xac thuc toan bo spec ngay khi import module nay. */
const REGISTRY: ReadonlyMap<string, SubPageSpec> = new Map(
  Object.entries(SUBPAGE_MODULES).map(([slug, raw]) => [slug, parseSubPageSpec(raw, slug)]),
);

export function getSubPage(slug: string): SubPageSpec | null {
  return REGISTRY.get(slug) ?? null;
}

export function getAllSubPages(): readonly SubPageSpec[] {
  return [...REGISTRY.values()];
}

/** Moi slug trang con, dung cho generateStaticParams. */
export function getSubPageSlugs(): readonly string[] {
  return [...REGISTRY.keys()];
}

/** Trang con truc tiep cua mot route (1 cap, khong lay chau). */
export function getChildren(parentSlug: string): readonly SubPageSpec[] {
  const depth = parentSlug === "" ? 1 : parentSlug.split("/").length + 1;
  const prefix = parentSlug === "" ? "" : `${parentSlug}/`;

  return getAllSubPages()
    .filter(
      (page) =>
        page.slug.startsWith(prefix) &&
        page.slug !== parentSlug &&
        page.slug.split("/").length === depth,
    )
    .sort((a, b) => a.slug.localeCompare(b.slug, "vi"));
}

/** Toan bo trang con thuoc mot section (moi cap sau). */
export function getSectionPages(section: PageSlug): readonly SubPageSpec[] {
  return getAllSubPages()
    .filter((page) => page.section === section)
    .sort((a, b) => a.slug.localeCompare(b.slug, "vi"));
}

export interface SubPageStats {
  readonly total: number;
  readonly articles: number;
  readonly totalHeight: number;
  readonly totalSlices: number;
  readonly totalBytes: number;
}

export function getSubPageStats(): SubPageStats {
  const pages = getAllSubPages();
  return {
    total: pages.length,
    articles: pages.filter((page) => page.isArticle).length,
    totalHeight: pages.reduce((sum, page) => sum + page.height, 0),
    totalSlices: pages.reduce((sum, page) => sum + page.slices.length, 0),
    totalBytes: pages.reduce(
      (sum, page) => sum + page.slices.reduce((inner, slice) => inner + slice.bytes, 0),
      0,
    ),
  };
}
