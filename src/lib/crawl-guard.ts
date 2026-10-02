import { clientIp, rateLimit, type RateLimitResult } from "./rate-limit";

/**
 * Chan cao du lieu o muc TRANG.
 *
 * ── Vi sao can ─────────────────────────────────────────────────────────────
 * `/api/leads` va `/api/search` da co gioi han tan so rieng, nhung trang HTML
 * thi khong co gi ca. Ai cung mo duoc 300 ket noi song song va keo sach 37
 * trang trong vai giay. Day khong phai gia dinh: ngay 02/10/2026 chinh toi da
 * lam dung vay voi tcauto.vn khi di tim anh goc, va tuong lua cua ho khoa IP
 * sau vai phut — dung nhu no nen lam. Khach yeu cau site moi phai lam duoc
 * dieu do: "muốn crawl thì phải qua lớp bảo mật chuẩn mới được".
 *
 * ── Gioi han o day KHONG phai de cam thu thap ──────────────────────────────
 * Google, Bing, va cac may tra loi bang AI van duoc chao don — xem
 * src/app/robots.ts, do la y do kinh doanh ro rang. Cai bi chan la hai thu:
 *   1. may cao SEO thuong mai khong mang lai gi cho TC Auto (Ahrefs, Semrush…)
 *      — chan thang bang 403;
 *   2. moi nguon ban qua nhanh, ke ca trinh duyet that — ha ve mot nhip ma
 *      nguoi doc that khong bao gio cham toi.
 *
 * ── Han che, noi thang ─────────────────────────────────────────────────────
 * Bo dem nam TRONG BO NHO cua tung instance. Tren Vercel moi vung/moi lan
 * khoi dong lanh la mot bo dem rieng, nen gioi han that se LONG HON con so
 * khai o day. No chan duoc dot ban nhanh tu mot nguon — dung cai da xay ra —
 * chu khong thay duoc tuong lua. Lop cung o Vercel la WAF
 * (Firewall → Attack Challenge Mode + custom rules); xem docs/SECURITY.md.
 */

/** Nhip cho nguoi doc that. Mot nguoi luot nhanh cung chi 20-30 trang/phut. */
const PAGE_LIMIT = 60;
const PAGE_WINDOW_MS = 60_000;

/** May tim kiem va tro ly AI duoc chao don — nhung van co tran. */
const BOT_LIMIT = 600;

/** Dang nhap quan tri: cham de do doan mat khau. */
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 600_000;

/** Trang quan tri: nguoi that dang lam viec, nhip cao hon han. */
const ADMIN_LIMIT = 300;

/**
 * May thu thap duoc chao don. Doi chieu voi danh sach trong
 * src/app/robots.ts — hai noi phai noi cung mot chuyen.
 *
 * Ten User-Agent GIA DUOC. Khong sao: gia ten chi doi duoc tu nhip nguoi
 * doc sang nhip may tim kiem, va ca hai deu co tran. Xac minh that phai tra
 * nguoc DNS, qua cham de dat trong proxy.
 */
const WELCOME = [
  "googlebot",
  "google-extended",
  "bingbot",
  "gptbot",
  "oai-searchbot",
  "chatgpt-user",
  "claudebot",
  "claude-searchbot",
  "perplexitybot",
  "perplexity-user",
  "applebot",
  "ccbot",
];

/**
 * May cao bi TU CHOI HAN.
 *
 * Toan la cong cu phan tich SEO thuong mai va may cao du lieu hang loat: chung
 * doc het site de ban lai du lieu cho nguoi khac, khong dua mot nguoi doc nao
 * ve cho TC Auto. Chan o day chu khong chi trong robots.txt, vi phan lon nhom
 * nay doc robots.txt roi lam nguoc lai.
 */
const DENY = [
  "ahrefsbot",
  "semrushbot",
  "mj12bot",
  "dotbot",
  "dataforseobot",
  "blexbot",
  "serpstatbot",
  "zoominfobot",
  "bytespider",
  "petalbot",
  "megaindex",
  "seekport",
  "barkrowler",
  "imagesiftbot",
  "webzio",
  "sitecheckerbotcrawler",
];

export type Verdict =
  | { readonly kind: "allow" }
  | { readonly kind: "deny" }
  | { readonly kind: "slow"; readonly retryAfterSeconds: number };

/**
 * Dia chi noi bo thi mien tru.
 *
 * Khong phai de tien: ca chuoi kiem cua du an tu mo hang tram trang tu mot
 * dia chi (check-responsive mo 156 luot). Neu tinh ca nhung luot do thi gate
 * tu chan chinh no, va con so gioi han se duoc noi rong cho vua chuoi kiem
 * thay vi vua nguoi dung — tuc la vo nghia.
 */
function isLocal(ip: string): boolean {
  return (
    ip === "unknown" ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("::ffff:127.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

function matches(agent: string, names: readonly string[]): boolean {
  return names.some((name) => agent.includes(name));
}

/**
 * `pathname` quyet dinh nhip; `headers` cho IP va User-Agent.
 *
 * `isLoginPost` phai do ben goi truyen vao: proxy biet phuong thuc, con ham
 * nay co y khong dung toi doi tuong request de con test duoc truc tiep.
 */
export function guard(
  pathname: string,
  headers: Headers,
  isLoginPost = false,
): Verdict {
  const ip = clientIp(headers);
  if (isLocal(ip)) {
    return { kind: "allow" };
  }

  const agent = (headers.get("user-agent") ?? "").toLowerCase();
  if (matches(agent, DENY)) {
    return { kind: "deny" };
  }

  let bucket: RateLimitResult;
  if (isLoginPost) {
    bucket = rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  } else if (pathname.startsWith("/admin")) {
    bucket = rateLimit(`admin:${ip}`, ADMIN_LIMIT, PAGE_WINDOW_MS);
  } else if (matches(agent, WELCOME)) {
    bucket = rateLimit(`bot:${ip}`, BOT_LIMIT, PAGE_WINDOW_MS);
  } else {
    bucket = rateLimit(`page:${ip}`, PAGE_LIMIT, PAGE_WINDOW_MS);
  }

  return bucket.allowed
    ? { kind: "allow" }
    : { kind: "slow", retryAfterSeconds: bucket.retryAfterSeconds };
}
