"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { leadInputSchema } from "@/lib/validation";

type Tone = "success" | "error";

interface ToastState {
  readonly message: string;
  readonly tone: Tone;
}

interface ContactFormProps {
  /** Toa do y trong canvas — lay tu page spec, giu nguyen vi tri Figma. */
  readonly y: number;
  readonly sourcePage: string;
  /**
   * "canvas" (mac dinh) giu nguyen hinh hoc tuyet doi cua thiet ke.
   * "mobile" xep doc, co dan theo be rong man hinh.
   */
  readonly layout?: "canvas" | "mobile";
}

const TOAST_MS = 3600;

/**
 * Form lien he trong canvas (.ff). Bo cuc / kich thuoc giu nguyen thiet ke goc;
 * bo sung validate phia client, trang thai dang gui, honeypot chong bot va toast.
 */
export function ContactForm({ y, sourcePage, layout = "canvas" }: ContactFormProps) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (pending) {
        return;
      }

      const data = new FormData(event.currentTarget);
      const candidate = {
        name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        message: String(data.get("message") ?? ""),
        honeypot: String(data.get("company") ?? ""),
        sourcePage,
      };

      const parsed = leadInputSchema.safeParse(candidate);
      if (!parsed.success) {
        const next: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path.join(".") || "_";
          if (!(key in next)) {
            next[key] = issue.message;
          }
        }
        setErrors(next);
        setToast({ message: Object.values(next)[0] ?? "Dữ liệu chưa hợp lệ.", tone: "error" });
        return;
      }

      setErrors({});
      setPending(true);

      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          fields?: Record<string, string>;
        };

        if (!response.ok) {
          setErrors(payload.fields ?? {});
          throw new Error(payload.error ?? "Không gửi được thông tin. Vui lòng thử lại.");
        }

        formRef.current?.reset();
        setToast({
          message: "Cảm ơn bạn! TC Auto sẽ liên hệ trong thời gian sớm nhất.",
          tone: "success",
        });
      } catch (error) {
        console.error("[contact-form]", error);
        setToast({
          message: error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.",
          tone: "error",
        });
      } finally {
        setPending(false);
      }
    },
    [pending, sourcePage],
  );

  return (
    <>
      <form
        ref={formRef}
        className={layout === "mobile" ? "ff tc-m-form" : "ff"}
        style={layout === "mobile" ? undefined : { top: `${y}px` }}
        onSubmit={submit}
        noValidate
        aria-label="Đăng ký nhận tư vấn từ TC Auto"
      >
        <input
          className="in1"
          name="name"
          required
          placeholder="Họ và tên của bạn"
          aria-label="Họ và tên của bạn"
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          maxLength={120}
        />
        <input
          className="in2"
          name="phone"
          type="tel"
          required
          placeholder="Số điện thoại"
          aria-label="Số điện thoại"
          aria-invalid={Boolean(errors.phone)}
          autoComplete="tel"
          maxLength={20}
        />
        <textarea
          name="message"
          placeholder="Nhu cầu, câu hỏi của bạn..."
          aria-label="Nhu cầu, câu hỏi của bạn"
          aria-invalid={Boolean(errors.message)}
          maxLength={2000}
        />

        {/* Honeypot: an voi nguoi that, bot thuong dien vao */}
        <input
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            width: "1px",
            height: "1px",
            opacity: 0,
          }}
        />

        <button type="submit" disabled={pending}>
          {pending ? "…" : "GỬI"}
        </button>
      </form>

      <output
        className={`toast${toast ? " is-on" : ""}`}
        data-tone={toast?.tone ?? "success"}
        aria-live="polite"
      >
        {toast?.message}
      </output>
    </>
  );
}
