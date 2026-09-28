import Link from "next/link";
import { LeadFilters } from "@/components/admin/LeadFilters";
import { LeadRowEditor } from "@/components/admin/LeadRowEditor";
import { buttonClass, EmptyState, formatNumber } from "@/components/admin/ui";
import { readAdminGate, hasAtLeast } from "@/lib/admin/auth";
import { listLeads, type Paged, type LeadRow } from "@/lib/admin/queries";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function readStatus(value: string | undefined): LeadStatus | "all" {
  return value && LEAD_STATUSES.includes(value as LeadStatus) ? (value as LeadStatus) : "all";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = readStatus(typeof params.status === "string" ? params.status : undefined);
  const search = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const gate = await readAdminGate();
  const canDelete = gate.kind === "ok" && hasAtLeast(gate.session.role, "admin");

  let result: Paged<LeadRow>;
  try {
    result = await listLeads({ status, search, page });
  } catch (error) {
    return (
      <EmptyState
        title="Không tải được danh sách khách hàng"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const exportQuery = new URLSearchParams();
  if (status !== "all") exportQuery.set("status", status);
  if (search) exportQuery.set("q", search);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Khách hàng tiềm năng</h1>
          <p className="mt-1 text-xs text-white/45">
            {formatNumber(result.total)} bản ghi
            {status !== "all" || search ? " khớp bộ lọc" : ""}.
          </p>
        </div>
        <Link
          href={`/api/admin/leads/export${exportQuery.size ? `?${exportQuery}` : ""}`}
          className={buttonClass("ghost")}
          prefetch={false}
        >
          Tải CSV
        </Link>
      </header>

      <LeadFilters status={status} search={search} />

      {result.rows.length === 0 ? (
        <EmptyState
          title="Chưa có khách hàng nào"
          description={
            search || status !== "all"
              ? "Không có bản ghi nào khớp bộ lọc hiện tại."
              : "Khi có người gửi form liên hệ trên website, thông tin sẽ xuất hiện tại đây."
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {result.rows.map((lead) => (
              <LeadRowEditor key={lead.id} lead={lead} canDelete={canDelete} />
            ))}
          </div>

          {result.pageCount > 1 && (
            <nav className="flex items-center justify-between gap-4 pt-2" aria-label="Phân trang">
              <p className="text-[11px] text-white/40">
                Trang {result.page} / {result.pageCount}
              </p>
              <div className="flex gap-2">
                {result.page > 1 && (
                  <Link
                    href={pageHref(status, search, result.page - 1)}
                    className={buttonClass("ghost")}
                  >
                    ← Trước
                  </Link>
                )}
                {result.page < result.pageCount && (
                  <Link
                    href={pageHref(status, search, result.page + 1)}
                    className={buttonClass("ghost")}
                  >
                    Sau →
                  </Link>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function pageHref(status: LeadStatus | "all", search: string, page: number): string {
  const query = new URLSearchParams();
  if (status !== "all") query.set("status", status);
  if (search) query.set("q", search);
  if (page > 1) query.set("page", String(page));
  return `/admin/leads${query.size ? `?${query}` : ""}`;
}
