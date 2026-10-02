import { SiteHeader } from "@/components/site/SiteHeader";
import { MobileNav } from "@/components/mobile/MobileNav";
import { asset } from "@/lib/asset-version";
import type { NavSpec } from "@/lib/types";

/**
 * Header cho nhung trang KHONG co canvas: bai viet, san pham, danh muc, FAQ.
 *
 * Truoc day chung dung thanh dieu huong cua DIEN THOAI (nut ba gach) ngay ca
 * tren man hinh rong, nen nhin ra mot site khac han sau trang chinh. Khach
 * bao: "menu header y chang không được thay đổi" (02/10/2026).
 *
 * ── Cach lam ───────────────────────────────────────────────────────────────
 * Dung LAI dung `SiteHeader` — cung component, cung toa do — dat tren mot dai
 * canvas cao 100px. Dai do lay chinh hinh nen header cua trang chu
 * (tools/brand/cut-header-strip.py), nen logo, khung o tim kiem va nen chuyen
 * mau giong het; chu nav va o nhap thi la phan tu that nhu moi khi.
 *
 * Duoi 900px thi doi sang `MobileNav` — dung nguong ma canvas bi an.
 */
export function DocHeader({ nav }: { readonly nav: readonly NavSpec[] }) {
  return (
    <>
      <div className="tc-dochdr" aria-hidden={false}>
        <div className="tc-dochdr-canvas">
          {/* eslint-disable-next-line @next/next/no-img-element -- dai nen cat
              san tu thiet ke, khong qua image optimizer */}
          <img
            className="tc-dochdr-bg"
            src={asset("/brand/header-strip@2x.webp")}
            srcSet={`${asset("/brand/header-strip@2x.webp")} 2880w, ${asset(
              "/brand/header-strip@3x.webp",
            )} 4320w`}
            sizes="100vw"
            alt=""
            width={1440}
            height={100}
            fetchPriority="high"
          />
          <SiteHeader nav={nav} />
        </div>
      </div>

      {/* `MobileNav` binh thuong nam trong `.tc-m` — lop do tu an tren man
          rong. O day no dung mot minh nen phai co lop boc rieng, dung cung
          nguong 900px. */}
      <div className="tc-docnav-m">
        <MobileNav nav={nav} />
      </div>
    </>
  );
}
