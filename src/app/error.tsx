"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Bat loi cua moi trang trong site. Dung lai bang token cua bo nhan dien
 * (tai dung lop .tc-404 vi hai trang nay cung bo cuc).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ghi lai de con truy ve sau; noi dung loi KHONG hien ra cho nguoi dung.
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="tc-404">
      <p className="tc-404-kicker">LỖI</p>

      <h1 className="tc-404-title">
        TRANG GẶP
        <br />
        <em>SỰ CỐ.</em>
      </h1>

      <p className="tc-404-lead">
        Đã có lỗi ngoài dự kiến khi tải trang này. Bạn thử lại giúp chúng tôi, hoặc
        gọi hotline 093&nbsp;617&nbsp;6996 để được hỗ trợ ngay.
      </p>

      {error.digest && (
        <p className="tc-404-digest">
          Mã lỗi: <code>{error.digest}</code>
        </p>
      )}

      <div className="tc-404-actions">
        <button type="button" className="tc-404-cta" onClick={reset}>
          THỬ LẠI
        </button>
        <Link href="/" className="tc-404-ghost">
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
