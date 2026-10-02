import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, "");
  //: Khu quan tri va API noi bo khong duoc thu thap.
  const blocked = ["/admin", "/admin/", "/api/"];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: blocked },
      // Cho phep RO RANG cac may thu thap cua cong cu tra loi bang AI.
      //
      // Chung mac dinh da duoc phep theo luat `*` o tren, nhung nhieu nha van
      // hanh chan san chung bang cau hinh may chu. Khai ten tung con mot la
      // noi ro y dinh: TC Auto MUON xuat hien khi nguoi dung hoi tro ly AI
      // "nen lap man hinh o to o dau", chu khong chi muon len Google.
      //
      // Danh sach nay la cac may thu thap CONG KHAI co ten rieng tinh den
      // 01/10/2026. Them ten moi khi co.
      ...[
        "Googlebot",
        "Google-Extended",
        "Bingbot",
        "GPTBot",
        "OAI-SearchBot",
        "ChatGPT-User",
        "ClaudeBot",
        "Claude-SearchBot",
        "PerplexityBot",
        "Perplexity-User",
        "Applebot",
        "Applebot-Extended",
        "CCBot",
      ].map((userAgent) => ({ userAgent, allow: "/", disallow: blocked })),
      // Tu choi HAN cac may cao SEO thuong mai va may cao du lieu hang loat.
      //
      // Chung doc het site de ban lai du lieu cho ben thu ba, khong dua mot
      // nguoi doc nao ve cho TC Auto. Phan lon nhom nay doc robots.txt roi
      // lam nguoc lai, nen dong khai o day chi la de noi ro y dinh — cho
      // chan that nam o src/lib/crawl-guard.ts, tra thang 403.
      // Hai danh sach phai khop nhau.
      ...[
        "AhrefsBot",
        "SemrushBot",
        "MJ12bot",
        "DotBot",
        "DataForSeoBot",
        "BLEXBot",
        "serpstatbot",
        "ZoominfoBot",
        "Bytespider",
        "PetalBot",
        "MegaIndex",
        "Barkrowler",
        "ImagesiftBot",
      ].map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
