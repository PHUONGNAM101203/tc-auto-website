import Link from "next/link";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { PreviewPane } from "@/components/admin/PreviewPane";
import { EmptyState } from "@/components/admin/ui";
import { getPost } from "@/lib/admin/posts";
import { listMedia } from "@/lib/admin/queries";
import { getPostSections } from "@/lib/post-sections";

export const dynamic = "force-dynamic";

/** `moi` la bai chua ton tai — mo bieu mau trong. */
const NEW = "moi";

export default async function PostEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  // Danh sach muc sinh tu van ban thiet ke; thu vien anh de chon anh bia.
  // Thu vien loi thi van soan bai duoc — chi mat phan chon anh.
  const sections = getPostSections();
  const media = await listMedia(40).catch(() => []);

  if (id === NEW) {
    return (
      <Frame title="Viết bài mới">
        <PostEditor post={null} saved={false} sections={sections} media={media} />
      </Frame>
    );
  }

  let post;
  try {
    post = await getPost(id);
  } catch (error) {
    return (
      <EmptyState
        title="Không tải được bài viết"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <Frame title={post.title}>
      <PostEditor post={post} saved={saved === "1"} sections={sections} media={media} />
      {/* Ban nhap cung xem truoc duoc: duong dan /admin/preview dung chung
          component voi trang that nhung doc bang quyen quan tri. Phai xem duoc
          TRUOC khi dang — dang roi moi xem thi da lo ra ngoai. */}
      <PreviewPane
        route={
          post.status === "published" ? `/bai-viet/${post.slug}` : `/admin/preview/${post.id}`
        }
        label={post.title}
      />
    </Frame>
  );
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/admin/posts" className="text-[11px] text-white/40 transition hover:text-white">
          ← Bài viết
        </Link>
        <h1 className="text-lg font-semibold">{title}</h1>
      </header>
      {children}
    </div>
  );
}
