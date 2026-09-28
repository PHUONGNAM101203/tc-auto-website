import { LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/types";
import { INK, STATUS_HUE, STATUS_ORDER } from "./tokens";

/**
 * Phan bo lead theo trang thai.
 *
 * Trang thai la MA HOA TRANG THAI, khong phai chuoi tuy y — mau co dinh theo
 * y nghia va LUON di kem nhan chu. Nhan chu chinh la ma hoa phu bat buoc cho
 * canh bao CVD 6-8 cua palette (xem tokens.ts).
 */
export function StatusBreakdown({
  counts,
}: {
  counts: Readonly<Record<LeadStatus, number>>;
}) {
  const total = STATUS_ORDER.reduce((sum, status) => sum + (counts[status] ?? 0), 0);

  if (total === 0) {
    return (
      <p className="text-xs text-white/40">
        Chưa có khách hàng nào trong 30 ngày gần nhất.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {STATUS_ORDER.map((status) => {
        const count = counts[status] ?? 0;
        const share = count / total;
        return (
          <li key={status}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2 text-[11px]" style={{ color: INK.secondary }}>
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: STATUS_HUE[status] }}
                />
                {LEAD_STATUS_LABEL[status]}
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: INK.primary }}>
                {count}
                <span style={{ color: INK.muted }}> · {Math.round(share * 100)}%</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: INK.grid }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: count > 0 ? `max(3px, ${share * 100}%)` : 0,
                  background: STATUS_HUE[status],
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
