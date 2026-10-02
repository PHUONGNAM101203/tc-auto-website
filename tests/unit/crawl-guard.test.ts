import { beforeEach, describe, expect, it } from "vitest";
import { guard } from "@/lib/crawl-guard";
import { resetRateLimits } from "@/lib/rate-limit";

/**
 * Lop chan cao du lieu.
 *
 * Khach yeu cau sau khi chinh phien lam viec nay lam nghen tcauto.vn bang vai
 * tram ket noi song song (02/10/2026). Nhung bai duoi day giu dung ba dieu:
 * nguoi doc that khong bao gio bi chan, may cao SEO bi tu choi han, va dot
 * ban nhanh thi bi ha nhip.
 */
function headers(extra: Record<string, string>): Headers {
  return new Headers({ "x-forwarded-for": "203.0.113.5", ...extra });
}

const CHROME = "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/131.0 Safari/537.36";

describe("chặn cào dữ liệu", () => {
  beforeEach(() => resetRateLimits());

  it("người đọc bình thường đi qua", () => {
    expect(guard("/giai-phap", headers({ "user-agent": CHROME })).kind).toBe("allow");
  });

  it("máy cào SEO bị từ chối hẳn, không phải chỉ hạ nhịp", () => {
    const verdict = guard(
      "/",
      headers({ "user-agent": "Mozilla/5.0 (compatible; AhrefsBot/7.0)" }),
    );
    expect(verdict.kind).toBe("deny");
  });

  it("Googlebot được chào đón", () => {
    expect(
      guard("/", headers({ "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" })).kind,
    ).toBe("allow");
  });

  it("bắn nhanh thì bị hạ nhịp, kèm thời gian chờ", () => {
    const head = headers({ "user-agent": CHROME });
    let slowed: ReturnType<typeof guard> | null = null;
    for (let i = 0; i < 200; i += 1) {
      const verdict = guard("/giai-phap", head);
      if (verdict.kind === "slow") {
        slowed = verdict;
        break;
      }
    }
    expect(slowed, "phải chặn trước khi hết 200 lượt").not.toBeNull();
    if (slowed?.kind === "slow") {
      expect(slowed.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("một IP bị hạ nhịp không kéo theo IP khác", () => {
    const busy = headers({ "user-agent": CHROME });
    for (let i = 0; i < 200; i += 1) guard("/giai-phap", busy);

    const other = new Headers({ "x-forwarded-for": "203.0.113.99", "user-agent": CHROME });
    expect(guard("/giai-phap", other).kind).toBe("allow");
  });

  it("dò mật khẩu bị khoá sau 5 lần", () => {
    const head = headers({ "user-agent": CHROME });
    const verdicts = Array.from({ length: 8 }, () => guard("/admin/login", head, true));
    expect(verdicts.slice(0, 5).every((v) => v.kind === "allow")).toBe(true);
    expect(verdicts[5].kind).toBe("slow");
  });

  it("địa chỉ nội bộ được miễn trừ — chuỗi kiểm tự mở hàng trăm lượt", () => {
    const local = new Headers({ "x-forwarded-for": "127.0.0.1", "user-agent": CHROME });
    for (let i = 0; i < 300; i += 1) {
      expect(guard("/giai-phap", local).kind).toBe("allow");
    }
  });
});
