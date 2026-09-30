import data from "@/data/gallery.json";
import type { Box, CoverPhoto } from "./coverflow";

/**
 * Dai anh "BỘ SƯU TẬP" tren trang Trai nghiem > Khoanh khac.
 *
 * Thiet ke ve chet ba tam anh le ra hai ben kem mui ten "‹ ›" — y la mot bang
 * chuyen. Khach muon no tu chay va bam vao tam nao thi tam do chay vao giua
 * (30/09/2026). Dai ve chet da duoc xoa khoi anh nen —
 * xem tools/brand/extract-gallery.py.
 */

const RAW = data as unknown as {
  readonly page: string;
  readonly centre: Box;
  readonly step: number;
  readonly photos: readonly CoverPhoto[];
};

export const GALLERY_CENTRE = RAW.centre;
export const GALLERY_STEP = RAW.step;

export function getGalleryPhotos(slug: string): readonly CoverPhoto[] {
  return slug === RAW.page ? RAW.photos : [];
}
