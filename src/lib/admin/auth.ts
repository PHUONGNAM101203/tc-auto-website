import { redirect } from "next/navigation";
import { isAdminConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminRole = "owner" | "admin" | "editor" | "viewer";

export interface AdminSession {
  readonly userId: string;
  readonly email: string;
  readonly fullName: string | null;
  readonly role: AdminRole;
}

export type AdminGate =
  | { readonly kind: "ok"; readonly session: AdminSession }
  | { readonly kind: "unconfigured" }
  | { readonly kind: "anonymous" }
  | { readonly kind: "forbidden"; readonly email: string };

/**
 * Xac dinh trang thai quyen cua request hien tai — khong redirect.
 * Dung cho layout de co the hien trang huong dan setup thay vi 500.
 */
export async function readAdminGate(): Promise<AdminGate> {
  if (!isAdminConfigured()) {
    return { kind: "unconfigured" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { kind: "anonymous" };
    }

    const { data, error } = await supabase
      .from("admin_profiles")
      .select("id, email, full_name, role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[admin/auth] Không đọc được admin_profiles:", error.message);
      return { kind: "forbidden", email: user.email ?? "" };
    }

    if (!data || data.is_active !== true) {
      return { kind: "forbidden", email: user.email ?? "" };
    }

    return {
      kind: "ok",
      session: {
        userId: data.id as string,
        email: (data.email as string) ?? user.email ?? "",
        fullName: (data.full_name as string | null) ?? null,
        role: (data.role as AdminRole) ?? "viewer",
      },
    };
  } catch (error) {
    console.error("[admin/auth] Lỗi khi kiểm tra quyền:", error);
    return { kind: "forbidden", email: "" };
  }
}

/** Dung trong Server Action / Route Handler: nem loi hoac redirect neu khong du quyen. */
export async function requireAdmin(minimum: AdminRole = "editor"): Promise<AdminSession> {
  const gate = await readAdminGate();

  if (gate.kind === "anonymous") {
    redirect("/admin/login");
  }
  if (gate.kind === "unconfigured") {
    throw new Error("Supabase chưa được cấu hình. Xem .env.example.");
  }
  if (gate.kind === "forbidden") {
    throw new Error("Tài khoản của bạn không có quyền truy cập trang quản trị.");
  }
  if (!hasAtLeast(gate.session.role, minimum)) {
    throw new Error(
      `Thao tác này cần quyền "${minimum}" trở lên. Quyền hiện tại: "${gate.session.role}".`,
    );
  }
  return gate.session;
}

const RANK: Readonly<Record<AdminRole, number>> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

export function hasAtLeast(role: AdminRole, minimum: AdminRole): boolean {
  return RANK[role] >= RANK[minimum];
}

export const ROLE_LABEL: Readonly<Record<AdminRole, string>> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị",
  editor: "Biên tập",
  viewer: "Chỉ xem",
};
