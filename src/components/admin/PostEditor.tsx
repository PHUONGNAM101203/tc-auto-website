"use client";

import { useActionState, useState } from "react";
import { IDLE } from "@/lib/admin/action-result";
import { deletePost, savePost } from "@/lib/admin/actions";
import { slugify } from "@/lib/admin/posts";
import type { PostRow } from "@/lib/admin/posts";
import { FormBanner } from "./FormBanner";
import { SubmitButton } from "./SubmitButton";
import { Card, Field, Select, TextArea, TextInput, buttonClass } from "./ui";

/**
 * Soan bai viet.
 *
 * Duong dan (slug) tu sinh tu tieu de khi con la ban nhap. Voi bai DA XUAT BAN
 * thi khong tu doi nua — doi slug se lam hong moi lien ket da chia se.
 */
export function PostEditor({ post, saved }: { post: PostRow | null; saved: boolean }) {
  const [state, action] = useActionState(savePost, IDLE);
  const [removeState, removeAction] = useActionState(deletePost, IDLE);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [touchedSlug, setTouchedSlug] = useState(Boolean(post));

  const shownSlug = touchedSlug ? slug : slugify(title);

  return (
    <div className="space-y-4">
      {saved && !state.message ? <FormBanner result={{ ok: true, message: "Đã lưu." }} /> : null}
      <FormBanner result={state} />
      <FormBanner result={removeState} />

      <form action={action} className="space-y-6">
        {post ? <input type="hidden" name="id" value={post.id} /> : null}
        {post?.publishedAt ? (
          <input type="hidden" name="publishedAt" value={post.publishedAt} />
        ) : null}

        <Card>
          <div className="space-y-4">
            <Field label="Tiêu đề" htmlFor="post-title" error={state.fields?.title}>
              <TextInput
                id="post-title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={200}
                placeholder="Ví dụ: Phạm Gia Auto trở thành đại lý Winca chính hãng"
              />
            </Field>

            <Field
              label="Đường dẫn"
              htmlFor="post-slug"
              error={state.fields?.slug}
              hint={`Bài sẽ nằm ở /bai-viet/${shownSlug || "…"}`}
            >
              <TextInput
                id="post-slug"
                name="slug"
                value={shownSlug}
                onChange={(event) => {
                  setTouchedSlug(true);
                  setSlug(event.target.value);
                }}
                placeholder="tu-dong-tao-tu-tieu-de"
              />
            </Field>

            <Field label="Tóm tắt" htmlFor="post-excerpt" hint="Hiện ở danh sách bài, 1–2 câu.">
              <TextArea id="post-excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} rows={2} />
            </Field>

            <Field
              label="Nội dung"
              htmlFor="post-body"
              error={state.fields?.body}
              hint="Mỗi đoạn cách nhau một dòng trống."
            >
              <TextArea
                id="post-body"
                name="body"
                defaultValue={post?.body ?? ""}
                rows={16}
                className="min-h-[360px]"
              />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trạng thái" htmlFor="post-status">
              <Select id="post-status" name="status" defaultValue={post?.status ?? "draft"}>
                <option value="draft">Bản nháp — chưa ai thấy</option>
                <option value="published">Xuất bản — hiện trên website</option>
              </Select>
            </Field>

            <Field label="Mục" htmlFor="post-section" hint="Để trống nếu bài không thuộc mục nào.">
              <TextInput
                id="post-section"
                name="section"
                defaultValue={post?.section ?? ""}
                placeholder="cong-nghe/tien-phong-cong-nghe/bai-viet"
              />
            </Field>

            <Field label="Ảnh bìa" htmlFor="post-cover" hint="Dán đường dẫn ảnh từ Thư viện media.">
              <TextInput id="post-cover" name="coverUrl" defaultValue={post?.coverUrl ?? ""} />
            </Field>

            <Field label="Nguồn" htmlFor="post-source" hint="Nếu bài lấy lại từ nơi khác.">
              <TextInput id="post-source" name="sourceUrl" defaultValue={post?.sourceUrl ?? ""} />
            </Field>
          </div>
        </Card>

        <SubmitButton>Lưu bài viết</SubmitButton>
      </form>

      {post ? (
        <form action={removeAction}>
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className={buttonClass("danger")}>
            Xoá bài viết
          </button>
        </form>
      ) : null}
    </div>
  );
}
