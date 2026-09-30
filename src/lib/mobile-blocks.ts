import { getLiftCards } from "./lift-cards";
import { getPhotoSliders } from "./photo-sliders";
import { SOLUTION_CARDS } from "./solution-cards";
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
  readonly title: string;
  readonly subtitle: string;
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
      tiles: SOLUTION_CARDS.map((card) => ({
        href: card.href,
        src: card.src,
        title: card.title,
        subtitle: card.subtitle,
      })),
    },
  ];
}

function liftBlocks(slug: PageSlug): MobileBlock[] {
  const groups = new Map<string, MobileTile[]>();
  const tops = new Map<string, number>();
  for (const card of getLiftCards(slug)) {
    groups.set(card.group, [
      ...(groups.get(card.group) ?? []),
      { href: card.href, src: card.src, title: card.title, subtitle: card.subtitle },
    ]);
    tops.set(card.group, Math.min(tops.get(card.group) ?? card.y, card.y));
  }
  return [...groups].map(([name, tiles]) => ({
    kind: "tiles" as const,
    id: name,
    y: tops.get(name) ?? 0,
    // Nhan lay tu chinh cac the: chung cung mot cum thi cung mot chu de.
    label: tiles.length > 0 ? tiles[0].subtitle : name,
    tiles,
  }));
}

export function getMobileBlocks(slug: PageSlug): readonly MobileBlock[] {
  return [...photoBlocks(slug), ...solutionBlock(slug), ...liftBlocks(slug)].sort(
    (a, b) => a.y - b.y,
  );
}
