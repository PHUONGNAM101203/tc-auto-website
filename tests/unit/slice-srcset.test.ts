import { describe, expect, it } from "vitest";
import { CANVAS_WIDTH, sliceSizes, sliceSrcSet } from "@/lib/slice-srcset";
import { getAllPageSpecs } from "@/lib/pages";

/**
 * Cach khai do phan giai cho lat anh nen.
 *
 * ── Vi sao KHONG dung `2x`/`3x` ─────────────────────────────────────────────
 * Canvas rong 1440px duoc PHONG TO theo be rong cua so (`--tc-zoom`). Voi mo ta
 * `x`, trinh duyet chon anh CHI theo mat do diem anh cua man hinh — no khong
 * biet gi ve `zoom`. Tren man retina rong 2000px, canvas phong 1,39 lan nen can
 * 1440 x 1,39 x 2 = 4000px, nhung trinh duyet van lay ban "2x" = 2880px roi
 * keo gian ra. Ket qua: chan trang va moi thu ve chet trong anh deu MO.
 *
 * Mo ta `w` cong `sizes` thi trinh duyet tinh tu BE RONG THUC TE da bo tri —
 * ma be rong do da tinh ca zoom — nen chon dung ban.
 */
describe("sliceSrcSet", () => {
  const variants = [
    { src: "/slices/home-0.webp", scale: 2 },
    { src: "/slices/home-0@3x.webp", scale: 3 },
  ];

  it("khai bằng bề rộng thật của ảnh, không phải bội số màn hình", () => {
    const set = sliceSrcSet(variants);
    expect(set).toContain("2880w");
    expect(set).toContain("4320w");
    expect(set).not.toContain("2x");
    expect(set).not.toContain("3x ");
  });

  it("bề rộng = 1440 nhân hệ số của từng bản", () => {
    for (const variant of variants) {
      expect(sliceSrcSet([variant])).toContain(
        `${CANVAS_WIDTH * variant.scale}w`,
      );
    }
  });

  it("giữ nguyên thứ tự và ngăn cách đúng cú pháp srcset", () => {
    const set = sliceSrcSet(variants);
    const parts = set.split(", ");
    expect(parts).toHaveLength(2);
    for (const part of parts) {
      expect(part).toMatch(/^\/slices\/\S+\.webp(\?v=[a-z0-9]+)? \d+w$/);
    }
  });

  it("danh sách rỗng thì trả chuỗi rỗng, không sinh srcset hỏng", () => {
    expect(sliceSrcSet([])).toBe("");
  });

  it("sizes nói rằng lát nền trải hết bề ngang khung nhìn", () => {
    // Lat nen luon rong dung bang canvas, ma canvas luon phu het be ngang
    // cua so — nen `100vw` la dung, va no tu tinh ca phan zoom.
    expect(sliceSizes()).toBe("100vw");
  });

  it("mọi lát của 6 trang chính đều có đủ hai bản @2x và @3x", () => {
    // Thieu ban @3x la man retina rong khong co gi de chon, lai mo nhu cu.
    for (const page of getAllPageSpecs()) {
      for (const slice of page.slices) {
        const scales = slice.srcSet.map((v) => v.scale).sort();
        expect(scales, `${page.slug} ${slice.src}`).toEqual([2, 3]);
      }
    }
  });
});
