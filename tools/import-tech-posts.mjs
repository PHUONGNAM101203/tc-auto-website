/**
 * Nhap bai viet cong nghe tu tcauto.vn ve bang `posts`.
 *
 * ── Vi sao ─────────────────────────────────────────────────────────────────
 * Trang /cong-nghe/tien-phong-cong-nghe/bai-viet co NAM o bai viet, ca nam
 * dang mang tieu de mau "TÊN BÀI VIẾT" cua ban thiet ke. Ha tang da san sang
 * tu truoc: o nao cung duoc lap bang bai co `section` trung slug trang (xem
 * `listPublishedPosts`). Chi la chua co bai nao. Khach bao: "nếu như chưa có
 * bài viết thì bạn giúp tôi quét bên website tcauto.vn hiện tại xem có không
 * thì lấy qua đây luôn" (02/10/2026).
 *
 * ── Nguyen tac ────────────────────────────────────────────────────────────
 *   - Lay qua WP REST API chu khong cao HTML: co san tieu de, tom tat, than
 *     bai va anh dai dien, khong phai doan tu the <div>.
 *   - TUAN TU, co nghi giua cac luot. Chinh phien lam viec nay da lam nghen
 *     tcauto.vn bang vai tram ket noi song song va bi tuong lua khoa IP. Day
 *     la cung mot may chu — khong lap lai.
 *   - `source_url` luon tro ve bai goc. Day la noi dung cua chinh TC Auto
 *     chuyen giua hai trang cua ho, nhung van phai ghi ro no tu dau toi.
 *   - KHONG ghi de bai da co: doi chieu theo `slug`, co roi thi bo qua, de
 *     chay lai nhieu lan khong hong gi.
 *
 * Chay:
 *   node tools/import-tech-posts.mjs                      # muc cong nghe
 *   node tools/import-tech-posts.mjs --section=<slug> --slugs=a,b,c
 *   them --publish de dang luon (mac dinh la BAN NHAP, xem lai roi hay dang)
 *
 * `--section` phai la slug mot trang CO O cho bai viet. Lay danh sach bang:
 *   node -e 'import("./src/lib/post-sections.ts")' — hoac xem o quan tri,
 *   truong "Mục" nay la danh sach chon sinh tu chinh van ban thiet ke.
 *
 * Can SUPABASE_SERVICE_ROLE_KEY trong .env.local (khong bao gio len git).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const BASE = "https://tcauto.vn/wp-json/wp/v2";

function argOf(name) {
  const hit = process.argv.find((item) => item.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

const SECTION = argOf("section") ?? "cong-nghe/tien-phong-cong-nghe/bai-viet";

/**
 * Nam bai cho nam o. Chon tay chu khong lay bua theo ngay dang: trang nay la
 * "BÀI VIẾT CÔNG NGHỆ", nen phai la bai noi ve CONG NGHE — man hinh, cam bien,
 * vat lieu phim — chu khong phai bai ban hang hay tin khuyen mai.
 */
const DEFAULT_WANTED = [
  "top-3-man-hinh-o-to-ban-chay-nhat-nua-dau-nam-2026",
  "series-xe-nang-cap-man-hinh-android-winca-s170-qled",
  "cam-bien-ap-suat-lop-a500-co-lap-duoc-khong",
  "ly-do-cuon-phim-cach-nhiet-hay-bi-loi-o-dau-va-cuoi",
  "top-4-kien-thuc-nang-cap-xe-o-to-can-biet",
];

const WANTED = (argOf("slugs")?.split(",").map((s) => s.trim()).filter(Boolean)) ?? DEFAULT_WANTED;

const PUBLISH = process.argv.includes("--publish");

function loadEnv() {
  // Khong dung dotenv: mot phu thuoc nua chi de doc nam dong.
  let text = "";
  try {
    text = readFileSync(".env.local", "utf8");
  } catch {
    throw new Error("Khong doc duoc .env.local");
  }
  const env = {};
  for (const line of text.split("\n")) {
    const at = line.indexOf("=");
    if (at < 1 || line.trimStart().startsWith("#")) continue;
    env[line.slice(0, at).trim()] = line.slice(at + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Bo the HTML va giai ma thuc the, giu ranh gioi doan van bang dong trong. */
function toPlainText(html) {
  return html
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#039;|&#8216;/g, "’")
    .replace(/&#8211;/g, "–")
    .replace(/&#8220;|&#8221;/g, "”")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      // Noi ro ta la ai. May chu nao muon chan thi chan duoc, do la quyen cua ho.
      "user-agent": "TCAutoSolutions-Importer/1.0 (+https://tcautosolutions.vn)",
      accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} — ${url}`);
  }
  return response.json();
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Thieu NEXT_PUBLIC_SUPABASE_URL hoac SUPABASE_SERVICE_ROLE_KEY");
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: existing, error: readError } = await supabase
    .from("posts")
    .select("slug")
    .eq("section", SECTION);
  if (readError) {
    throw new Error(`Khong doc duoc bang posts: ${readError.message}`);
  }
  const have = new Set((existing ?? []).map((row) => row.slug));

  let added = 0;
  for (const slug of WANTED) {
    if (have.has(slug)) {
      console.log(`  bo qua (da co): ${slug}`);
      continue;
    }

    const found = await getJson(
      `${BASE}/posts?slug=${slug}&_fields=title,excerpt,content,date,link,featured_media`,
    );
    await sleep(1200); // nghi giua cac luot — may chu nay da tung chan ta
    if (!Array.isArray(found) || found.length === 0) {
      console.log(`  KHONG TIM THAY: ${slug}`);
      continue;
    }
    const post = found[0];

    let coverUrl = null;
    if (post.featured_media) {
      try {
        const media = await getJson(`${BASE}/media/${post.featured_media}?_fields=source_url`);
        coverUrl = media.source_url ?? null;
        await sleep(1200);
      } catch {
        coverUrl = null; // khong co anh thi thoi, bai van dung duoc
      }
    }

    const body = toPlainText(post.content?.rendered ?? "");
    if (body.length < 200) {
      console.log(`  BO QUA (than bai qua ngan): ${slug}`);
      continue;
    }

    const payload = {
      slug,
      title: toPlainText(post.title?.rendered ?? slug),
      excerpt: toPlainText(post.excerpt?.rendered ?? "").slice(0, 300) || null,
      body,
      cover_url: coverUrl,
      section: SECTION,
      status: PUBLISH ? "published" : "draft",
      published_at: PUBLISH ? (post.date ? new Date(post.date).toISOString() : null) : null,
      source_url: post.link ?? null,
    };

    const { error } = await supabase.from("posts").insert(payload);
    if (error) {
      console.log(`  LOI khi them ${slug}: ${error.message}`);
      continue;
    }
    added += 1;
    console.log(`  da them: ${payload.title.slice(0, 60)}`);
  }

  console.log(
    `\n  Them ${added} bai vao muc ${SECTION} ` +
      `(${PUBLISH ? "DA XUAT BAN" : "ban nhap — vao /admin/posts de xem roi dang"}).`,
  );
}

main().catch((error) => {
  console.error(`\n  That bai: ${error.message}`);
  process.exit(1);
});
