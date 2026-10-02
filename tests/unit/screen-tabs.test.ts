import { describe, expect, it } from "vitest";
import { getBravoCards, SCREEN_GRID } from "@/lib/screen-tabs";

describe("thẻ cho tab Bravo", () => {
  it("lấy đúng ba dòng Bravo từ trang đã soạn, không chép lại", () => {
    const cards = getBravoCards();
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.name)).toEqual([
      "Bravo B10 LITE",
      "Bravo B100",
      "Bravo B100 PRO",
    ]);
  });

  it("thẻ nào cũng có ảnh và chỗ để bấm tới", () => {
    for (const card of getBravoCards()) {
      expect(card.image).toMatch(/^\/products\//);
      // Moi dong dan toi TRANG SAN PHAM cua chinh no — trang Bravo gop cu da
      // bi xoa (02/10/2026). Xem tests/unit/bravo-models.test.ts.
      expect(card.href).toBe(`/giai-phap/man-hinh/${card.id}`);
      expect(card.tagline.length).toBeGreaterThan(0);
      expect(card.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("hình học lưới đủ cho ba cột", () => {
    expect(SCREEN_GRID.columns).toHaveLength(3);
    // Khoang cach giua cac cot phai deu — neu lech thi the khong khop nen.
    const [a, b, c] = SCREEN_GRID.columns;
    expect(Math.abs(b - a - (c - b))).toBeLessThanOrEqual(1);
  });
});
