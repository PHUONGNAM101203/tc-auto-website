import data from "@/data/projects.json";
import type { Box, CoverPhoto } from "./coverflow";

/**
 * Dai anh "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" o cuoi trang Giai phap.
 *
 * Thiet ke ve chet mot dai nam tam anh: tam giua phang, bon tam kia nghieng
 * dan ra hai ben va bi canh canvas cat. Y la mot bang chuyen — khach muon bam
 * vao tam nao thi tam do chay vao giua (30/09/2026).
 *
 * Bon tam anh GOC (con phang) co san trong bo tai nguyen, nen dai nay dung
 * lai duoc that; dai ve chet da duoc to trang xoa di —
 * xem tools/brand/extract-projects.py.
 */

export type ProjectPhoto = CoverPhoto;

const RAW = data as unknown as {
  readonly page: string;
  readonly centre: Box;
  readonly photos: readonly ProjectPhoto[];
};

/** Cho GIUA cua dai, do tu chinh ban thiet ke. */
export const PROJECT_CENTRE = RAW.centre;

export function getProjectPhotos(slug: string): readonly ProjectPhoto[] {
  return slug === RAW.page ? RAW.photos : [];
}

export { offsetFrom } from "./coverflow";
