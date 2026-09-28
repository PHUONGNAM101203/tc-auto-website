/**
 * Tim ra dia chi goc that su cua site.
 *
 * Cho nay quyet dinh canonical URL, the Open Graph, `sitemap.xml` va dong
 * `Sitemap:` trong `robots.txt`. Neu sai thi Google di index mot ten mien khac
 * voi ten mien nguoi dung thay — nen no phai tu dung o ca ba hoan canh ma
 * khong bat ai nho sua tay:
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — dat tay. Khi gan domain that thi CHI CAN sua
 *    bien nay, khong dung den ma nguon.
 * 2. `…VERCEL_PROJECT_PRODUCTION_URL` — Vercel tu dat, tro toi ban production
 *    on dinh. Nho no ma ban tren *.vercel.app da co canonical dung ngay.
 * 3. Khong co gi — may ca nhan.
 *
 * CO Y khong dung `VERCEL_URL`: bien do la dia chi RIENG cua tung lan deploy
 * (`…-git-abc123.vercel.app`), moi lan push lai khac, dung lam canonical thi
 * cong cu tim kiem thay mot ten mien moi sau moi lan deploy.
 */

/** Cac bien duoc doc, theo dung thu tu uu tien. */
const SOURCES = [
  "NEXT_PUBLIC_SITE_URL",
  // Ban co tien to dung duoc ca o phia trinh duyet; ban tran chi o may chu.
  "NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
] as const;

const FALLBACK = "http://localhost:3000";

/**
 * @param env Bang bien moi truong. Truyen vao de kiem thu duoc; ma chay that
 *            dung `siteUrl()` ben duoi.
 */
export function resolveSiteUrl(env: Readonly<Record<string, string | undefined>>): string {
  for (const key of SOURCES) {
    const raw = env[key]?.trim();
    if (!raw) continue;

    // Vercel tra ve TEN MAY tran ("abc.vercel.app"), khong co giao thuc.
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return withScheme.replace(/\/+$/, "");
  }
  return FALLBACK;
}

/** Dia chi goc cua ban dang chay. */
export function siteUrl(): string {
  return resolveSiteUrl(process.env);
}
