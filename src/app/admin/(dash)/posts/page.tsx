import Link from "next/link";
import { Badge, ButtonLink, Card, EmptyState, formatDateTime } from "@/components/admin/ui";
import { listPosts } from "@/lib/admin/posts";

export const dynamic = "force-dynamic";

/**
 * Danh sach bai viet.
 *
 * Ban thiet ke de san nhung o tieu de mau "TÊN BÀI VIẾT" — cho do danh cho bai
 * viet that. Them bai o day la cac o do tu co noi dung, khong phai sua ma nguon.
 */
export default async function PostsPage() {
  let posts;
  try {
    posts = await listPosts();
  } catch (error) {
    return (
      <EmptyState
        title="Không tải được danh sách bài viết"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Bài viết</h1>
          <p className="text-xs text-white/45">
            {posts.length} bài · {posts.filter((p) => p.status === "published").length} đã xuất bản
          </p>
        </div>
        <ButtonLink href="/admin/posts/moi">Viết bài mới</ButtonLink>
      </header>

      {posts.length === 0 ? (
        <EmptyState
          title="Chưa có bài viết nào"
          description="Bản thiết kế đang để tiêu đề mẫu “TÊN BÀI VIẾT” ở một số ô. Thêm bài ở đây là những ô đó tự có nội dung."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-white/5">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center gap-3 py-3">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="flex-1 text-sm font-medium transition hover:text-white/70"
                >
                  {post.title}
                </Link>
                <Badge tone={post.status === "published" ? "good" : "neutral"}>
                  {post.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                </Badge>
                <span className="text-[11px] text-white/35">
                  Sửa lần cuối {formatDateTime(post.updatedAt)}
                </span>
                {post.status === "published" && (
                  <Link
                    href={`/bai-viet/${post.slug}`}
                    target="_blank"
                    className="text-[11px] text-white/40 transition hover:text-white"
                  >
                    Xem ↗
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
