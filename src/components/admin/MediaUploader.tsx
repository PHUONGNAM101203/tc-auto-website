"use client";

import { useRef, useState } from "react";
import { registerMedia } from "@/lib/admin/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { buttonClass } from "./ui";

const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/svg+xml,video/mp4,video/webm";

interface Status {
  readonly tone: "ok" | "err";
  readonly message: string;
}

/**
 * Tai tep truc tiep tu browser len Supabase Storage (RLS chi cho admin ghi),
 * sau do ghi metadata qua server action. Cach nay khong day file qua server
 * Next nen khong bi gioi han body size cua route handler.
 */
export function MediaUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  async function upload(files: FileList) {
    setBusy(true);
    setStatus(null);

    const supabase = getSupabaseBrowserClient();
    let done = 0;
    const failures: string[] = [];

    for (const file of Array.from(files)) {
      setProgress(`${done + 1}/${files.length} · ${file.name}`);

      if (file.size > MAX_BYTES) {
        failures.push(`${file.name} (vượt 15MB)`);
        continue;
      }

      // Ten duy nhat, bo ky tu la de URL cong khai luon hop le.
      const safeName = file.name.replace(/[^\w.\-]+/g, "-").slice(-80);
      const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID().slice(0, 8)}-${safeName}`;

      try {
        const { error } = await supabase.storage.from("media").upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });
        if (error) {
          throw new Error(error.message);
        }

        const dimensions = file.type.startsWith("image/") ? await readImageSize(file) : null;

        const form = new FormData();
        form.set("path", path);
        form.set("name", file.name);
        form.set("mimeType", file.type || "application/octet-stream");
        form.set("bytes", String(file.size));
        if (dimensions) {
          form.set("width", String(dimensions.width));
          form.set("height", String(dimensions.height));
        }

        const result = await registerMedia({ ok: true, message: "" }, form);
        if (!result.ok) {
          throw new Error(result.message);
        }
        done += 1;
      } catch (error) {
        console.error("[media/upload]", file.name, error);
        failures.push(`${file.name} (${error instanceof Error ? error.message : "lỗi"})`);
      }
    }

    setProgress("");
    setBusy(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setStatus(
      failures.length === 0
        ? { tone: "ok", message: `Đã tải lên ${done} tệp.` }
        : {
            tone: "err",
            message: `Tải lên ${done} tệp. Không thành công: ${failures.join("; ")}`,
          },
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const files = event.target.files;
          if (files && files.length > 0) {
            void upload(files);
          }
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={buttonClass("primary")}
      >
        {busy ? `Đang tải… ${progress}` : "Chọn tệp để tải lên"}
      </button>

      <p className="text-[11px] text-white/35">
        Ảnh PNG / JPEG / WebP / AVIF / SVG hoặc video MP4 / WebM. Tối đa 15MB mỗi tệp.
      </p>

      {status && (
        <p
          role="status"
          className={
            "rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ring-1 ring-inset " +
            (status.tone === "ok"
              ? "bg-emerald-400/10 text-emerald-200 ring-emerald-400/25"
              : "bg-brand/12 text-brand-soft ring-brand/30")
          }
        >
          {status.message}
        </p>
      )}
    </div>
  );
}

/** Doc kich thuoc anh o phia client de luu kem metadata. */
function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}
