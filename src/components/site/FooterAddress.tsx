import { SITE_CONTACT } from "@/lib/site-contact";

/**
 * Dong DIA CHI TRU SO trong chan trang cua canvas.
 *
 * ── Vi sao phai ve them ────────────────────────────────────────────────────
 * Chan trang thiet ke chi co ba dong: dien thoai, email, gio lam viec. Khong
 * co dia chi — luc dung thiet ke TC Auto chua cung cap. Thieu no thi khong
 * khai duoc `LocalBusiness` (schema bat buoc co `address`), nghia la khong
 * len duoc ket qua tim kiem dia phuong cua Google. Khach cung cap
 * 02/10/2026; dong nay la cho hien cho nguoi doc, con ban cho may doc nam o
 * `organizationLd()` trong structured-data.ts.
 *
 * ── Do ở đâu ra ───────────────────────────────────────────────────────────
 * Moi con so duoi day do thang tu lat nen chu khong uoc chung:
 *   - ba dong co san cach day trang 135 / 119 / 103 px → nhip 16px, nen dong
 *     thu tu dat o 87 - 16 = 71px; nhung o khoi cao 11px nen lay 75 de khoang
 *     ho tren va duoi deu nhau (bieu tuong mang xa hoi bat dau o 62px);
 *   - cot phai bat dau x 1235 (mep trai bieu tuong), chu bat dau x 1251;
 *   - chu cao 5px canvas (10 hang o ban @2x) → Montserrat ~9.5px;
 *   - mau diem sang nhat la #edf1f5, tuc gan trang co giam nhe.
 *
 * Day la mot NGOAI LE so voi thiet ke, da khai trong design-deviations.ts.
 */
export function FooterAddress({ pageHeight }: { readonly pageHeight: number }) {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    SITE_CONTACT.address,
  )}`;

  return (
    <a
      className="tc-footaddr"
      href={maps}
      target="_blank"
      rel="noopener noreferrer"
      style={{ top: `${pageHeight - 75}px` }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11ZM12 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      <span>{SITE_CONTACT.address}</span>
    </a>
  );
}
