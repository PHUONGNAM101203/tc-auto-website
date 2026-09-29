import { describe, expect, it } from "vitest";
import {
  getMobileHero,
  getMobileSections,
  headingLines,
} from "@/lib/mobile-sections";
import { asset } from "@/lib/asset-version";
import { getAllPageSpecs } from "@/lib/pages";
import type { PageSlug } from "@/lib/types";

/**
 * Lop mobile cua 6 trang chinh. Duoi 900px canvas bi an han va ban mobile
 * duoc dung lai TU DU LIEU chu khong thu nho anh — nen du lieu o day sai la
 * ban mobile hong, ma gate pixel chi do ban desktop nen khong bat duoc.
 */
describe("dữ liệu bản mobile", () => {
  const slugs = getAllPageSpecs().map((spec) => spec.slug as PageSlug);

  it("mọi trang chính đều có ảnh đầu trang", () => {
    for (const slug of slugs) {
      const hero = getMobileHero(slug);
      expect(hero, `thiếu ảnh đầu trang cho ${slug}`).toBeTruthy();
      expect(hero?.image ?? "", slug).not.toBe("");
    }
  });

  it("mọi trang chính đều có ít nhất một mục", () => {
    for (const slug of slugs) {
      expect(getMobileSections(slug).length, slug).toBeGreaterThan(0);
    }
  });

  it("mỗi mục đều có mã và tiêu đề", () => {
    for (const slug of slugs) {
      for (const section of getMobileSections(slug)) {
        expect(section.id.length, `${slug}/${section.id}`).toBeGreaterThan(0);
        expect(section.heading.length, `${slug}/${section.id}`).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it("chỉ đúng những mục ĐÃ BIẾT là thiếu ảnh mới được thiếu", () => {
    // Anh la TUY CHON — `MobilePage.tsx` co `section.image ? ... : null` nen
    // thieu anh thi bo qua khoi anh chu khong vo. Nhung thieu them mot muc
    // nua thi phai biet, vi do la bo tach anh khong tim thay gi o cho do.
    //
    // giai-phap-004 = nhan "PHIM CÁCH NHIỆT": trong thiet ke cho nay chi co
    // chu tren nen, khong co anh minh hoa rieng.
    const KNOWN_WITHOUT_IMAGE = new Set(["giai-phap-004"]);
    const missing: string[] = [];
    for (const slug of slugs) {
      for (const section of getMobileSections(slug)) {
        if (!section.image) {
          missing.push(section.id);
        }
      }
    }
    expect(new Set(missing)).toEqual(KNOWN_WITHOUT_IMAGE);
  });

  it("mã mục không trùng nhau trong cùng một trang", () => {
    for (const slug of slugs) {
      const ids = getMobileSections(slug).map((s) => s.id);
      expect(new Set(ids).size, slug).toBe(ids.length);
    }
  });

  it("nút nào có thì phải có đích đến thật, không để trỏ hụt", () => {
    // `getMobileSections` CO Y bo nut khi khong tra ra duoc dich: tha khong co
    // nut con hon co nut bam vao khong di dau.
    for (const slug of slugs) {
      for (const section of getMobileSections(slug)) {
        if (!section.cta) {
          continue;
        }
        expect(section.cta.label.length, section.id).toBeGreaterThan(0);
        expect(section.cta.href, section.id).toMatch(/^(\/|https?:\/\/|tel:)/);
      }
    }
  });

  it("đường dẫn lạ thì trả về rỗng chứ không ném lỗi", () => {
    expect(getMobileHero("khong-ton-tai" as PageSlug)).toBeNull();
    expect(getMobileSections("khong-ton-tai" as PageSlug)).toEqual([]);
  });
});

describe("headingLines", () => {
  it("tách tiêu đề theo đúng chỗ thiết kế xuống dòng", () => {
    expect(
      headingLines("TIÊN PHONG CÔNG NGHỆ.<br>TRẢI NGHIỆM NÂNG TẦM."),
    ).toEqual(["TIÊN PHONG CÔNG NGHỆ.", "TRẢI NGHIỆM NÂNG TẦM."]);
  });

  it("nhận mọi dạng viết của thẻ xuống dòng", () => {
    expect(headingLines("A<br/>B")).toEqual(["A", "B"]);
    expect(headingLines("A<BR />B")).toEqual(["A", "B"]);
  });

  it("không có thẻ xuống dòng thì trả về một dòng", () => {
    expect(headingLines("MỘT DÒNG")).toEqual(["MỘT DÒNG"]);
  });

  it("bỏ dòng rỗng và khoảng trắng thừa", () => {
    expect(headingLines("  A  <br><br>  B  ")).toEqual(["A", "B"]);
    expect(headingLines("")).toEqual([]);
  });
});

describe("asset", () => {
  it("gắn mã nội dung cho ảnh có trong bảng", () => {
    const stamped = asset("/brand/logo-horizontal-on-dark.png");
    expect(stamped).toMatch(
      /^\/brand\/logo-horizontal-on-dark\.png\?v=[a-z0-9]+$/,
    );
  });

  it("ảnh không có trong bảng thì trả nguyên đường dẫn", () => {
    // Quan trong: KHONG duoc gan `?v=undefined` — trinh duyet se coi do la mot
    // duong dan khac va tai lai anh moi lan dung.
    expect(asset("/khong-co-trong-bang.png")).toBe("/khong-co-trong-bang.png");
  });
});
