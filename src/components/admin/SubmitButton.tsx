"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "./ui";

/**
 * Nut submit tu vo hieu hoa khi form dang gui.
 * Phai la component rieng vi useFormStatus chi doc duoc trang thai cua <form> cha.
 */
export function SubmitButton({
  children,
  pendingLabel = "Đang lưu…",
  variant = "primary",
  name,
  value,
  confirm,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "ghost" | "danger";
  name?: string;
  value?: string;
  /** Neu co: hien hop xac nhan cua trinh duyet truoc khi gui. */
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={buttonClass(variant)}
      onClick={
        confirm
          ? (event) => {
              if (!window.confirm(confirm)) {
                event.preventDefault();
              }
            }
          : undefined
      }
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
