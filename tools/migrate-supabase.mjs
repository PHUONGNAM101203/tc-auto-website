/**
 * Chuyen du lieu tu du an Supabase CU sang du an MOI.
 *
 * ── Vi sao can mot bo rieng ────────────────────────────────────────────────
 * Khong the kết xuat roi nap thang: vai cot tro vao `auth.users`, ma BANG DO
 * KHONG chuyen duoc. Tai khoan quan tri o du an moi la mot nguoi dung khac,
 * co `id` khac han. Nap y nguyen thi hoac vi pham khoa ngoai, hoac te hon:
 * gan nhat ky hoat dong cho mot `id` khong ton tai.
 *
 * Nen bo nay:
 *   - BO HAN `admin_profiles` — tai khoan quan tri cua du an moi do chinh
 *     nguoi dung tao, roi cap quyen bang supabase/scripts/grant-admin.sql;
 *   - XOA cac cot tro nguoi dung (`updated_by`, `created_by`, `actor_id`) —
 *     de trong con hon tro sai;
 *   - giu nguyen `id` cua cac dong con lai, de duong dan /bai-viet/<slug> va
 *     moi tham chieu khac khong doi.
 *
 * ── Khong bao gio ghi de ──────────────────────────────────────────────────
 * Nap theo kieu `upsert` tren khoa chinh. Chay lai nhieu lan khong sinh ban
 * sao, va neu du an moi da co du lieu thi dong trung se duoc cap nhat chu
 * khong nhan doi.
 *
 * ── Bi mat ────────────────────────────────────────────────────────────────
 * Khoa cua du an MOI doc tu bien moi truong, KHONG doc tu .env.local — luc
 * chay bo nay thi .env.local van dang tro vao du an cu.
 *
 *   NEW_SUPABASE_URL=https://<ref>.supabase.co \
 *   NEW_SUPABASE_SERVICE_ROLE_KEY=... \
 *   node tools/migrate-supabase.mjs [--leads] [--dry]
 *
 *   --leads  nap ca bang `leads` (504 dong du lieu CA NHAN that: ten, so dien
 *            thoai). Mac dinh BO QUA — chuyen du lieu ca nhan sang mot he
 *            thong khac phai la quyet dinh co y, khong phai mac dinh.
 *   --dry    chi in ra se lam gi, khong ghi.
 *
 * Nguon: .backup/supabase-cu.json (do chinh phien lam viec nay xuat ra;
 * thu muc .backup da nam trong .gitignore vi chua du lieu ca nhan).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const DUMP = ".backup/supabase-cu.json";

/** Cot tro vao `auth.users` — phai xoa vi nguoi dung ben moi la nguoi khac. */
const USER_COLUMNS = ["updated_by", "created_by", "actor_id"];

/**
 * Thu tu nap. `settings` va `posts` truoc vi chung doc lap; `activity_log`
 * sau cung vi no chi la nhat ky.
 */
const ORDER = ["settings", "page_items", "posts", "media", "activity_log"];

/** Bang nay KHONG chuyen — xem phan dau tep. */
const SKIP = new Set(["admin_profiles"]);

const wantLeads = process.argv.includes("--leads");
const dryRun = process.argv.includes("--dry");

function strip(row) {
  const out = { ...row };
  for (const column of USER_COLUMNS) {
    if (column in out) out[column] = null;
  }
  return out;
}

async function main() {
  const url = process.env.NEW_SUPABASE_URL?.trim();
  const key = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Thieu NEW_SUPABASE_URL hoac NEW_SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Lay o Supabase Dashboard cua du an MOI -> Settings -> API.",
    );
  }

  let dump;
  try {
    dump = JSON.parse(readFileSync(DUMP, "utf8"));
  } catch {
    throw new Error(`Khong doc duoc ${DUMP}. Chay lai buoc xuat du lieu truoc.`);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const tables = [...ORDER];
  if (wantLeads) tables.push("leads");

  for (const table of tables) {
    if (SKIP.has(table)) continue;
    const rows = dump[table] ?? [];
    if (rows.length === 0) {
      console.log(`  ${table.padEnd(14)} khong co dong nao — bo qua`);
      continue;
    }
    if (dryRun) {
      console.log(`  ${table.padEnd(14)} se nap ${rows.length} dong (chay thu)`);
      continue;
    }

    // Chia lo: mot lan goi qua nhieu dong thi Supabase tu choi.
    const SIZE = 200;
    let done = 0;
    for (let at = 0; at < rows.length; at += SIZE) {
      const batch = rows.slice(at, at + SIZE).map(strip);
      const { error } = await supabase.from(table).upsert(batch, { onConflict: "id" });
      if (error) {
        console.log(`  ${table.padEnd(14)} LOI o lo ${at}: ${error.message}`);
        break;
      }
      done += batch.length;
    }
    console.log(`  ${table.padEnd(14)} nap ${done}/${rows.length} dong`);
  }

  if (!wantLeads) {
    const n = (dump.leads ?? []).length;
    console.log(
      `\n  BO QUA bang leads (${n} dong du lieu ca nhan). Them --leads neu muon chuyen.`,
    );
  }
  console.log(
    "\n  Con phai lam tay: tao tai khoan quan tri o du an moi roi chay\n" +
      "  supabase/scripts/grant-admin.sql — `admin_profiles` KHONG chuyen duoc.",
  );
}

main().catch((error) => {
  console.error(`\n  That bai: ${error.message}`);
  process.exit(1);
});
