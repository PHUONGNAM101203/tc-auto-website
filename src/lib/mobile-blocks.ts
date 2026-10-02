import { getLiftCards } from "./lift-cards";
import { getPhotoSliders } from "./photo-sliders";
import { getProjectPhotos, PROJECT_CENTRE } from "./projects";
import { SOLUTION_CARD, SOLUTION_CARDS } from "./solution-cards";
import type { PageSlug } from "./types";

/**
 * Cac KHOI cua ban desktop duoc dua xuong ban mobile.
 *
 * Ban mobile truoc day chi co chu va mot vai o anh; bang anh, dai the va cac
 * the noi deu chi co tren desktop — khach bao thieu (30/09/2026).
 *
 * ── Vi sao xep theo `y` ────────────────────────────────────────────────────
 * Cac muc chu cua ban mobile duoc sinh tu chinh cac phan tu tren canvas, nen
 * moi muc deu biet no nam o do cao nao. Cac khoi o day cung vay. Tron hai danh
 * sach roi xep theo `y` thi ban mobile doc theo DUNG THU TU cua ban desktop —
 * khong phai xep tay va khong lo lech khi thiet ke doi.
 *
 * Du lieu lay tu dung nguon cua ban desktop, khong chep lai.
 */

export interface MobileTile {
  readonly href: string;
  readonly src: string;
  /** Ban hep 360px — xem tools/brand/make-mobile-products.py. */
  readonly mobileSrc?: string;
  /** De trong khi tieu de da nam san trong anh — tranh doc thay hai lan. */
  readonly title: string;
  readonly subtitle: string;
  /**
   * Ten de doc cho trinh doc man hinh. LUON co, ke ca khi `title` de trong.
   *
   * Khong co no thi the anh thanh mot lien ket KHONG CO TEN: chu nam trong
   * anh nen may doc chi doc duoc "link", nguoi dung khong biet bam vao se di
   * dau. Do duoc 7 lien ket nhu vay tren trang chu ban dien thoai.
   */
  readonly label: string;
}

export type MobileBlock =
  | {
      readonly kind: "carousel";
      readonly id: string;
      readonly y: number;
      readonly label: string;
      /** Ti le khung anh, de cho khong nhay khi anh tai xong. */
      readonly ratio: string;
      readonly slides: readonly { key: string; src: string; alt: string }[];
    }
  | {
      readonly kind: "tiles";
      readonly id: string;
      readonly y: number;
      readonly label: string;
      /** Ti le khung cho MOI the trong luoi, de chung cao bang nhau. */
      readonly ratio: string;
      readonly tiles: readonly MobileTile[];
    };

function photoBlocks(slug: PageSlug): MobileBlock[] {
  return getPhotoSliders(slug).map((slider) => ({
    kind: "carousel" as const,
    id: slider.id,
    y: slider.box.y,
    label: slider.label,
    ratio: `${slider.box.width} / ${slider.box.height}`,
    slides: slider.slides.map((src, index) => ({
      key: `${slider.id}-${index}`,
      src,
      alt: index === 0 ? slider.label : "",
    })),
  }));
}

/**
 * Dai "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" o cuoi trang Giai phap.
 *
 * Tren desktop day la mot bang chuyen co chieu sau (`ProjectCoverflow`): bam
 * vao tam nao thi tam do chay vao giua. Phep nghieng do dua tren toa do canvas
 * 1440px nen khong mang xuong dien thoai duoc — ban mobile dung lai bang
 * `MobileCarousel`, cuon ngang va tu chay, tu CUNG BON TAM ANH GOC.
 *
 * Thieu khoi nay thi tren dien thoai trang Giai phap mat han phan dan chung
 * duy nhat cua no: bon le ky ket dai ly.
 */
function projectBlock(slug: PageSlug): MobileBlock[] {
  const photos = getProjectPhotos(slug);
  if (photos.length === 0) {
    return [];
  }
  return [
    {
      kind: "carousel",
      id: "du-an",
      y: PROJECT_CENTRE.y,
      label: "Các dự án đã triển khai",
      ratio: `${PROJECT_CENTRE.width} / ${PROJECT_CENTRE.height}`,
      slides: photos.map((photo) => ({
        key: photo.id,
        // Mac dinh la ban hep; trinh duyet nao can net hon thi lay ban goc
        // qua `srcSet`. Khong lam vay thi trang Giai phap tren dien thoai
        // NANG HON tren may ban — cua `verify:weight` bat dung cho do sau khi
        // ba tam nay duoc thay bang ban goc 1920px.
        src: photo.mobileSrc ?? photo.src,
        srcSet: photo.mobileSrc
          ? `${photo.mobileSrc} 720w, ${photo.src} 1920w`
          : undefined,
        alt: photo.alt,
      })),
    },
  ];
}

function solutionBlock(slug: PageSlug): MobileBlock[] {
  if (slug !== "home") {
    return [];
  }
  return [
    {
      kind: "tiles",
      id: "giai-phap",
      // Dai the "Giải pháp" tren trang chu, do tu chinh ban thiet ke.
      y: 1458,
      label: "Giải pháp",
      ratio: `${SOLUTION_CARD.width} / ${SOLUTION_CARD.height}`,
      // `labelInCss` = the nay KHONG co chu trong anh nen phai tu ve; the con
      // lai thi chu da nam san trong anh, in lai la doc thay hai lan.
      tiles: SOLUTION_CARDS.map((card) => ({
        href: card.href,
        src: card.src,
        title: card.labelInCss ? card.title : "",
        subtitle: card.labelInCss ? card.subtitle : "",
        label: [card.title, card.subtitle].filter(Boolean).join(" — "),
      })),
    },
  ];
}

function liftBlocks(slug: PageSlug): MobileBlock[] {
  const groups = new Map<string, MobileTile[]>();
  const tops = new Map<string, number>();
  for (const card of getLiftCards(slug)) {
    // Xem `hideOnMobile` trong lift-cards.ts: vai the chi la vung bam nam
    // duoi mot thanh phan khac, anh cua chung gan nhu trong.
    if (card.hideOnMobile) {
      continue;
    }
    groups.set(card.group, [
      ...(groups.get(card.group) ?? []),
      {
        href: card.href,
        src: card.src,
        mobileSrc: card.mobileSrc,
        title: card.captionInImage ? "" : card.title,
        subtitle: card.captionInImage ? "" : card.subtitle,
        label: [card.title, card.subtitle].filter(Boolean).join(" — "),
      },
    ]);
    tops.set(card.group, Math.min(tops.get(card.group) ?? card.y, card.y));
  }
  const shape = new Map<string, string>();
  for (const card of getLiftCards(slug)) {
    if (card.hideOnMobile) {
      continue;
    }
    shape.set(card.group, `${card.width} / ${card.height}`);
  }
  return [...groups].map(([name, tiles]) => ({
    kind: "tiles" as const,
    id: name,
    y: tops.get(name) ?? 0,
    ratio: shape.get(name) ?? "3 / 4",
    // Nhan lay tu chinh cac the: chung cung mot cum thi cung mot chu de.
    label: "",
    tiles,
  }));
}

export function getMobileBlocks(slug: PageSlug): readonly MobileBlock[] {
  return [
    ...photoBlocks(slug),
    ...solutionBlock(slug),
    ...liftBlocks(slug),
    ...projectBlock(slug),
  ].sort(
    (a, b) => a.y - b.y,
  );
}
