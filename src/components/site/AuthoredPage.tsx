import Link from "next/link";
import { assetUrl } from "@/lib/asset-url";
import { DocHeader } from "@/components/site/DocHeader";
import { BackToTop } from "@/components/site/BackToTop";
import { JsonLd } from "@/components/site/JsonLd";
import { authoredProductLd, breadcrumbLd } from "@/lib/structured-data";
import type { AuthoredPage as Page } from "@/lib/authored-pages";
import { getPageSpec } from "@/lib/pages";

/**
 * Bo cuc cho trang do chung ta soan.
 *
 * Khong dung canvas 1440px: trang nay co dan theo be rong man hinh nen doc tot
 * tren dien thoai. Mau sac va kieu chu lay dung tu bo nhan dien.
 *
 * Header dung `DocHeader`: tren man rong la DUNG header cua trang chu, duoi
 * 900px thi doi sang nut ba gach. Truoc day ba trang tu soan khong co thanh
 * nao ca — vao roi la cut duong, phai bam nut lui cua trinh duyet moi ra
 * duoc; roi co nut ba gach nhung no hien ca tren man rong nen nhin ra mot
 * site khac han sau trang chinh.
 */
export function AuthoredPage({ page }: { page: Page }) {
  // Danh sach muc menu lay tu dac ta cua chinh muc cha, nen thu tu va nhan
  // luon khop voi 37 trang con lai.
  const nav = getPageSpec(page.section).nav;

  return (
    <>
      <DocHeader nav={nav} />
      <main className="tc-doc">
        {/* Khai khop tung muc voi <nav> ngay duoi. */}
        <JsonLd
          data={breadcrumbLd([
            { name: "Trang chủ", url: "/" },
            { name: page.parentLabel, url: page.parent },
            { name: page.title, url: `/${page.slug}` },
          ])}
        />

        {/* Moi dong san pham khai rieng mot mau — nho vay may tim kiem va may
            tra loi AI nhan ra day la ba dong may chu khong phai mot bai viet. */}
        {page.products?.items.map((item) => (
          <JsonLd
            key={item.name}
            data={authoredProductLd(item, `/${page.slug}`)}
          />
        ))}

        <nav className="tc-doc-crumbs" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden="true">›</span>
          <Link href={page.parent}>{page.parentLabel}</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{page.title}</span>
        </nav>

        <p className="tc-doc-label">{page.label}</p>
        <h1 className="tc-doc-title">{page.heading}</h1>
        <p className="tc-doc-lead">{page.lead}</p>

        {page.blocks.map((block) => (
          <section key={block.heading} className="tc-doc-block">
            <h2>{block.heading}</h2>
            {block.paragraphs.map((text, index) => (
              <p key={`${index}-${text.slice(0, 16)}`}>{text}</p>
            ))}
          </section>
        ))}

        {page.products ? (
          <section className="tc-doc-products" aria-labelledby="tc-doc-products-title">
            <h2 id="tc-doc-products-title">{page.products.heading}</h2>
            <p className="tc-doc-products-intro">{page.products.intro}</p>

            <ul>
              {page.products.items.map((product) => (
                <li key={product.name}>
                  <h3>{product.name}</h3>
                  <p>{product.tagline}</p>
                  {product.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- anh
                       chep tu trang hang o ti le goc, khong qua image optimizer */
                    <img
                      className="tc-doc-shot"
                      src={assetUrl(product.image)}
                      alt={`Màn hình ${product.name}`}
                      width={product.imageWidth}
                      height={product.imageHeight}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  {product.specs.length > 0 ? (
                    <dl>
                      {product.specs.map((spec) => (
                        <div key={spec.label}>
                          <dt>{spec.label}</dt>
                          <dd>{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {product.note ? <p className="tc-doc-products-note">{product.note}</p> : null}
                </li>
              ))}
            </ul>

            <p className="tc-doc-source">{page.products.source}</p>
          </section>
        ) : null}

        <aside className="tc-doc-pending">
          <h2>{page.pending.heading}</h2>
          <ul>
            {page.pending.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            Trang này do đội ngũ dựng web soạn để nút “Khám phá ngay” có nơi dẫn tới. Những
            mục trên là số liệu nghiệp vụ — chỉ TC Auto mới cung cấp được, nên chúng tôi
            không tự điền.
          </p>
        </aside>

        <p className="tc-doc-cta">
          <Link href={page.cta.href}>{page.cta.label}</Link>
        </p>
      </main>

      <BackToTop />
    </>
  );
}
