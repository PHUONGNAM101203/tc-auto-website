import Link from "next/link";
import type { NavSpec } from "@/lib/types";
import { SiteSearch } from "./SiteSearch";

interface SiteHeaderProps {
  /** Toa do nav lay tu page spec — moi trang Figma co vi tri x hoi khac nhau. */
  readonly nav: readonly NavSpec[];
}

/**
 * Header cua canvas. Logo la vung bam trong suot dat dung tren logo da ve san
 * trong anh nen (giong prototype), nen khong can asset logo rieng.
 */
export function SiteHeader({ nav }: SiteHeaderProps) {
  return (
    <header className="hdr">
      {/* prefetch={false}: Next mac dinh tai truoc moi trang duoc lien ket, keo
          theo ca anh nen dau trang cua chung — vao trang chu la tai them 5 anh
          cua 5 trang khac. Cac trang deu la static nen bo prefetch van chuyen
          trang rat nhanh, ma lan tai dau nhe han han. */}
      <Link className="logo" href="/" prefetch={false} aria-label="TC Auto Solutions - Trang chủ" />

      <nav aria-label="Điều hướng chính">
        {nav.map((entry) => (
          <Link
            key={entry.href}
            className={entry.active ? "nv act" : "nv"}
            style={{ left: `${entry.x}px` }}
            href={entry.href}
            prefetch={false}
            aria-current={entry.active ? "page" : undefined}
          >
            {entry.label}
            <i aria-hidden="true">›</i>
          </Link>
        ))}
      </nav>

      <SiteSearch />
    </header>
  );
}
