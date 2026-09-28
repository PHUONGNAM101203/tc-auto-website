import Link from "next/link";
import { LEAD_STATUS_LABEL, LEAD_STATUSES, type LeadStatus } from "@/lib/types";
import { buttonClass, TextInput } from "./ui";

/** Bo loc dat tren mot hang phia tren danh sach. */
export function LeadFilters({
  status,
  search,
}: {
  readonly status: LeadStatus | "all";
  readonly search: string;
}) {
  const tabs: readonly (LeadStatus | "all")[] = ["all", ...LEAD_STATUSES];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((value) => {
          const href =
            value === "all"
              ? `/admin/leads${search ? `?q=${encodeURIComponent(search)}` : ""}`
              : `/admin/leads?status=${value}${search ? `&q=${encodeURIComponent(search)}` : ""}`;
          const active = value === status;
          return (
            <Link
              key={value}
              href={href}
              aria-current={active ? "true" : undefined}
              className={
                "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition " +
                (active
                  ? "bg-brand/18 text-white ring-1 ring-inset ring-brand/35"
                  : "text-white/50 hover:bg-white/5 hover:text-white")
              }
            >
              {value === "all" ? "Tất cả" : LEAD_STATUS_LABEL[value]}
            </Link>
          );
        })}
      </div>

      <form method="get" action="/admin/leads" className="ml-auto flex items-center gap-2">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <TextInput
          name="q"
          type="search"
          defaultValue={search}
          placeholder="Tìm tên hoặc số điện thoại…"
          aria-label="Tìm khách hàng"
          className="w-56"
        />
        <button type="submit" className={buttonClass("ghost")}>
          Tìm
        </button>
      </form>
    </div>
  );
}
