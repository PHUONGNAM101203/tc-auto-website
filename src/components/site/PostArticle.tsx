import Link from "next/link";
import { formatPostDate, postParagraphs } from "@/lib/posts";

/**
 * Than mot bai viet.
 *
 * Dung chung cho trang cong khai va cho khung XEM TRUOC trong quan tri — co
 * mot ban duy nhat nen nhung gi admin thay truoc khi dang dung la thu se hien
 * ra ngoai site, khong phai mot ban dung lai gan giong.
 */
export interface ArticleView {
  readonly title: string;
  readonly excerpt: string | null;
  readonly body: string;
  readonly coverUrl: string | null;
  readonly sourceUrl: string | null;
  readonly publishedAt: string | null;
}

export function PostArticle({
  post,
  crumbHref = "/",
}: {
  readonly post: ArticleView;
  readonly crumbHref?: string;
}) {
  const date = formatPostDate(post.publishedAt);

  return (
    <main className="tc-doc">
      <nav className="tc-doc-crumbs" aria-label="Đường dẫn">
        <Link href={crumbHref}>Trang chủ</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Bài viết</span>
      </nav>

      {date ? <p className="tc-doc-label">{date}</p> : null}
      <h1 className="tc-doc-title">{post.title}</h1>
      {post.excerpt ? <p className="tc-doc-lead">{post.excerpt}</p> : null}

      {post.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- anh do admin dan vao
        <img className="tc-doc-cover" src={post.coverUrl} alt="" loading="lazy" />
      ) : null}

      <div className="tc-doc-block">
        {postParagraphs(post.body).map((text, index) => (
          <p key={`${index}-${text.slice(0, 16)}`}>{text}</p>
        ))}
      </div>

      {post.sourceUrl ? (
        <p className="tc-doc-source">
          Nguồn:{" "}
          <a href={post.sourceUrl} target="_blank" rel="noreferrer noopener">
            {post.sourceUrl}
          </a>
        </p>
      ) : null}
    </main>
  );
}
