/**
 * Truy cap bien moi truong Supabase mot cach an toan.
 * Site public van chay binh thuong khi chua cau hinh Supabase — luc do
 * noi dung lay tu page spec tinh va form lien he tra ve loi ro rang.
 */

export interface SupabasePublicEnv {
  readonly url: string;
  readonly anonKey: string;
}

export function readPublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

export function requirePublicEnv(): SupabasePublicEnv {
  const env = readPublicEnv();
  if (!env) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Sao chép .env.example thành .env.local và điền giá trị từ Supabase Dashboard → Settings → API.",
    );
  }
  return env;
}

export function readServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export function requireServiceRoleKey(): string {
  const key = readServiceRoleKey();
  if (!key) {
    throw new Error(
      "Thiếu SUPABASE_SERVICE_ROLE_KEY. Lấy tại Supabase Dashboard → Settings → API → service_role. " +
        "Chỉ dùng ở phía server, tuyệt đối không expose ra client.",
    );
  }
  return key;
}

export function isSupabaseConfigured(): boolean {
  return readPublicEnv() !== null;
}

export function isAdminConfigured(): boolean {
  return isSupabaseConfigured() && readServiceRoleKey() !== null;
}
