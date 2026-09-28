import { compactNumber } from "./tokens";

/**
 * O so lieu. Hop dong: label (sentence case, khong dau hai cham) + value
 * (sans semibold, rut gon) + hint tuy chon. Khong co bieu do -> khong can hover.
 */
export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
      <p className="text-[11px] text-white/50">{label}</p>
      {/* Figure ti le (khong tabular) cho so lon standalone */}
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-white">
        {compactNumber(value)}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}

/** Con so duy nhat ma dashboard dan dat. Dung DUNG MOT lan moi view. */
export function HeroFigure({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
      <p className="text-[11px] text-white/50">{label}</p>
      <p className="mt-1 text-5xl font-semibold leading-none tracking-tight text-white">
        {compactNumber(value)}
      </p>
      {hint && <p className="mt-2 text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}
