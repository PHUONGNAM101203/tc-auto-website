import raw from "@/data/hero-slides.json";
import { assetUrl } from "./asset-url";

/**
 * Bang hero tren trang chu.
 *
 * Thiet ke ve san 5 vach chi muc va hai mui ten, nghia la co 5 slide. Nhung
 * trong bo file thiet ke chi co MOT anh hero — 4 anh con lai chua co. Vi vay
 * slider chi tu bat khi co tu 2 slide tro len; con mot slide thi khong ve dieu
 * khien nao ca, de khong tao ra nut bam gia.
 */

export interface SlideVariant {
  readonly src: string;
  readonly scale: number;
}

export interface HeroSlide {
  readonly id: string;
  readonly alt: string;
  readonly src: string;
  readonly srcSet: readonly SlideVariant[];
  /**
   * Ban HEP 720px, chi dung cho bang hero tren dien thoai.
   *
   * O do khung anh rong khoang 350px, ma ban @2x rong 2880 — gap bon lan muc
   * can. Xem tools/brand/make-mobile-hero.py.
   */
  readonly mobileSrc?: string;
  /** true = anh muon tam de gui khach review, chua phai anh thiet ke cho hero. */
  readonly placeholder?: boolean;
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface IndicatorBox extends Box {
  readonly dashWidth: number;
  readonly activeWidth: number;
  readonly gap: number;
}

interface HeroData {
  readonly region: Box;
  readonly controls: {
    readonly prev: Box;
    readonly next: Box;
    readonly indicator: IndicatorBox;
  };
  readonly slides: readonly HeroSlide[];
}

const DATA = raw as unknown as HeroData;

export const HERO_REGION = DATA.region;
export const HERO_CONTROLS = DATA.controls;

export function getHeroSlides(): readonly HeroSlide[] {
  return DATA.slides.map((slide) => ({
    ...slide,
    src: assetUrl(slide.src),
    mobileSrc: slide.mobileSrc ? assetUrl(slide.mobileSrc) : undefined,
    srcSet: slide.srcSet.map((variant) => ({ ...variant, src: assetUrl(variant.src) })),
  }));
}

/** Slider chi co y nghia khi co tu 2 slide tro len. */
export function heroSliderEnabled(): boolean {
  return DATA.slides.length >= 2;
}

export function heroSlideCount(): number {
  return DATA.slides.length;
}
