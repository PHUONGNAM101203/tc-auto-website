import { asset } from "@/lib/asset-version";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { SetupNotice } from "@/components/admin/SetupNotice";
import { buttonClass } from "@/components/admin/ui";
import { signOutAction } from "@/lib/admin/actions";
import { readAdminGate, ROLE_LABEL } from "@/lib/admin/auth";
import { readPublicEnv, readServiceRoleKey } from "@/lib/supabase/env";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const gate = await readAdminGate();

  if (gate.kind === "unconfigured") {
    const missing: string[] = [];
    if (!readPublicEnv()) {
      missing.push("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    if (!readServiceRoleKey()) {
      missing.push("SUPABASE_SERVICE_ROLE_KEY");
    }
    return <SetupNotice missing={missing} />;
  }

  if (gate.kind === "anonymous") {
    redirect("/admin/login");
  }

  if (gate.kind === "forbidden") {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Không có quyền truy cập</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Tài khoản {gate.email ? <strong className="text-white/85">{gate.email}</strong> : "này"}{" "}
          chưa được cấp quyền quản trị. Thêm tài khoản vào bảng{" "}
          <code className="font-mono text-white/80">admin_profiles</code> — xem{" "}
          <code className="font-mono text-white/80">supabase/migrations/0002_seed_admin.sql</code>.
        </p>
        <form action={signOutAction} className="mt-8">
          <button type="submit" className={buttonClass("ghost")}>
            Đăng xuất
          </button>
        </form>
      </main>
    );
  }

  const { session } = gate;

  return (
    // Nen gradient lay mach mau tu anh xe trong bo nhan dien (navy sau -> xanh
    // ngoc o goc), thay cho nen phang.
    <div className="tc-admin flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/8 px-4 py-6 lg:flex">
        <Link href="/admin" className="block px-3" aria-label="TC Auto Solutions — quản trị">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo chuan trong bo nhan dien */}
          <img
            src={asset("/brand/logo-horizontal-on-dark.png")}
            alt="TC Auto Solutions"
            width={150}
            height={34}
            className="h-8 w-auto"
          />
          <span className="mt-2 block text-[10px] tracking-[0.22em] text-white/35">
            QUẢN TRỊ
          </span>
        </Link>

        <div className="mt-8 flex-1">
          <AdminNav />
        </div>

        <div className="space-y-3 border-t border-white/8 pt-4">
          <div className="px-3">
            <p className="truncate text-xs font-medium text-white/85">
              {session.fullName ?? session.email}
            </p>
            <p className="mt-0.5 text-[11px] text-white/40">{ROLE_LABEL[session.role]}</p>
          </div>
          <form action={signOutAction} className="px-1">
            <button type="submit" className={`${buttonClass("ghost")} w-full`}>
              Đăng xuất
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-3 lg:px-8">
          <div className="lg:hidden">
            <AdminNav />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-white/50 transition hover:text-white"
            >
              Xem website ↗
            </Link>
          </div>
        </header>

        <main className="px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
