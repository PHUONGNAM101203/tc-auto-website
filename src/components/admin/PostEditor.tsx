"use client";

import { useActionState, useState } from "react";
import { IDLE } from "@/lib/admin/action-result";
import { deletePost, savePost } from "@/lib/admin/actions";
import { slugify } from "@/lib/admin/posts";
import type { PostRow } from "@/lib/admin/posts";
import type { PostSection } from "@/lib/post-sections";
import type { MediaRow } from "@/lib/admin/queries";
import { FormBanner } from "./FormBanner";
import { SubmitButton } from "./SubmitButton";
import { Card, Field, Select, TextArea, TextInput, buttonClass } from "./ui";

/**
 * Soan bai viet.
 *
 * Duong dan (slug) tu sinh tu tieu de khi con la ban nhap. Voi bai DA XUAT BAN
 * thi khong tu doi nua — doi slug se lam hong moi lien ket da chia se.
 */
export function PostEditor({
  post,
  saved,
  sections,
  media,
}: {
  post: PostRow | null;
  saved: boolean;
  /** Cac trang co o cho bai viet — sinh tu van ban thiet ke, xem post-sections.ts. */
  readonly sections: readonly PostSection[];
  /** Thu vien anh, de chon anh bia khong phai di chep duong dan. */
  readonly media: readonly MediaRow[];
}) {
  const [state, action] = useActionState(savePost, IDLE);
  const [removeState, removeAction] = useActionState(deletePost, IDLE);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [touchedSlug, setTouchedSlug] = useState(Boolean(post));
  const [cover, setCover] = useState(post?.coverUrl ?? "");

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

            {/* Danh sach chon chu khong phai o nhap: go sai mot dau gach la bai
                bien mat khoi trang ma khong bao loi gi. Moi muc kem so o dang
                trong de biet trang do con cho may bai. */}
            <Field
              label="Mục"
              htmlFor="post-section"
              hint="Bài sẽ hiện vào ô “TÊN BÀI VIẾT” của trang được chọn."
            >
              <Select id="post-section" name="section" defaultValue={post?.section ?? ""}>
                <option value="">Không thuộc mục nào</option>
                {sections.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.label} — {item.slots} ô
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Ảnh bìa"
              htmlFor="post-cover"
              hint="Chọn trong thư viện, hoặc dán đường dẫn ảnh bất kỳ."
            >
              <TextInput
                id="post-cover"
                name="coverUrl"
                value={cover}
                onChange={(event) => setCover(event.target.value)}
              />
              {media.length > 0 ? (
                <div className="mt-2 grid max-h-44 grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-white/10 p-2">
                  {media.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCover(item.publicUrl)}
                      title={item.name}
                      className={
                        "overflow-hidden rounded border transition " +
                        (cover === item.publicUrl
                          ? "border-red-400"
                          : "border-white/10 hover:border-white/40")
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- anh
                          tu kho media cua chinh admin, khong qua image optimizer */}
                      <img
                        src={item.publicUrl}
                        alt={item.altText ?? item.name}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-white/35">
                  Thư viện chưa có ảnh nào — tải lên ở mục Media rồi quay lại đây.
                </p>
              )}
              {cover ? (
                /* eslint-disable-next-line @next/next/no-img-element -- xem truoc */
                <img
                  src={cover}
                  alt=""
                  className="mt-2 h-20 rounded border border-white/10 object-cover"
                />
              ) : null}
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
