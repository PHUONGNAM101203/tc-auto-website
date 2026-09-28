import Link from "next/link";
import type { ReactNode } from "react";

/* Cac khoi UI dung chung cho admin. Giu o mot cho de giao dien nhat quan. */

export function Card({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-white/10 bg-white/[0.03] ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-white/50">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium tracking-wide text-white/70"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-brand-soft">{error}</p>
      ) : hint ? (
        <p className="text-xs text-white/40">{hint}</p>
      ) : null}
    </div>
  );
}

const INPUT_BASE =
  "w-full rounded-lg border border-white/12 bg-navy/60 px-3 py-2 text-sm text-white " +
  "placeholder:text-white/30 outline-none transition " +
  "focus:border-sky/70 focus:ring-2 focus:ring-sky/15 " +
  "aria-[invalid=true]:border-brand aria-[invalid=true]:ring-brand/20";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${INPUT_BASE} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${INPUT_BASE} min-h-24 resize-y leading-relaxed ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${INPUT_BASE} ${props.className ?? ""}`} />;
}

type BadgeTone = "neutral" | "info" | "good" | "warn" | "bad" | "brand";

const BADGE_TONE: Readonly<Record<BadgeTone, string>> = {
  neutral: "bg-white/8 text-white/70 ring-white/12",
  info: "bg-sky/12 text-sky ring-sky/25",
  good: "bg-emerald-400/12 text-emerald-300 ring-emerald-400/25",
  warn: "bg-amber-400/12 text-amber-300 ring-amber-400/25",
  bad: "bg-brand/15 text-brand-soft ring-brand/30",
  brand: "bg-brand/20 text-white ring-brand/40",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${BADGE_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-white/12 px-6 py-12 text-center">
      <p className="text-sm font-medium text-white/80">{title}</p>
      {description && <p className="max-w-md text-xs leading-relaxed text-white/45">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "ghost",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <Link href={href} className={buttonClass(variant)}>
      {children}
    </Link>
  );
}

export function buttonClass(variant: "primary" | "ghost" | "danger" = "primary"): string {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold " +
    "transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-[#0b1220] disabled:opacity-55 disabled:cursor-not-allowed";
  if (variant === "primary") {
    return `${base} bg-brand text-white hover:bg-brand-soft hover:text-navy focus-visible:ring-brand`;
  }
  if (variant === "danger") {
    return `${base} border border-brand/40 text-brand-soft hover:bg-brand/12 focus-visible:ring-brand`;
  }
  return `${base} border border-white/14 text-white/80 hover:border-white/30 hover:text-white focus-visible:ring-sky`;
}

/** Dinh dang so theo locale VN. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

const DATE_TIME = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string): string {
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? "—" : DATE_TIME.format(at);
}

/** "3 phút trước", "2 ngày trước" — de doc nhanh trong danh sach. */
export function formatRelative(iso: string): string {
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return "—";

  const seconds = Math.round((Date.now() - at) / 1000);
  if (seconds < 60) return "vừa xong";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.round(days / 30);
  return months < 12 ? `${months} tháng trước` : `${Math.round(months / 12)} năm trước`;
}
