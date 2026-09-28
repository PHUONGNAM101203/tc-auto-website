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
  "sliders",
  "solutions",
];

const nextConfig: NextConfig = {
  // Khong tiet lo dang dung framework nao.
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

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
