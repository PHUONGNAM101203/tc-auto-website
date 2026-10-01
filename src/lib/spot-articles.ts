import data from "@/data/spot-articles.json";

/**
 * Bai viet sinh tu cac nut "XEM THÊM" tren trang con.
 *
 * Ban thiet ke ve mot khoi chu bi MO DAN o cuoi kem nut "XEM THÊM". Truoc day
 * nut do xo khoi chu dai ra tai cho; khach noi lai (01/10/2026) rang no phai
 * DAN sang mot trang bai viet rieng. Chu cua bai nam trong anh thiet ke va lop
 * OCR da doc duoc het — gom ca phan bi lop mo che — nen moi bai dung lai duoc
 * day du. Xem tools/brand/build-spot-articles.py.
 */

export interface SpotArticle {
  /** Khoa duy nhat: "<trang cha>/<slug>". */
  readonly slug: string;
  readonly route: string;
  /** Duong dan trang cha, de ve duong dan phan cap va nut quay lai. */
  readonly parent: string;
  readonly parentPage: string;
  readonly title: string;
  /** ISO, hoac null khi ban thiet ke khong ghi ngay. */
  readonly date: string | null;
  readonly paragraphs: readonly string[];
  /** Toa do nut tren trang cha — de noi lai dung vung bam. */
  readonly spot: { readonly x: number; readonly y: number };
  /**
   * Anh minh hoa, cat tu chinh the bai viet trong ban thiet ke.
   *
   * Vai the khong co anh ma chi co logo tren nen trang — nhung the do khong
   * co truong nay. Xem tools/brand/extract-article-shots.py.
   */
  readonly image?: string;
  readonly imageWidth?: number;
  readonly imageHeight?: number;
}

const ARTICLES = (data as unknown as { articles: readonly SpotArticle[] })
  .articles;

export function getSpotArticles(): readonly SpotArticle[] {
  return ARTICLES;
}

export function getSpotArticle(slug: string): SpotArticle | null {
  return ARTICLES.find((article) => article.slug === slug) ?? null;
}

/**
 * Dich den cua nut tai mot toa do tren trang cha.
 *
 * Doi chieu bang TOA DO chu khong bang tieu de: tieu de do OCR doc nen co the
 * khac nhau mot vai ky tu giua hai lan chay, con toa do thi do tu chinh anh.
 */
export function spotArticleHref(page: string, x: number, y: number): string | null {
  const hit = ARTICLES.find(
    (article) =>
      article.parentPage === page &&
      Math.abs(article.spot.x - x) < 2 &&
      Math.abs(article.spot.y - y) < 2,
  );
  return hit?.route ?? null;
}
