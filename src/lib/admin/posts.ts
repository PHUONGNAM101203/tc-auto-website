import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Doc bai viet o khu quan tri — thay ca ban nhap lan ban da xuat.
 *
 * Dung khoa service_role nen BO QUA RLS; moi loi goi deu phai di qua
 * requireAdmin() truoc.
 */

export interface PostRow {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string | null;
  readonly body: string;
  readonly coverUrl: string | null;
  readonly section: string | null;
  readonly status: "draft" | "published";
  readonly publishedAt: string | null;
  readonly sourceUrl: string | null;
  readonly updatedAt: string;
}

const COLUMNS =
  "id, slug, title, excerpt, body, cover_url, section, status, published_at, source_url, updated_at";

interface Raw {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  section: string | null;
  status: "draft" | "published";
  published_at: string | null;
  source_url: string | null;
  updated_at: string;
}

function toRow(raw: Raw): PostRow {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt,
    body: raw.body,
    coverUrl: raw.cover_url,
    section: raw.section,
    status: raw.status,
    publishedAt: raw.published_at,
    sourceUrl: raw.source_url,
    updatedAt: raw.updated_at,
  };
}

export async function listPosts(): Promise<readonly PostRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select(COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Không đọc được danh sách bài viết: ${error.message}`);
  }
  return (data ?? []).map((row) => toRow(row as Raw));
}

export async function getPost(id: string): Promise<PostRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("posts").select(COLUMNS).eq("id", id).maybeSingle();

  if (error) {
    throw new Error(`Không đọc được bài viết: ${error.message}`);
  }
  return data ? toRow(data as Raw) : null;
}

export interface PostStats {
  readonly total: number;
  readonly published: number;
  readonly draft: number;
}

export async function getPostStats(): Promise<PostStats> {
  const rows = await listPosts();
  const published = rows.filter((row) => row.status === "published").length;
  return { total: rows.length, published, draft: rows.length - published };
}

/**
 * Doi tieu de tieng Viet thanh slug.
 *
 * Bo dau bang cach tach to hop ky tu (NFD) roi loai cac dau thanh/dau phu;
 * rieng "đ/Đ" khong phai to hop nen phai thay tay.
 */
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
