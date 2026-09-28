import { dayLabel, INK, niceCeiling, SERIES_HUE } from "./tokens";

interface DailyPoint {
  readonly date: string;
  readonly count: number;
}

const PLOT_HEIGHT = 168;
const TICK_COUNT = 4;

/**
 * Cot theo ngay — mot chuoi don.
 *
 * Theo dung mark spec: cot <= 24px, dau cot bo goc 4px va vuong o duong co so,
 * khe 2px mau be mat giua cac cot lien ke, gridline hairline lien (khong gach),
 * chi dan nhan cho gia tri lon nhat (khong dan nhan moi diem).
 * Mot chuoi -> KHONG can legend; tieu de da noi ro dang ve gi.
 */
export function DailyLeadsChart({ data }: { data: readonly DailyPoint[] }) {
  const max = Math.max(...data.map((point) => point.count), 0);
  const ceiling = niceCeiling(max || 1);
  const peakIndex = max > 0 ? data.findIndex((point) => point.count === max) : -1;
  const total = data.reduce((sum, point) => sum + point.count, 0);

  // So khach hang la so NGUYEN, nen vach chia cung phai la so nguyen phan biet.
  // Khi chua co du lieu, tran bang 1 — chia lam 4 roi lam tron se ra 0,0,1,1,1:
  // nhan lap lai va React bao trung `key`. Vi vay so vach khong duoc vuot qua
  // chinh tran.
  const tickCount = Math.max(1, Math.min(TICK_COUNT, ceiling));
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (ceiling / tickCount) * i);

  return (
    <figure className="m-0">
      <div
        className="relative"
        style={{ height: PLOT_HEIGHT }}
        role="img"
        aria-label={`Số khách hàng tiềm năng theo ngày, ${data.length} ngày gần nhất, tổng ${total}. Cao nhất ${max} vào ngày ${peakIndex >= 0 ? dayLabel(data[peakIndex].date) : "—"}.`}
      >
        {/* Gridline: hairline lien, lui ve sau */}
        {ticks.map((tick, index) => (
          <div
            key={index}
            className="absolute inset-x-0 flex items-center"
            style={{ bottom: `${(tick / ceiling) * 100}%` }}
          >
            <span
              className="-translate-y-1/2 pr-2 text-[10px] tabular-nums"
              style={{ color: INK.muted, minWidth: 18, textAlign: "right" }}
            >
              {tick}
            </span>
            <span className="h-px flex-1" style={{ background: INK.grid }} />
          </div>
        ))}

        {/* Cot du lieu */}
        <div className="absolute inset-y-0 left-7 right-0 flex items-end gap-0.5">
          {data.map((point, index) => {
            const ratio = point.count / ceiling;
            return (
              <div key={point.date} className="group relative flex h-full flex-1 items-end">
                <div
                  className="mx-auto w-full transition-opacity group-hover:opacity-80"
                  style={{
                    maxWidth: 24,
                    height: point.count > 0 ? `max(3px, ${ratio * 100}%)` : 1,
                    background: point.count > 0 ? SERIES_HUE : INK.grid,
                    borderRadius: "4px 4px 0 0",
                  }}
                />

                {/* Nhan truc tiep: CHI o cot cao nhat */}
                {index === peakIndex && (
                  <span
                    className="pointer-events-none absolute inset-x-0 text-center text-[10px] font-semibold tabular-nums"
                    style={{ bottom: `calc(${ratio * 100}% + 4px)`, color: INK.primary }}
                  >
                    {point.count}
                  </span>
                )}

                {/* Tooltip khi hover — hit target la ca cot chu khong chi phan to mau */}
                <div
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] shadow-lg group-hover:block"
                  style={{
                    background: "#0b1220",
                    border: `1px solid ${INK.grid}`,
                    color: INK.primary,
                  }}
                >
                  <strong className="font-semibold">{dayLabel(point.date)}</strong>
                  {" · "}
                  <span className="tabular-nums">{point.count}</span> khách
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nhan truc x: thua de khong chong nhau */}
      <div className="mt-2 flex gap-0.5 pl-7">
        {data.map((point, index) => (
          <span
            key={point.date}
            className="flex-1 text-center text-[9px] tabular-nums"
            style={{ color: INK.muted }}
          >
            {index % 2 === 0 || index === data.length - 1 ? dayLabel(point.date) : " "}
          </span>
        ))}
      </div>

      {/* Dang bang: bat buoc de du lieu khong bi khoa sau mau sac/hover */}
      <details className="mt-4">
        <summary className="cursor-pointer text-[11px] text-white/45 transition hover:text-white/70">
          Xem dạng bảng
        </summary>
        <table className="mt-2 w-full text-left text-[11px]">
          <caption className="sr-only">Số khách hàng tiềm năng theo ngày</caption>
          <thead>
            <tr style={{ color: INK.muted }}>
              <th scope="col" className="py-1 font-medium">Ngày</th>
              <th scope="col" className="py-1 text-right font-medium">Số khách</th>
            </tr>
          </thead>
          <tbody style={{ color: INK.secondary }}>
            {data.map((point) => (
              <tr key={point.date} className="border-t border-white/5">
                <td className="py-1 tabular-nums">{dayLabel(point.date)}</td>
                <td className="py-1 text-right tabular-nums">{point.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
