"use client";

import { useState } from "react";

/**
 * Xem truoc trang that ngay trong khu quan tri.
 *
 * Sua xong thi khong phai mo tab moi de kiem tra: khung nay nhung chinh trang
 * cong khai. Nut "Tai lai" ep khung doc lai sau khi luu — trang cong khai dung
 * ISR nen ban vua luu co the con trong bo nho dem vai giay.
 */
export function PreviewPane({ route, label }: { route: string; label: string }) {
  const [nonce, setNonce] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <section className="tc-preview">
      <header className="tc-preview-bar">
        <span className="tc-preview-title">Xem trước · {label}</span>

        <div className="tc-preview-tools">
          <button
            type="button"
            data-on={device === "desktop" || undefined}
            onClick={() => setDevice("desktop")}
          >
            Máy tính
          </button>
          <button
            type="button"
            data-on={device === "mobile" || undefined}
            onClick={() => setDevice("mobile")}
          >
            Điện thoại
          </button>
          <button type="button" onClick={() => setNonce((value) => value + 1)}>
            Tải lại
          </button>
          <a href={route} target="_blank" rel="noreferrer noopener">
            Mở tab mới ↗
          </a>
        </div>
      </header>

      <div className="tc-preview-stage" data-device={device}>
        <iframe
          key={nonce}
          src={`${route}${route.includes("?") ? "&" : "?"}preview=${nonce}`}
          title={`Xem trước ${label}`}
          loading="lazy"
        />
      </div>
    </section>
  );
}
