import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv, requireServiceRoleKey } from "./env";

let cached: SupabaseClient | null = null;

/**
 * Client service-role: bo qua RLS. CHI dung trong Route Handler / Server Action
 * da xac thuc admin. Khong bao gio import vao Client Component.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!cached) {
    const { url } = requirePublicEnv();
    cached = createClient(url, requireServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
