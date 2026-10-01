import { describe, expect, it } from "vitest";
import { headingAlreadyShown, normalise } from "@/lib/mobile-heading";

describe("lọc tiêu đề trùng của dải ảnh", () => {
  it("bỏ dấu, bỏ dấu câu và không phân biệt hoa thường", () => {
    expect(normalise("CÁC DỰ ÁN ĐÃ TRIỂN KHAI")).toBe("cac du an da trien khai");
    expect(normalise("Các dự án đã triển khai")).toBe("cac du an da trien khai");
  });

  it("nhận ra tiêu đề đã có trong mạch chữ của trang", () => {
    expect(
      headingAlreadyShown("Các dự án đã triển khai", ["PHIM CÁCH NHIỆT", "CÁC DỰ ÁN ĐÃ TRIỂN KHAI"]),
    ).toBe(true);
    expect(headingAlreadyShown("Bộ sưu tập", ["CÁC KHOẢNH KHẮC"])).toBe(false);
  });

  it("nhãn rỗng thì coi như đã có — không in ra một dòng trống", () => {
    expect(headingAlreadyShown("", [])).toBe(true);
    expect(headingAlreadyShown("   ", [])).toBe(true);
  });
});
