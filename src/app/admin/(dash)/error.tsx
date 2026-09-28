"use client";

import { useEffect } from "react";
import { buttonClass, Card } from "@/components/admin/ui";

/** Bat loi trong khu quan tri — hien du thong tin de nguoi quan tri xu ly. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-10">
      <Card title="Không tải được trang" description="Thao tác vừa rồi gặp lỗi.">
        <p className="text-xs leading-relaxed text-white/60">
          Thường là do mất kết nối tới Supabase hoặc chưa chạy migration. Kiểm tra lại
          biến môi trường trong <code className="font-mono text-white/80">.env.local</code>{" "}
          và các tệp trong <code className="font-mono text-white/80">supabase/migrations/</code>.
        </p>

        {error.digest && (
          <p className="mt-4 text-[11px] text-white/35">
            Mã lỗi: <code className="font-mono">{error.digest}</code>
          </p>
        )}

        <button type="button" onClick={reset} className={`${buttonClass("primary")} mt-6`}>
          Thử lại
        </button>
      </Card>
    </div>
  );
}
