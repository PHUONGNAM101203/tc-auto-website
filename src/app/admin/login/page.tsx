import { asset } from "@/lib/asset-version";
import { Suspense } from "react";

import { LoginForm } from "@/components/admin/LoginForm";
import { SetupNotice } from "@/components/admin/SetupNotice";
import { isAdminConfigured, readPublicEnv, readServiceRoleKey } from "@/lib/supabase/env";

export default function LoginPage() {
  if (!isAdminConfigured()) {
    const missing: string[] = [];
    if (!readPublicEnv()) {
      missing.push("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    if (!readServiceRoleKey()) {
      missing.push("SUPABASE_SERVICE_ROLE_KEY");
    }
    return <SetupNotice missing={missing} />;
  }

  return (
    <main className="tc-login">
      <div className="tc-login-card">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo chuan trong bo nhan dien */}
        <img
          src={asset("/brand/logo-horizontal-on-dark.png")}
          alt="TC Auto Solutions"
          width={176}
          height={40}
          className="tc-login-logo"
        />
        <h1 className="mt-6 text-xl font-semibold">Đăng nhập quản trị</h1>
        <p className="mt-2 text-xs leading-relaxed text-white/45">
          Dùng tài khoản đã được cấp quyền trong bảng admin_profiles.
        </p>

      {/* LoginForm doc ?next= bang useSearchParams. Khong co bien Suspense thi
          Next khong dung tinh duoc trang nay. */}
      <Suspense fallback={<div className="mt-6 h-40" aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
      </div>
    </main>
  );
}
