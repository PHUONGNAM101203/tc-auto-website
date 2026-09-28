import { INK, SERIES_HUE } from "./tokens";

interface PageCount {
  readonly page: string;
  readonly count: number;
}

/**
 * Trang mang lai nhieu lead nhat — mot chuoi don, thanh ngang.
 * Gia tri dat o dau thanh (bar -> value at the tip).
 */
export function TopPagesChart({ data }: { data: readonly PageCount[] }) {
  if (data.length === 0) {
    return <p className="text-xs text-white/40">Chưa có dữ liệu nguồn.</p>;
  }

  const max = Math.max(...data.map((row) => row.count));

  return (
    <ul className="space-y-2.5">
      {data.map((row) => (
        <li key={row.page} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3">
          <code
            className="truncate font-mono text-[11px]"
            style={{ color: INK.secondary }}
            title={row.page}
          >
            {row.page}
          </code>
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: INK.grid }}>
            <div
              className="h-full rounded-full"
              style={{ width: `max(4px, ${(row.count / max) * 100}%)`, background: SERIES_HUE }}
            />
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: INK.primary }}>
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
