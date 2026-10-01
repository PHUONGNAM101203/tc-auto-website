import { GALLERY_CENTRE, getGalleryPhotos } from "./gallery";
import {
  hasRelatedStrip,
  RELATED_BOX,
  RELATED_CARD,
  RELATED_CARDS,
} from "./related-strip";
import type { MobileBlock } from "./mobile-blocks";

/**
 * Cac DAI cua trang con duoc dua xuong ban dien thoai.
 *
 * Ra soat lai toan bo 31 trang con (01/10/2026) phat hien hai dai chi co tren
 * desktop: bang "BỘ SƯU TẬP" tren trang Khoảnh khắc va dai "CÁC BÀI VIẾT KHÁC"
 * o cuoi trang bai viet. Ca hai deu la bang chuyen co chieu sau, dung toa do
 * canvas 1440px, nen duoi 900px thi mat han.
 *
 * Tra ve dung kieu `MobileBlock` cua 6 trang chinh de dung chung
 * `MobileStrip` — hai ben khong duoc trong khac nhau.
 */
export function getMobileStrips(slug: string): readonly MobileBlock[] {
  const out: MobileBlock[] = [];

  const gallery = getGalleryPhotos(slug);
  if (gallery.length > 0) {
    out.push({
      kind: "carousel",
      id: "bo-suu-tap",
      y: GALLERY_CENTRE.y,
      label: "Bộ sưu tập",
      ratio: `${GALLERY_CENTRE.width} / ${GALLERY_CENTRE.height}`,
      slides: gallery.map((photo) => ({
        key: photo.id,
        src: photo.src,
        alt: photo.alt,
      })),
    });
  }

  if (hasRelatedStrip(slug)) {
    out.push({
      kind: "carousel",
      id: "bai-viet-khac",
      y: RELATED_BOX.y,
      label: "Các bài viết khác",
      ratio: `${RELATED_CARD.width} / ${RELATED_CARD.height}`,
      // Dung `carousel` chu khong phai `tiles`: ca ba the deu co `href` rong
      // (thiet ke chua tro toi bai nao), ma `tiles` thi moi o la mot lien ket.
      // Lam the se sinh ra ba lien ket dan di dau khong biet.
      slides: RELATED_CARDS.map((card) => ({
        key: card.id,
        src: card.src,
        alt: card.title || "",
      })),
    });
  }

  return out.sort((a, b) => a.y - b.y);
}
