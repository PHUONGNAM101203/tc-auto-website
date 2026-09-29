import { describe, expect, it } from "vitest";
import { PAGE_DESCRIPTIONS, SITE } from "@/lib/site-config";
import {
  PHONE_HREF,
  SITE_CONTACT,
  SOCIAL,
  SOCIAL_BOX,
} from "@/lib/site-contact";
import { getAllPageSpecs } from "@/lib/pages";

/**
 * Thong tin thuong hieu va lien he.
 *
 * Chan trang cua ban desktop duoc VE CHET vao anh nen — so lieu o day doc lai
 * tu chinh `Home.png`. Sai mot chu la sai o cho nguoi dung bam vao goi dien,
 * ma anh nen thi khong the sua bang code — nen phai co test canh.
 */
describe("thông tin site", () => {
  it("có đủ tên, khẩu hiệu và mô tả", () => {
    expect(SITE.name.length).toBeGreaterThan(0);
    expect(SITE.slogan.length).toBeGreaterThan(0);
    expect(SITE.description.length).toBeGreaterThan(40);
    expect(SITE.locale).toBe("vi_VN");
  });

  it("địa chỉ gốc là URL hợp lệ, không có gạch chéo thừa ở cuối", () => {
    expect(() => new URL(SITE.url)).not.toThrow();
    expect(SITE.url.endsWith("/")).toBe(false);
  });

  it("mọi trang chính đều có mô tả riêng cho thẻ meta", () => {
    // Thieu mo ta la trang do dung mo ta chung, xau tren ket qua tim kiem.
    for (const spec of getAllPageSpecs()) {
      const description = PAGE_DESCRIPTIONS[spec.slug];
      expect(description, `thiếu mô tả cho ${spec.slug}`).toBeTruthy();
      expect(description.length, spec.slug).toBeGreaterThan(40);
    }
  });

  it("mô tả đủ ngắn để không bị Google cắt giữa chừng", () => {
    for (const [slug, description] of Object.entries(PAGE_DESCRIPTIONS)) {
      expect(description.length, slug).toBeLessThanOrEqual(320);
    }
  });
});

describe("thông tin liên hệ", () => {
  it("số điện thoại và email đúng định dạng", () => {
    expect(SITE_CONTACT.phone).toMatch(/^[\d\s]+$/);
    expect(SITE_CONTACT.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it("liên kết gọi điện đã bỏ hết khoảng trắng", () => {
    // `tel:` con khoang trang thi mot so may Android khong quay duoc.
    expect(PHONE_HREF).toBe(`tel:${SITE_CONTACT.phone.replace(/\s/g, "")}`);
    expect(PHONE_HREF).not.toMatch(/\s/);
  });

  it("có giờ làm việc để hiện ở chân trang", () => {
    expect(SITE_CONTACT.hours.length).toBeGreaterThan(0);
  });

  it("mỗi biểu tượng mạng xã hội có nhãn cho trình đọc màn hình", () => {
    expect(SOCIAL.length).toBeGreaterThan(0);
    for (const item of SOCIAL) {
      expect(item.label.length, item.id).toBeGreaterThan(0);
    }
  });

  it("biểu tượng nào chưa có liên kết thật thì để trống, không trỏ bừa", () => {
    // TC Auto chua co tai khoan Instagram — xem DESIGN.md muc 9. De nguyen
    // trong con hon tro sang mot tai khoan trung ten cua hang khac.
    for (const item of SOCIAL) {
      if (item.href) {
        expect(() => new URL(item.href!), item.id).not.toThrow();
        expect(item.href, item.id).toMatch(/^https?:\/\//);
      }
    }
  });

  it("toạ độ ba biểu tượng nằm trong canvas 1440px và không chồng nhau", () => {
    // Ba bieu tuong duoc VE SAN trong chan trang moi frame; day chi la vung
    // bam phu len. Lech ra ngoai canvas hay chong nhau la bam nham nut.
    const xs = Object.values(SOCIAL_BOX.xs);
    expect(xs.length).toBe(SOCIAL.length);
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + SOCIAL_BOX.size).toBeLessThanOrEqual(1440);
    }
    const sorted = [...xs].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(SOCIAL_BOX.size);
    }
    expect(SOCIAL_BOX.fromBottom).toBeGreaterThan(0);
  });

  it("mỗi biểu tượng đều có toạ độ riêng", () => {
    for (const item of SOCIAL) {
      expect(
        SOCIAL_BOX.xs[item.id as keyof typeof SOCIAL_BOX.xs],
        `thiếu toạ độ cho ${item.id}`,
      ).toBeGreaterThan(0);
    }
  });
});
