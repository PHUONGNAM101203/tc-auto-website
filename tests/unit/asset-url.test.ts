import { describe, expect, it } from "vitest";
import { assetUrl, isRemoteAssets } from "@/lib/asset-url";

describe("assetUrl", () => {
  it("không có NEXT_PUBLIC_ASSET_BASE_URL thì giữ nguyên đường dẫn", () => {
    expect(assetUrl("/slices/home-0.webp")).toBe("/slices/home-0.webp");
    expect(isRemoteAssets()).toBe(false);
  });

  it("giữ nguyên đường dẫn đã có dấu /", () => {
    expect(assetUrl("/a/b.webp")).toBe("/a/b.webp");
  });
});
