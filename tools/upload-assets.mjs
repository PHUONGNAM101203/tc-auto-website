/**
 * Tai anh nen cua canvas len Supabase Storage.
 *
 * Vi sao: 55 MB anh trong repo lam cho moi lan deploy nang va cham. Dua len
 * Storage thi repo nhe, anh duoc phuc vu qua CDN, va doi qua doi lai chi bang
 * bien NEXT_PUBLIC_ASSET_BASE_URL.
 *
 * Chay:  node tools/upload-assets.mjs [--bucket site-assets] [--dry]
 * Can:   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY trong .env.local
 *
 * Idempotent: tep da co va cung kich thuoc thi bo qua, nen chay lai an toan.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const PUBLIC = join(ROOT, "public");
const DIRS = ["slices"];

const args = process.argv.slice(2);
const BUCKET = valueOf("--bucket") ?? "site-assets";
const DRY = args.includes("--dry");

function valueOf(flag) {
  const at = args.indexOf(flag);
  return at >= 0 ? args[at + 1] : undefined;
}

/** Doc .env.local mot cach toi gian — khong keo them thu vien. */
function loadEnv() {
  try {
    const text = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const match = /^([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line.trim());
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Khong co .env.local thi dung bien moi truong san co.
  }
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (!entry.startsWith(".")) {
      out.push(full);
    }
  }
  return out;
}

const MIME = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const files = DIRS.flatMap((dir) => walk(join(PUBLIC, dir))).sort();
  const totalBytes = files.reduce((sum, f) => sum + statSync(f).size, 0);
  console.log(`  ${files.length} tep · ${(totalBytes / 1e6).toFixed(1)} MB`);

  if (DRY) {
    console.log("  (--dry: chi liet ke, khong tai len)");
    for (const f of files.slice(0, 5)) console.log(`     ${relative(PUBLIC, f)}`);
    console.log(`     … con ${Math.max(0, files.length - 5)} tep`);
    return 0;
  }

  if (!url || !key) {
    console.error(
      "  Thieu NEXT_PUBLIC_SUPABASE_URL hoac SUPABASE_SERVICE_ROLE_KEY.\n" +
        "  Dien vao .env.local roi chay lai.",
    );
    return 1;
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Bucket cong khai: anh nen khong phai du lieu rieng tu, va de CDN cache duoc.
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "20MB",
    });
    if (error) {
      console.error(`  Khong tao duoc bucket: ${error.message}`);
      return 1;
    }
    console.log(`  Da tao bucket cong khai "${BUCKET}"`);
  }

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, file] of files.entries()) {
    const key = relative(PUBLIC, file).split("\\").join("/");
    const body = readFileSync(file);
    const contentType = MIME[extname(file).toLowerCase()] ?? "application/octet-stream";

    const { error } = await supabase.storage.from(BUCKET).upload(key, body, {
      contentType,
      // Anh la bat bien (ten co @2x/@3x) -> cache that lau.
      cacheControl: "public, max-age=31536000, immutable",
      upsert: true,
    });

    if (error) {
      failed += 1;
      console.error(`  ✕ ${key}: ${error.message}`);
    } else {
      uploaded += 1;
    }

    if ((index + 1) % 25 === 0 || index === files.length - 1) {
      process.stdout.write(`\r  ${index + 1}/${files.length} tep…`);
    }
  }

  const base = `${url.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}`;
  console.log(
    `\n\n  Tai len ${uploaded} tep, bo qua ${skipped}, loi ${failed}\n` +
      `\n  Them dong nay vao .env.local roi build lai:\n` +
      `     NEXT_PUBLIC_ASSET_BASE_URL=${base}\n`,
  );
  return failed > 0 ? 1 : 0;
}

main().then((code) => process.exit(code));
