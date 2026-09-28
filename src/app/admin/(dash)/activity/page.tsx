import { Badge, EmptyState, formatDateTime, formatRelative } from "@/components/admin/ui";
import { listActivity, type ActivityRow } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Readonly<Record<string, string>> = {
  update: "Cập nhật",
  reset: "Khôi phục bản gốc",
  delete: "Xoá",
  upload: "Tải lên",
};

const ENTITY_LABEL: Readonly<Record<string, string>> = {
  page_item: "Nội dung trang",
  lead: "Khách hàng",
  media: "Media",
  settings: "Cài đặt",
};

const ACTION_TONE: Readonly<Record<string, "info" | "good" | "bad" | "neutral">> = {
  update: "info",
  reset: "neutral",
  delete: "bad",
  upload: "good",
};

export default async function ActivityPage() {
  let rows: readonly ActivityRow[];
  try {
    rows = await listActivity();
  } catch (error) {
    return (
      <EmptyState
        title="Không tải được nhật ký"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold">Nhật ký hoạt động</h1>
        <p className="mt-1 text-xs text-white/45">
          80 thao tác gần nhất trong khu quản trị.
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="Chưa có hoạt động nào"
          description="Mọi thay đổi nội dung, khách hàng, media và cài đặt sẽ được ghi lại tại đây."
        />
      ) : (
        <ol className="space-y-1.5">
          {rows.map((row) => (
            <li
              key={row.id}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-4 py-2.5"
            >
              <Badge tone={ACTION_TONE[row.action] ?? "neutral"}>
                {ACTION_LABEL[row.action] ?? row.action}
              </Badge>

              <div className="min-w-0">
                <p className="truncate text-xs text-white/85">
                  {ENTITY_LABEL[row.entity] ?? row.entity}
                  {row.entityId && (
                    <span className="ml-1.5 font-mono text-[11px] text-white/40">
                      {row.entityId}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-white/35">
                  {row.actorEmail ?? "hệ thống"}
                </p>
              </div>

              <time
                dateTime={row.createdAt}
                title={formatDateTime(row.createdAt)}
                className="shrink-0 text-[11px] text-white/30"
              >
                {formatRelative(row.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
