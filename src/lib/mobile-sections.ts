import data from "@/data/mobile-sections.json";
import { CTA_LINK_MAP } from "./link-map";
import { getPageSpec } from "./pages";
import { getHeroSlides } from "./hero-slides";
import type { PageSlug } from "./types";

/**
 * Noi dung 6 trang chinh, dung cho ban MOBILE.
 *
 * Canvas 1440px khong co dan duoc: tren dien thoai no bi thu con 27%, chu than
 * bai chi con 3-4px — khong doc noi. Ban mobile vi vay duoc dung lai TU DU
 * LIEU: chu lay tu page spec, anh cat rieng bang
 * tools/brand/extract-mobile-tiles.py.
 *
 * Nho vay hai ban luon noi cung mot noi dung: sua thiet ke thi chay lai cong
 * cu, ca hai cung doi.
 */

export interface MobileSection {
  readonly id: string;
  /**
   * Do cao cua muc nay tren canvas desktop.
   *
   * Dung de tron cac muc chu voi cac KHOI (bang anh, dai the, the noi) roi xep
   * lai theo thu tu doc — nho vay ban mobile doc theo dung mach cua ban
   * desktop. Xem src/lib/mobile-blocks.ts.
   */
  readonly y: number;
  readonly label: string;
  /** Co the chua <br> cua thiet ke — hien bang cach tach dong, khong dung HTML. */
  readonly heading: string;
  readonly body: string;
  readonly image?: string;
  readonly cta: { readonly label: string; readonly href: string } | null;
}

export interface MobileHero {
  readonly image: string | null;
  readonly title: string;
  readonly slogan: string;
}

interface RawSection {
  id: string;
  label: string;
  heading: string;
  body: string;
  image?: string;
  cta: { label: string; itemId: string } | null;
}

const RAW = data as unknown as {
  heroes: Record<string, MobileHero>;
  pages: Record<string, readonly RawSection[]>;
};

/** Dich den cua mot nut: lay tu chinh page spec, neu khong co thi tra bang noi. */
function ctaHref(slug: PageSlug, itemId: string): string | null {
  const item = getPageSpec(slug)?.items.find((i) => i.id === itemId);
  return item?.href ?? CTA_LINK_MAP[itemId] ?? null;
}

export function getMobileHero(slug: PageSlug): MobileHero | null {
  return RAW.heroes[slug] ?? null;
}

export function getMobileSections(slug: PageSlug): readonly MobileSection[] {
  return (RAW.pages[slug] ?? []).map((section) => {
    const href = section.cta ? ctaHref(slug, section.cta.itemId) : null;
    return {
      id: section.id,
      y: getPageSpec(slug)?.items.find((i) => i.id === section.id)?.y ?? 0,
      label: section.label,
      heading: section.heading,
      body: section.body,
      image: section.image,
      cta: section.cta && href ? { label: section.cta.label, href } : null,
    };
  });
}

/** Tach tieu de thanh cac dong theo dung cho thiet ke xuong dong. */
export function headingLines(heading: string): readonly string[] {
  return heading
    .split(/<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Cac tam cua bang hero, doi sang dang ban mobile dung.
 *
 * Ban desktop co bang anh tu chay; ban mobile truoc day chi hien MOT tam tinh
 * — khach bao thieu (30/09/2026). Dung chung mot nguon du lieu
 * (src/data/hero-slides.json) nen hai ban khong bao gio lech noi dung.
 */
export function getMobileHeroSlides(slug: PageSlug) {
  if (slug !== "home") {
    return [];
  }
  return getHeroSlides().map((slide) => ({
    key: slide.id,
    src: slide.src,
    // Ban hep 720px di kem ban @2x 2880px. Mo ta `w` chu khong `x`: khung
    // hero tren dien thoai co dan theo be rong man hinh, ma mo ta `x` thi
    // trinh duyet chi nhin mat do diem anh. Xem tools/brand/make-mobile-hero.py.
    srcSet: slide.mobileSrc
      ? `${slide.mobileSrc} 720w, ${slide.src} 2880w`
      : undefined,
    alt: slide.alt,
  }));
}
