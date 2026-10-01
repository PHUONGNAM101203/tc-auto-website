import Link from "next/link";
import { Badge, Card, formatBytes, formatNumber } from "@/components/admin/ui";
import { countDetected } from "@/lib/hotspots";
import { getPageSpec } from "@/lib/pages";
import { getPageText } from "@/lib/subpage-text";
import { getSectionPages, getSubPageStats } from "@/lib/subpages";
import { PAGE_SLUGS, type PageSlug } from "@/lib/types";

/**
 * KHONG duoc dat "force-static" o day.
 *
 * Trang nay nam trong layout co kiem tra dang nhap. Dung san tinh thi luc build
 * layout chay khi CHUA co nguoi dung, va lenh chuyen ve trang dang nhap bi nuong
 * luon vao ban tinh — vao la bi da ra dang nhap, roi proxy thay da dang
 * nhap nen day tiep ve /admin. Ket qua: muc "Trang con" khong bao gio mo duoc.
 */
export const dynamic = "force-dynamic";

export default function SubPagesPage() {
  const stats = getSubPageStats();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold">Trang con</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/45">
          31 trang dựng từ frame thiết kế đã render (PNG @3x → WebP @2x). Khác 6 trang
          chính, chữ nằm trong ảnh nên không sửa được text ở đây — muốn đổi nội dung thì
          sửa trong Figma rồi export lại và chạy{" "}
          <code className="font-mono text-white/70">npm run parse:subpages</code>.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-[11px] text-white/50">Tổng trang con</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{stats.total}</p>
          <p className="mt-0.5 text-[11px] text-white/35">{stats.articles} bài viết</p>
        </Card>
        <Card>
          <p className="text-[11px] text-white/50">Tổng chiều cao thiết kế</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">
            {formatNumber(Math.round(stats.totalHeight))}
            <span className="ml-1 text-sm font-normal text-white/40">px</span>
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-white/50">Lát nền</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{stats.totalSlices}</p>
          <p className="mt-0.5 text-[11px] text-white/35">{formatBytes(stats.totalBytes)}</p>
        </Card>
        <Card>
          <p className="text-[11px] text-white/50">Khối văn bản OCR</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">
            {formatNumber(
              getSectionPages("trai-nghiem").length > 0
                ? PAGE_SLUGS.flatMap((s) => getSectionPages(s)).reduce(
                    (sum, page) => sum + getPageText(page.slug).blocks.length,
                    0,
                  )
                : 0,
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-white/35">phục vụ SEO &amp; tìm kiếm</p>
        </Card>
      </div>

      {PAGE_SLUGS.filter((slug) => slug !== "home").map((slug) => {
        const section = getPageSpec(slug as PageSlug);
        const pages = getSectionPages(slug as PageSlug);
        if (pages.length === 0) {
          return null;
        }

        return (
          <Card
            key={slug}
            title={section.title}
            description={`${pages.length} trang con · ${section.route}`}
          >
            <ul className="space-y-1.5">
              {pages.map((page) => {
                const depth = page.slug.split("/").length - 1;
                const text = getPageText(page.slug);
                return (
                  <li
                    key={page.slug}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
                    style={{ marginLeft: `${(depth - 1) * 18}px` }}
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-xs text-white/85">
                        {page.title}
                        {page.isArticle && <Badge tone="info">Bài viết</Badge>}
                      </p>
                      <code className="mt-0.5 block truncate font-mono text-[10px] text-white/35">
                        {page.route}
                      </code>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-[10px] tabular-nums text-white/35">
                      <span title="Chiều cao thiết kế">{Math.round(page.height)}px</span>
                      <span title="Số lát nền">{page.slices.length} lát</span>
                      <span title="Khối văn bản OCR">{text.blocks.length} khối</span>
                      <span title="Nút CTA dò được trong ảnh">
                        {countDetected(page.slug)} nút
                      </span>
                      <Link
                        href={page.route}
                        target="_blank"
                        className="text-sky transition hover:text-white"
                      >
                        Xem ↗
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
