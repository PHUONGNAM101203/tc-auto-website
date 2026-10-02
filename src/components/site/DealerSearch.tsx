"use client";

import { useState } from "react";
import {
  BRANDS,
  findDealers,
  mapHref,
  PROVINCES,
  type DealerResult,
} from "@/lib/dealers";

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

/**
 * Toa do do LAI bang cach quet chinh anh nen (02/10/2026), khong lay uoc chung
 * tu frame nua.
 *
 * Ban cu de `left: 84, height: 48` trong khi hop ve san la x 83..436,
 * y 1235..1286 — tuc la phan tu that nam THUT VAO trong hop ve san 1-2px moi
 * phia. Khi chon gia tri, phan tu ve vien cua no va nguoi dung thay HAI duong
 * vien long nhau. Khach chi dung cho do: "không được cho nó có phần bị đè như
 * này ở bất cứ phần nào".
 *
 * Nay phan tu phu KHIT hop ve san, va khi co nen duc thi no che han vien ve
 * san di — chi con mot duong vien duy nhat.
 */
const FIELD = { left: 83, width: 354, height: 52 } as const;
const BRAND_TOP = 1235;
const PROVINCE_TOP = 1305;
/** Nut do ve san: x 83..262, y 1377..1410 (do bang cach quet diem mau do). */
const BUTTON = { left: 83, top: 1377, width: 180, height: 34 } as const;
/** Vung ket qua — dung cho vi tri ma thiet ke dat danh sach dai ly. */
const PANEL = { left: 830, top: 1100, width: 545, height: 640 } as const;

/**
 * `canvas` = dat tuyet doi len dung o chon ve san trong anh nen.
 * `mobile`  = xep doc, co dan theo be rong man hinh.
 *
 * Mot component chu khong phai hai: duoi 900px canvas bi an han, nen truoc day
 * tren dien thoai trang "Mạng lưới đại lý" KHONG CO cach nao tim dai ly —
 * ca hai o chon lan nut deu nam trong canvas.
 */
export function DealerSearch({
  layout = "canvas",
}: {
  readonly layout?: "canvas" | "mobile";
}) {
  const flow = layout === "mobile";
  const at = <T,>(style: T): T | undefined => (flow ? undefined : style);
  const [brand, setBrand] = useState("");
  const [province, setProvince] = useState("");
  const [result, setResult] = useState<(DealerResult & { province: string }) | null>(
    null,
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!brand || !province) {
      return;
    }
    setResult({ ...findDealers({ brand, province }), province });
  }

  return (
    <div className={flow ? "tc-dealer-m" : "tc-dealer-canvas"}>
      <form onSubmit={submit} aria-label="Tìm kiếm đại lý">
        <select
          className="tc-field"
          style={at({
            left: FIELD.left,
            top: BRAND_TOP,
            width: FIELD.width,
            height: FIELD.height,
          })}
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
          style={at({
            left: FIELD.left,
            top: PROVINCE_TOP,
            width: FIELD.width,
            height: FIELD.height,
          })}
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
          style={at({
            left: BUTTON.left,
            top: BUTTON.top,
            width: BUTTON.width,
            height: BUTTON.height,
          })}
        >
          TÌM KIẾM
        </button>
      </form>

      {result && (
        <div
          className="tc-dealer-panel"
          style={at({
            left: PANEL.left,
            top: PANEL.top,
            width: PANEL.width,
            maxHeight: PANEL.height,
          })}
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
            <div className="tc-dealer-empty">
              <p>
                Danh sách đại lý {result.province} đang được cập nhật. Gọi{" "}
                <a href="tel:+84936176996">093&nbsp;617&nbsp;6996</a> hoặc nhắn{" "}
                <a href="mailto:infor@tcautosolutions.vn">
                  infor@tcautosolutions.vn
                </a>{" "}
                để TC Auto giới thiệu đại lý gần bạn nhất.
              </p>
              {/* Khu vuc nguoi dung chon chua co thi it ra chi duoc cho gan
                  nhat, thay vi de ho tu mo. */}
              {(result.nearby?.length ?? 0) > 0 ? (
                <p className="tc-dealer-nearby">
                  Khu vực gần nhất đang có đại lý:{" "}
                  {result.nearby!.map((name, index) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setProvince(name);
                        setResult({ ...findDealers({ brand, province: name }), province: name });
                      }}
                    >
                      {name}
                      {index < result.nearby!.length - 1 ? "," : ""}
                    </button>
                  ))}
                </p>
              ) : null}
            </div>
          )}

          <button type="button" className="tc-dealer-close" onClick={() => setResult(null)}>
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}
