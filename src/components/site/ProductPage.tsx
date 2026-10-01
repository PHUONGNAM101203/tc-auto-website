import Link from "next/link";
import { assetUrl } from "@/lib/asset-url";
import { SITE_CONTACT } from "@/lib/site-contact";
import { categoryOf, otherProducts, type Product } from "@/lib/products";
import { getProductSpecs } from "@/lib/product-specs";

/**
 * Trang chi tiet mot san pham man hinh o to.
 *
 * ── Dung theo mach nao ─────────────────────────────────────────────────────
 * Bo thiet ke co dung MOT trang chi tiet mau — "3M Ceramic Elite IM" ben muc
 * Phim dan kinh. Mach cua no la:
 *     ten san pham mau do, gach ngang hai ben
 *     -> doan mo -> anh lon -> cac muc -> khoi lien he -> dai "CÁC BÀI VIẾT KHÁC"
 * Trang nay di theo dung mach do, chi thay dai bai viet bang dai san pham khac.
 *
 * Dung chung lop `tc-doc` voi hai trang tu soan san co (src/lib/authored-pages.ts)
 * de ca ba trang cung mot kieu chu, mot he mau, va deu CO DAN theo be rong man
 * hinh thay vi dong khung 1440px.
 *
 * ── Cho nao con thieu thi noi thang ────────────────────────────────────────
 * Thiet ke khong co thong so ky thuat, gia hay chinh sach bao hanh cua tung
 * may. Thong so nay da lay duoc tu trang chinh hang (xem src/lib/product-specs.ts);
 * phan con lai thi khoi `tc-doc-pending` noi ro thay vi bia so.
 */

/** Nhung gi chi TC Auto moi cung cap duoc. Khong tu dien. */
const PENDING = [
  "Giá bán và chính sách bảo hành của từng dòng máy",
  "Danh sách dòng xe lắp vừa",
  "Ảnh thực tế sau khi lắp trên xe",
];

/** Khi chua co thong so cua may nay thi van phai noi ro la con thieu. */
const PENDING_NO_SPECS = [
  "Thông số kỹ thuật: vi xử lý, RAM, bộ nhớ trong, hệ điều hành",
  ...PENDING,
];

export function ProductPage({ product }: { product: Product }) {
  const category = categoryOf(product);
  const others = otherProducts(product.slug);
  const tech = getProductSpecs(product.slug);

  return (
    <main className="tc-doc tc-prod">
      <nav className="tc-doc-crumbs" aria-label="Đường dẫn">
        <Link href="/">Trang chủ</Link>
        <span aria-hidden="true">›</span>
        <Link href={category.parent}>{category.parentLabel}</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/${category.slug}`}>{category.title}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <p className="tc-doc-label">{category.label}</p>

      {/* Ten san pham mau do kem gach ngang hai ben — dung nhu trang mau. */}
      <h1 className="tc-prod-name">{product.name}</h1>

      {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san tu
          frame thiet ke o ti le goc, khong qua image optimizer */}
      <img
        className="tc-prod-shot"
        src={assetUrl(product.image)}
        alt={`Màn hình ${product.name}`}
        width={product.imageWidth}
        height={product.imageHeight}
        decoding="async"
      />

      <p className="tc-doc-lead">{product.description}</p>

      {tech ? (
        <section className="tc-prod-specs" aria-labelledby="tc-prod-specs-title">
          <h2 id="tc-prod-specs-title">Thông số kỹ thuật</h2>
          <dl>
            {tech.specs.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
          {/* Noi ro so lieu lay tu dau, de nguoi doc va TC Auto cung kiem duoc. */}
          <p className="tc-doc-source">
            Thông số do hãng công bố tại{" "}
            <a href={tech.source} target="_blank" rel="noopener noreferrer">
              wincavn.com
            </a>
            . Chỗ nào trang hãng không nêu thì ở đây cũng không có.
          </p>
        </section>
      ) : null}

      <aside className="tc-doc-pending">
        <h2>Đang chờ TC Auto cung cấp</h2>
        <ul>
          {(tech ? PENDING : PENDING_NO_SPECS).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          Tên, mô tả và ảnh trên đây lấy từ chính bản thiết kế. Những mục vừa liệt kê thì
          bản thiết kế không có, nên chúng tôi không tự điền.
        </p>
      </aside>

      <section className="tc-doc-block">
        <h2>Cần tư vấn dòng máy phù hợp với xe của bạn?</h2>
        <p>
          Kích thước khoang lái và hệ thống điện mỗi dòng xe một khác, nên cùng một màn
          hình có thể vừa xe này mà không vừa xe kia. Gọi hoặc nhắn cho TC Auto kèm dòng
          xe của bạn, đội kỹ thuật sẽ nói rõ máy nào lắp vừa.
        </p>
        <p className="tc-prod-contact">
          <a href={`tel:${SITE_CONTACT.phone.replace(/\s/g, "")}`}>{SITE_CONTACT.phone}</a>
          <span aria-hidden="true">·</span>
          <a href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>
          <span aria-hidden="true">·</span>
          <span>{SITE_CONTACT.hours}</span>
        </p>
      </section>

      {others.length > 0 && (
        <section className="tc-prod-more" aria-labelledby="tc-prod-more-title">
          <h2 id="tc-prod-more-title">Sản phẩm khác</h2>
          <ul>
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={other.route}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- nhu tren */}
                  <img
                    src={assetUrl(other.image)}
                    alt=""
                    width={other.imageWidth}
                    height={other.imageHeight}
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{other.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="tc-doc-cta">
        <Link href={`/${category.slug}`}>{`Xem tất cả ${category.title.toLowerCase()}`}</Link>
      </p>
    </main>
  );
}
