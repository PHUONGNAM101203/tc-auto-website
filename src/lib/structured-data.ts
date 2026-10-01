import { SITE } from "./site-config";
import { SITE_CONTACT, SOCIAL } from "./site-contact";
import type { Product } from "./products";
import { getProductSpecs } from "./product-specs";

/**
 * Du lieu co cau truc (JSON-LD, schema.org).
 *
 * ── Vi sao can ─────────────────────────────────────────────────────────────
 * Ca site truoc day khong co mot mau JSON-LD nao. Thieu no thi:
 *   - Google doc trang bang cach doan tu HTML, khong hien duoc ket qua giau
 *     (breadcrumb, bang san pham, bai viet);
 *   - may tra loi bang AI khong biet dau la ten cong ty, dau la so dien thoai,
 *     dau la thong so may — chung doc kieu nay truoc het.
 *
 * ── Nguyen tac ─────────────────────────────────────────────────────────────
 * CHI khai nhung gi ta biet chac. Google phat trang khai sai lech so voi noi
 * dung nguoi dung nhin thay. Cu the o day:
 *   - KHONG dung `LocalBusiness`: no doi `address`, ma ca du an khong co dia
 *     chi tru so nao — phai xin TC Auto. Dung `Organization` cho phan biet ro.
 *   - KHONG khai `offers`/gia tren san pham: ta khong co bang gia.
 *   - KHONG khai `SearchAction`: no doi mot duong dan trang KET QUA that, ma
 *     o tim kiem o day tra ket qua ngay tai cho chu khong co trang rieng.
 *   - KHONG khai `aggregateRating`: khong co danh gia that nao.
 */

type Json = Record<string, unknown>;

function abs(path: string): string {
  const base = SITE.url.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path}`;
}

/** Id co dinh cua phap nhan, de cac mau khac tro ve bang `@id`. */
export const ORG_ID = `${SITE.url.replace(/\/$/, "")}/#to-chuc`;

/**
 * Phap nhan TC Auto.
 *
 * `sameAs` chi liet ke trang co that — Instagram bi bo vi TC Auto chua co tai
 * khoan nao (xem SOCIAL trong site-contact.ts).
 */
export function organizationLd(): Json {
  const links = SOCIAL.filter((s) => s.href).map((s) => s.href as string);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    url: abs("/"),
    description: SITE.description,
    slogan: SITE.slogan,
    logo: {
      "@type": "ImageObject",
      url: abs("/brand/logo-horizontal-on-dark.png"),
    },
    ...(links.length > 0 ? { sameAs: links } : {}),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: SITE_CONTACT.phone.replace(/\s/g, ""),
        email: SITE_CONTACT.email,
        areaServed: "VN",
        availableLanguage: ["vi"],
      },
    ],
  };
}

/** Trang web noi chung — gan voi phap nhan o tren. */
export function websiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url.replace(/\/$/, "")}/#trang-web`,
    url: abs("/"),
    name: SITE.name,
    description: SITE.description,
    inLanguage: "vi-VN",
    publisher: { "@id": ORG_ID },
  };
}

export interface Crumb {
  readonly name: string;
  readonly url: string;
}

/**
 * Duong dan phan cap.
 *
 * Google noi ro: mau nay phai KHOP voi duong dan nguoi dung nhin thay tren
 * trang. Nen moi cho goi ham deu truyen dung day breadcrumb da ve.
 */
export function breadcrumbLd(trail: readonly Crumb[]): Json | null {
  if (trail.length < 2) {
    return null;
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: abs(crumb.url),
    })),
  };
}

/**
 * Mot dong man hinh.
 *
 * Thong so ky thuat (neu co) di vao `additionalProperty` — day la cho schema.org
 * danh cho thong so khong co truong rieng, va cung la cho may tra loi AI doc.
 * Khong co `offers` vi khong co bang gia; khai gia bia la Google phat.
 */
export function productLd(product: Product): Json {
  const tech = getProductSpecs(product.slug);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: abs(product.route),
    image: abs(product.image),
    category: product.category,
    brand: { "@type": "Brand", name: brandOf(product.name) },
    ...(tech
      ? {
          additionalProperty: tech.specs.map((spec) => ({
            "@type": "PropertyValue",
            name: spec.label,
            value: spec.value,
          })),
        }
      : {}),
  };
}

/**
 * Thuong hieu suy tu TEN san pham, khong suy tu danh muc.
 *
 * Danh muc "man-hinh" chua ca may Winca lan may Bravo, con danh muc phim thi
 * chua ca 3M lan Nano Sun — lay theo danh muc la gan nham thuong hieu.
 */
function brandOf(name: string): string {
  const upper = name.toUpperCase();
  if (upper.startsWith("3M")) {
    return "3M";
  }
  if (upper.startsWith("NANO")) {
    return "Nano Sun";
  }
  if (upper.startsWith("BRAVO")) {
    return "Bravo";
  }
  if (/^S\d/.test(upper)) {
    return "Winca";
  }
  return SITE.name;
}

/**
 * Mot dong san pham khai tren TRANG TU SOAN (vi du ba dong Bravo).
 *
 * Khac `productLd`: o day khong co trang rieng cho tung dong, nen `url` tro
 * ve trang chua no kem neo. Thong so van vao `additionalProperty` de may tim
 * kiem va may tra loi AI doc duoc.
 */
export function authoredProductLd(
  item: {
    readonly name: string;
    readonly tagline: string;
    readonly specs: readonly { readonly label: string; readonly value: string }[];
  },
  pageUrl: string,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.tagline,
    url: abs(pageUrl),
    brand: { "@type": "Brand", name: brandOf(item.name) },
    ...(item.specs.length > 0
      ? {
          additionalProperty: item.specs.map((spec) => ({
            "@type": "PropertyValue",
            name: spec.label,
            value: spec.value,
          })),
        }
      : {}),
  };
}

export interface ArticleSeed {
  readonly title: string;
  readonly excerpt: string | null;
  readonly url: string;
  readonly image: string | null;
  readonly publishedAt: string | null;
}

export function articleLd(article: ArticleSeed): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    ...(article.excerpt ? { description: article.excerpt } : {}),
    url: abs(article.url),
    ...(article.image ? { image: abs(article.image) } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    inLanguage: "vi-VN",
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}
