import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemEditor } from "@/components/admin/ItemEditor";
import { PreviewPane } from "@/components/admin/PreviewPane";
import { Badge, EmptyState } from "@/components/admin/ui";
import { listOverrides } from "@/lib/admin/queries";
import { getPageSpec, isPageSlug } from "@/lib/pages";

export const dynamic = "force-dynamic";

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isPageSlug(slug)) {
    notFound();
  }

  const page = getPageSpec(slug);

  let overrides: ReadonlyMap<string, { html: string | null; href: string | null; hidden: boolean }>;
  try {
    overrides = await listOverrides(slug);
  } catch (error) {
    return (
      <EmptyState
        title="Không tải được nội dung đã sửa"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/admin/content"
          className="text-[11px] text-white/40 transition hover:text-white"
        >
          ← Nội dung trang
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold">{page.title}</h1>
          <Badge>{page.items.length} phần tử</Badge>
          {overrides.size > 0 && <Badge tone="info">{overrides.size} đã sửa</Badge>}
          <Link
            href={page.route}
            target="_blank"
            className="text-xs text-white/40 transition hover:text-white"
          >
            Xem trang ↗
          </Link>
        </div>
        <p className="max-w-2xl text-xs leading-relaxed text-white/45">
          Các phần tử xếp theo thứ tự từ trên xuống dưới của trang. Số bên phải là toạ
          độ x,y trong khung 1440px của Figma.
        </p>
      </header>

      {/* Sua xong thi thay ngay ket qua o day, khong phai mo tab moi. */}
      <PreviewPane route={page.route} label={page.title} />

      <div className="space-y-2">
        {page.items.map((item) => (
          <ItemEditor
            key={item.id}
            slug={slug}
            item={item}
            override={overrides.get(item.id) ?? null}
          />
        ))}
      </div>
    </div>
  );
}
