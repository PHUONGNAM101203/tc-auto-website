/**
 * Kieu du lieu va phep tinh dung chung cho hai bang chuyen anh:
 * "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" (trang Giai phap) va "BỘ SƯU TẬP" (Khoảnh khắc).
 */

export interface CoverPhoto {
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

/**
 * Do lech cua mot tam so voi cho giua, tinh theo so bac.
 *
 * Chay VONG: voi bon tam thi tam thu 3 nam ben trai gan hon la ben phai. Nho
 * vay bam tam nao cung chi truot mot buoc ngan nhat.
 */
export function offsetFrom(index: number, centre: number, count: number): number {
  const raw = (((index - centre) % count) + count) % count;
  // `>=` chu khong phai `>`: voi so tam CHAN, tam nam dung doi dien duoc day
  // sang TRAI. Nho vay bon tam luon rai thanh -2, -1, 0, +1 — hai ben giua
  // deu hon la 0, +1, +2, -1.
  return raw >= count / 2 ? raw - count : raw;
}
