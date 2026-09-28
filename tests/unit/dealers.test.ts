import { describe, expect, it } from "vitest";
import {
  BRANDS,
  countByProvince,
  findDealers,
  MAP_PINS,
  PROVINCES,
  totalDealers,
} from "@/lib/dealers";

describe("mạng lưới đại lý", () => {
  it("có đủ dữ liệu đọc từ thiết kế", () => {
    expect(totalDealers()).toBe(16);
    expect(BRANDS).toContain("3M");
    expect(PROVINCES.length).toBe(6);
    expect(MAP_PINS.length).toBe(9);
  });

  it("mọi đại lý đều có đủ tên, khu vực, tỉnh và hãng", () => {
    for (const province of PROVINCES) {
      for (const dealer of findDealers({ brand: "3M", province }).dealers) {
        expect(dealer.name.length).toBeGreaterThan(2);
        expect(dealer.area.length).toBeGreaterThan(2);
        expect(dealer.brand).toBe("3M");
      }
    }
  });

  it("tìm được 16 đại lý 3M tại Đà Nẵng", () => {
    const result = findDealers({ brand: "3M", province: "Đà Nẵng" });
    expect(result.dealers).toHaveLength(16);
    expect(result.pending).toBe(false);
    expect(result.dealers.map((d) => d.name)).toContain("Thanh Bình Auto CMT8");
    expect(result.dealers.map((d) => d.area)).toContain("Núi Thành");
  });

  it("tỉnh chưa có dữ liệu được đánh dấu 'đang cập nhật', không phải 'không có'", () => {
    const result = findDealers({ brand: "3M", province: "Huế" });
    expect(result.dealers).toHaveLength(0);
    // pending = true nghia la thiet ke chua liet ke, KHONG phai khang dinh la trong.
    expect(result.pending).toBe(true);
  });

  it("thiếu hãng hoặc tỉnh thì không trả kết quả và cũng không báo đang cập nhật", () => {
    for (const query of [
      { brand: "", province: "Đà Nẵng" },
      { brand: "3M", province: "" },
      { brand: "", province: "" },
    ]) {
      const result = findDealers(query);
      expect(result.dealers).toHaveLength(0);
      expect(result.pending).toBe(false);
    }
  });

  it("hãng không tồn tại thì không trả bừa kết quả", () => {
    expect(findDealers({ brand: "KHONG-CO", province: "Đà Nẵng" }).dealers).toHaveLength(0);
  });

  it("không có đại lý trùng tên trong cùng khu vực", () => {
    const seen = new Set<string>();
    for (const dealer of findDealers({ brand: "3M", province: "Đà Nẵng" }).dealers) {
      const key = `${dealer.name}|${dealer.area}`;
      expect(seen.has(key), `trùng: ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("tên đại lý đã được sửa lỗi dấu của OCR", () => {
    const names = findDealers({ brand: "3M", province: "Đà Nẵng" }).dealers.flatMap((d) => [
      d.name,
      d.area,
    ]);
    // OCR doc nham "Đà Nẵng" thanh "Đà Năng" — khong duoc con sot trong du lieu.
    expect(names.some((n) => n.includes("Năng"))).toBe(false);
  });

  it("thống kê theo tỉnh khớp tổng số", () => {
    const counts = countByProvince();
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(totalDealers());
    expect(counts.get("Đà Nẵng")).toBe(16);
  });

  it("mọi tỉnh trong ô chọn đều tra cứu được mà không nổ", () => {
    for (const province of PROVINCES) {
      expect(() => findDealers({ brand: "3M", province })).not.toThrow();
    }
  });
});
