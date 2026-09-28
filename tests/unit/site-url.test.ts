import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSiteUrl, siteUrl } from "@/lib/site-url";

/**
 * Dia chi goc cua site quyet dinh canonical, Open Graph, sitemap va robots.
 * Sai cho nay thi Google index nham ten mien — nen no phai dung o CA BA hoan
 * canh: may ca nhan, ban tren Vercel chua gan domain, va ban da gan domain that.
 */
describe("resolveSiteUrl", () => {
  it("may ca nhan khong dat gi thi ve localhost", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });

  it("uu tien NEXT_PUBLIC_SITE_URL hon moi bien cua Vercel", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://tcauto.vn",
        NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: "tc-auto.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "tc-auto.vercel.app",
      }),
    ).toBe("https://tcauto.vn");
  });

  it("chua gan domain thi dung dia chi production cua Vercel", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: "tc-auto.vercel.app" }),
    ).toBe("https://tc-auto.vercel.app");
  });

  it("ban khong co tien to NEXT_PUBLIC_ van dung duoc o phia may chu", () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "tc-auto.vercel.app" })).toBe(
      "https://tc-auto.vercel.app",
    );
  });

  it("Vercel tra ve ten may tran khong co giao thuc — phai tu them https", () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "abc.vercel.app" })).toBe(
      "https://abc.vercel.app",
    );
  });

  it("khong them https hai lan neu bien da co san giao thuc", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://tcauto.vn" })).toBe(
      "https://tcauto.vn",
    );
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3311" })).toBe(
      "http://localhost:3311",
    );
  });

  it("cat dau gach cheo thua o cuoi — sitemap tu noi duong dan vao sau", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://tcauto.vn/" })).toBe(
      "https://tcauto.vn",
    );
  });

  it("bo qua bien chi co khoang trang", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "   ",
        VERCEL_PROJECT_PRODUCTION_URL: "tc-auto.vercel.app",
      }),
    ).toBe("https://tc-auto.vercel.app");
  });

  it("KHONG dung VERCEL_URL: dia chi do doi theo tung lan deploy nen canonical se nhay lung tung", () => {
    expect(resolveSiteUrl({ VERCEL_URL: "tc-auto-git-abc123.vercel.app" })).toBe(
      "http://localhost:3000",
    );
  });
});

describe("siteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("doc tu moi truong that dang chay", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tcauto.vn");
    expect(siteUrl()).toBe("https://tcauto.vn");
  });
});
