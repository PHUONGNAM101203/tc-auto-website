import { beforeEach, describe, expect, it, vi } from "vitest";
import { clientIp, rateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.useRealTimers();
  });

  it("cho qua trong giới hạn", () => {
    for (let i = 0; i < 3; i += 1) {
      expect(rateLimit("k", 3, 1000).allowed).toBe(true);
    }
  });

  it("chặn khi vượt giới hạn", () => {
    for (let i = 0; i < 3; i += 1) {
      rateLimit("k", 3, 1000);
    }
    const blocked = rateLimit("k", 3, 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("đếm remaining giảm dần", () => {
    expect(rateLimit("k", 3, 1000).remaining).toBe(2);
    expect(rateLimit("k", 3, 1000).remaining).toBe(1);
    expect(rateLimit("k", 3, 1000).remaining).toBe(0);
  });

  it("các key độc lập với nhau", () => {
    rateLimit("a", 1, 1000);
    expect(rateLimit("a", 1, 1000).allowed).toBe(false);
    expect(rateLimit("b", 1, 1000).allowed).toBe(true);
  });

  it("mở lại sau khi hết cửa sổ thời gian", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    rateLimit("k", 1, 1000);
    expect(rateLimit("k", 1, 1000).allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(rateLimit("k", 1, 1000).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("lấy IP đầu tiên từ x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(clientIp(headers)).toBe("1.2.3.4");
  });

  it("dùng x-real-ip khi không có x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("trả về unknown khi không có header nào", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
