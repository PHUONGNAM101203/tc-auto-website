import { createSupabasePublicClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";

/**
 * Bai viet do admin soan.
 *
 * Ban thiet ke de san nhung o tieu de mau "TÊN BÀI VIẾT" — cho do danh cho bai
 * viet that. Khi admin them bai, cac o do tu co noi dung va dan sang trang chi
 * tiet, khong phai sua ma nguon.
 *
 * Doc bang client KHONG cookie: dung cookies() la Next coi ca tuyen duong la
 * dong, 47 trang tinh mat het loi the toc do.
 */

export interface Post {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string | null;
  readonly body: string;
  readonly coverUrl: string | null;
  readonly section: string | null;
  readonly publishedAt: string | null;
  readonly sourceUrl: string | null;
}

interface Row {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  section: string | null;
  published_at: string | null;
  source_url: string | null;
}

const COLUMNS = "slug, title, excerpt, body, cover_url, section, published_at, source_url";

function toPost(row: Row): Post {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverUrl: row.cover_url,
    section: row.section,
    publishedAt: row.published_at,
    sourceUrl: row.source_url,
  };
}

/**
 * Bai da xuat ban, moi nhat truoc.
 *
 * Tra ve mang RONG (khong nem loi) khi chua cau hinh Supabase hoac chua chay
 * migration — site public luon phai render duoc tu du lieu tinh.
 */
export async function listPublishedPosts(section?: string): Promise<readonly Post[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = createSupabasePublicClient();
    let builder = supabase
      .from("posts")
      .select(COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false });

    if (section) {
      builder = builder.eq("section", section);
    }

    const { data, error } = await builder;
    if (error) {
      console.error("[posts] Không đọc được danh sách bài:", error.message);
      return [];
    }
    return (data ?? []).map((row) => toPost(row as Row));
  } catch (error) {
    console.error("[posts] Lỗi khi tải bài viết:", error);
    return [];
  }
}

export async function getPublishedPost(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("posts")
      .select(COLUMNS)
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error(`[posts] Không đọc được bài "${slug}":`, error.message);
      return null;
    }
    return data ? toPost(data as Row) : null;
  } catch (error) {
    console.error(`[posts] Lỗi khi tải bài "${slug}":`, error);
    return null;
  }
}

/** Tach than bai thanh doan — moi doan cach nhau mot dong trong. */
export function postParagraphs(body: string): readonly string[] {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim().replace(/\s*\n\s*/g, " "))
    .filter(Boolean);
}

/** Ngay dang, dinh dang kieu Viet Nam. */
export function formatPostDate(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : `Ngày ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}
