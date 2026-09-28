"use client";

import { useState } from "react";
import type { PaginationModel } from "@/lib/pagination";

/**
 * Bo phan trang cua cac trang danh sach.
 *
 * Ve HOAN TOAN bang phan tu that (hinh ve san trong anh da duoc xoa di), vi so
 * trang phai suy ra tu so bai co that. Thiet ke ve "1 2 3 …" chi la hinh minh
 * hoa; danh sach nao chi du noi dung mot trang thi chi hien mot so.
 *
 * Kieu dang lay tu ban thiet ke: vien bo tron, nen sang hon nen trang mot chut,
 * so trang dang xem nam trong vong tron.
 */
export function Pagination({
  model,
  label,
}: {
  readonly model: PaginationModel;
  readonly label: string;
}) {
  const [page, setPage] = useState(1);
  const { box, pageCount, pages } = model;

  return (
    <>
      <nav
        className="tc-pager"
        style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
        aria-label={`Phân trang ${label}`}
      >
        <button
          type="button"
          className="tc-pager-arrow"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          aria-label="Trang trước"
        >
          <Arrow direction="left" />
        </button>

        <span className="tc-pager-pages">
          {pages.map((n) =>
            n === null ? (
              <span key="more" className="tc-pager-more" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                className={`tc-pager-page${n === page ? " is-on" : ""}`}
                onClick={() => setPage(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Trang ${n}`}
              >
                {n}
              </button>
            ),
          )}
        </span>

        <button
          type="button"
          className="tc-pager-arrow"
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={page === pageCount}
          aria-label="Trang sau"
        >
          <Arrow direction="right" />
        </button>
      </nav>

      {/* Danh sach chi du mot trang thi khong noi gi them: so "1" voi hai mui
          ten da tat da du ro. Truoc day cho nay co mot dong giai thich cach so
          trang tu tang — do la chuyen cua nguoi lam web, khach khong can doc. */}
    </>
  );
}

/** Mui ten tam giac, dung kieu cua ban thiet ke. */
function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 10 16" aria-hidden="true" focusable="false">
      <path
        d={direction === "left" ? "M8 1 L2 8 L8 15 Z" : "M2 1 L8 8 L2 15 Z"}
        fill="currentColor"
      />
    </svg>
  );
}
