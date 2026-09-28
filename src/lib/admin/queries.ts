import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { LEAD_STATUSES, type LeadStatus, type PageSlug } from "@/lib/types";

export interface LeadRow {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly message: string | null;
  readonly sourcePage: string;
  readonly status: LeadStatus;
  readonly note: string | null;
  readonly createdAt: string;
}

export interface LeadQuery {
  readonly status?: LeadStatus | "all";
  readonly search?: string;
  readonly page?: number;
  readonly perPage?: number;
}

export interface Paged<T> {
  readonly rows: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
  readonly pageCount: number;
}

const DEFAULT_PER_PAGE = 25;

/** Danh sach lead co phan trang, loc theo trang thai va tim theo ten/sdt. */
export async function listLeads(query: LeadQuery = {}): Promise<Paged<LeadRow>> {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(100, Math.max(5, query.perPage ?? DEFAULT_PER_PAGE));
  const from = (page - 1) * perPage;

  const supabase = getSupabaseAdminClient();
  let builder = supabase
    .from("leads")
    .select("id, name, phone, message, source_page, status, note, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (query.status && query.status !== "all") {
    builder = builder.eq("status", query.status);
  }

  const search = query.search?.trim();
  if (search) {
    // Escape ky tu dac biet cua PostgREST or()/ilike de tranh chen cu phap.
    const safe = search.replace(/[%_,()\\]/g, "");
    if (safe) {
      builder = builder.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`);
    }
  }

  const { data, error, count } = await builder;
  if (error) {
    throw new Error(`Không tải được danh sách lead: ${error.message}`);
  }

  const total = count ?? 0;
  return {
    rows: (data ?? []).map(toLeadRow),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

function toLeadRow(row: Record<string, unknown>): LeadRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    phone: String(row.phone ?? ""),
    message: (row.message as string | null) ?? null,
    sourcePage: String(row.source_page ?? "/"),
    status: (row.status as LeadStatus) ?? "new",
    note: (row.note as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export interface DashboardStats {
  readonly total: number;
  readonly today: number;
  readonly last7Days: number;
  readonly last30Days: number;
  readonly byStatus: Readonly<Record<LeadStatus, number>>;
  /** 14 ngay gan nhat, cu nhat truoc. */
  readonly daily: readonly { readonly date: string; readonly count: number }[];
  readonly topPages: readonly { readonly page: string; readonly count: number }[];
  readonly overrides: number;
  readonly mediaCount: number;
}

const DAILY_DAYS = 14;

/** Tong hop so lieu cho dashboard. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseAdminClient();

  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [leadsResult, overridesResult, mediaResult] = await Promise.all([
    supabase
      .from("leads")
      .select("status, source_page, created_at")
      .gte("created_at", since30)
      .order("created_at", { ascending: true }),
    supabase.from("page_items").select("slug", { count: "exact", head: true }),
    supabase.from("media").select("id", { count: "exact", head: true }),
  ]);

  if (leadsResult.error) {
    throw new Error(`Không tải được số liệu lead: ${leadsResult.error.message}`);
  }

  // Tong so lead (moi thoi diem) lay rieng vi truy van tren chi gioi han 30 ngay.
  const totalResult = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true });

  const rows = leadsResult.data ?? [];
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const byStatus = Object.fromEntries(
    LEAD_STATUSES.map((status) => [status, 0]),
  ) as Record<LeadStatus, number>;

  const dailyMap = new Map<string, number>();
  for (let i = DAILY_DAYS - 1; i >= 0; i -= 1) {
    dailyMap.set(isoDate(new Date(now - i * 86_400_000)), 0);
  }

  const pageMap = new Map<string, number>();
  let today = 0;
  let last7 = 0;

  for (const row of rows) {
    const status = (row.status as LeadStatus) ?? "new";
    if (status in byStatus) {
      byStatus[status] += 1;
    }

    const at = new Date(String(row.created_at));
    if (at >= startOfToday) {
      today += 1;
    }
    if (now - at.getTime() <= 7 * 86_400_000) {
      last7 += 1;
    }

    const key = isoDate(at);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }

    const page = String(row.source_page ?? "/");
    pageMap.set(page, (pageMap.get(page) ?? 0) + 1);
  }

  return {
    total: totalResult.count ?? rows.length,
    today,
    last7Days: last7,
    last30Days: rows.length,
    byStatus,
    daily: [...dailyMap].map(([date, count]) => ({ date, count })),
    topPages: [...pageMap]
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    overrides: overridesResult.count ?? 0,
    mediaCount: mediaResult.count ?? 0,
  };
}

function isoDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate(),
  ).padStart(2, "0")}`;
}

export interface OverrideRow {
  readonly slug: PageSlug;
  readonly itemId: string;
  readonly html: string | null;
  readonly href: string | null;
  readonly hidden: boolean;
  readonly updatedAt: string;
}

/** Cac ban ghi de noi dung cua mot trang, key theo item_id. */
export async function listOverrides(slug: PageSlug): Promise<ReadonlyMap<string, OverrideRow>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("page_items")
    .select("slug, item_id, html, href, hidden, updated_at")
    .eq("slug", slug);

  if (error) {
    throw new Error(`Không tải được nội dung đã sửa: ${error.message}`);
  }

  return new Map(
    (data ?? []).map((row) => [
      String(row.item_id),
      {
        slug: row.slug as PageSlug,
        itemId: String(row.item_id),
        html: (row.html as string | null) ?? null,
        href: (row.href as string | null) ?? null,
        hidden: row.hidden === true,
        updatedAt: String(row.updated_at),
      },
    ]),
  );
}

/** So phan tu da sua theo tung trang — dung cho danh sach trang. */
export async function countOverridesBySlug(): Promise<ReadonlyMap<string, number>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("page_items").select("slug");
  if (error) {
    throw new Error(`Không đếm được nội dung đã sửa: ${error.message}`);
  }
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const slug = String(row.slug);
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return counts;
}

export interface MediaRow {
  readonly id: string;
  readonly path: string;
  readonly name: string;
  readonly mimeType: string;
  readonly bytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly altText: string | null;
  readonly createdAt: string;
  readonly publicUrl: string;
}

export async function listMedia(limit = 60): Promise<readonly MediaRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("media")
    .select("id, path, name, mime_type, bytes, width, height, alt_text, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Không tải được thư viện media: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    path: String(row.path),
    name: String(row.name),
    mimeType: String(row.mime_type),
    bytes: Number(row.bytes),
    width: (row.width as number | null) ?? null,
    height: (row.height as number | null) ?? null,
    altText: (row.alt_text as string | null) ?? null,
    createdAt: String(row.created_at),
    publicUrl: supabase.storage.from("media").getPublicUrl(String(row.path)).data.publicUrl,
  }));
}

export interface SettingsRow {
  readonly siteTitle: string;
  readonly siteDescription: string;
  readonly contactPhone: string;
  readonly contactEmail: string;
  readonly contactAddress: string;
  readonly motionEnabled: boolean;
  readonly updatedAt: string;
}

export async function getSettings(): Promise<SettingsRow> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("settings")
    .select(
      "site_title, site_description, contact_phone, contact_email, contact_address, motion_enabled, updated_at",
    )
    .eq("id", 1)
    .single();

  if (error) {
    throw new Error(`Không tải được cài đặt: ${error.message}`);
  }

  return {
    siteTitle: String(data.site_title ?? ""),
    siteDescription: String(data.site_description ?? ""),
    contactPhone: String(data.contact_phone ?? ""),
    contactEmail: String(data.contact_email ?? ""),
    contactAddress: String(data.contact_address ?? ""),
    motionEnabled: data.motion_enabled !== false,
    updatedAt: String(data.updated_at),
  };
}

export interface ActivityRow {
  readonly id: number;
  readonly actorEmail: string | null;
  readonly action: string;
  readonly entity: string;
  readonly entityId: string | null;
  readonly detail: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

export async function listActivity(limit = 80): Promise<readonly ActivityRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, actor_email, action, entity, entity_id, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Không tải được nhật ký: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: Number(row.id),
    actorEmail: (row.actor_email as string | null) ?? null,
    action: String(row.action),
    entity: String(row.entity),
    entityId: (row.entity_id as string | null) ?? null,
    detail: (row.detail as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  }));
}
