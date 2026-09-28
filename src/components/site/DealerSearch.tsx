"use client";

import { useState } from "react";
import { BRANDS, findDealers, mapHref, PROVINCES, type Dealer } from "@/lib/dealers";

/**
 * Tim kiem dai ly tren trang "Mạng lưới đại lý".
 *
 * Thiet ke ve san hai o chon va nut "TÌM KIẾM" ngay trong anh nen, nen o day
 * chi dat cac dieu khien THAT de dung toa do do — trong suot khi nhan roi
 * (xem .tc-ghost trong overlay.css), chi hien khi nguoi dung cham vao.
 *
 * Toa do do truc tiep tu frame thiet ke:
 *   o chon 1   x 84  y 1237  354x48
 *   o chon 2   x 84  y 1305  354x48
 *   nut        x 83  y 1377  179x34   (trung voi nut do detector do duoc)
 */

const FIELD = { left: 84, width: 354, height: 48 } as const;
const BRAND_TOP = 1237;
const PROVINCE_TOP = 1305;
const BUTTON = { left: 83, top: 1377, width: 179, height: 34 } as const;
/** Vung ket qua — dung cho vi tri ma thiet ke dat danh sach dai ly. */
const PANEL = { left: 830, top: 1100, width: 545, height: 640 } as const;

export function DealerSearch() {
  const [brand, setBrand] = useState("");
  const [province, setProvince] = useState("");
  const [result, setResult] = useState<{
    dealers: readonly Dealer[];
    pending: boolean;
    province: string;
  } | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!brand || !province) {
      return;
    }
    setResult({ ...findDealers({ brand, province }), province });
  }

  return (
    <>
      <form onSubmit={submit} aria-label="Tìm kiếm đại lý">
        <select
          className="tc-field"
          style={{ left: FIELD.left, top: BRAND_TOP, width: FIELD.width, height: FIELD.height }}
          value={brand}
          data-filled={brand ? "true" : "false"}
          onChange={(event) => setBrand(event.target.value)}
          aria-label="Chọn hãng"
        >
          <option value="">Đại lý</option>
          {BRANDS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="tc-field"
          style={{ left: FIELD.left, top: PROVINCE_TOP, width: FIELD.width, height: FIELD.height }}
          value={province}
          data-filled={province ? "true" : "false"}
          onChange={(event) => setProvince(event.target.value)}
          aria-label="Chọn tỉnh hoặc thành phố"
        >
          <option value="">Tỉnh / Thành phố</option>
          {PROVINCES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="tc-field-submit"
          style={{ left: BUTTON.left, top: BUTTON.top, width: BUTTON.width, height: BUTTON.height }}
        >
          TÌM KIẾM
        </button>
      </form>

      {result && (
        <div
          className="tc-dealer-panel"
          style={{ left: PANEL.left, top: PANEL.top, width: PANEL.width, maxHeight: PANEL.height }}
          role="region"
          aria-live="polite"
          aria-label="Kết quả tìm đại lý"
        >
          <p className="tc-dealer-head">
            {result.dealers.length > 0
              ? `${result.dealers.length} đại lý tại ${result.province}`
              : `Đại lý tại ${result.province}`}
          </p>

          {result.dealers.length > 0 ? (
            <ul>
              {result.dealers.map((dealer) => (
                <li key={`${dealer.name}-${dealer.area}`}>
                  <a
                    href={mapHref(dealer)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Mở ${dealer.name} tại ${dealer.area} trên Google Maps`}
                  >
                    {dealer.name} <span>– {dealer.area}</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tc-dealer-empty">
              Danh sách đại lý khu vực này đang được cập nhật. Vui lòng gọi hotline
              093&nbsp;617&nbsp;6996 để được hỗ trợ ngay.
            </p>
          )}

          <button type="button" className="tc-dealer-close" onClick={() => setResult(null)}>
            Đóng
          </button>
        </div>
      )}
    </>
  );
}
