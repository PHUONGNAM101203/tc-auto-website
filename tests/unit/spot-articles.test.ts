import { describe, expect, it } from "vitest";
import {
  getSpotArticle,
  getSpotArticles,
  spotArticleHref,
} from "@/lib/spot-articles";
import { getAllSubPages } from "@/lib/subpages";
import { getCtaSpots } from "@/lib/cta-links";

/**
 * Bai viet mo ra tu nut "XEM THÊM".
 * Xem tools/brand/build-spot-articles.py.
 */
describe("bài viết mở ra từ XEM THÊM", () => {
  const articles = getSpotArticles();

  it("có bài, và bài nào cũng đủ tiêu đề lẫn thân bài", () => {
    expect(articles.length).toBeGreaterThanOrEqual(10);
    for (const article of articles) {
      expect(article.title.trim().length, article.slug).toBeGreaterThan(8);
      // Hai doan la du: co bai viet lien mach, 500 ky tu ma chi hai doan.
      // So KY TU moi la thuoc do that — xem MIN_CHARS trong bo sinh.
      expect(article.paragraphs.length, article.slug).toBeGreaterThanOrEqual(2);
      const chars = article.paragraphs.join(" ").length;
      expect(chars, article.slug).toBeGreaterThanOrEqual(150);
      for (const para of article.paragraphs) {
        expect(para.trim().length, article.slug).toBeGreaterThan(0);
      }
    }
  });

  it("đường dẫn không trùng nhau và nằm dưới trang cha", () => {
    const routes = articles.map((a) => a.route);
    expect(new Set(routes).size).toBe(routes.length);
    for (const article of articles) {
      expect(article.route.startsWith(`${article.parent}/`), article.slug).toBe(
        true,
      );
    }
  });

  it("trang cha là một trang con CÓ THẬT", () => {
    const pages = new Set(getAllSubPages().map((p) => p.slug));
    for (const article of articles) {
      expect(pages.has(article.parentPage), article.slug).toBe(true);
    }
  });

  it("tra theo slug: có thì trả bài, không có thì trả null", () => {
    expect(getSpotArticle(articles[0].slug)?.route).toBe(articles[0].route);
    expect(getSpotArticle("khong/co/that")).toBeNull();
  });

  it("tra theo TOẠ ĐỘ nút, không tra theo tiêu đề", () => {
    // Tieu de do OCR doc nen co the khac nhau vai ky tu giua hai lan chay;
    // toa do thi do tu chinh anh nen on dinh.
    const article = articles[0];
    expect(
      spotArticleHref(article.parentPage, article.spot.x, article.spot.y),
    ).toBe(article.route);
    // Lech qua xa thi khong khop.
    expect(
      spotArticleHref(article.parentPage, article.spot.x + 50, article.spot.y),
    ).toBeNull();
    expect(spotArticleHref("trang/khong/co", article.spot.x, article.spot.y)).toBeNull();
  });

  it("nút trên trang cha ĐÃ được gắn đường dẫn tới bài", () => {
    for (const article of articles) {
      const spots = getCtaSpots(article.parentPage);
      const hit = spots.find(
        (s) =>
          Math.abs(s.x - article.spot.x) < 2 && Math.abs(s.y - article.spot.y) < 2,
      );
      expect(hit?.href, article.slug).toBe(article.route);
    }
  });
});
