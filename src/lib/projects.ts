import data from "@/data/projects.json";

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

export interface ProjectPhoto {
  readonly id: string;
  readonly alt: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

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

/**
 * Do lech cua mot tam so voi cho giua, tinh theo so bac.
 *
 * Chay VONG: voi bon tam thi tam thu 3 nam ben trai gan hon la ben phai. Nho
 * vay bam tam nao cung chi truot mot buoc ngan nhat.
 */
export function offsetFrom(index: number, centre: number, count: number): number {
  const raw = ((index - centre) % count + count) % count;
  // `>=` chu khong phai `>`: voi so tam CHAN, tam nam dung doi dien duoc day
  // sang TRAI. Nho vay bon tam luon rai thanh -2, -1, 0, +1 — hai ben giua
  // deu hon la 0, +1, +2, -1.
  return raw >= count / 2 ? raw - count : raw;
}
