import type { NextConfig } from "next";

/**
 * Chinh sach bao mat noi dung.
 *
 * `script-src` buoc phai co 'unsafe-inline': Next nhung san script noi dong de
 * truyen du lieu hydrate (`self.__next_f.push(...)`), va trang cong khai duoc
 * sinh TINH nen khong the gan nonce theo tung request — gan nonce se bien ca 47
 * trang thanh render dong, mat het loi the toc do.
 *
 * Doi lai, moi huong tan cong con lai deu bi dong: khong cho nhung vao iframe,
 * khong cho doi <base>, form chi gui ve chinh minh, va moi HTML do admin nhap
 * deu di qua bo loc trong src/lib/sanitize.ts (co 21 test, gom ca payload XSS).
 *
 * RIENG che do dev con phai them 'unsafe-eval': React o che do phat trien dung
 * eval() de dung lai ngan xep loi cho bang bao loi cua Next. Thieu no thi moi
 * lan chay `next dev` deu no mot Console Error. Ban BUILD khong bao gio dung
 * eval() nen khong duoc noi long o do.
 */
const IS_DEV = process.env.NODE_ENV === "development";

function contentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${IS_DEV ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // data: cho anh giu cho 1x1; https: cho anh dat tren Supabase Storage.
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // 'self' chu khong phai 'none': khu quan tri nhung chinh trang cong khai
    // vao khung "Xem truoc". Site khac van khong nhung duoc.
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // SAMEORIGIN de khung "Xem truoc" trong /admin hoat dong; van chan site khac.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Trang nay khong dung cac quyen do — tat han cho chac.
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    // Chi co tac dung tren HTTPS; tren localhost trinh duyet bo qua.
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Cat dut moi tham chieu `window.opener` giua ta va trang khac. Khong co
    // no, mot trang ta mo bang target="_blank" (vi du tep tai tren wincavn.com)
    // van co the doc va dieu khien `window.opener` trong vai tinh huong.
    // `rel="noopener"` da chan o tung the <a>; day la lop chan o cap trang,
    // phong khi sau nay co the <a> nao quen `rel`.
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    // Site khac khong duoc nhung tai nguyen cua ta vao trang cua ho roi doc
    // noi dung qua kenh phu. `same-site` chu khong phai `same-origin`: anh va
    // phong con duoc phuc vu qua CDN cua Vercel o ten mien con.
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  {
    // Khong de trinh duyet doan kieu tep tu noi dung khi tai xuong.
    key: "X-Download-Options",
    value: "noopen",
  },
];

/**
 * Anh va font duoc cache VINH VIEN o trinh duyet va o bien CDN.
 *
 * An toan vi moi duong dan anh deu mang ?v=<ma bam noi dung>
 * (tools/stamp-slices.py) — noi dung doi thi duong dan doi, trinh duyet tai
 * lai ngay. CHI duoc them thu muc vao day khi MOI duong dan cua no da co dau;
 * thieu dau ma van dat immutable thi nguoi dung giu ban cu mai khong sua duoc.
 */
const IMMUTABLE = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

/**
 * Cac thu muc anh tinh. Da doi chieu voi HTML dung that: tat ca deu 100% co
 * ?v=. `/tech` CO Y khong co trong danh sach — khong trang nao dung toi no nua.
 */
const ASSET_DIRS = [
  "slices",
  "fonts",
  "brand",
  "cards",
  "hero",
  "lift",
  "mobile",
  "ppf",
  "products",
  "related",
  "sliders",
  "solutions",
];

const nextConfig: NextConfig = {
  // Khong tiet lo dang dung framework nao.
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  /**
   * Chan moi duong dan ket thuc bang `/index` TRUOC khi Next dinh tuyen.
   *
   * ── Loi that, tai hien duoc 100% ──────────────────────────────────────────
   * Next luu trang da dung san cua `/` vao `.next/server/app/index.html`.
   * Duong dan `/index` BAM VAO CUNG MOT TEP do. No khong nam trong
   * generateStaticParams cua `[...slug]` nen bi coi la 404 — va cai 404 do
   * duoc GHI DE len chinh tep cua trang chu.
   *
   * Cach tai hien (da do, khong phai suy doan):
   *   1. `/` tra 200
   *   2. doi qua 60 giay cho `revalidate` cua trang chu het han
   *   3. goi `/index` dung MOT lan
   *   4. `/` tra 404, va `.next/server/app/index.meta` ghi `"status": 404`
   *
   * Nghia la chi can mot con bot hay mot nguoi go nham `/index` la trang chu
   * sap, cho den lan deploy sau. Da phat hien vi cua kiem do net quet thu muc
   * `src/data/subpages/*.json` va dem ca `index.json` — von la BAN MUC LUC
   * liet ke 31 trang con chu khong phai mot trang — thanh route `/index`.
   *
   * Chuyen huong o day chay TRUOC khi dinh tuyen, nen catch-all khong bao gio
   * dung toi khoa dem cua trang chu nua. Viet tong quat cho moi cap, vi
   * `/giai-phap/index` cung dam vao tep cua `/giai-phap` y nhu vay.
   */
  async redirects() {
    return [
      { source: "/index", destination: "/", permanent: true },
      { source: "/:path+/index", destination: "/:path+", permanent: true },
    ];
  },

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      ...ASSET_DIRS.map((dir) => ({
        source: `/${dir}/:path*`,
        headers: IMMUTABLE,
      })),
    ];
  },
};

export default nextConfig;
