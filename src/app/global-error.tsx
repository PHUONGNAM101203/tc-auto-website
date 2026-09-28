"use client";

/**
 * Luoi cuoi cung: bat ca loi xay ra trong chinh layout goc.
 * Component nay PHAI tu render <html> va <body> vi luc nay layout goc da hong.
 * Vi vay khong dung duoc CSS cua site — style phai viet thang vao day.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "10vh 8vw",
          background: "#02111c",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <p style={{ color: "#c22326", fontWeight: 800, letterSpacing: "0.04em" }}>
          TC AUTO SOLUTIONS
        </p>
        <h1 style={{ margin: "18px 0 0", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 600 }}>
          Đã có lỗi xảy ra
        </h1>
        <p style={{ marginTop: 16, maxWidth: "46ch", lineHeight: 1.6, color: "rgba(255,255,255,.6)" }}>
          Trang gặp sự cố ngoài dự kiến. Bạn thử tải lại giúp chúng tôi, hoặc gọi
          hotline 093&nbsp;617&nbsp;6996 để được hỗ trợ ngay.
        </p>

        {error.digest && (
          <p style={{ marginTop: 20, fontSize: 12, color: "rgba(255,255,255,.35)" }}>
            Mã lỗi: <code>{error.digest}</code>
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 34,
            alignSelf: "flex-start",
            height: 44,
            padding: "0 26px",
            border: 0,
            borderRadius: 6,
            background: "#c22326",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Thử lại
        </button>
      </body>
    </html>
  );
}
