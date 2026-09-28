import home from "@/data/pages/home.json";
import traiNghiem from "@/data/pages/trai-nghiem.json";
import giaiPhap from "@/data/pages/giai-phap.json";
import congNghe from "@/data/pages/cong-nghe.json";
import daiLy from "@/data/pages/dai-ly.json";
import nhanSu from "@/data/pages/nhan-su.json";

import { parsePageSpec } from "./page-spec-schema";
import type { NavSpec } from "./types";
import { PAGE_SLUGS, type PageIndexEntry, type PageSlug, type PageSpec } from "./types";

/**
 * Trang chu KHONG co muc nav nao dang duoc chon.
 *
 * Frame Home.png goc danh dau 'TRẢI NGHIỆM' — day la loi cua ban thiet ke
 * (header bi copy tu frame khac). Neu giu nguyen, nguoi dung dang o trang chu
 * lai tuong minh dang o trang Trai nghiem.
 * Ghi nhan trong src/lib/design-deviations.ts.
 */
function clearActiveNav(spec: PageSpec): PageSpec {
  return {
    ...spec,
    nav: spec.nav.map((entry): NavSpec => ({ ...entry, active: false })),
  };
}

/** Xac thuc ngay khi import: parser sinh sai se lam build do thay vi render lech. */
const REGISTRY: Readonly<Record<PageSlug, PageSpec>> = {
  home: clearActiveNav(parsePageSpec(home, "home")),
  "trai-nghiem": parsePageSpec(traiNghiem, "trai-nghiem"),
  "giai-phap": parsePageSpec(giaiPhap, "giai-phap"),
  "cong-nghe": parsePageSpec(congNghe, "cong-nghe"),
  "dai-ly": parsePageSpec(daiLy, "dai-ly"),
  "nhan-su": parsePageSpec(nhanSu, "nhan-su"),
};

export function isPageSlug(value: string): value is PageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(value);
}

/** Lay page spec goc (bat buoc ton tai — slug la union type). */
export function getPageSpec(slug: PageSlug): PageSpec {
  return REGISTRY[slug];
}

export function getAllPageSpecs(): readonly PageSpec[] {
  return PAGE_SLUGS.map((slug) => REGISTRY[slug]);
}

export function getPageIndex(): readonly PageIndexEntry[] {
  return getAllPageSpecs().map((page) => ({
    slug: page.slug,
    route: page.route,
    title: page.title,
    height: page.height,
    items: page.items.length,
    slices: page.slices.length,
  }));
}

/** Route -> slug, dung cho middleware / breadcrumb. */
export function slugFromRoute(route: string): PageSlug | null {
  const normalised = route === "/" ? "/" : route.replace(/\/+$/, "");
  return getAllPageSpecs().find((page) => page.route === normalised)?.slug ?? null;
}
