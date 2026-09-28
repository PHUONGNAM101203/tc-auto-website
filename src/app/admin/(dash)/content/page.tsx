import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/admin/ui";
import { countOverridesBySlug } from "@/lib/admin/queries";
import { getAllPageSpecs } from "@/lib/pages";

export const dynamic = "force-dynamic";

export default async function ContentIndexPage() {
  const pages = getAllPageSpecs();

  let counts: ReadonlyMap<string, number>;
  try {
    counts = await countOverridesBySlug();
  } catch (error) {
    return (
      <EmptyState
        title="Không tải được trạng thái nội dung"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold">Nội dung trang</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/45">
          Sửa được chữ và liên kết của từng phần tử. Toạ độ, kích thước, font và màu
          đến từ Figma và không thay đổi được ở đây — đó là điều giữ cho website khớp
          tuyệt đối với thiết kế.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {pages.map((page) => {
          const edited = counts.get(page.slug) ?? 0;
          return (
            <Card key={page.slug}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-white">{page.title}</h2>
                  <code className="mt-0.5 block truncate font-mono text-[11px] text-white/40">
                    {page.route}
                  </code>
                </div>
                {edited > 0 ? (
                  <Badge tone="info">{edited} đã sửa</Badge>
                ) : (
                  <Badge>Nguyên bản</Badge>
                )}
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <dt className="text-white/40">Phần tử</dt>
                  <dd className="mt-0.5 tabular-nums text-white/85">{page.items.length}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Lát nền</dt>
                  <dd className="mt-0.5 tabular-nums text-white/85">{page.slices.length}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Chiều cao</dt>
                  <dd className="mt-0.5 tabular-nums text-white/85">
                    {Math.round(page.height)}px
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/admin/content/${page.slug}`}
                  className="text-xs font-semibold text-sky transition hover:text-white"
                >
                  Sửa nội dung →
                </Link>
                <Link
                  href={page.route}
                  target="_blank"
                  className="text-xs text-white/40 transition hover:text-white/70"
                >
                  Xem ↗
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
