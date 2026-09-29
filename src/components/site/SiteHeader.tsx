import Link from "next/link";
import type { NavSpec } from "@/lib/types";
import { SiteNav } from "./SiteNav";
import { SiteSearch } from "./SiteSearch";

interface SiteHeaderProps {
  /** Toa do nav lay tu page spec — moi trang Figma co vi tri x hoi khac nhau. */
  readonly nav: readonly NavSpec[];
  /** Xem chu thich `pill` trong SiteNav. Trang con phai truyen `false`. */
  readonly pill?: boolean;
  /**
   * O tim kiem da duoc VE SAN trong anh nen cua trang nay chua.
   * Neu roi thi o that phai trong suot luc nghi, khong thi chu bi nhan doi —
   * xem src/lib/search-baked.ts.
   */
  readonly searchBaked?: boolean;
}

/**
 * Header cua canvas. Logo la vung bam trong suot dat dung tren logo da ve san
 * trong anh nen (giong prototype), nen khong can asset logo rieng.
 */
export function SiteHeader({ nav, pill, searchBaked }: SiteHeaderProps) {
  return (
    <header className={searchBaked ? "hdr tc-search-baked" : "hdr"}>
      {/* prefetch={false}: Next mac dinh tai truoc moi trang duoc lien ket, keo
          theo ca anh nen dau trang cua chung — vao trang chu la tai them 5 anh
          cua 5 trang khac. Cac trang deu la static nen bo prefetch van chuyen
          trang rat nhanh, ma lan tai dau nhe han han. */}
      <Link
        className="logo"
        href="/"
        prefetch={false}
        aria-label="TC Auto Solutions - Trang chủ"
      />

      <SiteNav nav={nav} pill={pill} />

      <SiteSearch />
    </header>
  );
}
