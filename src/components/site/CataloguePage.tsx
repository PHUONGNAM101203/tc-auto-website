import Link from "next/link";
import { MobileNav } from "@/components/mobile/MobileNav";
import { BackToTop } from "@/components/site/BackToTop";
import { JsonLd } from "@/components/site/JsonLd";
import { ScreenCatalogue } from "@/components/site/ScreenCatalogue";
import { getPageSpec } from "@/lib/pages";
import { getScreenModels } from "@/lib/screen-catalogue";
import { breadcrumbLd } from "@/lib/structured-data";
import { SITE } from "@/lib/site-config";

/**
 * Trang "Tất cả các mẫu màn hình".
 *
 * Bo thiet ke chi ve chin mau trong khi trang hang niem yet nhieu hon han,
 * va khong co cho nao de LOC. Trang nay gom day du va cho loc — xem
 * src/components/site/ScreenCatalogue.tsx.
 *
 * Gia: chua co. Khach se gui chinh sach gia sau (01/10/2026), nen o day noi
 * thang la "lien he" chu khong de mot o gia trong.
 */
export const CATALOGUE_SLUG = "giai-phap/man-hinh/tat-ca";
export const CATALOGUE_ROUTE = `/${CATALOGUE_SLUG}`;

export function CataloguePage() {
  const nav = getPageSpec("giai-phap").nav;
  const models = getScreenModels();

  return (
    <>
      <MobileNav nav={nav} />

      <JsonLd
        data={breadcrumbLd([
          { name: "Trang chủ", url: "/" },
          { name: "Giải pháp", url: "/giai-phap" },
          { name: "Màn hình ô tô", url: "/giai-phap/man-hinh" },
          { name: "Tất cả các mẫu", url: CATALOGUE_ROUTE },
        ])}
      />
      {/* Danh sach co thu tu — giup may tim kiem va may tra loi AI hieu day la
          mot danh muc san pham chu khong phai mot bai viet. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Màn hình ô tô tại ${SITE.name}`,
          numberOfItems: models.length,
          itemListElement: models.map((model, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: model.name,
          })),
        }}
      />

      <main className="tc-doc">
        <nav className="tc-doc-crumbs" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden="true">›</span>
          <Link href="/giai-phap">Giải pháp</Link>
          <span aria-hidden="true">›</span>
          <Link href="/giai-phap/man-hinh">Màn hình ô tô</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Tất cả các mẫu</span>
        </nav>

        <p className="tc-doc-label">MÀN HÌNH Ô TÔ</p>
        <h1 className="tc-doc-title">Chọn màn hình theo đúng thứ bạn cần.</h1>
        <p className="tc-doc-lead">
          {models.length} mẫu màn hình Winca và Bravo mà TC AUTO phân phối, kèm
          thông số do chính hãng công bố. Lọc theo hãng, kích thước, độ phân
          giải và camera 360 để thu hẹp nhanh về vài mẫu phù hợp với xe bạn.
        </p>

        <ScreenCatalogue />

        <aside className="tc-doc-pending">
          <h2>Về giá</h2>
          <p>
            Giá từng mẫu phụ thuộc dòng xe, phần công lắp đặt và các hạng mục đi
            kèm, nên TC AUTO báo giá theo từng xe thay vì niêm yết một con số
            chung. Gọi <strong>{"093 617 6996"}</strong> hoặc để lại thông tin ở
            form liên hệ, đội ngũ sẽ báo giá đúng cho xe của bạn.
          </p>
        </aside>

        <p className="tc-doc-cta">
          <Link href="/giai-phap/man-hinh">Quay lại Màn hình ô tô</Link>
        </p>
      </main>

      <BackToTop />
    </>
  );
}
