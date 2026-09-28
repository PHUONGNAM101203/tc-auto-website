import { describe, expect, it, vi } from "vitest";
import { failure, fromError, IDLE, success } from "@/lib/admin/action-result";
import { parsePageSpec } from "@/lib/page-spec-schema";
import home from "@/data/pages/home.json";

describe("ActionResult", () => {
  it("IDLE là trạng thái rỗng, không phải lỗi", () => {
    expect(IDLE.ok).toBe(true);
    expect(IDLE.message).toBe("");
  });

  it("success mang thông báo và ok=true", () => {
    expect(success("Đã lưu.")).toEqual({ ok: true, message: "Đã lưu." });
  });

  it("failure mang thông báo, ok=false và lỗi theo field", () => {
    const result = failure("Sai rồi", { html: "Bắt buộc" });
    expect(result.ok).toBe(false);
    expect(result.fields?.html).toBe("Bắt buộc");
  });

  describe("fromError", () => {
    it("dùng message của Error khi ngắn và một dòng", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(fromError(new Error("Không đủ quyền."), "fallback").message).toBe(
        "Không đủ quyền.",
      );
      spy.mockRestore();
    });

    it("dùng fallback cho message dài (che chi tiết hệ thống)", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(fromError(new Error("x".repeat(300)), "fallback").message).toBe("fallback");
      spy.mockRestore();
    });

    it("dùng fallback cho message nhiều dòng (thường là stack trace)", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(fromError(new Error("dòng 1\ndòng 2"), "fallback").message).toBe("fallback");
      spy.mockRestore();
    });

    it("dùng fallback cho giá trị không phải Error", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(fromError("chuỗi thường", "fallback").message).toBe("fallback");
      expect(fromError(null, "fallback").message).toBe("fallback");
      spy.mockRestore();
    });

    it("luôn trả ok=false", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(fromError(new Error("x"), "fallback").ok).toBe(false);
      spy.mockRestore();
    });
  });
});

describe("parsePageSpec", () => {
  it("chấp nhận page spec thật", () => {
    expect(parsePageSpec(home, "home").slug).toBe("home");
  });

  it("nêu rõ đường dẫn field và cách sửa khi sai cấu trúc", () => {
    expect(() => parsePageSpec({ ...home, canvasWidth: 1000 }, "home")).toThrow(
      /canvasWidth[\s\S]*parse-prototype/,
    );
  });

  it("từ chối slug lạ", () => {
    expect(() => parsePageSpec({ ...home, slug: "khong-ton-tai" }, "x")).toThrow(/slug/);
  });

  it("từ chối trang không có lát nền nào", () => {
    expect(() => parsePageSpec({ ...home, slices: [] }, "home")).toThrow(/slices/);
  });

  it("từ chối đầu vào không phải object", () => {
    expect(() => parsePageSpec(null, "x")).toThrow();
    expect(() => parsePageSpec("chuỗi", "x")).toThrow();
  });
});
