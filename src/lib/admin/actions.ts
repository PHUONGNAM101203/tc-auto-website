"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPageSpec, isPageSlug } from "@/lib/pages";
import { sanitizeInlineHtml } from "@/lib/sanitize";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LEAD_STATUSES, type LeadStatus, type PageSlug } from "@/lib/types";
import { leadUpdateSchema, settingsSchema } from "@/lib/validation";
import { failure, fromError, success, type ActionResult } from "./action-result";
import { logActivity } from "./activity";
import { requireAdmin } from "./auth";
import { slugify } from "./posts";

function text(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Lam moi cache cua trang public sau khi doi noi dung. */
function revalidatePublic(slug: PageSlug): void {
  revalidatePath(getPageSpec(slug).route);
}

// ---------------------------------------------------------------------------
// Noi dung trang
// ---------------------------------------------------------------------------

export async function savePageItem(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin("editor");

    const slug = text(data, "slug");
    const itemId = text(data, "itemId");
    if (!isPageSlug(slug)) {
      return failure("Trang không hợp lệ.");
    }

    const spec = getPageSpec(slug);
    const original = spec.items.find((item) => item.id === itemId);
    if (!original) {
      return failure(`Không tìm thấy phần tử "${itemId}" trong trang ${spec.title}.`);
    }

    const rawHtml = text(data, "html");
    if (rawHtml.length > 5000) {
      return failure("Nội dung quá dài (tối đa 5000 ký tự).", { html: "Quá dài" });
    }

    const html = sanitizeInlineHtml(rawHtml);
    if (!html && !data.has("hidden")) {
      return failure("Nội dung không được để trống.", { html: "Bắt buộc" });
    }

    const href = text(data, "href") || null;
    if (href && !/^(\/|https?:\/\/|tel:|mailto:)/.test(href)) {
      return failure("Liên kết phải bắt đầu bằng /, http://, https://, tel: hoặc mailto:", {
        href: "Không hợp lệ",
      });
    }

    const hidden = data.get("hidden") === "on" || data.get("hidden") === "true";

    // Trung khop ban goc Figma va khong an -> xoa ban ghi de thay vi luu trung lap.
    const isUnchanged = html === original.html && href === original.href && !hidden;

    const supabase = getSupabaseAdminClient();

    if (isUnchanged) {
      const { error } = await supabase
        .from("page_items")
        .delete()
        .eq("slug", slug)
        .eq("item_id", itemId);
      if (error) {
        throw new Error(error.message);
      }
      await logActivity(session, {
        action: "reset",
        entity: "page_item",
        entityId: `${slug}/${itemId}`,
      });
      revalidatePublic(slug);
      return success("Đã trả về nội dung gốc từ Figma.");
    }

    const { error } = await supabase.from("page_items").upsert(
      {
        slug,
        item_id: itemId,
        html,
        href,
        hidden,
        updated_by: session.userId,
      },
      { onConflict: "slug,item_id" },
    );
    if (error) {
      throw new Error(error.message);
    }

    await logActivity(session, {
      action: "update",
      entity: "page_item",
      entityId: `${slug}/${itemId}`,
      detail: { hidden, hasHref: Boolean(href), length: html.length },
    });

    revalidatePublic(slug);
    return success("Đã lưu. Trang public sẽ cập nhật trong vòng 1 phút.");
  } catch (error) {
    return fromError(error, "Không lưu được nội dung. Vui lòng thử lại.");
  }
}

export async function resetPageItem(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin("editor");
    const slug = text(data, "slug");
    const itemId = text(data, "itemId");
    if (!isPageSlug(slug)) {
      return failure("Trang không hợp lệ.");
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("page_items")
      .delete()
      .eq("slug", slug)
      .eq("item_id", itemId);
    if (error) {
      throw new Error(error.message);
    }

    await logActivity(session, {
      action: "reset",
      entity: "page_item",
      entityId: `${slug}/${itemId}`,
    });
    revalidatePublic(slug);
    return success("Đã trả về nội dung gốc từ Figma.");
  } catch (error) {
    return fromError(error, "Không khôi phục được nội dung gốc.");
  }
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function updateLead(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin("editor");
    const id = text(data, "id");
    if (!id) {
      return failure("Thiếu mã lead.");
    }

    const statusRaw = text(data, "status");
    const parsed = leadUpdateSchema.safeParse({
      status: LEAD_STATUSES.includes(statusRaw as LeadStatus)
        ? (statusRaw as LeadStatus)
        : undefined,
      note: text(data, "note") || null,
    });
    if (!parsed.success) {
      return failure("Dữ liệu không hợp lệ.");
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("leads").update(parsed.data).eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    await logActivity(session, {
      action: "update",
      entity: "lead",
      entityId: id,
      detail: { status: parsed.data.status },
    });

    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return success("Đã cập nhật lead.");
  } catch (error) {
    return fromError(error, "Không cập nhật được lead.");
  }
}

export async function deleteLead(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin("admin");
    const id = text(data, "id");
    if (!id) {
      return failure("Thiếu mã lead.");
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    await logActivity(session, { action: "delete", entity: "lead", entityId: id });
    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return success("Đã xoá lead.");
  } catch (error) {
    return fromError(error, "Không xoá được lead.");
  }
}

// ---------------------------------------------------------------------------
// Cai dat
// ---------------------------------------------------------------------------

export async function saveSettings(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin("admin");

    const parsed = settingsSchema.safeParse({
      siteTitle: text(data, "siteTitle"),
      siteDescription: text(data, "siteDescription"),
      contactPhone: text(data, "contactPhone"),
      contactEmail: text(data, "contactEmail"),
      contactAddress: text(data, "contactAddress"),
      motionEnabled: data.get("motionEnabled") === "on",
    });

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (key && !(key in fields)) {
          fields[key] = issue.message;
        }
      }
      return failure("Vui lòng kiểm tra lại các trường được đánh dấu.", fields);
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("settings")
      .update({
        site_title: parsed.data.siteTitle,
        site_description: parsed.data.siteDescription,
        contact_phone: parsed.data.contactPhone,
        contact_email: parsed.data.contactEmail,
        contact_address: parsed.data.contactAddress,
        motion_enabled: parsed.data.motionEnabled,
        updated_by: session.userId,
      })
      .eq("id", 1);
    if (error) {
      throw new Error(error.message);
    }

    await logActivity(session, { action: "update", entity: "settings", entityId: "1" });
    revalidatePath("/admin/settings");
    return success("Đã lưu cài đặt.");
  } catch (error) {
    return fromError(error, "Không lưu được cài đặt.");
  }
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export async function registerMedia(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin("editor");

    const path = text(data, "path");
    const name = text(data, "name");
    const mimeType = text(data, "mimeType");
    const bytes = Number(text(data, "bytes"));

    if (!path || !name || !mimeType || !Number.isFinite(bytes) || bytes <= 0) {
      return failure("Thiếu thông tin tệp.");
    }
    if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {
      return failure("Chỉ hỗ trợ tệp ảnh hoặc video.");
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("media").upsert(
      {
        path,
        name,
        mime_type: mimeType,
        bytes,
        width: Number(text(data, "width")) || null,
        height: Number(text(data, "height")) || null,
        alt_text: text(data, "altText") || null,
        created_by: session.userId,
      },
      { onConflict: "path" },
    );
    if (error) {
      throw new Error(error.message);
    }

    await logActivity(session, { action: "upload", entity: "media", entityId: path });
    revalidatePath("/admin/media");
    return success(`Đã tải lên “${name}”.`);
  } catch (error) {
    return fromError(error, "Không ghi nhận được tệp vừa tải lên.");
  }
}

export async function deleteMedia(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin("admin");
    const id = text(data, "id");
    const path = text(data, "path");
    if (!id || !path) {
      return failure("Thiếu thông tin tệp.");
    }

    const supabase = getSupabaseAdminClient();

    // Xoa file trong Storage truoc; neu that bai thi giu lai ban ghi de con doi chieu.
    const { error: storageError } = await supabase.storage.from("media").remove([path]);
    if (storageError) {
      throw new Error(`Không xoá được tệp trong Storage: ${storageError.message}`);
    }

    const { error } = await supabase.from("media").delete().eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    await logActivity(session, { action: "delete", entity: "media", entityId: path });
    revalidatePath("/admin/media");
    return success("Đã xoá tệp.");
  } catch (error) {
    return fromError(error, "Không xoá được tệp.");
  }
}

// ---------------------------------------------------------------------------
// Dang xuat
// ---------------------------------------------------------------------------

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Bai viet
// ---------------------------------------------------------------------------

/**
 * Luu bai viet — them moi neu chua co id, sua neu da co.
 *
 * Slug do tieu de sinh ra, nhung neu admin da tu dat thi giu nguyen: doi slug
 * cua bai da xuat ban se lam hong moi lien ket da chia se.
 */
export async function savePost(_previous: ActionResult, data: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin("editor");

    const id = text(data, "id");
    const title = text(data, "title");
    if (!title) {
      return failure("Tiêu đề không được để trống.", { title: "Bắt buộc" });
    }
    if (title.length > 200) {
      return failure("Tiêu đề quá dài (tối đa 200 ký tự).", { title: "Quá dài" });
    }

    const slug = slugify(text(data, "slug") || title);
    if (!slug) {
      return failure("Không tạo được đường dẫn từ tiêu đề này.", { slug: "Không hợp lệ" });
    }

    const status = text(data, "status") === "published" ? "published" : "draft";
    const body = text(data, "body");
    if (body.length > 40000) {
      return failure("Nội dung quá dài (tối đa 40.000 ký tự).", { body: "Quá dài" });
    }

    const payload = {
      slug,
      title,
      excerpt: text(data, "excerpt") || null,
      body,
      cover_url: text(data, "coverUrl") || null,
      section: text(data, "section") || null,
      source_url: text(data, "sourceUrl") || null,
      status,
      // Ghi ngay dang o lan xuat ban dau tien va giu nguyen tu do.
      published_at:
        status === "published" ? text(data, "publishedAt") || new Date().toISOString() : null,
      updated_by: session.userId,
    };

    const supabase = getSupabaseAdminClient();
    const query = id
      ? supabase.from("posts").update(payload).eq("id", id).select("id").single()
      : supabase.from("posts").insert(payload).select("id").single();

    const { data: saved, error } = await query;
    if (error) {
      if (error.code === "23505") {
        return failure("Đường dẫn này đã có bài khác dùng.", { slug: "Trùng" });
      }
      return failure(`Không lưu được bài viết: ${error.message}`);
    }

    await logActivity(session, {
      action: id ? "post.update" : "post.create",
      entity: "post",
      entityId: saved.id,
      detail: { title, slug, status },
    });

    revalidatePath(`/bai-viet/${slug}`);
    revalidatePath("/admin/posts");
    redirect(`/admin/posts/${saved.id}?saved=1`);
  } catch (error) {
    return fromError(error, "Không lưu được bài viết.");
  }
}

export async function deletePost(_previous: ActionResult, data: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin("admin");
    const id = text(data, "id");
    if (!id) {
      return failure("Thiếu mã bài viết.");
    }

    const supabase = getSupabaseAdminClient();
    const { data: removed, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .select("slug, title")
      .maybeSingle();

    if (error) {
      return failure(`Không xoá được bài viết: ${error.message}`);
    }

    await logActivity(session, {
      action: "post.delete",
      entity: "post",
      entityId: id,
      detail: { title: removed?.title ?? id },
    });

    if (removed?.slug) {
      revalidatePath(`/bai-viet/${removed.slug}`);
    }
    revalidatePath("/admin/posts");
    redirect("/admin/posts");
  } catch (error) {
    return fromError(error, "Không xoá được bài viết.");
  }
}
