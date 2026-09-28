import { describe, expect, it } from "vitest";
import {
  compactNumber,
  dayLabel,
  niceCeiling,
  STATUS_HUE,
  STATUS_ORDER,
} from "@/components/admin/charts/tokens";
import { LEAD_STATUSES } from "@/lib/types";

describe("compactNumber", () => {
  it("giữ nguyên số dưới 10.000", () => {
    expect(compactNumber(0)).toBe("0");
    expect(compactNumber(1284)).toBe("1.284");
    expect(compactNumber(9999)).toBe("9.999");
  });

  it("rút gọn thành K", () => {
    expect(compactNumber(12_900)).toBe("12,9K");
    expect(compactNumber(150_000)).toBe("150,0K");
  });

  it("rút gọn thành M", () => {
    expect(compactNumber(4_200_000)).toBe("4,2M");
  });
});

describe("niceCeiling", () => {
  it("trả về 1 cho giá trị không dương", () => {
    expect(niceCeiling(0)).toBe(1);
    expect(niceCeiling(-5)).toBe(1);
  });

  it("làm tròn lên số tròn đẹp", () => {
    expect(niceCeiling(1)).toBe(1);
    expect(niceCeiling(3)).toBe(5);
    expect(niceCeiling(7)).toBe(10);
    expect(niceCeiling(12)).toBe(20);
    expect(niceCeiling(23)).toBe(25);
    expect(niceCeiling(140)).toBe(200);
  });

  it("luôn lớn hơn hoặc bằng giá trị đầu vào", () => {
    for (let value = 1; value <= 500; value += 7) {
      expect(niceCeiling(value)).toBeGreaterThanOrEqual(value);
    }
  });
});

describe("dayLabel", () => {
  it("định dạng ngày/tháng", () => {
    expect(dayLabel("2026-03-09")).toBe("09/03");
  });

  it("trả về nguyên đầu vào khi không parse được", () => {
    expect(dayLabel("khong-phai-ngay")).toBe("khong-phai-ngay");
  });
});

describe("palette trạng thái", () => {
  it("phủ đủ mọi trạng thái lead", () => {
    expect([...STATUS_ORDER].sort()).toEqual([...LEAD_STATUSES].sort());
    for (const status of LEAD_STATUSES) {
      expect(STATUS_HUE[status]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("mỗi trạng thái một màu riêng biệt", () => {
    const hues = STATUS_ORDER.map((status) => STATUS_HUE[status]);
    expect(new Set(hues).size).toBe(hues.length);
  });

  it("giữ đúng thứ tự cố định theo tiến trình lead", () => {
    expect(STATUS_ORDER).toEqual(["new", "contacted", "qualified", "won", "lost"]);
  });
});
