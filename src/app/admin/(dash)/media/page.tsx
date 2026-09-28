import { MediaCard } from "@/components/admin/MediaCard";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { Card, EmptyState } from "@/components/admin/ui";
import { hasAtLeast, readAdminGate } from "@/lib/admin/auth";
import { listMedia, type MediaRow } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const gate = await readAdminGate();
  const canDelete = gate.kind === "ok" && hasAtLeast(gate.session.role, "admin");

  let items: readonly MediaRow[];
  try {
    items = await listMedia();
  } catch (error) {
    return (
      <EmptyState
        title="Không tải được thư viện media"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold">Thư viện media</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/45">
          Nơi lưu ảnh và video dùng cho chiến dịch, bài viết hoặc trang con. Ảnh nền của
          6 trang chính đến từ Figma và nằm trong{" "}
          <code className="font-mono text-white/70">public/slices</code> — không sửa ở đây.
        </p>
      </header>

      <Card title="Tải lên">
        <MediaUploader />
      </Card>

      {items.length === 0 ? (
        <EmptyState
          title="Thư viện đang trống"
          description="Tải tệp đầu tiên lên bằng khung phía trên."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} canDelete={canDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
