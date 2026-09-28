import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminSession } from "./auth";

export interface ActivityEntry {
  readonly action: string;
  readonly entity: string;
  readonly entityId?: string | null;
  readonly detail?: Readonly<Record<string, unknown>>;
}

/**
 * Ghi nhat ky hoat dong. Loi ghi nhat ky KHONG duoc lam that bai thao tac chinh —
 * chi log ra server de con theo dau.
 */
export async function logActivity(
  session: AdminSession,
  entry: ActivityEntry,
): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("activity_log").insert({
      actor_id: session.userId,
      actor_email: session.email,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      detail: entry.detail ?? {},
    });
    if (error) {
      console.error("[activity] Không ghi được nhật ký:", error.message);
    }
  } catch (error) {
    console.error("[activity] Lỗi khi ghi nhật ký:", error);
  }
}
