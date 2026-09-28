import Link from "next/link";
import type { Metadata } from "next";
import { getAllPageSpecs } from "@/lib/pages";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Không tìm thấy trang | ${SITE.name}`,
  // Khong khai bao robots o day: Next da tu them <meta name="robots" content="noindex">
  // cho not-found. Khai bao them chi tao ra the trung lap.
};

/**
 * Trang 404.
 *
 * Thiet ke Figma khong co frame cho trang nay, nen o day dung lai bang DUNG cac
 * token cua bo nhan dien (navy #02111C, do #C22326, Cormorant Infant / Unbounded /
 * Montserrat) thay vi bia ra mot phong cach khac.
 */
export default function NotFound() {
  const pages = getAllPageSpecs().filter((page) => page.slug !== "home");

  return (
    <main className="tc-404">
      <p className="tc-404-kicker">404</p>

      <h1 className="tc-404-title">
        KHÔNG TÌM THẤY
        <br />
        <em>TRANG NÀY.</em>
      </h1>

      <p className="tc-404-lead">
        Đường dẫn bạn vừa mở không tồn tại hoặc đã được chuyển đi nơi khác.
      </p>

      <Link href="/" className="tc-404-cta">
        VỀ TRANG CHỦ
      </Link>

      <nav className="tc-404-nav" aria-label="Các trang chính">
        {pages.map((page) => (
          <Link key={page.slug} href={page.route}>
            {page.title}
          </Link>
        ))}
      </nav>
    </main>
  );
}
