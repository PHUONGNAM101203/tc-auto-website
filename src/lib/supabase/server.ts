import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "./env";

/**
 * Client chi de DOC noi dung cong khai (page_items, settings...).
 *
 * KHONG dung cookie. Day la diem mau chot: chi can cham vao `cookies()` la Next
 * coi ca tuyen duong do la dong, 47 trang tinh mat sach loi the toc do. Noi dung
 * cong khai thi khong can phien dang nhap, nen dung client "tran" va de RLS lo
 * phan quyen.
 */
export function createSupabasePublicClient(): SupabaseClient {
  const { url, anonKey } = requirePublicEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Supabase client dung trong Server Component / Route Handler.
 * Doc & ghi session qua cookie nen dang nhap admin duoc giu qua request.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = requirePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component khong duoc phep ghi cookie — middleware se lo viec refresh.
        }
      },
    },
  });
}
