"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { credentialsSchema } from "@/lib/validation";
import { buttonClass, Field, TextInput } from "./ui";

/** Dang nhap bang Supabase Auth; session duoc luu vao cookie qua @supabase/ssr. */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const next = params.get("next");
  const target = next?.startsWith("/admin") ? next : "/admin";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const parsed = credentialsSchema.safeParse({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (key && !(key in next)) {
          next[key] = issue.message;
        }
      }
      setFields(next);
      setError("Vui lòng kiểm tra lại thông tin đăng nhập.");
      return;
    }

    setFields({});
    setError(null);
    setPending(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);

      if (authError) {
        // Khong tiet lo email co ton tai hay khong.
        setError("Email hoặc mật khẩu không đúng.");
        return;
      }

      router.replace(target);
      router.refresh();
    } catch (cause) {
      console.error("[admin/login]", cause);
      setError("Không kết nối được tới máy chủ xác thực. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
      <Field label="Email" htmlFor="email" error={fields.email}>
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(fields.email)}
          placeholder="admin@tcauto.vn"
        />
      </Field>

      <Field label="Mật khẩu" htmlFor="password" error={fields.password}>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(fields.password)}
          placeholder="••••••••"
        />
      </Field>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-brand/12 px-3.5 py-2.5 text-xs text-brand-soft ring-1 ring-inset ring-brand/30"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className={`${buttonClass("primary")} w-full`}>
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}
