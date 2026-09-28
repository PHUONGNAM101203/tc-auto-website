import type { ActionResult } from "@/lib/admin/action-result";

/** Bang thong bao ket qua cua server action. */
export function FormBanner({ result }: { result: ActionResult }) {
  if (!result.message) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className={
        "rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ring-1 ring-inset " +
        (result.ok
          ? "bg-emerald-400/10 text-emerald-200 ring-emerald-400/25"
          : "bg-brand/12 text-brand-soft ring-brand/30")
      }
    >
      {result.message}
    </p>
  );
}
