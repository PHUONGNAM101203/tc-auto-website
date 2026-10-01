import { describe, expect, it } from "vitest";
import { CANONICAL_OF, canonicalRouteOf, isDuplicateOfAnother } from "@/lib/canonical";
import { getSubPage } from "@/lib/subpages";

describe("bản chính khi hai đường dẫn cùng một nội dung", () => {
  it("bản phụ trỏ canonical sang bản chính", () => {
    expect(
      canonicalRouteOf(
        "giai-phap/du-an/dai-ly-winca-pham-gia-auto",
        "/giai-phap/du-an/dai-ly-winca-pham-gia-auto",
      ),
    ).toBe("/dai-ly/chan-dung-dai-ly/dai-ly-winca-pham-gia-auto");
  });

  it("trang bình thường thì canonical là chính nó", () => {
    expect(canonicalRouteOf("giai-phap/man-hinh", "/giai-phap/man-hinh")).toBe(
      "/giai-phap/man-hinh",
    );
  });

  it("mọi bản chính được khai đều PHẢI tồn tại — không trỏ vào hư không", () => {
    for (const [phu, chinh] of Object.entries(CANONICAL_OF)) {
      expect(getSubPage(phu), `bản phụ ${phu} phải có thật`).not.toBeNull();
      expect(getSubPage(chinh), `bản chính ${chinh} phải có thật`).not.toBeNull();
      expect(phu).not.toBe(chinh);
    }
  });

  it("không có chuỗi nối tiếp — bản chính không được lại là bản phụ của ai", () => {
    for (const chinh of Object.values(CANONICAL_OF)) {
      expect(isDuplicateOfAnother(chinh)).toBe(false);
    }
  });
});
