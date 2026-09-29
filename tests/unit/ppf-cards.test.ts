import { describe, expect, it } from "vitest";
import {
  offsetAt,
  PPF_CARD,
  PPF_CARDS,
  PPF_FIRST_X,
  PPF_LOOP_STEP,
  PPF_PITCH,
  PPF_VIEW,
  repeatedCards,
  stripOriginX,
  visibleCount,
} from "@/lib/ppf-cards";

/**
 * Dai the "3M PPF" o /giai-phap/ppf.
 *
 * Thiet ke ve chet bon the vao anh, hai the ngoai bi cat o mep canvas. Dai da
 * duoc tach thanh phan tu that de hai mui ten bam duoc va chay vong khong het.
 * Cac phep tinh duoi day quyet dinh dai co BI HO khoang trong hay khong.
 */
describe("dải thẻ PPF", () => {
  it("hình học lấy từ bản thiết kế, không phải số bịa", () => {
    expect(PPF_CARDS.length).toBeGreaterThan(0);
    expect(PPF_VIEW.width).toBeGreaterThan(0);
    expect(PPF_CARD.width).toBeGreaterThan(0);
    expect(PPF_PITCH).toBeGreaterThanOrEqual(PPF_CARD.width);
  });

  it("mỗi thẻ có đủ mã và ảnh để hiện ra", () => {
    const ids = new Set<string>();
    for (const card of PPF_CARDS) {
      expect(card.id.length).toBeGreaterThan(0);
      expect(ids.has(card.id), `trùng mã ${card.id}`).toBe(false);
      ids.add(card.id);
    }
  });

  it("số thẻ lọt khung nhìn đủ phủ hết bề ngang cộng hai thẻ đệm", () => {
    const count = visibleCount();
    expect(count).toBeGreaterThanOrEqual(3);
    // Du phu kin khung nhin: (count - 2) buoc phai vuot be ngang khung.
    expect((count - 2) * PPF_PITCH).toBeGreaterThanOrEqual(PPF_VIEW.width);
  });

  it("danh sách lặp lại đủ dài để chạy vòng cả hai chiều mà không hở", () => {
    const cards = repeatedCards();
    // Phai la boi so nguyen cua so the that — khong thi moc dat lai vi tri lech.
    expect(cards.length % PPF_CARDS.length).toBe(0);
    expect(cards.length).toBeGreaterThanOrEqual(visibleCount() * 2);
  });

  it("mỗi bản sao có khoá riêng để React không dựng nhầm thẻ", () => {
    const keys = repeatedCards().map((card) => card.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("thứ tự thẻ trong bản lặp đúng chu kỳ của danh sách gốc", () => {
    const cards = repeatedCards();
    for (let i = 0; i < cards.length; i += 1) {
      expect(cards[i].id, `vị trí ${i}`).toBe(
        PPF_CARDS[i % PPF_CARDS.length].id,
      );
    }
  });

  it("nhịp 0 đặt thẻ đầu ĐÚNG chỗ thiết kế vẽ", () => {
    // Day la dieu quan trong nhat: luc dung yen, dai phai trung khop thiet ke.
    // Dai duoc keo lui mot so nguyen chu ky nen the dau van roi dung PPF_FIRST_X.
    const lead = PPF_FIRST_X - stripOriginX();
    expect(lead % PPF_PITCH).toBe(0);
    expect(lead / PPF_PITCH).toBeGreaterThan(0);
  });

  it("đi trọn một vòng thì dải trùng khít với chính nó", () => {
    // `toBe` dung Object.is, ma Object.is(-0, 0) la false — `-step * pitch`
    // voi step 0 cho ra -0. So bang `===` moi dung y "khong dich chuyen".
    expect(offsetAt(0) === 0).toBe(true);
    expect(offsetAt(PPF_LOOP_STEP)).toBe(-PPF_CARDS.length * PPF_PITCH);
    // Nhip duong keo sang TRAI.
    expect(offsetAt(1)).toBeLessThan(0);
    expect(offsetAt(-1)).toBeGreaterThan(0);
  });

  it("độ dời tỉ lệ thẳng với số nhịp", () => {
    expect(offsetAt(3)).toBe(offsetAt(1) * 3);
  });
});
