import { describe, expect, it } from "vitest";
import {
  credentialsSchema,
  fieldErrors,
  itemOverrideSchema,
  leadInputSchema,
  settingsSchema,
} from "@/lib/validation";

describe("leadInputSchema", () => {
  const valid = { name: "Nguyễn Văn A", phone: "0909123456", sourcePage: "/" };

  it("nhận dữ liệu hợp lệ", () => {
    expect(leadInputSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    "0909123456",
    "0909 123 456",
    "0909.123.456",
    "0909-123-456",
    "+84909123456",
    "84909123456",
    "02839123456",
  ])("nhận số điện thoại VN hợp lệ: %s", (phone) => {
    expect(leadInputSchema.safeParse({ ...valid, phone }).success).toBe(true);
  });

  it.each(["abc", "123", "0", "", "0909123456789012345", "+1555123456789"])(
    "từ chối số điện thoại không hợp lệ: %s",
    (phone) => {
      expect(leadInputSchema.safeParse({ ...valid, phone }).success).toBe(false);
    },
  );

  it("từ chối tên quá ngắn", () => {
    expect(leadInputSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("từ chối tên quá dài", () => {
    expect(leadInputSchema.safeParse({ ...valid, name: "a".repeat(121) }).success).toBe(false);
  });

  it("cắt khoảng trắng hai đầu", () => {
    const parsed = leadInputSchema.parse({ ...valid, name: "  Trần B  " });
    expect(parsed.name).toBe("Trần B");
  });

  it("message là tuỳ chọn, mặc định rỗng", () => {
    expect(leadInputSchema.parse(valid).message).toBe("");
  });

  it("từ chối message quá dài", () => {
    expect(
      leadInputSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success,
    ).toBe(false);
  });

  it("honeypot phải rỗng", () => {
    expect(leadInputSchema.safeParse({ ...valid, honeypot: "bot" }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...valid, honeypot: "" }).success).toBe(true);
  });
});

describe("itemOverrideSchema", () => {
  it("chỉ nhận slug thuộc 6 trang", () => {
    expect(
      itemOverrideSchema.safeParse({ slug: "home", itemId: "home-000", html: "x", href: null })
        .success,
    ).toBe(true);
    expect(
      itemOverrideSchema.safeParse({ slug: "khong-ton-tai", itemId: "x", html: "x", href: null })
        .success,
    ).toBe(false);
  });

  it("hidden mặc định false", () => {
    const parsed = itemOverrideSchema.parse({
      slug: "home",
      itemId: "home-000",
      html: "x",
      href: null,
    });
    expect(parsed.hidden).toBe(false);
  });
});

describe("settingsSchema", () => {
  const valid = {
    siteTitle: "TC Auto",
    siteDescription: "",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
    motionEnabled: true,
  };

  it("cho phép email rỗng", () => {
    expect(settingsSchema.safeParse(valid).success).toBe(true);
  });

  it("từ chối email sai định dạng", () => {
    expect(settingsSchema.safeParse({ ...valid, contactEmail: "khong-phai-email" }).success).toBe(
      false,
    );
  });

  it("nhận email hợp lệ", () => {
    expect(settingsSchema.safeParse({ ...valid, contactEmail: "a@b.vn" }).success).toBe(true);
  });

  it("từ chối tên website rỗng", () => {
    expect(settingsSchema.safeParse({ ...valid, siteTitle: "" }).success).toBe(false);
  });
});

describe("credentialsSchema", () => {
  it("yêu cầu mật khẩu tối thiểu 8 ký tự", () => {
    expect(credentialsSchema.safeParse({ email: "a@b.vn", password: "1234567" }).success).toBe(
      false,
    );
    expect(credentialsSchema.safeParse({ email: "a@b.vn", password: "12345678" }).success).toBe(
      true,
    );
  });
});

describe("fieldErrors", () => {
  it("gom lỗi theo tên field, giữ thông báo đầu tiên", () => {
    const result = leadInputSchema.safeParse({ name: "A", phone: "xx" });
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = fieldErrors(result.error);
    expect(errors.name).toBeTruthy();
    expect(errors.phone).toBeTruthy();
    expect(typeof errors.name).toBe("string");
  });
});
