import { describe, expect, it } from "vitest";
import {
  hasRelatedStrip,
  RELATED_BACKGROUND,
  RELATED_BOX,
  RELATED_CARD,
  RELATED_CARDS,
  RELATED_PITCH,
  repeatCount,
  repeatedCards,
} from "@/lib/related-strip";
import { getAllSubPages } from "@/lib/subpages";

/**
 * Dai the "CAC BAI VIET KHAC" tu cuon ngang.
 */
describe("dải thẻ bài viết khác", () => {
  it("hình học nằm gọn trong canvas 1440px", () => {
    expect(RELATED_BOX.x).toBeGreaterThanOrEqual(0);
    expect(RELATED_BOX.x + RELATED_BOX.width).toBeLessThanOrEqual(1440);
    expect(RELATED_BOX.height).toBeGreaterThan(RELATED_CARD.height);
  });

  it("màu nền đúng dạng mã màu, để phủ kín ảnh nền bên dưới", () => {
    // Dai PHU LEN anh nen chu khong xoa gi — nen mau phai dac va dung mau nen
    // cua trang, khong thi lo ra vien.
    expect(RELATED_BACKGROUND).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("mỗi thẻ có ảnh riêng, không trùng mã", () => {
    expect(RELATED_CARDS.length).toBeGreaterThanOrEqual(2);
    const ids = new Set<string>();
    for (const card of RELATED_CARDS) {
      expect(card.src).toMatch(/^\/related\/.+\.webp$/);
      expect(ids.has(card.id), `trùng mã ${card.id}`).toBe(false);
      ids.add(card.id);
    }
  });

  it("thẻ nào chưa có tiêu đề thì để TRỐNG chứ không đoán bừa", () => {
    // Hai the ngoai cung bi cat mat chu trong thiet ke. De trong thi component
    // bo phan chu di; dien chu bia ra thi khach khong biet ma sua.
    const titled = RELATED_CARDS.filter((c) => c.title.trim().length > 0);
    expect(titled.length).toBeGreaterThan(0);
    for (const card of RELATED_CARDS) {
      expect(typeof card.title).toBe("string");
    }
  });

  it("bước lặp bằng bề ngang thẻ cộng khoảng hở", () => {
    expect(RELATED_PITCH).toBe(RELATED_CARD.width + RELATED_CARD.gap);
    expect(RELATED_CARD.gap).toBeGreaterThan(0);
  });

  it("lặp đủ dài để dải không bao giờ hở khoảng trống", () => {
    for (const view of [1440, 2000, 3000]) {
      const cards = repeatedCards(view);
      const total = cards.length * RELATED_PITCH;
      // Phai phu het khung nhin CONG mot chu ky — vi vong chay dich trai dung
      // mot chu ky roi nhay ve 0.
      expect(total, `khung ${view}px`).toBeGreaterThanOrEqual(
        view + RELATED_CARDS.length * RELATED_PITCH,
      );
    }
  });

  it("số bản sao luôn là bội nguyên của danh sách gốc", () => {
    // Khong phai boi nguyen thi moc nhay ve 0 bi lech va dai giat mot cai.
    const cards = repeatedCards(1440);
    expect(cards.length % RELATED_CARDS.length).toBe(0);
    expect(repeatCount(1440)).toBeGreaterThanOrEqual(2);
  });

  it("mỗi bản sao có khoá riêng để React không dựng nhầm thẻ", () => {
    const keys = repeatedCards(1440).map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("thứ tự thẻ trong bản lặp đúng chu kỳ danh sách gốc", () => {
    const cards = repeatedCards(1440);
    for (let i = 0; i < cards.length; i += 1) {
      expect(cards[i].id).toBe(RELATED_CARDS[i % RELATED_CARDS.length].id);
    }
  });

  it("chỉ bật trên trang CÓ THẬT", () => {
    const routes = new Set(getAllSubPages().map((p) => p.slug));
    const on = getAllSubPages().filter((p) => hasRelatedStrip(p.slug));
    expect(on.length).toBeGreaterThan(0);
    for (const page of on) {
      expect(routes.has(page.slug)).toBe(true);
    }
    expect(hasRelatedStrip("khong-ton-tai")).toBe(false);
  });
});
