import { notFound } from "next/navigation";
import { PostArticle } from "@/components/site/PostArticle";
import { getPost } from "@/lib/admin/posts";

/**
 * Xem truoc mot bai viet — KE CA khi no con la ban nhap.
 *
 * Trang cong khai chi tra ve bai da dang, nen truoc day admin phai dang bai
 * len roi moi xem duoc no ra sao — tuc la da lo ra ngoai roi. Duong dan nay
 * nam trong /admin nen proxy chan nguoi la, va no doc thang bang du lieu
 * bang quyen quan tri.
 *
 * Dung CHUNG mot component voi trang that, nen khong the lech nhau.
 */
export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

export default async function PostPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <>
      {post.status !== "published" && (
        <p className="tc-preview-flag">Bản nháp — chưa hiển thị ngoài website</p>
      )}
      <PostArticle post={post} />
    </>
  );
}
