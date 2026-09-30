import { describe, expect, it } from "vitest";
import { getProjectPhotos, offsetFrom, PROJECT_CENTRE } from "@/lib/projects";

/**
 * Dai anh "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" — xem src/lib/projects.ts.
 */
describe("dải ảnh dự án", () => {
  const photos = getProjectPhotos("giai-phap");

  it("chỉ trang Giải pháp mới có dải này", () => {
    expect(photos.length).toBeGreaterThanOrEqual(4);
    expect(getProjectPhotos("home")).toEqual([]);
  });

  it("mỗi ảnh đều có mô tả và kích thước thật", () => {
    for (const photo of photos) {
      expect(photo.alt.length, photo.id).toBeGreaterThan(10);
      expect(photo.width).toBeGreaterThan(900);
      expect(photo.height).toBeGreaterThan(600);
      expect(photo.src).toMatch(/^\/projects\/.+\.webp(\?v=[a-z0-9]+)?$/);
    }
  });

  it("chỗ giữa lấy đúng từ bản thiết kế", () => {
    expect(PROJECT_CENTRE).toEqual({ x: 503, y: 5424, width: 416, height: 280 });
  });

  it("bậc chạy VÒNG: bấm tấm nào cũng chỉ trượt một bước ngắn nhất", () => {
    const n = 4;
    // Tam dang o giua thi bac 0.
    expect(offsetFrom(2, 2, n)).toBe(0);
    // Ke ben phai / ben trai.
    expect(offsetFrom(3, 2, n)).toBe(1);
    expect(offsetFrom(1, 2, n)).toBe(-1);
    // Tam doi dien duoc day sang TRAI, khong keo ca dai sang phai.
    expect(offsetFrom(0, 2, n)).toBe(-2);
  });

  it("bốn tấm luôn rải đều quanh chỗ giữa", () => {
    for (let centre = 0; centre < photos.length; centre += 1) {
      const steps = photos
        .map((_, index) => offsetFrom(index, centre, photos.length))
        .sort((a, b) => a - b);
      expect(steps, `giữa = ${centre}`).toEqual([-2, -1, 0, 1]);
    }
  });
});
