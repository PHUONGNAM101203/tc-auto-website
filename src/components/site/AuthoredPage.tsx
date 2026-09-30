import Link from "next/link";
import type { AuthoredPage as Page } from "@/lib/authored-pages";

/**
 * Bo cuc cho trang do chung ta soan.
 *
 * Khong dung canvas 1440px: trang nay co dan theo be rong man hinh nen doc tot
 * tren dien thoai. Mau sac va kieu chu lay dung tu bo nhan dien.
 */
export function AuthoredPage({ page }: { page: Page }) {
  return (
    <main className="tc-doc">
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
  );
}
